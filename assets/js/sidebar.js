      const sidebar = document.getElementById("sidebar");
      const backdrop = document.getElementById("sidebarBackdrop");
      const menuBtn = document.getElementById("mobileMenuBtn");
      const ICON_OPEN =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
      const ICON_CLOSE =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
      function toggleSidebar(forceState) {
        if (!sidebar) return;
        let open =
          typeof forceState === "boolean"
            ? forceState
            : !sidebar.classList.contains("sidebar-open");
        if (open) {
          sidebar.classList.add("sidebar-open");
          backdrop.classList.add("sidebar-open");
          menuBtn.setAttribute("aria-expanded", "true");
          menuBtn.setAttribute("aria-label", "Close menu");
          menuBtn.innerHTML = ICON_CLOSE;
        } else {
          sidebar.classList.remove("sidebar-open");
          backdrop.classList.remove("sidebar-open");
          menuBtn.setAttribute("aria-expanded", "false");
          menuBtn.setAttribute("aria-label", "Open menu");
          menuBtn.innerHTML = ICON_OPEN;
        }
      }
      function closeSidebarOnMobile() {
        if (window.innerWidth < 1024) toggleSidebar(false);
      }
      window.addEventListener("resize", () => {
        if (window.innerWidth >= 1024) toggleSidebar(false);
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && sidebar.classList.contains("sidebar-open"))
          toggleSidebar(false);
      });

      /* ------------------------------------------------------------
         Avatar intro: when the website loads, the Figma selection
         (frame + "img" + 50 × 50) shows itself for ~2.2s and then
         fades away. It fires once, right after the photo is ready
         (or after 1.6s max if `load` is slow), and real hovering
         keeps working exactly as before.
         ------------------------------------------------------------ */
      (function avatarIntro() {
        var av = document.querySelector(".profile-avatar");
        if (!av) return;
        var started = false;
        var HOLD_MS = 2200; /* how long the selection stays up */
        var guard;
        function play() {
          if (started) return;
          started = true;
          av.classList.add("is-intro");
          window.setTimeout(function () {
            av.classList.remove("is-intro");
          }, HOLD_MS);
        }
        /* right after the page + the photo are ready … */
        guard = window.setTimeout(play, 8000); /* … unless `load` hangs */
        window.addEventListener("load", function () {
          window.clearTimeout(guard);
          window.setTimeout(play, 350);
        });
      })();
