/* =====================================================================
   Practice Games - player-made games that are NOT part of the real
   games/ folder or games.csv. Everything lives in "practice mode":

     1. someone makes a game in the Game Lab  (add-game/index.html)
     2. the game is sent to Ben's review desk
     3. Ben approves -> it shows up in the games list as a PRACTICE game
        Ben deletes  -> the game is gone

   Game files are stored as data, so nothing ever gets written into the
   website's own game folders. The shared inbox is the same Firebase
   project the forum already uses. If Firebase can't be reached,
   everything still works on this device (localStorage) and games can be
   sent to Ben with a copy/paste game code.
   ===================================================================== */
(function () {
    "use strict";

    /* ---------------------------------------------------------------
       Ben's review code. Change the word if you want a new secret.
       Only this code can approve or delete games.
       --------------------------------------------------------------- */
    var REVIEW_CODE = "ben";

    /* Set this to false if you ever want game making to stay completely
       on each person's own device (no shared inbox at all). */
    var SHARE_IN_INBOX = true;

    var FIREBASE_CONFIG = {
        apiKey: "AIzaSyDyMbSVjBTVStyRXOEo38IeMcM4LWTdJ-I",
        authDomain: "games-d836d.firebaseapp.com",
        databaseURL: "https://games-d836d-default-rtdb.firebaseio.com",
        projectId: "games-d836d",
        storageBucket: "games-d836d.firebasestorage.app",
        messagingSenderId: "228157907811",
        appId: "1:228157907811:web:c2a536b3b3bb6ade5e6956"
    };
    var APP_ID = "games-d836d";
    var DB_PATH = "artifacts/" + APP_ID + "/public/data/practice_games";

    var STORE_KEY = "ben_practice_games_v1";
    var GONE_KEY = "ben_practice_deleted_v1";
    var MINE_KEY = "ben_my_game_ids_v1";
    var UNLOCK_KEY = "ben_review_unlocked_v1";
    var SDK = "https://www.gstatic.com/firebasejs/11.6.1/";

    var localGames = [];   // games saved on this device
    var remoteGames = [];  // games shared with everyone
    var gone = [];         // deleted ids, so they can't come back
    var current = [];      // merged list the pages read
    var listeners = [];
    var statusListeners = [];
    var status = "starting"; // starting | live | solo
    var fb = null;           // firebase handles once connected
    var connected = false;

    /* --------------------------- helpers --------------------------- */

    function read(key, fallback) {
        try {
            var raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            return fallback;
        }
    }

    function write(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage off */ }
    }

    function newId() {
        return "game_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
    }

    function clean(text, max) {
        return String(text == null ? "" : text).replace(/\s+/g, " ").trim().slice(0, max || 80);
    }

    function toBase64(str) { return btoa(unescape(encodeURIComponent(str))); }

    function fromBase64(str) { return decodeURIComponent(escape(atob(str))); }

    function slugTitle(title) {
        var slug = clean(title, 60).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        return slug || "practice-game";
    }

    /* ---------------------------- merging -------------------------- */

    function merge() {
        var byId = {};
        var order = [];

        function add(list) {
            list.forEach(function (g) {
                if (!g || !g.id) return;
                if (gone.indexOf(g.id) !== -1) return;
                if (!byId[g.id]) { byId[g.id] = g; order.push(g.id); return; }
                var merged = Object.assign({}, byId[g.id], g);
                if (!g._local) delete merged._local;
                byId[g.id] = merged;
            });
        }

        add(remoteGames);
        add(localGames);

        current = order.map(function (id) { return byId[id]; })
            .sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
    }

    function saveLocal(game) {
        var found = false;
        localGames = localGames.map(function (g) {
            if (g.id === game.id) { found = true; return Object.assign({}, g, game); }
            return g;
        });
        if (!found) localGames.push(game);
        write(STORE_KEY, localGames);
    }

    function publish() {
        merge();
        listeners.slice().forEach(function (cb) {
            try { cb(current); } catch (e) { console.error(e); }
        });
    }

    function setStatus(next) {
        if (status === next) return;
        status = next;
        statusListeners.slice().forEach(function (cb) {
            try { cb(next); } catch (e) { console.error(e); }
        });
    }

    /* ---------------------------- firebase ------------------------- */

    function connect() {
        Promise.all([
            import(SDK + "firebase-app.js"),
            import(SDK + "firebase-auth.js"),
            import(SDK + "firebase-database.js")
        ]).then(function (mods) {
            var appMod = mods[0], authMod = mods[1], dbMod = mods[2];
            var app = appMod.initializeApp(FIREBASE_CONFIG);
            var auth = authMod.getAuth(app);
            var db = dbMod.getDatabase(app);
            fb = { db: db, dbMod: dbMod };

            return authMod.signInAnonymously(auth).then(function () {
                dbMod.onValue(dbMod.ref(db, DB_PATH), function (snapshot) {
                    var val = snapshot.val() || {};
                    remoteGames = Object.keys(val).map(function (key) {
                        return Object.assign({ id: key }, val[key]);
                    });
                    connected = true;
                    setStatus("live");
                    publish();
                    pushLocalOnly();
                }, function (err) {
                    console.warn("Practice Games: cannot read the shared inbox", err);
                    if (!connected) { setStatus("solo"); publish(); }
                });
            });
        }).catch(function (err) {
            console.warn("Practice Games: staying on this device only", err);
            setStatus("solo");
            publish();
        });
    }

    function pushLocalOnly() {
        if (!fb) return;
        var changed = false;
        localGames.forEach(function (g) {
            if (!g._local) return;
            delete g._local;
            saveRemote(g);
            changed = true;
        });
        if (changed) write(STORE_KEY, localGames);
    }

    function saveRemote(game) {
        if (!fb) return;
        try {
            var done = fb.dbMod.set(fb.dbMod.ref(fb.db, DB_PATH + "/" + game.id), stripLocal(game));
            if (done && done.catch) {
                done.catch(function (err) {
                    console.warn("Practice Games: the shared inbox refused the save", err);
                    setStatus("solo");
                });
            }
        } catch (e) { console.warn("Practice Games: saving to the shared inbox failed", e); }
    }

    function deleteRemote(id) {
        if (!fb) return;
        try {
            var done = fb.dbMod.remove(fb.dbMod.ref(fb.db, DB_PATH + "/" + id));
            if (done && done.catch) done.catch(function () { /* nothing to do */ });
        } catch (e) { console.warn("Practice Games: deleting from the shared inbox failed", e); }
    }

    function stripLocal(game) {
        var copy = Object.assign({}, game);
        delete copy._local;
        return copy;
    }

    /* ------------------------------ API ---------------------------- */

    var api = {
        REVIEW_CODE: REVIEW_CODE,

        all: function () { return current.slice(); },
        pending: function () { return current.filter(function (g) { return g.status !== "approved"; }); },
        approved: function () { return current.filter(function (g) { return g.status === "approved"; }); },
        byId: function (id) {
            for (var i = 0; i < current.length; i++) if (current[i].id === id) return current[i];
            return null;
        },
        mine: function () {
            var ids = api.myIds();
            return current.filter(function (g) { return ids.indexOf(g.id) !== -1; });
        },

        ready: function (cb) {
            listeners.push(cb);
            if (current.length || status !== "starting") cb(current);
            return function () {
                listeners = listeners.filter(function (fn) { return fn !== cb; });
            };
        },
        onStatus: function (cb) {
            statusListeners.push(cb);
            cb(status);
            return function () {
                statusListeners = statusListeners.filter(function (fn) { return fn !== cb; });
            };
        },
        status: function () { return status; },

        /* somebody finished a game -> send it to Ben */
        submit: function (data) {
            var game = {
                id: newId(),
                title: clean(data.title, 60) || "My Practice Game",
                goal: clean(data.goal, 120) || "Have fun!",
                category: clean(data.category, 20) || "Arcade",
                emoji: clean(data.emoji, 6) || "🎮",
                by: clean(data.by, 24) || "Anonymous",
                html: String(data.html || ""),
                createdAt: Date.now(),
                status: "pending",
                _local: true
            };
            saveLocal(game);
            saveRemote(game);
            api.rememberMine(game.id);
            if (fb) delete game._local;
            publish();
            return game;
        },

        /* Ben says "good" -> it gets added to the games */
        approve: function (id) {
            var game = api.byId(id);
            if (!game) return null;
            var updated = Object.assign({}, stripLocal(game), { status: "approved", reviewedAt: Date.now() });
            saveLocal(updated);
            saveRemote(updated);
            publish();
            return updated;
        },

        /* Ben says "not good" -> the game gets deleted */
        removeGame: function (id) {
            localGames = localGames.filter(function (g) { return g.id !== id; });
            remoteGames = remoteGames.filter(function (g) { return g.id !== id; });
            if (gone.indexOf(id) === -1) gone.push(id);
            write(GONE_KEY, gone);
            write(STORE_KEY, localGames);
            deleteRemote(id);
            publish();
        },

        /* copy/paste hand-off, works even without a shared inbox */
        exportCode: function (id) {
            var game = api.byId(id);
            if (!game) return "";
            var payload = {
                t: game.title, g: game.goal, c: game.category, e: game.emoji,
                b: game.by, h: game.html, s: game.status || "pending"
            };
            return "BENGAME1:" + toBase64(JSON.stringify(payload));
        },

        importCode: function (code) {
            var text = String(code || "").trim().replace(/\s+/g, "");
            if (text.indexOf("BENGAME1:") === 0) text = text.slice(9);
            var payload;
            try {
                payload = JSON.parse(fromBase64(text));
            } catch (e) {
                return { ok: false, message: "That game code doesn't look right. Ask for it again." };
            }
            if (!payload || !payload.h) return { ok: false, message: "That game code is missing the game." };
            var game = {
                id: newId(),
                title: clean(payload.t, 60) || "Practice Game",
                goal: clean(payload.g, 120) || "Have fun!",
                category: clean(payload.c, 20) || "Arcade",
                emoji: clean(payload.e, 6) || "🎮",
                by: clean(payload.b, 24) || "Anonymous",
                html: String(payload.h),
                createdAt: Date.now(),
                status: "pending",
                _local: true
            };
            saveLocal(game);
            saveRemote(game);
            if (fb) delete game._local;
            publish();
            return { ok: true, message: "Added \u201c" + game.title + "\u201d to your review desk.", id: game.id };
        },

        myIds: function () { return read(MINE_KEY, []); },
        rememberMine: function (id) {
            var ids = api.myIds();
            if (ids.indexOf(id) === -1) { ids.push(id); write(MINE_KEY, ids); }
        },

        /* Ben's review desk lock */
        isReviewer: function () {
            try {
                return sessionStorage.getItem(UNLOCK_KEY) === "yes" || localStorage.getItem(UNLOCK_KEY) === "yes";
            } catch (e) { return false; }
        },
        unlock: function (code) {
            if (String(code == null ? "" : code).trim().toLowerCase() !== REVIEW_CODE) return false;
            try {
                sessionStorage.setItem(UNLOCK_KEY, "yes");
                localStorage.setItem(UNLOCK_KEY, "yes");
            } catch (e) { /* ignore */ }
            return true;
        },
        lock: function () {
            try {
                sessionStorage.removeItem(UNLOCK_KEY);
                localStorage.removeItem(UNLOCK_KEY);
            } catch (e) { /* ignore */ }
        },

        playerUrl: function (game) {
            return "play.html?id=" + encodeURIComponent(game.id) + "&name=" + slugTitle(game.title);
        }
    };

    localGames = read(STORE_KEY, []);
    gone = read(GONE_KEY, []);
    merge();
    window.PracticeGames = api;
    if (SHARE_IN_INBOX) connect();
    else setStatus("solo");
})();
