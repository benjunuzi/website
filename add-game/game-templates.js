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
        { id: "orange", name: "Orange", accent: "#ff9d3f", accent2: "#ffd7a8", bg: "#251004" },
        { id: "red",    name: "Red",    accent: "#ff5f6d", accent2: "#ffb8be", bg: "#2a060b" },
        { id: "cyan",   name: "Cyan",   accent: "#25d8e8", accent2: "#a9f4fb", bg: "#03222a" },
        { id: "gold",   name: "Gold",   accent: "#ffc93c", accent2: "#fff0b8", bg: "#241a02" },
        { id: "lime",   name: "Lime",   accent: "#b6f24d", accent2: "#e4ffb0", bg: "#17220a" },
        { id: "teal",   name: "Teal",   accent: "#2dd4bf", accent2: "#a7f3e8", bg: "#042521" },
        { id: "violet", name: "Violet", accent: "#8b5cf6", accent2: "#d9c7ff", bg: "#140a2e" },
        { id: "coral",  name: "Coral",  accent: "#ff7a6b", accent2: "#ffc8bf", bg: "#2b0d09" }
    ];

    /* Faces the memory game uses. The player's chosen "good" and "bad"
       emoji are added to the front so their picks always show up. */
    var MATCH_FACES = ["🍎", "🍕", "💎", "⭐", "🎁", "⚽", "🚀", "🌈", "🍩", "🐝", "🎈", "🍇"];

    var KINDS = [
        {
            id: "catch",
            name: "Catch It",
            icon: "🧺",
            blurb: "Catch the good stuff, dodge the danger.",
            goal: "Catch as many good things as you can before time runs out!",
            seconds: 60,
            scoreLabel: "Catches",
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
            scoreLabel: "Score",
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
            scoreLabel: "Taps",
            player: "",
            good: "🎯",
            bad: "💥",
            tip: "Tap or click the targets. If 3 of them escape, the game is over."
        },
        {
            id: "jump",
            name: "Jump It",
            icon: "🦘",
            blurb: "Run, hop the hazards, grab the stars.",
            goal: "Jump over everything in your way and grab the stars!",
            seconds: 0,
            scoreLabel: "Points",
            player: "🦘",
            good: "⭐",
            bad: "🌵",
            tip: "Tap anywhere — or press the space bar — to jump."
        },
        {
            id: "bounce",
            name: "Bounce It",
            icon: "🏓",
            blurb: "Keep the ball up with your paddle.",
            goal: "Bounce the ball as many times as you can without missing!",
            seconds: 0,
            scoreLabel: "Hits",
            player: "🏓",
            good: "⚽",
            bad: "💣",
            tip: "Slide your finger or use the arrow keys to move the paddle."
        },
        {
            id: "match",
            name: "Match It",
            icon: "🃏",
            blurb: "Flip the cards and find every pair.",
            goal: "Find all the matching pairs before the clock runs out!",
            seconds: 90,
            scoreLabel: "Pairs",
            player: "",
            good: "🍎",
            bad: "💣",
            tip: "Tap two cards. If they match they stay face up, if not they flip back."
        },
        {
            id: "flap",
            name: "Flap It",
            icon: "🐦",
            blurb: "Flap through the gaps without crashing.",
            goal: "Flap through as many gaps as you can without crashing!",
            seconds: 0,
            scoreLabel: "Gaps",
            player: "🐦",
            good: "⭐",
            bad: "🌵",
            tip: "Tap anywhere — or press the space bar — to flap your wings."
        },
        {
            id: "snake",
            name: "Snake It",
            icon: "🐍",
            blurb: "Eat, grow, and don't bite yourself.",
            goal: "Eat as much food as you can without running into yourself!",
            seconds: 0,
            scoreLabel: "Food",
            player: "🐍",
            good: "🍎",
            bad: "💣",
            tip: "Tap the way you want to go, or use the arrow keys."
        },
        {
            id: "blocks",
            name: "Smash Blocks",
            icon: "🧱",
            blurb: "Bounce the ball and smash every block.",
            goal: "Smash every block with the ball before you run out of lives!",
            seconds: 0,
            scoreLabel: "Blocks",
            player: "🏓",
            good: "⚽",
            bad: "💣",
            tip: "Slide your finger or use the arrow keys to move the paddle."
        },
        {
            id: "stack",
            name: "Stack It",
            icon: "🏗️",
            blurb: "Drop the blocks and build a tall tower.",
            goal: "Stack the blocks as high as you can without missing!",
            seconds: 0,
            scoreLabel: "Blocks",
            player: "",
            good: "⭐",
            bad: "💣",
            tip: "Tap anywhere to drop the sliding block on top of the tower."
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

    /* -------------------------- Jump It ---------------------------- */

    var JUMP_BODY = `        var PLAYER = "__PLAYER__";
        var HAZARD = "__BAD__";
        var BONUS = "__GOOD__";
        var rocks = [];
        var treats = [];
        var rockTimer = 1.1;
        var treatTimer = 1.6;
        var hopY = 0;
        var hopV = 0;
        var onGround = true;

        state.bonus = 0;

        function setup() {
            rocks = [];
            treats = [];
            rockTimer = 1.1;
            treatTimer = 1.6;
            hopY = 0;
            hopV = 0;
            onGround = true;
            state.bonus = 0;
        }

        function groundLine() { return H - 74; }
        function playerX() { return W * 0.26; }

        function jump() {
            if (state.running && onGround) { hopV = -700; onGround = false; }
        }
        function onPoint() { jump(); }

        function spawnRock() {
            rocks.push({
                x: W + 40,
                w: 26 + Math.random() * 18,
                h: 20 + Math.random() * 24,
                vx: (130 + Math.random() * 55) * MULT * (1 + state.t * 0.012)
            });
        }

        function spawnTreat() {
            treats.push({
                x: W + 40,
                y: (H - 74) - (78 + Math.random() * 88),
                vx: (135 + Math.random() * 55) * MULT
            });
        }

        function update(dt) {
            var g = groundLine();
            var px = playerX();
            var i;

            if (dt > 0) {
                if ((keys[" "] || keys["ArrowUp"] || keys["w"] || keys["W"]) && onGround) jump();
                state.time += dt;
                rockTimer -= dt;
                if (rockTimer <= 0) {
                    spawnRock();
                    rockTimer = Math.max(1, (1.7 - state.t * 0.012) / MULT);
                }
                treatTimer -= dt;
                if (treatTimer <= 0) {
                    spawnTreat();
                    treatTimer = 2 + Math.random() * 2.4;
                }
            }

            hopV += 1500 * dt;
            hopY += hopV * dt;
            if (hopY >= 0) { hopY = 0; hopV = 0; onGround = true; }

            var feet = g + hopY;
            var head = feet - 42;
            var left = px - 15;
            var right = px + 15;

            for (i = rocks.length - 1; i >= 0; i--) {
                var rk = rocks[i];
                rk.x -= rk.vx * dt;
                if (rk.x < -70) { rocks.splice(i, 1); state.bonus += 2; continue; }
                var hitX = rk.x + rk.w / 2 > left && rk.x - rk.w / 2 < right;
                var hitY = feet > g - rk.h + 6 && head < g;
                if (hitX && hitY) {
                    rocks.splice(i, 1);
                    state.lives -= 1;
                    if (state.lives <= 0) { state.lives = 0; endGame("💥"); return; }
                }
            }

            for (i = treats.length - 1; i >= 0; i--) {
                var tr = treats[i];
                tr.x -= tr.vx * dt;
                if (tr.x < -70) { treats.splice(i, 1); continue; }
                var dx = tr.x - px;
                var dy = tr.y - (feet - 24);
                if (Math.sqrt(dx * dx + dy * dy) < 32) {
                    treats.splice(i, 1);
                    state.bonus += 5;
                }
            }

            state.score = Math.floor(state.t * 3) + state.bonus;
        }

        function draw() {
            var g = groundLine();
            var grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, "__BG__");
            grad.addColorStop(1, "rgba(255,255,255,.07)");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            ctx.save();
            ctx.globalAlpha = 0.4;
            ctx.strokeStyle = "__ACCENT__";
            ctx.lineWidth = 2;
            ctx.setLineDash([7, 9]);
            ctx.beginPath();
            ctx.moveTo(0, g + 4);
            ctx.lineTo(W, g + 4);
            ctx.stroke();
            ctx.restore();

            rocks.forEach(function (rk) { emoji(HAZARD, rk.x, g - rk.h / 2, Math.max(26, rk.h * 1.25)); });
            treats.forEach(function (tr) { emoji(BONUS, tr.x, tr.y, 26); });

            var feet = g + hopY;
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = "#000";
            ctx.beginPath();
            ctx.ellipse(playerX(), g + 8, Math.max(8, 20 + hopY / 11), 6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            emoji(PLAYER, playerX(), feet - 22, 34);
        }`;

    /* ------------------------- Bounce It --------------------------- */

    var BOUNCE_BODY = `        var PLAYER = "__PLAYER__";
        var BALL = "__GOOD__";
        var PADDLE_W = 96;
        var PADDLE_Y = H - 66;
        var paddleX = W / 2;
        var ball = { x: W / 2, y: (H - 66) - 52, vx: 0, vy: 0, r: 12 };

        function setup() {
            PADDLE_W = Math.max(74, Math.min(126, W * 0.28));
            PADDLE_Y = H - 66;
            paddleX = W / 2;
            pointer.x = paddleX;
            resetBall();
        }

        function resetBall() {
            ball.r = 12;
            ball.x = paddleX;
            ball.y = PADDLE_Y - 52;
            ball.vx = (Math.random() < 0.5 ? -1 : 1) * 145 * MULT;
            ball.vy = -215 * MULT;
        }

        function update(dt) {
            moveAxis(dt, 560);
            var half = PADDLE_W / 2;
            paddleX = Math.max(half + 4, Math.min(W - half - 4, pointer.x));

            if (dt <= 0) return;

            state.time += dt;
            ball.x += ball.vx * dt;
            ball.y += ball.vy * dt;

            if (ball.x < ball.r + 4) { ball.x = ball.r + 4; ball.vx = Math.abs(ball.vx); }
            if (ball.x > W - ball.r - 4) { ball.x = W - ball.r - 4; ball.vx = -Math.abs(ball.vx); }
            if (ball.y < ball.r + 52) { ball.y = ball.r + 52; ball.vy = Math.abs(ball.vy); }

            var overPaddle = ball.y + ball.r >= PADDLE_Y - 10 &&
                ball.y - ball.r <= PADDLE_Y + 14 &&
                Math.abs(ball.x - paddleX) <= half + ball.r;

            if (ball.vy > 0 && overPaddle) {
                var off = Math.max(-1, Math.min(1, (ball.x - paddleX) / half));
                var speed = Math.min(620, Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) * 1.045);
                var angle = off * 1.1;
                ball.vx = Math.sin(angle) * speed;
                ball.vy = -Math.abs(Math.cos(angle) * speed);
                ball.y = PADDLE_Y - ball.r - 12;
                state.score += 1;
            }

            if (ball.y - ball.r > H + 40) {
                state.lives -= 1;
                if (state.lives <= 0) { state.lives = 0; endGame("💔"); return; }
                resetBall();
            }
        }

        function draw() {
            var grad = ctx.createLinearGradient(0, 0, W, H);
            grad.addColorStop(0, "__BG__");
            grad.addColorStop(1, "rgba(255,255,255,.07)");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            ctx.save();
            ctx.globalAlpha = 0.35;
            ctx.strokeStyle = "__ACCENT__";
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 9]);
            ctx.beginPath();
            ctx.moveTo(0, PADDLE_Y + 24);
            ctx.lineTo(W, PADDLE_Y + 24);
            ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.fillStyle = "rgba(255,255,255,.14)";
            ctx.strokeStyle = "__ACCENT__";
            ctx.lineWidth = 3;
            roundBox(paddleX - PADDLE_W / 2, PADDLE_Y - 9, PADDLE_W, 18, 9);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
            emoji(PLAYER, paddleX, PADDLE_Y, 26);

            ctx.save();
            ctx.globalAlpha = 0.45;
            ctx.strokeStyle = "__ACCENT2__";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.r + 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            emoji(BALL, ball.x, ball.y, ball.r * 2);
        }`;

    /* -------------------------- Match It --------------------------- */

    var MATCH_BODY = `        var DECK = __DECK__;
        var COLS = 3;
        var ROWS = 4;
        var cards = [];
        var firstPick = null;
        var missTimer = 0;
        var misses = [];

        function layout() {
            var padX = 14;
            var gap = 8;
            var top = 88;
            var bottom = 34;
            var cellW = (W - padX * 2 - gap * (COLS - 1)) / COLS;
            var cellH = Math.min(cellW * 1.08, (H - top - bottom - gap * (ROWS - 1)) / ROWS);
            var gridH = cellH * ROWS + gap * (ROWS - 1);
            var startY = top + Math.max(0, (H - top - bottom - gridH) / 2);
            cards = [];
            for (var r = 0; r < ROWS; r++) {
                for (var c = 0; c < COLS; c++) {
                    cards.push({
                        x: padX + c * (cellW + gap),
                        y: startY + r * (cellH + gap),
                        w: cellW,
                        h: cellH,
                        face: "",
                        up: false,
                        done: false
                    });
                }
            }
        }

        function setup() {
            layout();
            var pairs = (COLS * ROWS) / 2;
            var used = [];
            var faces = [];
            for (var i = 0; i < pairs; i++) {
                var e = DECK[Math.floor(Math.random() * DECK.length)];
                var guard = 0;
                while (used.indexOf(e) >= 0 && guard < 60) {
                    e = DECK[Math.floor(Math.random() * DECK.length)];
                    guard++;
                }
                used.push(e);
                faces.push(e, e);
            }
            for (var j = faces.length - 1; j > 0; j--) {
                var k = Math.floor(Math.random() * (j + 1));
                var swap = faces[j];
                faces[j] = faces[k];
                faces[k] = swap;
            }
            for (var n = 0; n < cards.length; n++) cards[n].face = faces[n];
            firstPick = null;
            missTimer = 0;
            misses = [];
            state.score = 0;
            state.lives = 4;
        }

        function allDone() {
            for (var i = 0; i < cards.length; i++) if (!cards[i].done) return false;
            return true;
        }

        function win() {
            state.running = false;
            state.done = true;
            overlayBox.innerHTML =
                '<div class="big">🏆</div>' +
                '<h1>You found them all!</h1>' +
                '<p>You matched every pair with <b>' + Math.ceil(state.time) + 's</b> to spare.</p>' +
                '<button id="startBtn">▶ Play again</button>';
            overlay.classList.remove("hide");
        }

        function flip(card) {
            card.up = true;
            if (!firstPick) { firstPick = card; return; }
            if (firstPick.face === card.face) {
                firstPick.done = true;
                card.done = true;
                firstPick = null;
                state.score += 1;
                hud();
                if (allDone()) win();
            } else {
                missTimer = 0.7;
                misses = [firstPick, card];
                firstPick = null;
            }
        }

        function onPoint(x, y) {
            if (!state.running || missTimer > 0) return;
            for (var i = 0; i < cards.length; i++) {
                var c = cards[i];
                if (c.done || c.up) continue;
                if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) { flip(c); return; }
            }
        }

        function update(dt) {
            if (dt <= 0) return;
            if (missTimer > 0) {
                missTimer -= dt;
                if (missTimer <= 0) {
                    missTimer = 0;
                    misses.forEach(function (c) { if (!c.done) c.up = false; });
                    misses = [];
                    state.lives -= 1;
                    if (state.lives <= 0) { state.lives = 0; endGame("🙈"); return; }
                }
            }
            state.time -= dt;
            if (state.time <= 0) { state.time = 0; endGame("⏰"); return; }
        }

        function draw() {
            var grad = ctx.createLinearGradient(0, 0, W, H);
            grad.addColorStop(0, "__BG__");
            grad.addColorStop(1, "rgba(255,255,255,.06)");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            cards.forEach(function (c) {
                var cx = c.x + c.w / 2;
                var cy = c.y + c.h / 2;
                ctx.save();
                if (c.done) {
                    ctx.globalAlpha = 0.55;
                    ctx.fillStyle = "rgba(255,255,255,.05)";
                } else if (c.up) {
                    ctx.fillStyle = "rgba(255,255,255,.16)";
                } else {
                    ctx.fillStyle = "rgba(255,255,255,.09)";
                }
                ctx.strokeStyle = (c.up || c.done) ? "__ACCENT__" : "rgba(255,255,255,.22)";
                ctx.lineWidth = 3;
                roundBox(c.x, c.y, c.w, c.h, 16);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
                if (c.up || c.done) emoji(c.face, cx, cy, Math.min(c.w, c.h) * 0.5);
                else emoji("❓", cx, cy, Math.min(c.w, c.h) * 0.4);
            });
        }`;

    /* --------------------------- build ------------------------------ */

    /* --------------------------- Flap It ---------------------------- */

    var FLAP_BODY = `        var PLAYER = "__PLAYER__";
        var pipes = [];
        var birdX = 0;
        var bird = { y: 0, vy: 0, r: 14 };
        var pipeW = 52;
        var gapH = 168;
        var groundY = 0;
        var spawnTimer = 1.2;
        var keyLatch = false;
        var tilt = 0;

        function setup() {
            groundY = H - 44;
            birdX = W * 0.3;
            bird.r = 14;
            bird.y = H * 0.45;
            bird.vy = 0;
            pipes = [];
            spawnTimer = 1.1;
            keyLatch = false;
            tilt = 0;
            gapH = Math.max(150, Math.min(220, H * 0.28));
        }

        function flap() {
            if (!state.running) return;
            bird.vy = -285 * Math.max(0.9, Math.min(1.15, MULT));
        }
        function onPoint() { flap(); }

        function spawnPipe() {
            var margin = 40;
            var room = Math.max(40, groundY - gapH - margin * 2);
            pipes.push({
                x: W + 30,
                top: margin + Math.random() * room,
                gap: gapH,
                vx: (105 + Math.random() * 35) * MULT * (1 + state.t * 0.01),
                scored: false
            });
        }

        function crash() {
            state.lives -= 1;
            if (state.lives <= 0) { state.lives = 0; endGame("💥"); return; }
            pipes = [];
            spawnTimer = 1.2;
            bird.y = H * 0.45;
            bird.vy = 0;
            tilt = 0;
        }

        function update(dt) {
            if (dt <= 0) return;
            var down = !!(keys[" "] || keys["ArrowUp"] || keys["w"] || keys["W"]);
            if (down && !keyLatch) flap();
            keyLatch = down;

            state.time += dt;
            bird.vy += 880 * dt;
            bird.y += bird.vy * dt;
            tilt = Math.max(-0.5, Math.min(0.9, bird.vy / 620));

            spawnTimer -= dt;
            if (spawnTimer <= 0) {
                spawnPipe();
                spawnTimer = Math.max(1, (1.7 - state.t * 0.012) / MULT);
            }

            for (var i = pipes.length - 1; i >= 0; i--) {
                var p = pipes[i];
                p.x -= p.vx * dt;
                if (!p.scored && p.x + pipeW < birdX - bird.r) { p.scored = true; state.score += 1; }
                if (p.x < -pipeW - 30) { pipes.splice(i, 1); continue; }
                if (birdX + bird.r > p.x && birdX - bird.r < p.x + pipeW) {
                    if (bird.y - bird.r < p.top || bird.y + bird.r > p.top + p.gap) { crash(); return; }
                }
            }

            if (bird.y - bird.r < 0) { bird.y = bird.r; bird.vy = Math.max(0, bird.vy); }
            if (bird.y + bird.r > groundY) { crash(); return; }
        }

        function draw() {
            var grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, "__BG__");
            grad.addColorStop(1, "rgba(255,255,255,.07)");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            pipes.forEach(function (p) {
                ctx.save();
                ctx.fillStyle = "rgba(255,255,255,.12)";
                ctx.strokeStyle = "__ACCENT__";
                ctx.lineWidth = 3;
                roundBox(p.x, -6, pipeW, p.top + 6, 10);
                ctx.fill();
                ctx.stroke();
                roundBox(p.x, p.top + p.gap, pipeW, groundY - (p.top + p.gap), 10);
                ctx.fill();
                ctx.stroke();
                ctx.globalAlpha = 0.75;
                ctx.fillStyle = "__ACCENT__";
                roundBox(p.x - 4, p.top - 16, pipeW + 8, 16, 8);
                ctx.fill();
                roundBox(p.x - 4, p.top + p.gap, pipeW + 8, 16, 8);
                ctx.fill();
                ctx.restore();
            });

            ctx.save();
            ctx.globalAlpha = 0.45;
            ctx.strokeStyle = "__ACCENT__";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, groundY + 4);
            ctx.lineTo(W, groundY + 4);
            ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.translate(birdX, bird.y);
            ctx.rotate(tilt);
            emoji(PLAYER, 0, 0, 32);
            ctx.restore();
        }`;

    /* -------------------------- Snake It ---------------------------- */

    var SNAKE_BODY = `        var PLAYER = "__PLAYER__";
        var FOOD = "__GOOD__";
        var cell = 26;
        var cols = 12;
        var rows = 14;
        var ox = 0;
        var oy = 92;
        var snake = [];
        var dir = { x: 1, y: 0 };
        var queued = null;
        var food = { x: 0, y: 0 };
        var acc = 0;
        var stepTime = 0.2;

        function setup() {
            cell = Math.max(16, Math.floor(Math.min((W - 16) / 14, (H - 150) / 16)));
            cols = Math.max(8, Math.floor((W - 16) / cell));
            rows = Math.max(8, Math.floor((H - 150) / cell));
            ox = (W - cols * cell) / 2;
            oy = 92;
            stepTime = 0.2 / Math.max(0.65, Math.min(1.8, MULT));
            acc = 0;
            resetSnake();
        }

        function resetSnake() {
            var cx = Math.floor(cols / 2);
            var cy = Math.floor(rows / 2);
            snake = [];
            for (var i = 0; i < 3; i++) snake.push({ x: cx - i, y: cy });
            dir = { x: 1, y: 0 };
            queued = null;
            placeFood();
        }

        function occupied(x, y, skipTail) {
            var last = skipTail ? snake.length - 1 : snake.length;
            for (var i = 0; i < last; i++) if (snake[i].x === x && snake[i].y === y) return true;
            return false;
        }

        function placeFood() {
            var guard = 0;
            do {
                food.x = Math.floor(Math.random() * cols);
                food.y = Math.floor(Math.random() * rows);
                guard++;
            } while (occupied(food.x, food.y, false) && guard < 300);
        }

        function turn(x, y) {
            if (x === -dir.x && y === -dir.y) return;
            queued = { x: x, y: y };
        }

        function onPoint(x, y) {
            if (!state.running) return;
            var head = snake[0];
            var dx = x - (ox + head.x * cell + cell / 2);
            var dy = y - (oy + head.y * cell + cell / 2);
            if (Math.abs(dx) < cell * 0.35 && Math.abs(dy) < cell * 0.35) return;
            if (Math.abs(dx) >= Math.abs(dy)) turn(dx > 0 ? 1 : -1, 0);
            else turn(0, dy > 0 ? 1 : -1);
        }

        function step() {
            if (queued) { dir = queued; queued = null; }
            var head = snake[0];
            var nx = head.x + dir.x;
            var ny = head.y + dir.y;
            var eating = (nx === food.x && ny === food.y);

            if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || occupied(nx, ny, !eating)) {
                state.lives -= 1;
                if (state.lives <= 0) { state.lives = 0; endGame("💥"); return; }
                resetSnake();
                return;
            }

            snake.unshift({ x: nx, y: ny });
            if (eating) {
                state.score += 1;
                placeFood();
            } else {
                snake.pop();
            }
        }

        function update(dt) {
            if (dt <= 0) return;
            if (keys["ArrowLeft"] || keys["a"] || keys["A"]) turn(-1, 0);
            if (keys["ArrowRight"] || keys["d"] || keys["D"]) turn(1, 0);
            if (keys["ArrowUp"] || keys["w"] || keys["W"]) turn(0, -1);
            if (keys["ArrowDown"] || keys["s"] || keys["S"]) turn(0, 1);

            state.time += dt;
            acc += dt;
            var guard = 0;
            while (acc >= stepTime && state.running && guard < 8) {
                acc -= stepTime;
                step();
                guard++;
            }
        }

        function draw() {
            var grad = ctx.createLinearGradient(0, 0, W, H);
            grad.addColorStop(0, "__BG__");
            grad.addColorStop(1, "rgba(255,255,255,.06)");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            ctx.save();
            ctx.globalAlpha = 0.12;
            ctx.fillStyle = "__ACCENT__";
            for (var r = 0; r < rows; r++) {
                for (var c = 0; c < cols; c++) {
                    if ((r + c) % 2) continue;
                    ctx.fillRect(ox + c * cell + 1, oy + r * cell + 1, cell - 2, cell - 2);
                }
            }
            ctx.restore();

            ctx.save();
            for (var i = snake.length - 1; i >= 0; i--) {
                var s = snake[i];
                ctx.globalAlpha = i === 0 ? 1 : Math.max(0.35, 0.85 - i * 0.04);
                ctx.fillStyle = "__ACCENT__";
                roundBox(ox + s.x * cell + 2, oy + s.y * cell + 2, cell - 4, cell - 4, 7);
                ctx.fill();
            }
            ctx.restore();

            /* nothing to draw until the player has pressed Start */
            if (!snake.length) return;
            emoji(FOOD, ox + food.x * cell + cell / 2, oy + food.y * cell + cell / 2, cell * 0.85);
            var head = snake[0];
            emoji(PLAYER, ox + head.x * cell + cell / 2, oy + head.y * cell + cell / 2, cell * 1.05);
        }`;

    /* ------------------------ Smash Blocks -------------------------- */

    var BLOCKS_BODY = `        var PLAYER = "__PLAYER__";
        var BALL = "__GOOD__";
        var PADDLE_W = 96;
        var PADDLE_Y = H - 66;
        var paddleX = W / 2;
        var ball = { x: 0, y: 0, vx: 0, vy: 0, r: 9 };
        var blocks = [];
        var cols = 6;
        var rowsB = 4;
        var bw = 0;
        var bh = 16;

        function setup() {
            PADDLE_W = Math.max(74, Math.min(126, W * 0.28));
            PADDLE_Y = H - 66;
            paddleX = W / 2;
            pointer.x = paddleX;
            layoutBlocks();
            resetBall();
        }

        function layoutBlocks() {
            var gap = 5;
            var padX = 14;
            bw = (W - padX * 2 - gap * (cols - 1)) / cols;
            bh = 16;
            blocks = [];
            for (var r = 0; r < rowsB; r++) {
                for (var c = 0; c < cols; c++) {
                    blocks.push({
                        x: padX + c * (bw + gap),
                        y: 92 + r * (bh + gap),
                        w: bw,
                        h: bh,
                        row: r
                    });
                }
            }
        }

        function resetBall() {
            ball.r = 9;
            ball.x = paddleX;
            ball.y = PADDLE_Y - 42;
            ball.vx = (Math.random() < 0.5 ? -1 : 1) * 130 * MULT;
            ball.vy = -230 * MULT;
        }

        function win() {
            state.running = false;
            state.done = true;
            overlayBox.innerHTML =
                '<div class="big">🏆</div>' +
                '<h1>Every block smashed!</h1>' +
                '<p>You cleared the wall in <b>' + Math.ceil(state.t) + 's</b>.</p>' +
                '<button id="startBtn">▶ Play again</button>';
            overlay.classList.remove("hide");
        }

        function update(dt) {
            moveAxis(dt, 560);
            var half = PADDLE_W / 2;
            paddleX = Math.max(half + 4, Math.min(W - half - 4, pointer.x));
            if (dt <= 0) return;

            state.time += dt;
            ball.x += ball.vx * dt;
            ball.y += ball.vy * dt;

            if (ball.x < ball.r + 4) { ball.x = ball.r + 4; ball.vx = Math.abs(ball.vx); }
            if (ball.x > W - ball.r - 4) { ball.x = W - ball.r - 4; ball.vx = -Math.abs(ball.vx); }
            if (ball.y < ball.r + 46) { ball.y = ball.r + 46; ball.vy = Math.abs(ball.vy); }

            var overPaddle = ball.y + ball.r >= PADDLE_Y - 10 &&
                ball.y - ball.r <= PADDLE_Y + 14 &&
                Math.abs(ball.x - paddleX) <= half + ball.r;
            if (ball.vy > 0 && overPaddle) {
                var off = Math.max(-1, Math.min(1, (ball.x - paddleX) / half));
                var speed = Math.min(560, Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) * 1.03);
                /* a touch of spin so the ball never gets stuck in one lane */
                var angle = off * 1.05 + (Math.random() - 0.5) * 0.1;
                ball.vx = Math.sin(angle) * speed;
                ball.vy = -Math.abs(Math.cos(angle) * speed);
                ball.y = PADDLE_Y - ball.r - 12;
            }

            for (var i = blocks.length - 1; i >= 0; i--) {
                var b = blocks[i];
                if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w &&
                    ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {
                    var overlapX = Math.min(ball.x + ball.r - b.x, b.x + b.w - (ball.x - ball.r));
                    var overlapY = Math.min(ball.y + ball.r - b.y, b.y + b.h - (ball.y - ball.r));
                    if (overlapX < overlapY) ball.vx = -ball.vx;
                    else ball.vy = -ball.vy;
                    blocks.splice(i, 1);
                    state.score += 1;
                    break;
                }
            }

            if (!blocks.length) { win(); return; }

            if (ball.y - ball.r > H + 40) {
                state.lives -= 1;
                if (state.lives <= 0) { state.lives = 0; endGame("💔"); return; }
                resetBall();
            }
        }

        function draw() {
            var grad = ctx.createLinearGradient(0, 0, W, H);
            grad.addColorStop(0, "__BG__");
            grad.addColorStop(1, "rgba(255,255,255,.07)");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            blocks.forEach(function (b) {
                ctx.save();
                ctx.globalAlpha = 0.9;
                ctx.fillStyle = (b.row % 2 === 0) ? "__ACCENT__" : "__ACCENT2__";
                roundBox(b.x, b.y, b.w, b.h, 5);
                ctx.fill();
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = "#04060d";
                roundBox(b.x + 3, b.y + b.h - 6, b.w - 6, 3, 2);
                ctx.fill();
                ctx.restore();
            });

            ctx.save();
            ctx.globalAlpha = 0.35;
            ctx.strokeStyle = "__ACCENT__";
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 9]);
            ctx.beginPath();
            ctx.moveTo(0, PADDLE_Y + 24);
            ctx.lineTo(W, PADDLE_Y + 24);
            ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.fillStyle = "rgba(255,255,255,.14)";
            ctx.strokeStyle = "__ACCENT__";
            ctx.lineWidth = 3;
            roundBox(paddleX - PADDLE_W / 2, PADDLE_Y - 9, PADDLE_W, 18, 9);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
            emoji(PLAYER, paddleX, PADDLE_Y, 24);

            ctx.save();
            ctx.globalAlpha = 0.45;
            ctx.strokeStyle = "__ACCENT2__";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.r + 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            emoji(BALL, ball.x, ball.y, ball.r * 2.2);
        }`;

    /* -------------------------- Stack It ---------------------------- */

    var STACK_BODY = `        var tower = [];
        var blockH = 26;
        var movingX = 0;
        var movingW = 0;
        var movingDir = 1;
        var dropLock = 0;

        function setup() {
            var w = Math.min(W * 0.62, 220);
            blockH = Math.max(20, Math.min(30, Math.round(H / 22)));
            tower = [{ x: (W - w) / 2, w: w }];
            launchMoving(w, -1);
            dropLock = 0;
            state.lives = 1;
        }

        function launchMoving(w, side) {
            movingW = w;
            movingDir = side;
            movingX = side > 0 ? 8 : W - 8 - w;
        }

        function moveSpeed() {
            var m = Math.max(0.7, Math.min(1.6, MULT));
            return Math.min(430, (135 + tower.length * 9) * m);
        }

        function anchorY() {
            return Math.max(H * 0.42, (H - 96) - tower.length * blockH);
        }

        function drop() {
            if (!state.running || dropLock > 0) return;
            var top = tower[tower.length - 1];
            var left = Math.max(movingX, top.x);
            var right = Math.min(movingX + movingW, top.x + top.w);
            var overlap = right - left;

            if (overlap < 3) {
                state.lives = 0;
                endGame("💥");
                return;
            }

            var perfect = Math.abs(movingX - top.x) < 3 && Math.abs(movingW - top.w) < 3;
            var w = perfect ? top.w : overlap;
            var x = perfect ? top.x : left;
            tower.push({ x: x, w: w });
            state.score += perfect ? 2 : 1;
            if (tower.length > 22) tower.shift();
            hud();
            launchMoving(w, -movingDir);
            dropLock = 0.12;
        }

        function onPoint() { drop(); }

        function update(dt) {
            if (dt <= 0) return;
            state.time += dt;
            if (dropLock > 0) dropLock -= dt;
            movingX += movingDir * moveSpeed() * dt;
            if (movingX < 8) { movingX = 8; movingDir = 1; }
            if (movingX + movingW > W - 8) { movingX = W - 8 - movingW; movingDir = -1; }
        }

        function draw() {
            var grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, "__BG__");
            grad.addColorStop(1, "rgba(255,255,255,.06)");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            var base = anchorY();
            var n = tower.length;
            for (var i = 0; i < n; i++) {
                var b = tower[i];
                var y = base + (n - 1 - i) * blockH;
                ctx.save();
                ctx.globalAlpha = 0.92;
                ctx.fillStyle = (i % 2 === 0) ? "__ACCENT__" : "__ACCENT2__";
                roundBox(b.x, y, b.w, blockH - 3, 7);
                ctx.fill();
                ctx.globalAlpha = 0.25;
                ctx.fillStyle = "#04060d";
                roundBox(b.x + 4, y + blockH - 9, b.w - 8, 4, 2);
                ctx.fill();
                ctx.restore();
            }

            ctx.save();
            ctx.globalAlpha = 0.95;
            ctx.fillStyle = "__ACCENT2__";
            roundBox(movingX, base - blockH + 1, movingW, blockH - 3, 7);
            ctx.fill();
            ctx.restore();

            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.strokeStyle = "__ACCENT__";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, H - 90);
            ctx.lineTo(W, H - 90);
            ctx.stroke();
            ctx.restore();
        }`;

    function deckLiteral(good, bad) {
        var faces = [good, bad].concat(MATCH_FACES).filter(function (e, i, arr) {
            return e && arr.indexOf(e) === i;
        }).slice(0, 8);
        return "[" + faces.map(function (e) {
            return '"' + String(e).replace(/["\\<>]/g, "") + '"';
        }).join(",") + "]";
    }

    function bodyFor(kindId) {
        if (kindId === "dodge") return DODGE_BODY;
        if (kindId === "clicker") return CLICKER_BODY;
        if (kindId === "jump") return JUMP_BODY;
        if (kindId === "bounce") return BOUNCE_BODY;
        if (kindId === "match") return MATCH_BODY;
        if (kindId === "flap") return FLAP_BODY;
        if (kindId === "snake") return SNAKE_BODY;
        if (kindId === "blocks") return BLOCKS_BODY;
        if (kindId === "stack") return STACK_BODY;
        return CATCH_BODY;
    }

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

        var chips = '<span class="chip">' + esc(kind.scoreLabel || "Score") + ' <b id="score">0</b></span>' +
            '<span class="chip">Time <b id="time">' + seconds + '</b></span>' +
            '<span class="chip">❤️ <b id="lives">3</b></span>';

        var body = bodyFor(cfg.kind);

        var values = {
            "__TITLE__": esc(title),
            "__GOAL__": esc(goal),
            "__TIP__": esc(kind.tip),
            "__BY__": esc(by),
            "__EMOJI__": esc(icon),
            "__GOOD__": good.slice(0, 4),
            "__BAD__": bad.slice(0, 4),
            "__PLAYER__": player.slice(0, 4),
            "__DECK__": deckLiteral(good, bad),
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
