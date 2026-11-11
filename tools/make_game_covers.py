#!/usr/bin/env python3
"""Turn the saved game screenshots into colorful BGames-style cover cards."""

from __future__ import annotations

import csv
import os
import re
import subprocess
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import quote


ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "assets" / "game-previews"
OUTPUT_DIR = ROOT / "assets" / "game-covers-v2"
TEMPLATE = ROOT / "tools" / "game-cover-v2.html"
CHROME = Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
ICONS = {
    "number guessing": "🎲", "football": "🏈", "touchdown blitz": "🏈",
    "nitro-racer": "🏎️", "go-kart": "🏎️", "retro ping pong": "🏓",
    "retro hoop shootout": "🏀", "dodgeball": "🤾", "color echo": "🌈",
    "golf": "⛳", "hyper hoop master": "🏀", "retro tennis game": "🎾",
    "slime soccer": "🟢", "neon air hockey championshipneon": "🏒",
    "basketball": "🏀", "soccer game": "⚽", "neon-air-hockey": "🏒",
    "neon horizon": "🌆", "coin clicker": "🪙", "retro arcade": "🕹️",
    "cosmic-defender": "👾", "tictacto": "❌", "space run": "🚀",
    "f1": "🏁", "pacman": "🟡", "fighter-ship": "✈️",
    "fast hands": "⚡", "ping pong": "🏓", "space adventure!": "🚀",
    "classic snake": "🐍", "mini-strike": "🎯", "piano tiles": "🎹",
    "pool game": "🎱", "soccer": "⚽", "soccer game v2": "⚽",
    "cool baseball": "⚾", "baseball showdown": "⚾", "flappy bird": "🐦",
    "dog food run": "🐕", "fruit catch frenzy": "🍎", "1v1 soccer": "⚽",
    "music studio": "🎶", "fc27": "⚽", "neon brick breaker": "🧱",
    "hide and seek": "🙈", "boxing tournament": "🥊", "pong arena": "🏓",
    "neon flappy": "🐦", "endless runner": "🏃", "pit crew: driver's orders": "🧑‍🔧",
    "golden goal": "⚽",
}


def slugify(title: str) -> str:
    return re.sub(r"(^-+|-+$)", "", re.sub(r"[^a-z0-9]+", "-", title.lower())) or "game"


def make_cover(item: tuple[int, dict[str, str]]) -> tuple[str, str]:
    index, game = item
    title = game["title"].strip()
    slug = slugify(title)
    source = SOURCE_DIR / f"{slug}.jpg"
    output = OUTPUT_DIR / f"{slug}.jpg"
    if not source.exists():
        raise RuntimeError(f"{title}: source screenshot missing")

    params = "&".join(
        [
            f"title={quote(title)}",
            f"category={quote(game['category'].strip())}",
            f"icon={quote(ICONS.get(title.lower(), '🎮'))}",
            f"img={quote('../assets/game-previews/' + source.name)}",
        ]
    )
    page_url = f"{TEMPLATE.as_uri()}?{params}"

    with tempfile.TemporaryDirectory(prefix=f"game-cover-{index}-") as profile:
        screenshot = Path(profile) / "cover.png"
        command = [
            str(CHROME),
            "--headless=new",
            "--disable-gpu",
            "--hide-scrollbars",
            "--no-first-run",
            "--no-default-browser-check",
            "--disable-background-networking",
            "--allow-file-access-from-files",
            f"--user-data-dir={profile}",
            "--window-size=720,450",
            "--virtual-time-budget=2500",
            f"--screenshot={screenshot}",
            page_url,
        ]
        result = subprocess.run(command, capture_output=True, text=True, timeout=25)
        if result.returncode != 0 or not screenshot.exists() or screenshot.stat().st_size < 10_000:
            detail = (result.stderr or result.stdout).strip().splitlines()
            raise RuntimeError(f"{title}: cover capture failed ({detail[-1] if detail else 'no output'})")

        converted = subprocess.run(
            [
                "/usr/bin/sips",
                "-s", "format", "jpeg",
                "-s", "formatOptions", "88",
                str(screenshot),
                "--out", str(output),
            ],
            capture_output=True,
            text=True,
        )
        if converted.returncode != 0 or not output.exists():
            raise RuntimeError(f"{title}: JPEG conversion failed")
    return title, str(output.relative_to(ROOT))


def main() -> None:
    if not CHROME.exists():
        raise SystemExit(f"Chrome not found at {CHROME}")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with (ROOT / "games.csv").open(newline="", encoding="utf-8") as source:
        games = list(csv.DictReader(source))

    started = time.monotonic()
    failures: list[str] = []
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = {pool.submit(make_cover, (i, game)): game["title"] for i, game in enumerate(games, 1)}
        for future in as_completed(futures):
            try:
                title, output = future.result()
                print(f"[ok] {title} -> {output}")
            except Exception as error:
                failures.append(str(error))
                print(f"[failed] {error}")

    print(f"Created {len(games) - len(failures)}/{len(games)} covers in {time.monotonic() - started:.1f}s")
    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
