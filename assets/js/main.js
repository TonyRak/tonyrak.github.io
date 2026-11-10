(function () {
    'use strict';

    var root = document.documentElement;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---- Année du copyright ---- */
    var year = document.getElementById('annee');
    if (year) year.textContent = new Date().getFullYear();

    /* ---- Bascule de thème ---- */
    var themeBtn = document.querySelector('.theme-toggle');
    var themeMeta = document.querySelector('meta[name="theme-color"]');

    function syncTheme() {
        var light = root.getAttribute('data-theme') === 'light';
        if (themeBtn) themeBtn.setAttribute('aria-label', light ? 'Passer en thème sombre' : 'Passer en thème clair');
        if (themeMeta) themeMeta.setAttribute('content', light ? '#f6f7fc' : '#0b0e1a');
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', function () {
            var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            root.setAttribute('data-theme', next);
            try { localStorage.setItem('theme', next); } catch (e) { /* non bloquant */ }
            syncTheme();
        });
    }
    syncTheme();

    /* ---- Menu mobile ---- */
    var navBtn = document.querySelector('.nav-toggle');
    var nav = document.getElementById('menu');

    function closeNav() {
        if (!nav || !navBtn) return;
        nav.classList.remove('is-open');
        navBtn.setAttribute('aria-expanded', 'false');
    }

    if (navBtn && nav) {
        navBtn.addEventListener('click', function () {
            var open = nav.classList.toggle('is-open');
            navBtn.setAttribute('aria-expanded', String(open));
        });
        nav.addEventListener('click', function (e) {
            if (e.target.closest('a')) closeNav();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeNav();
        });
    }

    /* ---- Lien actif dans la navigation ---- */
    var links = nav ? Array.prototype.slice.call(nav.querySelectorAll('a')) : [];
    var sections = links
        .map(function (a) { return document.querySelector(a.getAttribute('href')); })
        .filter(Boolean);

    function setActive(id) {
        links.forEach(function (a) {
            var on = a.getAttribute('href') === '#' + id;
            a.classList.toggle('is-active', on);
            if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
    }

    if ('IntersectionObserver' in window && sections.length) {
        var spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) setActive(entry.target.id);
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        sections.forEach(function (s) { spy.observe(s); });

        var hero = document.getElementById('accueil');
        if (hero) {
            new IntersectionObserver(function (entries) {
                if (entries[0].isIntersecting) setActive('');
            }, { rootMargin: '-45% 0px -50% 0px' }).observe(hero);
        }
    }

    /* ---- Apparition au défilement ---- */
    var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    if (reduceMotion || !('IntersectionObserver' in window)) {
        reveals.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                io.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
        reveals.forEach(function (el) { io.observe(el); });
    }

    /* ---- Effet machine à écrire sur le rôle ---- */
    var typed = document.querySelector('.typed');
    if (typed && !reduceMotion) {
        var roles = (typed.getAttribute('data-roles') || '').split('|').filter(Boolean);
        if (roles.length > 1) {
            // Le texte complet reste lisible par les lecteurs d'écran.
            typed.setAttribute('aria-label', roles.join(' — '));
            var index = 0;
            var pos = roles[0].length;
            var deleting = true;

            var tick = function () {
                var word = roles[index];
                var delay;
                if (deleting) {
                    pos -= 1;
                    delay = 28;
                    if (pos === 0) {
                        deleting = false;
                        index = (index + 1) % roles.length;
                        delay = 350;
                    }
                } else {
                    pos += 1;
                    delay = 55;
                    if (pos === word.length) {
                        deleting = true;
                        delay = 2600;
                    }
                }
                typed.textContent = roles[index].slice(0, pos);
                setTimeout(tick, delay);
            };
            setTimeout(tick, 2600);
        }
    }
})();
