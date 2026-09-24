/* =====================================================================
   Game Lab templates.

   Turns a few choices (name, goal, emoji, colours, difficulty) into a
   complete, self-contained HTML game. The games use a canvas and need
   no internet, no libraries and no build step, so they can be played
   straight out of the practice-mode player.
   ===================================================================== */
(function () {
    "use strict";

    var THEMES = [
        { id: "blue",   name: "Blue",   accent: "#4aa8ff", accent2: "#9ed3ff", bg: "#04101f" },
        { id: "purple", name: "Purple", accent: "#b06bff", accent2: "#e0bdff", bg: "#130627" },
        { id: "pink",   name: "Pink",   accent: "#ff6ec7", accent2: "#ffc2e6", bg: "#28061a" },
        { id: "green",  name: "Green",  accent: "#35e08a", accent2: "#a6f7cd", bg: "#032218" },
        { id: "orange", name: "Orange", accent: "#ff9d3f", accent2: "#ffd7a8", bg: "#251004" }
    ];

    var KINDS = [
        {
            id: "catch",
            name: "Catch It",
            icon: "🧺",
            blurb: "Catch the good stuff, dodge the danger.",
            goal: "Catch as many good things as you can before time runs out!",
            seconds: 60,
            player: "🧺",
            good: "⭐",
            bad: "💣",
            tip: "Move with your finger, the mouse, or the arrow keys."
        },
        {
            id: "dodge",
            name: "Dodge It",
            icon: "🚀",
            blurb: "Survive the falling hazards as long as you can.",
            goal: "Dodge everything and survive as long as you can!",
            seconds: 0,
            player: "🚀",
            good: "⭐",
            bad: "☄️",
            tip: "Drag your finger or use the arrow keys. Grab the ⭐ for bonus points."
        },
        {
            id: "clicker",
            name: "Tap Attack",
            icon: "🎯",
            blurb: "Tap the targets before they vanish.",
            goal: "Tap as many targets as you can in 30 seconds!",
            seconds: 30,
            player: "",
            good: "🎯",
            bad: "💥",
            tip: "Tap or click the targets. If 3 of them escape, the game is over."
        }
    ];

    function esc(str) {
        return String(str == null ? "" : str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function fill(text, values) {
        Object.keys(values).forEach(function (key) {
            text = text.split(key).join(values[key]);
        });
        return text;
    }

    function themeOf(id) {
        for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) return THEMES[i];
        return THEMES[0];
    }

    var STYLE = `    <style>
        * { box-sizing: border-box; }
        html, body {
            margin: 0; height: 100%; overflow: hidden; background: __BG__; color: #fff;
            font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
            touch-action: none; -webkit-user-select: none; user-select: none;
            -webkit-tap-highlight-color: transparent;
        }
        canvas { display: block; width: 100%; height: 100%; }
        #hud {
            position: fixed; top: 0; left: 0; right: 0; display: flex; justify-content: space-between;
            gap: 8px; padding: 10px 12px; font-size: 14px; font-weight: 800; pointer-events: none;
        }
        .chip {
            background: rgba(4, 8, 20, .45); border: 1px solid rgba(255, 255, 255, .16);
            border-radius: 999px; padding: 5px 12px; white-space: nowrap;
        }
        .chip b { color: __ACCENT2__; }
        #overlay {
            position: fixed; inset: 0; display: grid; place-items: center; padding: 26px;
            background: rgba(4, 6, 14, .78); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
        }
        #overlay.hide { display: none; }
        #overlayBox { display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
        #overlayBox .big { font-size: 56px; line-height: 1; filter: drop-shadow(0 8px 18px rgba(0, 0, 0, .5)); }
        #overlayBox h1 { margin: 0; font-size: 24px; letter-spacing: -.01em; }
        #overlayBox p { margin: 0; max-width: 330px; font-size: 14px; color: #cbd5e1; line-height: 1.45; }
        #overlayBox .tip { font-size: 12px; color: #8fa0bb; }
        #overlayBox .made { font-size: 11px; color: #64748b; }
        #startBtn {
            margin-top: 6px; border: 0; border-radius: 16px; padding: 13px 30px; font-size: 16px; font-weight: 800;
            color: #04060d; cursor: pointer; background: linear-gradient(135deg, __ACCENT__, __ACCENT2__);
            box-shadow: 0 10px 26px rgba(0, 0, 0, .45);
        }
    </style>`;

    /* Everything the generated games share: canvas, input, HUD, game loop.
       The game's own logic is inserted between the top and the bottom half
       so that it lives in the same scope as this runtime. */
    var RUNTIME_TOP = `    <script>
    (function () {
        var cv = document.getElementById("c");
        var ctx = cv.getContext("2d");
        var W = 360, H = 640, DPR = 1;

        function resize() {
            DPR = Math.min(window.devicePixelRatio || 1, 2);
            W = cv.clientWidth || window.innerWidth;
            H = cv.clientHeight || window.innerHeight;
            cv.width = Math.round(W * DPR);
            cv.height = Math.round(H * DPR);
            ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        }
        window.addEventListener("resize", resize);
        resize();

        var MULT = __MULT__;
        var START_TIME = __TIME__;
        var state = { score: 0, time: START_TIME, lives: 3, running: false, started: false, done: false, t: 0 };

        var overlay = document.getElementById("overlay");
        var overlayBox = document.getElementById("overlayBox");
        var scoreEl = document.getElementById("score");
        var timeEl = document.getElementById("time");
        var livesEl = document.getElementById("lives");

        var pointer = { x: W / 2, y: H * 0.8, active: false };
        var keys = {};

        function pointAt(clientX, clientY) {
            var box = cv.getBoundingClientRect();
            pointer.x = clientX - box.left;
            pointer.y = clientY - box.top;
            pointer.active = true;
        }

        cv.addEventListener("mousemove", function (e) { pointAt(e.clientX, e.clientY); });
        cv.addEventListener("mousedown", function (e) {
            pointAt(e.clientX, e.clientY);
            if (typeof onPoint === "function") onPoint(pointer.x, pointer.y);
        });
        cv.addEventListener("touchstart", function (e) {
            var t = e.touches[0];
            pointAt(t.clientX, t.clientY);
            if (typeof onPoint === "function") onPoint(pointer.x, pointer.y);
            e.preventDefault();
        }, { passive: false });
        cv.addEventListener("touchmove", function (e) {
            var t = e.touches[0];
            pointAt(t.clientX, t.clientY);
            e.preventDefault();
        }, { passive: false });

        window.addEventListener("keydown", function (e) {
            keys[e.key] = true;
            if ((e.key === " " || e.key === "Enter") && !state.running) startGame();
            if (e.key.indexOf("Arrow") === 0) e.preventDefault();
        });
        window.addEventListener("keyup", function (e) { keys[e.key] = false; });

        function moveAxis(dt, speed) {
            var v = 0;
            if (keys["ArrowLeft"] || keys["a"] || keys["A"]) v -= 1;
            if (keys["ArrowRight"] || keys["d"] || keys["D"]) v += 1;
            if (v !== 0) { pointer.active = true; pointer.x += v * speed * dt; }
            pointer.x = Math.max(22, Math.min(W - 22, pointer.x));
        }

        function emoji(ch, x, y, size) {
            if (!ch) return;
            ctx.font = size + "px system-ui, -apple-system, 'Segoe UI', sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(ch, x, y);
        }

        function roundBox(x, y, w, h, r) {
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
            else ctx.rect(x, y, w, h);
        }

        function hud() {
            if (scoreEl) scoreEl.textContent = state.score;
            if (timeEl) timeEl.textContent = Math.max(0, Math.ceil(state.time));
            if (livesEl) livesEl.textContent = state.lives;
        }

        function startHtml(icon, title, goal, tip, by) {
            return '<div class="big">' + icon + '</div>' +
                '<h1>' + title + '</h1>' +
                '<p>' + goal + '</p>' +
                '<p class="tip">' + tip + '</p>' +
                '<button id="startBtn">▶ Start</button>' +
                '<p class="made">Made by ' + by + ' in the Game Lab</p>';
        }

        function startGame() {
            state.score = 0;
            state.time = START_TIME;
            state.lives = 3;
            state.t = 0;
            state.done = false;
            state.running = true;
            state.started = true;
            pointer.active = false;
            pointer.x = W / 2;
            pointer.y = H * 0.8;
            setup();
            hud();
            overlay.classList.add("hide");
        }

        function endGame(face) {
            if (state.done) return;
            state.running = false;
            state.done = true;
            overlayBox.innerHTML =
                '<div class="big">' + (face || "🏁") + '</div>' +
                '<h1>Game over</h1>' +
                '<p>You scored <b>' + state.score + '</b> point' + (state.score === 1 ? "" : "s") + '.</p>' +
                '<button id="startBtn">▶ Play again</button>';
            overlay.classList.remove("hide");
        }

        overlay.addEventListener("click", function (e) {
            if (e.target && e.target.id === "startBtn") startGame();
        });

        var lastTS = 0;
        function frame(ts) {
            var dt = Math.min(((ts - lastTS) || 16) / 1000, 0.05);
            lastTS = ts;
            if (state.running) {
                state.t += dt;
                update(dt);
                if (state.running) hud();
            }
            draw();
            requestAnimationFrame(frame);
        }
`;

    var RUNTIME_BOTTOM = `
        overlayBox.innerHTML = startHtml("__EMOJI__", "__TITLE__", "__GOAL__", "__TIP__", "__BY__");
        hud();
        update(0);
        requestAnimationFrame(frame);
    })();
    <\/script>`;

    /* ------------------------- Catch It ---------------------------- */

    var CATCH_BODY = `        var items = [];
        var GOOD = "__GOOD__";
        var BAD = "__BAD__";
        var CATCHER = "__PLAYER__";
        var spawnTimer = 0.5;

        function setup() {
            items = [];
            spawnTimer = 0.5;
        }

        function spawnItem() {
            var bad = Math.random() < 0.2 * MULT;
            items.push({
                x: 26 + Math.random() * Math.max(40, W - 52),
                y: -24,
                r: 13,
                vy: (105 + Math.random() * 65) * MULT * (1 + state.t * 0.012),
                bad: bad
            });
        }

        function update(dt) {
            moveAxis(dt, 460);
            if (dt > 0) {
                state.time -= dt;
                if (state.time <= 0) { state.time = 0; endGame("⏰"); return; }
                spawnTimer -= dt;
                if (spawnTimer <= 0) {
                    spawnItem();
                    spawnTimer = Math.max(0.3, (0.95 - state.t * 0.012) / MULT);
                }
            }
            var line = H - 54;
            for (var i = items.length - 1; i >= 0; i--) {
                var it = items[i];
                it.y += it.vy * dt;
                if (it.y > line - 20 && it.y < line + 36 && Math.abs(it.x - pointer.x) < 46 + it.r) {
                    items.splice(i, 1);
                    if (it.bad) {
                        state.lives -= 1;
                        if (state.lives <= 0) { state.lives = 0; endGame("💥"); return; }
                    } else {
                        state.score += 1;
                    }
                } else if (it.y > H + 40) {
                    items.splice(i, 1);
                }
            }
        }

        function draw() {
            var grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, "__BG__");
            grad.addColorStop(1, "rgba(255,255,255,.06)");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            var line = H - 54;
            ctx.globalAlpha = 0.25;
            ctx.strokeStyle = "__ACCENT__";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, line + 30);
            ctx.lineTo(W, line + 30);
            ctx.stroke();
            ctx.globalAlpha = 1;

            items.forEach(function (it) { emoji(it.bad ? BAD : GOOD, it.x, it.y, it.r * 2.1); });

            ctx.save();
            ctx.fillStyle = "rgba(255,255,255,.10)";
            ctx.strokeStyle = "__ACCENT__";
            ctx.lineWidth = 3;
            roundBox(pointer.x - 46, line, 92, 24, 12);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
            emoji(CATCHER, pointer.x, line + 12, 26);
        }`;

    /* ------------------------- Dodge It ---------------------------- */

    var DODGE_BODY = `        var rocks = [];
        var stars = [];
        var PLAYER = "__PLAYER__";
        var ROCK = "__BAD__";
        var STAR = "__GOOD__";
        var spawnTimer = 0.7;
        var starTimer = 2;
        var safe = 1.2;

        function setup() {
            rocks = [];
            stars = [];
            spawnTimer = 0.7;
            starTimer = 2;
            safe = 1.2;
        }

        function spawnRock() {
            var r = 12 + Math.random() * 10;
            rocks.push({
                x: 20 + Math.random() * Math.max(40, W - 40),
                y: -20,
                r: r,
                vy: (120 + Math.random() * 90) * MULT * (1 + state.t * 0.02)
            });
        }

        function spawnStar() {
            stars.push({ x: 26 + Math.random() * Math.max(40, W - 52), y: -20, r: 13, vy: 120 * MULT });
        }

        function update(dt) {
            moveAxis(dt, 460);
            state.time += dt;
            safe -= dt;

            if (dt > 0) {
                spawnTimer -= dt;
                if (spawnTimer <= 0) {
                    spawnRock();
                    spawnTimer = Math.max(0.18, (0.85 - state.t * 0.02) / MULT);
                }
                starTimer -= dt;
                if (starTimer <= 0) {
                    spawnStar();
                    starTimer = 3.5 + Math.random() * 2;
                }
            }

            var x = pointer.x;
            var y = H - 60;
            var i;
            for (i = rocks.length - 1; i >= 0; i--) {
                var rk = rocks[i];
                rk.y += rk.vy * dt;
                if (rk.y > H + 30) { rocks.splice(i, 1); continue; }
                var dx = rk.x - x;
                var dy = rk.y - y;
                if (safe <= 0 && Math.sqrt(dx * dx + dy * dy) < rk.r + 16) {
                    rocks.splice(i, 1);
                    state.lives -= 1;
                    safe = 1.2;
                    if (state.lives <= 0) { state.lives = 0; endGame("💥"); return; }
                }
            }
            for (i = stars.length - 1; i >= 0; i--) {
                var st = stars[i];
                st.y += st.vy * dt;
                if (st.y > H + 30) { stars.splice(i, 1); continue; }
                var sx = st.x - x;
                var sy = st.y - y;
                if (Math.sqrt(sx * sx + sy * sy) < st.r + 20) {
                    stars.splice(i, 1);
                    state.score += 10;
                    state.bonus = (state.bonus || 0) + 1;
                }
            }
            state.score = Math.floor(state.t) + (state.bonus || 0) * 10;
        }

        function draw() {
            var grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, "__BG__");
            grad.addColorStop(1, "rgba(255,255,255,.07)");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            rocks.forEach(function (rk) { emoji(ROCK, rk.x, rk.y, rk.r * 2); });
            stars.forEach(function (st) { emoji(STAR, st.x, st.y, st.r * 2); });

            ctx.save();
            ctx.globalAlpha = safe > 0 && Math.floor(safe * 10) % 2 === 0 ? 0.35 : 1;
            ctx.fillStyle = "rgba(255,255,255,.12)";
            ctx.strokeStyle = "__ACCENT__";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(pointer.x, H - 60, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
            emoji(PLAYER, pointer.x, H - 60, 26);
        }`;

    /* ------------------------ Tap Attack --------------------------- */

    var CLICKER_BODY = `        var targets = [];
        var spawnTimer = 0.4;
        var TARGET = "__GOOD__";

        function setup() {
            targets = [];
            spawnTimer = 0.4;
        }

        function spawnTarget() {
            var shrink = 1 + state.t * 0.06 * MULT;
            targets.push({
                x: 46 + Math.random() * Math.max(20, W - 92),
                y: 86 + Math.random() * Math.max(20, H - 200),
                r: 38 / shrink + 16,
                life: 2.4 / MULT,
                maxLife: 2.4 / MULT
            });
        }

        function onPoint(x, y) {
            if (!state.running) return;
            for (var i = targets.length - 1; i >= 0; i--) {
                var t = targets[i];
                var dx = t.x - x;
                var dy = t.y - y;
                if (Math.sqrt(dx * dx + dy * dy) <= t.r) {
                    targets.splice(i, 1);
                    state.score += 1;
                    hud();
                    return;
                }
            }
        }

        function update(dt) {
            if (dt > 0) {
                state.time -= dt;
                if (state.time <= 0) { state.time = 0; endGame("⏰"); return; }
                spawnTimer -= dt;
                if (spawnTimer <= 0) {
                    spawnTarget();
                    spawnTimer = Math.max(0.22, (0.7 - state.t * 0.015) / MULT);
                }
            }
            for (var i = targets.length - 1; i >= 0; i--) {
                targets[i].life -= dt * MULT;
                if (targets[i].life <= 0) {
                    targets.splice(i, 1);
                    state.lives -= 1;
                    if (state.lives <= 0) { state.lives = 0; endGame("💨"); return; }
                }
            }
        }

        function draw() {
            var grad = ctx.createLinearGradient(0, 0, W, H);
            grad.addColorStop(0, "__BG__");
            grad.addColorStop(1, "rgba(255,255,255,.07)");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            targets.forEach(function (t) {
                var left = Math.max(0, t.life / t.maxLife);
                ctx.save();
                ctx.globalAlpha = 0.85;
                ctx.strokeStyle = "__ACCENT__";
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2 * left);
                ctx.stroke();
                ctx.restore();
                emoji(TARGET, t.x, t.y, t.r * 1.5);
            });
        }`;

    function build(cfg) {
        var kind = null;
        for (var i = 0; i < KINDS.length; i++) if (KINDS[i].id === cfg.kind) kind = KINDS[i];
        if (!kind) kind = KINDS[0];

        var theme = themeOf(cfg.theme);
        var speed = Number(cfg.speed) || 1;
        var title = cfg.title || "My Practice Game";
        var goal = cfg.goal || kind.goal;
        var icon = cfg.emoji || kind.icon;
        var good = cfg.good || kind.good;
        var bad = cfg.bad || kind.bad;
        var player = cfg.player || kind.player;
        var by = cfg.by || "Anonymous";
        var seconds = kind.seconds;

        var chips = '<span class="chip">Score <b id="score">0</b></span>' +
            '<span class="chip">Time <b id="time">' + seconds + '</b></span>' +
            '<span class="chip">❤️ <b id="lives">3</b></span>';

        var body = cfg.kind === "dodge" ? DODGE_BODY : (cfg.kind === "clicker" ? CLICKER_BODY : CATCH_BODY);

        var values = {
            "__TITLE__": esc(title),
            "__GOAL__": esc(goal),
            "__TIP__": esc(kind.tip),
            "__BY__": esc(by),
            "__EMOJI__": esc(icon),
            "__GOOD__": good.slice(0, 4),
            "__BAD__": bad.slice(0, 4),
            "__PLAYER__": player.slice(0, 4),
            "__ACCENT2__": theme.accent2,
            "__ACCENT__": theme.accent,
            "__BG__": theme.bg,
            "__MULT__": String(speed),
            "__TIME__": String(seconds),
            "__CHIPS__": chips
        };

        var parts = [
            "<!DOCTYPE html>",
            '<html lang="en">',
            "<head>",
            '<meta charset="UTF-8">',
            '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">',
            "<title>" + esc(title) + "</title>",
            STYLE,
            "</head>",
            "<body>",
            '<canvas id="c"></canvas>',
            '<div id="hud">' + chips + "</div>",
            '<div id="overlay"><div id="overlayBox"></div></div>',
            RUNTIME_TOP,
            body,
            RUNTIME_BOTTOM,
            "</body>",
            "</html>"
        ];

        return fill(parts.join("\n"), values);
    }

    function starter(kindId) {
        for (var i = 0; i < KINDS.length; i++) if (KINDS[i].id === kindId) return KINDS[i];
        return KINDS[0];
    }

    window.GameTemplates = {
        kinds: KINDS,
        themes: THEMES,
        build: build,
        starter: starter
    };
})();
