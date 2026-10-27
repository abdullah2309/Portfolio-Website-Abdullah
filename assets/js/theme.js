      (function initTheme() {
        const saved = localStorage.getItem("theme") || "light";
        applyTheme(saved);
        function applyTheme(t) {
          document.documentElement.setAttribute("data-theme", t);
          localStorage.setItem("theme", t);
          const slider = document.getElementById("themeSlider");
          const btns = document.querySelectorAll(
            "#themeToggle .theme-toggle-btn",
          );
          if (!slider || !btns.length) return;
          btns.forEach((b) => b.classList.remove("active"));
          if (t === "light") {
            btns[0].classList.add("active");
            slider.style.transform = "translateX(0)";
          } else {
            btns[1].classList.add("active");
            slider.style.transform = "translateX(26px)";
          }
        }
        window.setTheme = function (t) {
          applyTheme(t);
        };
        document.addEventListener("DOMContentLoaded", () => applyTheme(saved));
      })();
