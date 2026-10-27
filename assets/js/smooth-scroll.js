      (function () {
        "use strict";
        var reduced = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        if (reduced || typeof window.Lenis === "undefined") return;

        /* Helper: attach a single Lenis instance to a scrollable element */
        function attachLenis(el) {
          if (!el || el.__lenis) return null;
          var l = new window.Lenis({
            wrapper: el,
            content: el,
            lerp: 0.1 /* smooth-out factor; smaller = smoother/slower */,
            duration: 1.1 /* fallback duration when wheelMode=duration */,
            wheelMultiplier: 1.0,
            touchMultiplier: 1.2,
            smoothWheel: true,
            smoothTouch: false /* touch users want native scroll */,
            easing: function (t) {
              return Math.min(1, 1.001 - Math.pow(2, -10 * t));
            },
          });
          el.__lenis = l;
          return l;
        }

        /* The portfolio uses scrollable .page-section--scrollable elements,
     the sidebar .scrollable-content, #content-play, and the main container.
     Attach a Lenis instance to each that actually scrolls. */
        var lenisInstances = [];
        function initAll() {
          var sels = [
            ".page-section--scrollable",
            "#content-play",
            ".scrollable-content",
            ".main-container",
            ".sidebar-container",
          ];
          sels.forEach(function (sel) {
            var els = document.querySelectorAll(sel);
            els.forEach(function (el) {
              var l = attachLenis(el);
              if (l) lenisInstances.push(l);
            });
          });
        }

        /* RAF driver — uses a single rAF for all Lenis instances so we
     get consistent 60 fps pacing across systems. */
        var running = true;
        function raf(time) {
          if (!running) return;
          lenisInstances.forEach(function (l) {
            l && l.raf(time);
          });
          requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        /* Pause/resume on visibility change for perf */
        document.addEventListener("visibilitychange", function () {
          running = !document.hidden;
          if (running) requestAnimationFrame(raf);
        });

        /* Init now and also after fonts are ready (font load changes scroll size) */
        initAll();
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(function () {
            /* recompute sizes on the existing instances */
            lenisInstances.forEach(function (l) {
              l && l.resize && l.resize();
            });
          });
        }

        /* When the active section changes, reset its scroll via Lenis */
        window.addEventListener("sectionchange", function (e) {
          var id =
            (e && e.detail && e.detail.id) ||
            (location.hash || "#hero").slice(1);
          var target = document.getElementById(id);
          if (target && target.__lenis) {
            target.__lenis.scrollTo(0, { immediate: true });
          }
        });

        /* === SCROLL-LOCK INTEGRATION ===
     While the headline color is filling, the scroll-jack module puts
     .fx-scroll-lock on the #about element. When that happens, we
     stop the #about Lenis instance so its wheel handler doesn't fight
     with the scroll-jack. When the lock class is removed, we resume. */
        var aboutEl = document.getElementById("about");
        function syncAboutLockState() {
          if (!aboutEl || !aboutEl.__lenis) return;
          if (aboutEl.classList.contains("fx-scroll-lock")) {
            aboutEl.__lenis.stop && aboutEl.__lenis.stop();
          } else {
            aboutEl.__lenis.start && aboutEl.__lenis.start();
          }
        }
        /* Apply immediately (in case #about was locked before Lenis started) */
        syncAboutLockState();
        /* Observe future class changes on #about */
        if (aboutEl) {
          var mo = new MutationObserver(function () {
            syncAboutLockState();
          });
          mo.observe(aboutEl, { attributes: true, attributeFilter: ["class"] });
        }
        /* Re-sync after sectionchange too */
        window.addEventListener("sectionchange", syncAboutLockState);

        /* Re-init when DOMContentLoaded in case we ran before parse finished */
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", initAll);
        }
      })();
