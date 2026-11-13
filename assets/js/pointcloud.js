/* Nuage de points 3D de l'accueil : sphère → bouclier → hexagone → cadenas.
   Canvas 2D écrit à la main, sans bibliothèque. */
(function () {
    'use strict';

    var canvas = document.querySelector('.hero-cloud');
    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext('2d');
    var hero = canvas.parentElement;
    var root = document.documentElement;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var N = window.innerWidth < 720 ? 1100 : 2400;
    var HOT_START = Math.floor(N * 0.94);   // les 6 % derniers points scintillent en couleur d'accent
    var TAU = Math.PI * 2;
    var HOLD = 3.6;                          // secondes passées sur chaque forme
    var MORPH = 1.8;                         // durée d'une transformation

    function rand(a, b) { return a + Math.random() * (b - a); }

    function shuffle(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var j = (Math.random() * (i + 1)) | 0;
            var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
        }
        return arr;
    }

    function pack(points) {
        var out = new Float32Array(N * 3);
        shuffle(points);
        for (var i = 0; i < N; i++) {
            out[i * 3] = points[i][0];
            out[i * 3 + 1] = points[i][1];
            out[i * 3 + 2] = points[i][2];
        }
        return out;
    }

    /* ---------- Formes (coordonnées dans [-1, 1]) ---------- */

    function noise() {
        var pts = [];
        for (var i = 0; i < N; i++) pts.push([rand(-3, 3), rand(-2, 2), rand(-3, 3)]);
        return pts;
    }

    function sphere() {
        var pts = [], golden = Math.PI * (3 - Math.sqrt(5));
        for (var i = 0; i < N; i++) {
            var y = 1 - (i / (N - 1)) * 2;
            var r = Math.sqrt(1 - y * y);
            pts.push([Math.cos(golden * i) * r, y, Math.sin(golden * i) * r]);
        }
        return pts;
    }

    function shieldHalfWidth(y) {
        return y > 0.1 ? 0.8 : 0.8 * (1 - Math.pow((0.1 - y) / 1.1, 2));
    }
    function shieldDepth(x) {
        return 0.32 * (1 - (x / 0.8) * (x / 0.8)) - 0.12;
    }

    function shield() {
        var pts = [];
        var nFace = Math.round(N * 0.6), nRim = Math.round(N * 0.24);
        var x, y, i, u;

        while (pts.length < nFace) {
            x = rand(-0.8, 0.8); y = rand(-1, 0.95);
            if (Math.abs(x) <= shieldHalfWidth(y)) pts.push([x, y, shieldDepth(x)]);
        }
        for (i = 0; i < nRim; i++) {
            if (Math.random() < 0.2) { x = rand(-0.8, 0.8); y = 0.95; }
            else { y = rand(-1, 0.95); x = shieldHalfWidth(y) * (Math.random() < 0.5 ? -1 : 1); }
            var z = shieldDepth(x);
            pts.push([x, y, rand(z - 0.18, z)]);
        }
        // Coche de validation, légèrement en relief sur la face
        while (pts.length < N) {
            u = Math.random();
            if (u < 0.35) { u /= 0.35; x = -0.38 + 0.28 * u; y = -0.05 - 0.3 * u; }
            else { u = (u - 0.35) / 0.65; x = -0.1 + 0.52 * u; y = -0.35 + 0.67 * u; }
            pts.push([x + rand(-0.03, 0.03), y + rand(-0.03, 0.03), shieldDepth(x) + 0.07]);
        }
        return pts;
    }

    // Rayon d'un hexagone régulier (pointe en haut) dans la direction theta
    function hexRadius(theta) {
        var a = ((theta + Math.PI / 6) % (Math.PI / 3)) - Math.PI / 6;
        return Math.cos(Math.PI / 6) / Math.cos(a);
    }

    function hexagon() {
        var pts = [];
        var gaps = [Math.PI / 6, (5 * Math.PI) / 6, (3 * Math.PI) / 2];
        while (pts.length < N) {
            var outer = Math.random() < 0.64;
            var r0 = outer ? 0.76 : 0.3, r1 = outer ? 1 : 0.5;
            var th = rand(0, TAU);
            if (outer && gaps.some(function (g) {
                var d = Math.abs(th - g); return Math.min(d, TAU - d) < 0.16;
            })) continue;
            var r = Math.sqrt(rand(r0 * r0, r1 * r1)) * hexRadius(th);
            var z = Math.random() < 0.6 ? (Math.random() < 0.5 ? -0.22 : 0.22) : rand(-0.22, 0.22);
            pts.push([Math.cos(th) * r, Math.sin(th) * r, z]);
        }
        return pts;
    }

    function padlock() {
        var pts = [];
        var bx = 0.62, by0 = -0.95, by1 = 0.12, bz = 0.24;
        var nBody = Math.round(N * 0.68);
        var x, y, z, a;

        while (pts.length < nBody) {
            var f = Math.random();
            x = rand(-bx, bx); y = rand(by0, by1); z = rand(-bz, bz);
            if (f < 0.36) z = bz;
            else if (f < 0.72) z = -bz;
            else if (f < 0.86) x = Math.random() < 0.5 ? -bx : bx;
            else y = Math.random() < 0.5 ? by0 : by1;
            // Trou de serrure sur la face avant
            if (z === bz && (Math.hypot(x, y + 0.3) < 0.11 || (Math.abs(x) < 0.045 && y < -0.3 && y > -0.62))) continue;
            pts.push([x, y, z]);
        }
        // Anse : demi-tore et deux montants
        var R = 0.42, cy = 0.5, tube = 0.08;
        while (pts.length < N) {
            a = rand(0, TAU);
            if (Math.random() < 0.62) {
                var t = rand(0, Math.PI), nx = Math.cos(t), ny = Math.sin(t);
                pts.push([nx * R + nx * Math.cos(a) * tube, cy + ny * R + ny * Math.cos(a) * tube, Math.sin(a) * tube]);
            } else {
                pts.push([(Math.random() < 0.5 ? -R : R) + Math.cos(a) * tube, rand(by1, cy), Math.sin(a) * tube]);
            }
        }
        return pts;
    }

    var shapes = [sphere, shield, hexagon, padlock].map(function (fn) { return pack(fn()); });

    // Direction de dispersion propre à chaque point, utilisée pendant les transformations
    var scatter = new Float32Array(N * 3);
    var phase = new Float32Array(N);
    for (var i = 0; i < N; i++) {
        var th = rand(0, TAU), ph = Math.acos(rand(-1, 1)), m = rand(0.15, 0.55);
        scatter[i * 3] = Math.sin(ph) * Math.cos(th) * m;
        scatter[i * 3 + 1] = Math.sin(ph) * Math.sin(th) * m;
        scatter[i * 3 + 2] = Math.cos(ph) * m;
        phase[i] = rand(0, TAU);
    }

    /* ---------- État ---------- */

    var from = pack(noise());   // au chargement, les points convergent depuis le vide
    var to = shapes[0];
    var shapeIndex = 0;
    var morphing = !reduceMotion;
    var t = 0, time = 0;
    var rotY = 0.6, tiltX = 0.18, tiltY = 0;
    var pointerX = 0, pointerY = 0;

    var W = 0, H = 0, dpr = 1;
    var color = '#8b9bff', hotColor = '#ffe45e', isLight = false;

    function readTheme() {
        var css = getComputedStyle(root);
        color = css.getPropertyValue('--cloud').trim() || color;
        hotColor = css.getPropertyValue('--cloud-hot').trim() || hotColor;
        isLight = root.getAttribute('data-theme') === 'light';
    }

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = Math.max(1, Math.round(canvas.clientWidth * dpr));
        H = Math.max(1, Math.round(canvas.clientHeight * dpr));
        canvas.width = W;
        canvas.height = H;
    }

    function easeInOut(p) {
        return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    }

    function update(dt) {
        time += dt;
        t += dt;
        if (morphing) {
            if (t >= MORPH) { morphing = false; t = 0; from = to; }
        } else if (t >= HOLD) {
            morphing = true; t = 0;
            shapeIndex = (shapeIndex + 1) % shapes.length;
            to = shapes[shapeIndex];
        }
        rotY += dt * 0.35;
        tiltX += (0.18 + pointerY * 0.35 - tiltX) * Math.min(1, dt * 3);
        tiltY += (pointerX * 0.6 - tiltY) * Math.min(1, dt * 3);
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);
        ctx.globalCompositeOperation = isLight ? 'source-over' : 'lighter';

        var p = morphing ? Math.min(1, t / MORPH) : 1;
        var e = easeInOut(p);
        var spread = morphing ? Math.sin(p * Math.PI) : 0;
        var target = morphing ? to : from;

        var size = Math.min(W, H) * 0.36;
        var cx = W * (W > H ? 0.57 : 0.5), cy = H * 0.5;
        var ay = rotY + tiltY, cosY = Math.cos(ay), sinY = Math.sin(ay);
        var cosX = Math.cos(tiltX), sinX = Math.sin(tiltX);
        var D = 3.4;
        var scanY = Math.sin(time * 0.7) * 1.15;
        var baseAlpha = isLight ? 0.22 : 0.16;

        ctx.fillStyle = color;
        for (var i = 0; i < N; i++) {
            if (i === HOT_START) ctx.fillStyle = hotColor;
            var k = i * 3;
            var x = from[k] + (target[k] - from[k]) * e + scatter[k] * spread;
            var y = from[k + 1] + (target[k + 1] - from[k + 1]) * e + scatter[k + 1] * spread;
            var z = from[k + 2] + (target[k + 2] - from[k + 2]) * e + scatter[k + 2] * spread;

            var x1 = x * cosY + z * sinY;
            var z1 = -x * sinY + z * cosY;
            var y2 = y * cosX - z1 * sinX;
            var z2 = y * sinX + z1 * cosX;

            var persp = D / (D - z2);
            var depth = Math.max(0, Math.min(1, (z2 + 1.2) / 2.4));
            var scan = Math.exp(-((y2 - scanY) * (y2 - scanY)) / 0.006);

            var alpha = baseAlpha + depth * 0.6 + scan * 0.5;
            if (i >= HOT_START) alpha *= 0.55 + 0.45 * Math.sin(time * 3 + phase[i]);
            ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

            var r = (0.9 + depth * 1.3 + scan * 0.8) * dpr;
            ctx.fillRect(cx + x1 * persp * size - r / 2, cy - y2 * persp * size - r / 2, r, r);
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    }

    /* ---------- Boucle, pause et interactions ---------- */

    var running = false, visible = true, last = 0;

    function frame(now) {
        if (!running) return;
        var dt = Math.min(0.05, (now - last) / 1000 || 0);
        last = now;
        update(dt);
        draw();
        requestAnimationFrame(frame);
    }

    function setRunning() {
        var should = !reduceMotion && visible && !document.hidden;
        if (should && !running) {
            running = true;
            last = performance.now();
            requestAnimationFrame(frame);
        } else if (!should) {
            running = false;
        }
    }

    readTheme();
    resize();

    if ('ResizeObserver' in window) {
        new ResizeObserver(function () { resize(); if (!running) draw(); }).observe(canvas);
    } else {
        window.addEventListener('resize', function () { resize(); if (!running) draw(); });
    }

    new MutationObserver(function () { readTheme(); if (!running) draw(); })
        .observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    if (reduceMotion) {
        draw();   // sphère fixe, sans animation
        return;
    }

    window.addEventListener('pointermove', function (ev) {
        var rect = hero.getBoundingClientRect();
        pointerX = Math.max(-1, Math.min(1, ((ev.clientX - rect.left) / rect.width) * 2 - 1));
        pointerY = Math.max(-1, Math.min(1, ((ev.clientY - rect.top) / rect.height) * 2 - 1));
    }, { passive: true });

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            visible = entries[0].isIntersecting;
            setRunning();
        }).observe(hero);
    }
    document.addEventListener('visibilitychange', setRunning);
    setRunning();
})();
