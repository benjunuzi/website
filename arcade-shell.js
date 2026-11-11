/* Shared player experience for every game page. */
(function () {
    "use strict";

    var GA_ID = "G-S7RQ3NVLF4";
    var HISTORY_KEY = "benArcadeHistory.v1";
    var FAVORITES_KEY = "benArcadeFavorites.v1";
    var PLAYER_NAME_KEY = "benArcadePlayerName.v1";
    var MAX_HISTORY = 24;
    var SITE_ROOT_URL = new URL(
        ".",
        document.currentScript && document.currentScript.src ? document.currentScript.src : location.href
    );

    function readList(key) {
        try {
            var value = JSON.parse(localStorage.getItem(key) || "[]");
            return Array.isArray(value) ? value : [];
        } catch (error) {
            return [];
        }
    }

    function writeList(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            /* Private browsing can disable storage. The page still works. */
        }
    }

    function cleanTitle(title) {
        return String(title || "Game")
            .replace(/\s*[·|]\s*ben\.junuzi\.com\s*$/i, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    function pathFor(url) {
        try {
            var parsed = new URL(url, SITE_ROOT_URL);
            var path = decodeURIComponent(parsed.pathname);
            if (parsed.protocol === "file:") {
                var siteRootPath = decodeURIComponent(SITE_ROOT_URL.pathname);
                if (path.startsWith(siteRootPath)) path = path.slice(siteRootPath.length);
                path = "/" + path.replace(/^\/+/, "");
            }
            path = path
                .replace(/\/index\.html$/i, "")
                .replace(/\/+$/, "") || "/";
            var practiceId = parsed.searchParams.get("id");
            return path === "/add-game/play.html" && practiceId
                ? path + "?id=" + encodeURIComponent(practiceId)
                : path;
        } catch (error) {
            return "";
        }
    }

    function currentPath() {
        return pathFor(location.href);
    }

    function gameKey(game) {
        return pathFor(game.path || game.url || location.href);
    }

    function minimalGame(game) {
        return {
            title: cleanTitle(game.title),
            url: pathFor(game.url || game.path || location.href),
            path: pathFor(game.path || game.url || location.href)
        };
    }

    function recordOpen(game) {
        var item = minimalGame(game);
        var history = readList(HISTORY_KEY);
        var key = gameKey(item);
        var existing = history.find(function (entry) { return gameKey(entry) === key; });
        history = history.filter(function (entry) { return gameKey(entry) !== key; });
        history.unshift({
            title: item.title,
            url: item.url,
            path: item.path,
            plays: existing ? Number(existing.plays) || 0 : 0,
            lastOpenedAt: Date.now()
        });
        writeList(HISTORY_KEY, history.slice(0, MAX_HISTORY));
    }

    function recordPlay(game) {
        var item = minimalGame(game);
        var history = readList(HISTORY_KEY);
        var key = gameKey(item);
        var existing = history.find(function (entry) { return gameKey(entry) === key; });
        history = history.filter(function (entry) { return gameKey(entry) !== key; });
        history.unshift({
            title: item.title,
            url: item.url,
            path: item.path,
            plays: (existing ? Number(existing.plays) || 0 : 0) + 1,
            lastOpenedAt: Date.now(),
            lastPlayedAt: Date.now()
        });
        writeList(HISTORY_KEY, history.slice(0, MAX_HISTORY));
    }

    function isFavorite(game) {
        var key = gameKey(game);
        return readList(FAVORITES_KEY).some(function (entry) {
            return gameKey(entry) === key;
        });
    }

    function toggleFavorite(game) {
        var item = minimalGame(game);
        var key = gameKey(item);
        var favorites = readList(FAVORITES_KEY);
        var wasFavorite = favorites.some(function (entry) { return gameKey(entry) === key; });
        favorites = favorites.filter(function (entry) { return gameKey(entry) !== key; });
        if (!wasFavorite) {
            favorites.unshift({
                title: item.title,
                url: item.url,
                path: item.path,
                savedAt: Date.now()
            });
        }
        writeList(FAVORITES_KEY, favorites);
        return !wasFavorite;
    }

    function track(name, details) {
        var params = Object.assign({
            game_title: currentGame.title,
            game_path: currentGame.path
        }, details || {});
        try {
            if (typeof window.gtag === "function") {
                window.gtag("event", name, params);
            } else {
                window.dataLayer = window.dataLayer || [];
                window.dataLayer.push(Object.assign({ event: name }, params));
            }
        } catch (error) {
            /* Analytics must never break a game. */
        }
    }

    var currentGame = {
        title: cleanTitle(document.title),
        path: currentPath(),
        url: currentPath()
    };
    var isGamePage = /^\/games\/[^/]+(?:\/[^/]+)?$/.test(currentGame.path);

    function ensureAnalytics() {
        if (typeof window.gtag !== "function") {
            window.dataLayer = window.dataLayer || [];
            window.gtag = function () { window.dataLayer.push(arguments); };
        }

        if (!document.querySelector("script[data-ben-arcade-analytics]")) {
            var script = document.createElement("script");
            script.async = true;
            script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_ID);
            script.setAttribute("data-ben-arcade-analytics", "true");
            window.gtag("js", new Date());
            window.gtag("config", GA_ID, { send_page_view: true });
            document.head.appendChild(script);
        }
    }

    function parseCsv(text) {
        var rows = [];
        var row = [];
        var field = "";
        var quoted = false;

        for (var index = 0; index < text.length; index += 1) {
            var character = text[index];
            var next = text[index + 1];
            if (character === '"' && quoted && next === '"') {
                field += '"';
                index += 1;
            } else if (character === '"') {
                quoted = !quoted;
            } else if (character === "," && !quoted) {
                row.push(field);
                field = "";
            } else if ((character === "\n" || character === "\r") && !quoted) {
                if (character === "\r" && next === "\n") index += 1;
                row.push(field);
                if (row.some(function (cell) { return cell !== ""; })) rows.push(row);
                row = [];
                field = "";
            } else {
                field += character;
            }
        }

        row.push(field);
        if (row.some(function (cell) { return cell !== ""; })) rows.push(row);
        return rows;
    }

    function loadGames() {
        function fallbackRows() {
            return Array.isArray(window.BEN_GAMES_DATA)
                ? window.BEN_GAMES_DATA.map(function (game) {
                    var copy = Object.assign({}, game);
                    copy.path = pathFor(copy.url);
                    return copy;
                })
                : [];
        }

        if (location.protocol === "file:") {
            return Promise.resolve(fallbackRows());
        }

        return fetch("/games.csv", { cache: "no-store" })
            .then(function (response) {
                if (!response.ok) throw new Error("Could not load games.csv");
                return response.text();
            })
            .then(function (text) {
                var rows = parseCsv(text);
                var headers = (rows.shift() || []).map(function (header) {
                    return header.trim().toLowerCase();
                });
                return rows.map(function (cells) {
                    var game = {};
                    headers.forEach(function (header, index) {
                        game[header] = (cells[index] || "").trim();
                    });
                    game.path = pathFor(game.url);
                    return game;
                }).filter(function (game) {
                    return game.title && game.path;
                });
            })
            .catch(function () {
                return fallbackRows();
            });
    }

    function installBodySpacing() {
        var style = document.createElement("style");
        style.setAttribute("data-ben-arcade-spacing", "true");
        style.textContent = "body{padding-bottom:max(72px,calc(env(safe-area-inset-bottom) + 62px))!important;}";
        document.head.appendChild(style);
    }

    function installBar() {
        var host = document.createElement("div");
        host.id = "ben-arcade-gamebar";
        var shadow = host.attachShadow({ mode: "open" });
        var homeHref = location.protocol === "file:" ? "../../index.html?view=games" : "/?view=games";
        shadow.innerHTML = [
            "<style>",
            ":host{all:initial}",
            ".bar{position:fixed;left:50%;bottom:calc(9px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2147483647;",
            "display:flex;align-items:center;gap:4px;width:min(520px,calc(100vw - 16px));padding:5px;box-sizing:border-box;",
            "border:1px solid rgba(114,243,203,.42);border-radius:16px;background:rgba(3,30,34,.94);",
            "box-shadow:0 12px 36px rgba(0,0,0,.48);backdrop-filter:blur(16px);font-family:Inter,ui-sans-serif,system-ui,sans-serif}",
            ".action{appearance:none;border:0;background:transparent;color:#d9fff4;text-decoration:none;height:40px;flex:1;",
            "display:flex;align-items:center;justify-content:center;gap:6px;border-radius:11px;font:800 11px/1 Inter,ui-sans-serif,system-ui,sans-serif;",
            "cursor:pointer;transition:background .15s ease,color .15s ease,transform .15s ease;white-space:nowrap}",
            ".action:hover,.action:focus-visible{background:rgba(114,243,203,.14);color:#fff;outline:none}",
            ".action:active{transform:scale(.97)}",
            ".action.primary{background:linear-gradient(135deg,#20cfa0,#72f3cb);color:#032d2b;box-shadow:0 6px 18px rgba(24,210,165,.24)}",
            ".action.favorite.on{background:rgba(255,214,90,.16);color:#ffe57e}",
            ".icon{font-size:16px;line-height:1}",
            ".toast{position:fixed;left:50%;bottom:calc(69px + env(safe-area-inset-bottom));transform:translateX(-50%) translateY(8px);",
            "z-index:1;max-width:calc(100vw - 32px);padding:8px 12px;border-radius:999px;background:#f4f1e7;color:#07110b;",
            "font:800 11px/1.25 Inter,ui-sans-serif,system-ui,sans-serif;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.3);",
            "opacity:0;pointer-events:none;transition:opacity .18s ease,transform .18s ease}",
            ".toast.show{opacity:1;transform:translateX(-50%) translateY(0)}",
            "@media(max-width:390px){.label-share{display:none}.action{gap:4px;font-size:10px}}",
            "@media(max-width:430px){.action>span:not(.icon){display:none}.action.primary>span:not(.icon){display:inline;font-size:10px}.icon{font-size:18px}}",
            "</style>",
            "<nav class='bar' aria-label='Ben Arcade game navigation'>",
            "<a class='action' id='home' href='" + homeHref + "' aria-label='Back to all games'><span class='icon'>▦</span><span>Arcade</span></a>",
            "<button class='action favorite' id='favorite' type='button' aria-label='Add this game to favorites'><span class='icon'>☆</span><span>Save</span></button>",
            "<button class='action' id='replay' type='button' aria-label='Play this game again'><span class='icon'>↻</span><span>Again</span></button>",
            "<button class='action' id='share' type='button' aria-label='Share this game'><span class='icon'>↗</span><span class='label-share'>Share</span></button>",
            "<a class='action primary' id='next' href='/?view=games' aria-label='Play the next game'><span>Next</span><span class='icon'>→</span></a>",
            "</nav>",
            "<div class='toast' id='toast' role='status' aria-live='polite'></div>"
        ].join("");

        document.body.appendChild(host);
        return {
            host: host,
            shadow: shadow,
            favorite: shadow.getElementById("favorite"),
            replay: shadow.getElementById("replay"),
            share: shadow.getElementById("share"),
            next: shadow.getElementById("next"),
            toast: shadow.getElementById("toast")
        };
    }

    function showToast(ui, message) {
        ui.toast.textContent = message;
        ui.toast.classList.add("show");
        clearTimeout(showToast.timer);
        showToast.timer = setTimeout(function () {
            ui.toast.classList.remove("show");
        }, 2100);
    }

    function updateFavoriteButton(ui) {
        var selected = isFavorite(currentGame);
        ui.favorite.classList.toggle("on", selected);
        ui.favorite.setAttribute("aria-pressed", String(selected));
        ui.favorite.setAttribute("aria-label", selected ? "Remove this game from favorites" : "Add this game to favorites");
        ui.favorite.querySelector(".icon").textContent = selected ? "★" : "☆";
        ui.favorite.querySelector("span:last-child").textContent = selected ? "Saved" : "Save";
    }

    function shareCurrentGame(ui) {
        var shareData = {
            title: currentGame.title + " · Ben's Arcade",
            text: "Play " + currentGame.title + " free on Ben's Arcade.",
            url: location.href
        };

        function copyFallback() {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                return navigator.clipboard.writeText(location.href).then(function () {
                    showToast(ui, "Game link copied");
                    track("share_game", { method: "clipboard", result: "success" });
                });
            }
            return Promise.reject(new Error("Clipboard unavailable"));
        }

        if (navigator.share) {
            navigator.share(shareData)
                .then(function () {
                    track("share_game", { method: "web_share", result: "success" });
                })
                .catch(function (error) {
                    if (error && error.name === "AbortError") return;
                    copyFallback().catch(function () {
                        showToast(ui, "Copy the address bar to share");
                    });
                });
            return;
        }

        copyFallback().catch(function () {
            showToast(ui, "Copy the address bar to share");
        });
    }

    function setupNavigation(games, ui) {
        var index = games.findIndex(function (game) {
            return game.path === currentGame.path;
        });
        if (index !== -1) {
            var nextGame = games[(index + 1) % games.length];
            ui.next.href = location.protocol === "file:"
                ? "../../" + nextGame.path.replace(/^\//, "") + (nextGame.path.endsWith(".html") ? "" : "/index.html")
                : nextGame.path;
            ui.next.setAttribute("aria-label", "Play " + nextGame.title);
            ui.next.title = "Next: " + nextGame.title;
            ui.next.addEventListener("click", function () {
                recordOpen(nextGame);
                track("next_game", { next_game_title: nextGame.title });
            });
        }
    }

    function setupEngagement() {
        var interacted = false;
        var startedAt = performance.now();

        function markInteraction(event) {
            if (interacted) return;
            if (event.composedPath && event.composedPath().indexOf(document.getElementById("ben-arcade-gamebar")) !== -1) return;
            interacted = true;
            track("game_interaction", {
                seconds_after_load: Math.max(0, Math.round((performance.now() - startedAt) / 100) / 10)
            });
        }

        document.addEventListener("pointerdown", markInteraction, { passive: true });
        document.addEventListener("keydown", markInteraction);

        document.addEventListener("visibilitychange", function () {
            if (document.visibilityState === "hidden" && interacted) {
                track("game_session_end", {
                    seconds_engaged: Math.max(0, Math.round((performance.now() - startedAt) / 100) / 10)
                });
            }
        });
    }

    function normalizeStoredGame(entry) {
        return {
            title: cleanTitle(entry && entry.title),
            url: pathFor(entry && (entry.path || entry.url)),
            path: pathFor(entry && (entry.path || entry.url))
        };
    }

    window.BenArcade = {
        track: track,
        pathFor: pathFor,
        normalizeGame: normalizeStoredGame,
        recordOpen: function (game) {
            recordOpen(game);
            track("game_click", { clicked_game_title: cleanTitle(game.title) });
        },
        toggleFavorite: function (game) {
            var selected = toggleFavorite(game);
            track(selected ? "favorite_add" : "favorite_remove", {
                game_title: cleanTitle(game.title)
            });
            return selected;
        },
        isFavorite: isFavorite,
        getHistory: function () { return readList(HISTORY_KEY); },
        getFavorites: function () { return readList(FAVORITES_KEY); },
        getPlayerName: function () {
            try { return localStorage.getItem(PLAYER_NAME_KEY) || ""; } catch (error) { return ""; }
        },
        setPlayerName: function (name) {
            try { localStorage.setItem(PLAYER_NAME_KEY, cleanTitle(name).slice(0, 32)); } catch (error) {}
        }
    };

    ensureAnalytics();

    if (isGamePage) {
        recordPlay(currentGame);
        track("game_page_view", { referrer: document.referrer || "direct" });

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", start, { once: true });
        } else {
            start();
        }
    }

    function start() {
        installBodySpacing();
        var ui = installBar();
        updateFavoriteButton(ui);
        setupEngagement();

        ui.favorite.addEventListener("click", function () {
            toggleFavorite(currentGame);
            updateFavoriteButton(ui);
            track(isFavorite(currentGame) ? "favorite_add" : "favorite_remove");
            showToast(ui, isFavorite(currentGame) ? "Saved to your favorites" : "Removed from favorites");
        });

        ui.replay.addEventListener("click", function () {
            track("game_replay");
            location.reload();
        });

        ui.share.addEventListener("click", function () {
            shareCurrentGame(ui);
        });

        loadGames()
            .then(function (games) {
                var match = games.find(function (game) { return game.path === currentGame.path; });
                if (match) {
                    currentGame.title = cleanTitle(match.title);
                    updateFavoriteButton(ui);
                }
                var uniqueGames = [];
                var seen = {};
                games.forEach(function (game) {
                    if (!seen[game.path]) {
                        seen[game.path] = true;
                        uniqueGames.push(game);
                    }
                });
                setupNavigation(uniqueGames, ui);
            })
            .catch(function () {
                track("game_catalog_error");
            });
    }
}());
