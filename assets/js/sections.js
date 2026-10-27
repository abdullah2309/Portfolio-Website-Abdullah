      (function pageSectionInit() {
        /* Chrome runs its "scroll to the fragment" pass right after the
           load event. If we write "#hero"/"#about" into the URL before
           that happens, the browser scrolls the document to the target
           (on mobile that jumps straight past the profile sidebar).
           So URL syncing is held back until the initial load is done. */
        var urlSyncReady = false;
        window.addEventListener("load", function () {
          urlSyncReady = true;
        });

        function showSection(id) {
          const sections = document.querySelectorAll(
            "#content-work > .page-section",
          );
          sections.forEach(function (s) {
            s.classList.remove("page-section--active");
          });
          const target = document.getElementById(id);
          if (target) target.classList.add("page-section--active");
          const navLinks = document.querySelectorAll("nav ul li a");
          navLinks.forEach(function (a) {
            a.classList.remove("nav-link-active");
          });
          const activeLink = document.querySelector(
            'nav ul li a[href="#' + id + '"]',
          );
          if (activeLink) activeLink.classList.add("nav-link-active");

          // Smooth-scroll the about section to top when switching to it
          if (id === "about" && target) {
            target.scrollTo({ top: 0, behavior: "smooth" });
          }
          // Also reset main container scroll
          const main = document.querySelector(".main-container");
          if (main) main.scrollTo({ top: 0, behavior: "smooth" });

          if (history.replaceState && urlSyncReady)
            history.replaceState(null, "", "#" + id);

          // Notify other modules (e.g. scroll-jack) that the active section changed
          window.dispatchEvent(
            new CustomEvent("sectionchange", { detail: { id: id } }),
          );
        }
        window.showSection = showSection;
        document.addEventListener("DOMContentLoaded", function () {
          const hash = (window.location.hash || "#hero").replace("#", "");
          const valid = ["hero", "about"];
          showSection(valid.indexOf(hash) !== -1 ? hash : "hero");
          // Dispatch sectionchange after initial paint so the scroll-lock
          // engages correctly when the page first loads with #about
          setTimeout(function () {
            window.dispatchEvent(
              new CustomEvent("sectionchange", {
                detail: { id: hash || "hero" },
              }),
            );
          }, 80);
        });
      })();
