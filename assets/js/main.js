      // ====== Email Copy Function ======
      function copyEmail(btn) {
        var emailLink = btn.parentElement.querySelector("a");
        var email = emailLink
          ? emailLink.textContent.trim()
          : "abdullah2309r@gmail.com";

        // Try modern clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard
            .writeText(email)
            .then(function () {
              showCopyFeedback(btn, email);
            })
            .catch(function () {
              fallbackCopy(email, btn);
            });
        } else {
          fallbackCopy(email, btn);
        }
      }

      function fallbackCopy(text, btn) {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand("copy");
          showCopyFeedback(btn, text);
        } catch (e) {}
        document.body.removeChild(ta);
      }

      function showCopyFeedback(btn, email) {
        var original = btn.innerHTML;
        btn.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        btn.style.color = "var(--primary-blue)";

        // Show toast
        var toast = document.createElement("div");
        // toast.style.cssText = "position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--primary-blue);color:#fff;padding:8px 18px;border-radius:8px;font-size:12px;font-family:'Space Mono',monospace;font-weight:600;z-index:9999;opacity:0;transition:opacity 0.3s ease;box-shadow:0 4px 16px rgba(24,62,235,0.3);";
        // toast.textContent  ;
        // toast.textContent = "✓ " + email + " copied";
        document.body.appendChild(toast);
        setTimeout(function () {
          toast.style.opacity = "1";
        }, 10);
        setTimeout(function () {
          toast.style.opacity = "0";
          setTimeout(function () {
            toast.remove();
          }, 300);
        }, 2000);

        setTimeout(function () {
          btn.innerHTML = original;
          btn.style.color = "";
        }, 1500);
      }

      function switchMode(mode) {
        const workContent = document.getElementById("content-work");
        const playContent = document.getElementById("content-play");
        const slider = document.getElementById("toggleSlider");
        const btns = document.querySelectorAll("#modeToggle .toggle-btn");
        btns.forEach((btn) => btn.classList.remove("active"));
        if (mode === "work") {
          btns[0].classList.add("active");
          slider.style.transform = "translateX(0)";
          workContent.classList.remove("hidden");
          workContent.classList.add("block");
          playContent.classList.add("hidden");
          playContent.classList.remove("block");
          if (typeof window.gameReset === "function") window.gameReset();
        } else {
          btns[1].classList.add("active");
          slider.style.transform = "translateX(100%)";
          workContent.classList.add("hidden");
          workContent.classList.remove("block");
          playContent.classList.remove("hidden");
          playContent.classList.add("block");
          if (typeof window.gameAutoStart === "function")
            window.gameAutoStart();
        }
      }
