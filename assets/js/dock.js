      /* Wire the bottom dock nav to the existing showSection() so the
   sidebar nav and the dock nav stay perfectly in sync. */
      (function () {
        "use strict";
        var dock = document.querySelector(".dock-nav");
        if (!dock) return;
        var buttons = dock.querySelectorAll(".dock-nav__btn");

        function setActive(id) {
          buttons.forEach(function (b) {
            var isActive = b.getAttribute("data-target") === id;
            b.classList.toggle("is-active", isActive);
            if (isActive) b.setAttribute("aria-current", "page");
            else b.removeAttribute("aria-current");
          });
        }

        buttons.forEach(function (b) {
          b.addEventListener("click", function () {
            var id = b.getAttribute("data-target");
            if (!id) return;
            if (typeof window.showSection === "function") {
              window.showSection(id);
            }
            /* Also close the mobile sidebar if open — closeSidebarOnMobile
         is defined as a top-level function in an earlier script. */
            if (typeof window.closeSidebarOnMobile === "function") {
              window.closeSidebarOnMobile();
            } else if (typeof closeSidebarOnMobile === "function") {
              closeSidebarOnMobile();
            }
          });
        });

        /* Keep active state in sync whenever the active section changes
     (whether the change came from the sidebar, the dock, or the URL). */
        window.addEventListener("sectionchange", function (e) {
          var id =
            (e && e.detail && e.detail.id) ||
            (location.hash || "#hero").replace("#", "");
          setActive(id);
        });

        /* Initialize from the current hash */
        var initial = (location.hash || "#hero").replace("#", "");
        setActive(initial || "hero");
      })();
