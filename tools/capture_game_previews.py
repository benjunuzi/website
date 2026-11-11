#!/usr/bin/env python3
"""Capture local gameplay previews for every game listed in games.csv."""

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
OUTPUT_DIR = ROOT / "assets" / "game-previews"
BASE_URL = os.environ.get("GAME_PREVIEW_BASE_URL", "http://127.0.0.1:8083")
CHROME = Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")


def slugify(title: str) -> str:
    return re.sub(r"(^-+|-+$)", "", re.sub(r"[^a-z0-9]+", "-", title.lower())) or "game"


def capture(item: tuple[int, str, str]) -> tuple[str, str]:
    index, title, game_url = item
    slug = slugify(title)
    output = OUTPUT_DIR / f"{slug}.jpg"
    with tempfile.TemporaryDirectory(prefix=f"game-preview-{index}-") as profile:
        screenshot = Path(profile) / "capture.png"
        url_path = game_url if game_url.startswith("/") else f"/{game_url}"
        page_url = f"{BASE_URL}{quote(url_path, safe='/:')}"
        command = [
            str(CHROME),
            "--headless=new",
            "--disable-gpu",
            "--hide-scrollbars",
            "--no-first-run",
            "--no-default-browser-check",
            "--disable-background-networking",
            f"--user-data-dir={profile}",
            "--window-size=1440,900",
            "--virtual-time-budget=5000",
            f"--screenshot={screenshot}",
            page_url,
        ]
        result = subprocess.run(command, capture_output=True, text=True, timeout=30)
        if result.returncode != 0 or not screenshot.exists() or screenshot.stat().st_size < 10_000:
            detail = (result.stderr or result.stdout).strip().splitlines()
            raise RuntimeError(f"{title}: capture failed ({detail[-1] if detail else 'no output'})")

        converted = subprocess.run(
            [
                "/usr/bin/sips",
                "-s",
                "format",
                "jpeg",
                "-s",
                "formatOptions",
                "82",
                str(screenshot),
                "--out",
                str(output),
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
        games = [(i, row["title"].strip(), row["url"].strip()) for i, row in enumerate(csv.DictReader(source), 1)]

    started = time.monotonic()
    failures: list[str] = []
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = {pool.submit(capture, game): game[1] for game in games}
        for future in as_completed(futures):
            title = futures[future]
            try:
                captured_title, output = future.result()
                print(f"[ok] {captured_title} -> {output}")
            except Exception as error:
                failures.append(str(error))
                print(f"[failed] {error}")

    elapsed = time.monotonic() - started
    print(f"Captured {len(games) - len(failures)}/{len(games)} previews in {elapsed:.1f}s")
    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
