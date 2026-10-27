      /* ===== enhancements (scroll text, About card art, easter eggs) ===== */
      /* enhancements.js — add-on layer. No dependencies; touches no existing markup except
   the target headline's text nodes and the top of each .about-card. */
      (function () {
        "use strict";
        var doc = document,
          root = doc.documentElement;
        var reduced = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        var clamp = function (v, a, b) {
          return Math.min(b, Math.max(a, v));
        };
        var $ = function (s, r) {
          return (r || doc).querySelector(s);
        };
        var $$ = function (s, r) {
          return Array.prototype.slice.call((r || doc).querySelectorAll(s));
        };

        /* ---------- 1. Scroll-driven headline color (scroll-jacked) ---------- */
        /* Behaviour:
     - While the about section is at the top, user scroll is "captured"
       — page does NOT scroll; instead each scroll tick advances the
       headline's --scroll-fill variable from 0 to 1. The CSS uses
       background-size: calc(var(--scroll-fill) * 100%) so the headline
       fills in left-to-right just like the existing hover animation.
     - When --scroll-fill reaches 1, scroll lock is released and the
       page begins to scroll normally.
     - Existing hover animation on the headline is preserved (uses
       .fx-scrolltext-ready class, and hover overrides background-size
       to 100%). */
        function initScrollText() {
          var about = $("#about"),
            h1 =
              $("#about .about-shell > h1") ||
              $("#about .hover-p .my-text-tilte2");
          if (!about || !h1 || h1.dataset.fx) return;
          h1.dataset.fx = "1";

          /* Mark the headline as ready so the CSS line-fill effect applies */
          h1.classList.add("fx-scrolltext-ready");

          /* ---- Wrap each VISUAL line of the headline into its own .hl-line span
       so each line can be color-filled independently (line-by-line scroll).
       We do this by walking the text nodes and wrapping each "word" (chunk
       separated by whitespace) in an inline <span class="hl-word">, then
       grouping words into lines based on their bounding rect top. The
       words within a line are then collected into a single .hl-line span
       that wraps the gradient. Re-run on resize so the lines stay in sync
       if the layout changes. */
          var wrapped = false;
          var lineSpans = []; /* Array of { el: HTMLElement } */
          var wordSpans = []; /* Array of <span class="hl-word"> elements */

          function wrapWords() {
            /* Walk all text nodes inside h1, but ignore the se-icon-reveal
         markup so we don't disturb the hover icons. We split text on
         whitespace and wrap each word in a span. Inline children like
         the .se-highlight span are left in place; we wrap their text
         content too. */

            /* Preserve the se-highlight span so its hover behaviour survives.
         Strategy: take a snapshot of the innerHTML, but we can't use
         innerHTML because that destroys existing event listeners. So we
         use a DOM walk: for every text node inside h1, split it on
         whitespace and replace each chunk with a <span class="hl-word">
         plus a text node for the space. */
            var walker = doc.createTreeWalker(h1, NodeFilter.SHOW_TEXT, null);
            var textNodes = [];
            var n;
            while ((n = walker.nextNode())) {
              /* Skip text inside .se-icon-reveal (those are icon labels) */
              if (n.parentElement && n.parentElement.closest(".se-icon-reveal"))
                continue;
              textNodes.push(n);
            }
            textNodes.forEach(function (tn) {
              var text = tn.nodeValue;
              if (!text || !text.trim()) return;
              var parent = tn.parentNode;
              var frag = doc.createDocumentFragment();
              /* Split on whitespace, keep words and spaces */
              var parts = text.split(/(\s+)/);
              parts.forEach(function (p) {
                if (p === "") return;
                if (/^\s+$/.test(p)) {
                  frag.appendChild(doc.createTextNode(p));
                } else {
                  var w = doc.createElement("span");
                  w.className = "hl-word";
                  w.style.display = "inline";
                  w.textContent = p;
                  frag.appendChild(w);
                  wordSpans.push(w);
                }
              });
              parent.replaceChild(frag, tn);
            });
          }

          function groupIntoLines() {
            /* Group wordSpans into lines based on their bounding rect top.
         Each line becomes one .hl-line span. */
            var groups = [];
            var current = null;
            var lastTop = null;
            wordSpans.forEach(function (w) {
              var r = w.getBoundingClientRect();
              var top = Math.round(r.top);
              if (lastTop === null || top !== lastTop) {
                current = { top: top, words: [] };
                groups.push(current);
                lastTop = top;
              }
              current.words.push(w);
            });

            /* Clear any old .hl-line wrappers (without losing wordSpans). */
            /* Build the line structure: wrap each group's words in a <span class="hl-line">.
         We need to insert the hl-line spans around the existing hl-word spans
         without disturbing their inline flow. */
            lineSpans = [];
            groups.forEach(function (g) {
              /* Find the parent of the first word and create the line span
           at the same position. */
              var lineEl = doc.createElement("span");
              lineEl.className = "hl-line";
              /* Insert lineEl before the first word, then move all words of
           this group (plus any whitespace text nodes between them) into
           the lineEl. */
              var firstWord = g.words[0];
              var parent = firstWord.parentNode;
              parent.insertBefore(lineEl, firstWord);

              /* Walk through the parent's children from firstWord onward,
           pulling each word and the whitespace between into lineEl,
           stopping when we hit the last word of this group OR a word
           that belongs to a different group. */
              var node = firstWord;
              var lastWord = g.words[g.words.length - 1];
              var toMove = [];
              while (node) {
                var next = node.nextSibling;
                if (node.nodeType === 3 /* text */) {
                  /* whitespace between words of this line — keep it */
                  toMove.push(node);
                } else if (
                  node.nodeType === 1 &&
                  node.classList.contains("hl-word")
                ) {
                  /* is this word in this group? */
                  if (g.words.indexOf(node) !== -1) {
                    toMove.push(node);
                    if (node === lastWord) break;
                  } else {
                    /* belongs to a different line — stop */
                    break;
                  }
                } else {
                  /* Some other element (e.g. the .se-highlight span wrapper) —
               we keep it inside the line if its words belong here. But
               since .se-highlight is inline and our wrapping put hl-word
               spans inside it, we just treat it as part of the line. */
                  toMove.push(node);
                }
                node = next;
              }
              toMove.forEach(function (n2) {
                lineEl.appendChild(n2);
              });
              lineSpans.push(lineEl);
            });
          }

          function buildLines() {
            if (wrapped) return;
            wrapWords();
            wrapped = true;
            groupIntoLines();
          }

          function rebuildLines() {
            /* On resize we need to re-group words into lines because the wrap
         points may have changed. We ungroup by unwrapping each line
         span (move its children back to the parent), then regroup. */
            lineSpans.forEach(function (ls) {
              var parent = ls.parentNode;
              while (ls.firstChild) parent.insertBefore(ls.firstChild, ls);
              parent.removeChild(ls);
            });
            lineSpans = [];
            groupIntoLines();
            /* Re-apply the current fill to the new lines */
            applyFill(vp.v);
          }

          buildLines();
          if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function () {
              rebuildLines();
            });
          }

          /* virtual progress (0..N) where N = number of lines. Each unit
       represents one line fully filling. */
          var vp = { v: 0 };
          var locked = false;
          /* pixels of wheel scroll needed to fully fill ONE line. Larger =
       slower / more deliberate fill per line. */
          var FILL_BUDGET_PER_LINE = 280;

          function isHeadlineInView() {
            var r = h1.getBoundingClientRect();
            return r.bottom > 0 && r.top < window.innerHeight * 0.8;
          }

          /* Apply a virtual progress value to the line spans.
       vp.v is in [0, N]. For each line i (0-indexed), its fill is:
         lineFill_i = clamp(vp.v - i, 0, 1)
       So line 0 fills first (0..1), then line 1, then line 2, etc. */
          function applyFill(v) {
            v = clamp(v, 0, lineSpans.length);
            vp.v = v;
            lineSpans.forEach(function (ls, i) {
              var lf = clamp(v - i, 0, 1);
              ls.style.setProperty("--line-fill", lf.toFixed(3));
            });
          }

          function setFill(v) {
            applyFill(v);
          }

          function isComplete() {
            return vp.v >= lineSpans.length - 0.001;
          }

          function paint() {
            /* While unlocked and user is past the top, keep fill at full. */
            if (!locked && about.scrollTop > 4) {
              if (!isComplete()) setFill(lineSpans.length);
            }
          }

          var raf = 0;
          function queue() {
            if (!raf)
              raf = requestAnimationFrame(function () {
                raf = 0;
                paint();
              });
          }

          /* Engage the lock when the headline is in view and we're at the top
       of the about section, while not yet complete. */
          function updateLockState() {
            var shouldLock =
              isHeadlineInView() && about.scrollTop <= 4 && !isComplete();
            if (shouldLock && !locked) {
              locked = true;
              about.classList.add("fx-scroll-lock");
            } else if (!shouldLock && locked && isComplete()) {
              locked = false;
              about.classList.remove("fx-scroll-lock");
            }
          }

          /* Intercept wheel events while locked. preventDefault stops the page
       from scrolling; we advance vp.v instead. When vp.v reaches N (all
       lines complete), we release the lock so the next scroll tick
       actually scrolls. */
          function onWheel(e) {
            if (!locked) return;
            if (!about.classList.contains("page-section--active")) return;
            var delta = e.deltaY;
            if (Math.abs(delta) < 0.5) return;
            e.preventDefault();
            e.stopImmediatePropagation();
            var step = delta / FILL_BUDGET_PER_LINE;
            var next = clamp(vp.v + step, 0, lineSpans.length);
            setFill(next);
            if (isComplete()) {
              locked = false;
              about.classList.remove("fx-scroll-lock");
              queue();
            }
          }

          /* Keyboard: PageUp/PageDown, Arrow Up/Down while locked */
          function onKeyDown(e) {
            if (!locked) return;
            if (!about.classList.contains("page-section--active")) return;
            var k = e.key,
              step = 0;
            if (k === "ArrowDown" || k === "PageDown" || k === " ") step = 0.15;
            else if (k === "ArrowUp" || k === "PageUp") step = -0.15;
            else return;
            e.preventDefault();
            var next = clamp(vp.v + step, 0, lineSpans.length);
            setFill(next);
            if (isComplete()) {
              locked = false;
              about.classList.remove("fx-scroll-lock");
            }
            queue();
          }

          /* Touch: similar wheel handling — when locked, swipe advances the color */
          var touchStartY = 0;
          function onTouchStart(e) {
            if (e.touches && e.touches.length)
              touchStartY = e.touches[0].clientY;
          }
          function onTouchMove(e) {
            if (!locked) return;
            if (!about.classList.contains("page-section--active")) return;
            var y =
              e.touches && e.touches[0] ? e.touches[0].clientY : touchStartY;
            var delta =
              touchStartY - y; /* swipe up → positive → fill forward */
            if (Math.abs(delta) < 4) return;
            e.preventDefault();
            var step = delta / FILL_BUDGET_PER_LINE;
            var next = clamp(vp.v + step, 0, lineSpans.length);
            setFill(next);
            touchStartY = y;
            if (isComplete()) {
              locked = false;
              about.classList.remove("fx-scroll-lock");
            }
            queue();
          }

          /* Attach listeners — passive:false so we can preventDefault while locked */
          about.addEventListener("wheel", onWheel, {
            passive: false,
            capture: true,
          });
          about.addEventListener("touchstart", onTouchStart, { passive: true });
          about.addEventListener("touchmove", onTouchMove, {
            passive: false,
            capture: true,
          });
          doc.addEventListener("keydown", onKeyDown, { passive: false });

          /* When the about section's scrollTop returns to 0, re-engage the lock
       so the user can scroll-fill again (if they haven't completed yet). */
          about.addEventListener(
            "scroll",
            function () {
              if (about.scrollTop <= 0 && !isComplete() && isHeadlineInView()) {
                if (!locked) {
                  locked = true;
                  about.classList.add("fx-scroll-lock");
                }
              }
              queue();
            },
            { passive: true },
          );

          /* When switching sections, ensure the lock state is correct */
          window.addEventListener("sectionchange", function () {
            if (about.classList.contains("page-section--active")) {
              if (about.scrollTop <= 4 && !isComplete()) {
                locked = true;
                about.classList.add("fx-scroll-lock");
              }
            } else {
              locked = false;
              about.classList.remove("fx-scroll-lock");
            }
            queue();
          });

          /* Re-evaluate on resize — rebuild lines since wrap points may change */
          var resizeT = null;
          window.addEventListener("resize", function () {
            updateLockState();
            if (resizeT) clearTimeout(resizeT);
            resizeT = setTimeout(function () {
              rebuildLines();
              queue();
            }, 120);
          });

          /* Initial paint: empty fill, then engage lock on first load if about is active */
          setFill(0);
          setTimeout(function () {
            rebuildLines();
            setFill(0);
            if (
              about.classList.contains("page-section--active") &&
              about.scrollTop <= 4
            ) {
              locked = true;
              about.classList.add("fx-scroll-lock");
            }
            queue();
          }, 120);
        }

        /* ---------- 3. About card art + entrance ---------- */
        var P = 'pathLength="1"';
        var SHIELD =
          "M160 24L212 42V88C212 120 188 142 160 154C132 142 108 120 108 88V42Z";
        var ART = [
          /* Architect: HLD -> LLD blueprint */
          '<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
            '<path class="l grid" d="M0 30H320M0 60H320M0 90H320M0 120H320M0 150H320M40 0V180M80 0V180M120 0V180M160 0V180M200 0V180M240 0V180M280 0V180"/>' +
            '<path class="wire" d="M160 66V84M160 84H60V104M160 84V104M160 84H260V104"/>' +
            '<circle class="pk pk-l" cx="160" cy="66" r="3"/><circle class="pk pk-m" cx="160" cy="66" r="3"/><circle class="pk pk-r" cx="160" cy="66" r="3"/>' +
            '<g class="fx-hld"><rect class="box hi d" ' +
            P +
            ' x="110" y="30" width="100" height="36" rx="5"/><text class="t-hi" x="160" y="52" text-anchor="middle">HLD</text></g>' +
            '<g class="fx-g fx-l1"><rect class="box d" ' +
            P +
            ' x="20" y="104" width="80" height="34" rx="5"/><text x="60" y="125" text-anchor="middle">LLD</text></g>' +
            '<g class="fx-g fx-l2"><rect class="box d" ' +
            P +
            ' x="120" y="104" width="80" height="34" rx="5"/><text x="160" y="125" text-anchor="middle">LLD</text></g>' +
            '<g class="fx-g fx-l3"><rect class="box d" ' +
            P +
            ' x="220" y="104" width="80" height="34" rx="5"/><text x="260" y="125" text-anchor="middle">LLD</text></g>' +
            '<path class="l" d="M20 160H300M20 155V165M300 155V165"/><text x="160" y="157" text-anchor="middle">scalable</text></svg>',
          /* Full-stack: three layers + stack chips */
          '<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
            '<g class="fx-g fx-s1"><rect class="box hi d" ' +
            P +
            ' x="60" y="18" width="200" height="30" rx="6"/><circle class="hi-dot" cx="76" cy="33" r="3"/><text class="t-hi" x="164" y="37" text-anchor="middle">UI · React / Flutter</text></g>' +
            '<g class="fx-g fx-s2"><rect class="box d" ' +
            P +
            ' x="60" y="58" width="200" height="30" rx="6"/><circle class="dot" cx="76" cy="73" r="3"/><text x="164" y="77" text-anchor="middle">API · .NET / PHP</text></g>' +
            '<g class="fx-g fx-s3"><rect class="box d" ' +
            P +
            ' x="60" y="98" width="200" height="30" rx="6"/><circle class="dot" style="animation-delay:.3s" cx="76" cy="113" r="3"/><text x="164" y="117" text-anchor="middle">Data · SQL</text></g>' +
            '<g class="fx-g fx-c1"><rect class="box" x="39" y="142" width="50" height="20" rx="10"/><text x="64" y="155" text-anchor="middle">.NET</text></g>' +
            '<g class="fx-g fx-c2"><rect class="box" x="99" y="142" width="54" height="20" rx="10"/><text x="126" y="155" text-anchor="middle">React</text></g>' +
            '<g class="fx-g fx-c3"><rect class="box" x="163" y="142" width="46" height="20" rx="10"/><text x="186" y="155" text-anchor="middle">PHP</text></g>' +
            '<g class="fx-g fx-c4"><rect class="box" x="219" y="142" width="62" height="20" rx="10"/><text x="250" y="155" text-anchor="middle">Flutter</text></g></svg>',
          /* Built to last: shield, scan, checks */
          '<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
            '<defs><clipPath id="fxShieldClip"><path d="' +
            SHIELD +
            '"/></clipPath></defs>' +
            '<path class="l" d="M42 44H88M42 74H80M42 104H88M232 44H292M240 74H292M232 104H292"/>' +
            '<circle class="dot" cx="32" cy="44" r="3"/><circle class="dot" style="animation-delay:.2s" cx="32" cy="74" r="3"/><circle class="dot" style="animation-delay:.4s" cx="32" cy="104" r="3"/>' +
            '<circle class="dot" cx="300" cy="44" r="3"/><circle class="dot" style="animation-delay:.2s" cx="300" cy="74" r="3"/><circle class="dot" style="animation-delay:.4s" cx="300" cy="104" r="3"/>' +
            '<path class="ring" d="' +
            SHIELD +
            '"/>' +
            '<path class="shield d" ' +
            P +
            ' d="' +
            SHIELD +
            '"/>' +
            '<g clip-path="url(#fxShieldClip)"><rect class="scan" x="100" y="22" width="120" height="14"/></g>' +
            '<path class="tick" d="M138 90L154 106L184 72"/></svg>',
        ];
        function initCards() {
          var cards = $$("#about .about-card");
          var canHover = window.matchMedia("(hover: hover)").matches;
          cards.forEach(function (c, i) {
            if (c.querySelector(".fx-art")) return;
            var art = doc.createElement("div");
            art.className = "fx-art";
            art.innerHTML = ART[i % ART.length];
            c.insertBefore(art, c.firstChild);
            c.style.setProperty("--d", i * 120 + "ms");
            if (canHover && !reduced) {
              c.addEventListener("pointermove", function (e) {
                var r = art.getBoundingClientRect();
                art.style.setProperty(
                  "--mx",
                  clamp(
                    ((e.clientX - r.left) / r.width) * 2 - 1,
                    -1,
                    1,
                  ).toFixed(2),
                );
                art.style.setProperty(
                  "--my",
                  clamp(
                    ((e.clientY - r.top) / r.height) * 2 - 1,
                    -1,
                    1,
                  ).toFixed(2),
                );
              });
              c.addEventListener("pointerleave", function () {
                art.style.setProperty("--mx", 0);
                art.style.setProperty("--my", 0);
              });
            }
          });
          if (reduced || !("IntersectionObserver" in window)) return;
          var io = new IntersectionObserver(
            function (es) {
              es.forEach(function (e) {
                if (e.isIntersecting) {
                  e.target.classList.add("fx-in");
                  io.unobserve(e.target);
                }
              });
            },
            { threshold: 0.2 },
          );
          cards.forEach(function (c) {
            c.classList.add("fx-pre");
            io.observe(c);
          });
        }


        /* ---------- 2. Easter eggs ---------- */
        var found = {};
        try {
          found = JSON.parse(localStorage.getItem("fxEggs") || "{}");
        } catch (e) {}
        var TOTAL = 8;
        function mark(id) {
          if (found[id]) return;
          found[id] = 1;
          try {
            localStorage.setItem("fxEggs", JSON.stringify(found));
          } catch (e) {}
          toast(
            "Easter egg " + Object.keys(found).length + "/" + TOTAL + " found",
          );
        }

        var toastEl, toastT;
        function toast(msg) {
          if (!toastEl) {
            toastEl = doc.createElement("div");
            toastEl.className = "fx-toast";
            toastEl.setAttribute("role", "status");
            doc.body.appendChild(toastEl);
          }
          toastEl.textContent = msg;
          toastEl.classList.add("show");
          clearTimeout(toastT);
          toastT = setTimeout(function () {
            toastEl.classList.remove("show");
          }, 2800);
        }

        var GLYPHS = ["{ }", "</>", ";", "=>", "&&", "0x1", "#", "[]"];
        function burst(x, y, n, dx, dy) {
          if (reduced) return;
          for (var i = 0; i < n; i++) {
            var g = doc.createElement("span");
            g.className = "fx-glyph";
            g.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0];
            g.style.setProperty(
              "--x",
              x + (Math.random() - 0.5) * (dx > 300 ? dx : 0) + "px",
            );
            g.style.setProperty("--y", y + "px");
            g.style.setProperty(
              "--dx",
              (Math.random() - 0.5) * (dx > 300 ? 60 : dx) + "px",
            );
            g.style.setProperty(
              "--dy",
              dy * (0.6 + Math.random() * 0.6) + "px",
            );
            g.addEventListener("animationend", function () {
              this.remove();
            });
            doc.body.appendChild(g);
          }
        }

        function theme(t) {
          if (window.setTheme) window.setTheme(t);
          else root.setAttribute("data-theme", t);
        }
        function link(name) {
          var a = $$(".my-contact-li").filter(function (x) {
            return x.textContent.trim().toLowerCase() === name;
          })[0];
          return a && a.href;
        }

        /* terminal */
        var term,
          out,
          input,
          hist = [],
          hi = 0,
          lastFocus;
        function print(t, cls) {
          var d = doc.createElement("div");
          if (cls) d.className = cls;
          d.textContent = t;
          out.appendChild(d);
          out.scrollTop = out.scrollHeight;
        }
        var CMDS = {
          help: function () {
            print(
              "whoami  skills  projects  git log  ls  cat about.txt  open <github|linkedin|leetcode|resume>\ntheme <light|dark>  home  about  play  eggs  clear  exit",
              "dim",
            );
          },
          whoami: function () {
            print(
              "Abdullah Shahid — software developer, Karachi. Ships systems, not just features.",
            );
          },
          skills: function () {
            print(
              $$("#about .about-skill-chip")
                .map(function (c) {
                  return c.textContent.trim();
                })
                .join(" · "),
            );
          },
          projects: function () {
            print(
              $$(".projects-row .project-card:not([aria-hidden]) h3")
                .map(function (h) {
                  return "• " + h.textContent.trim();
                })
                .join("\n"),
            );
          },
          "git log": function () {
            print(
              $$("#about .exp-card")
                .map(function (e) {
                  return (
                    "commit  " +
                    $(".exp-card__title", e).textContent.trim() +
                    " @ " +
                    $(".exp-card__company", e).textContent.trim() +
                    "\nDate:   " +
                    $(".exp-card__date", e).textContent.trim()
                  );
                })
                .join("\n\n"),
            );
          },
          ls: function () {
            print(
              "about.txt  projects/  skills.json  resume.pdf  secrets/",
              "hl",
            );
          },
          "cat about.txt": function () {
            print(
              "Think like an architect, build like an engineer, ship like an owner.",
            );
          },
          "ls secrets": function () {
            print(
              "Nothing here but good habits: design first, test twice, document always.",
              "dim",
            );
          },
          home: function () {
            window.showSection && window.showSection("hero");
            print("→ home");
          },
          about: function () {
            window.showSection && window.showSection("about");
            print("→ about");
          },
          play: function () {
            window.switchMode && window.switchMode("play");
            close();
          },
          eggs: function () {
            print(
              "Found " +
                Object.keys(found).length +
                " of " +
                TOTAL +
                ". Hint: try the Konami code, a few clicks on the avatar, and the letter g.",
            );
          },
          sudo: function () {
            print(
              "abdullah is not in the sudoers file. This incident will be reported to… nobody, it’s a portfolio.",
              "dim",
            );
          },
          "rm -rf /": function () {
            print(
              "Nice try. Permission denied: this portfolio is immutable.",
              "dim",
            );
          },
          clear: function () {
            out.textContent = "";
          },
          exit: function () {
            close();
          },
        };
        function run(raw) {
          var cmd = raw.trim().toLowerCase().replace(/\s+/g, " ");
          print("$ " + raw, "hl");
          if (!cmd) return;
          if (cmd.indexOf("theme ") === 0) {
            var t = cmd.split(" ")[1];
            return t === "dark" || t === "light"
              ? (theme(t), print("theme → " + t))
              : print("usage: theme <light|dark>", "dim");
          }
          if (cmd.indexOf("open ") === 0) {
            var u = link(cmd.split(" ")[1]);
            return u
              ? (window.open(u, "_blank", "noopener"), print("opening…"))
              : print("unknown target", "dim");
          }
          if (cmd.indexOf("echo ") === 0) return print(raw.trim().slice(5));
          if (CMDS[cmd]) CMDS[cmd]();
          else print("command not found: " + cmd + " — try ‘help’", "dim");
        }
        function build() {
          term = doc.createElement("div");
          term.className = "fx-term";
          term.setAttribute("role", "dialog");
          term.setAttribute("aria-label", "Developer terminal");
          term.innerHTML =
            '<div class="fx-term__bar"><span>abdullah@portfolio ~ </span><span>esc to close</span></div>' +
            '<div class="fx-term__out" aria-live="polite"></div>' +
            '<div class="fx-term__row"><span>$</span><input class="fx-term__in" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Terminal input"></div>';
          doc.body.appendChild(term);
          out = $(".fx-term__out", term);
          input = $(".fx-term__in", term);
          print("Welcome. Type ‘help’ to see what’s here.", "dim");
          input.addEventListener("keydown", function (e) {
            if (e.key === "Escape") {
              close();
            } else if (e.key === "Enter") {
              hist.push(input.value);
              hi = hist.length;
              run(input.value);
              input.value = "";
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              if (hi > 0) input.value = hist[--hi];
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              input.value =
                hi < hist.length - 1 ? hist[++hi] : ((hi = hist.length), "");
            }
          });
        }
        function open() {
          if (!term) build();
          lastFocus = doc.activeElement;
          term.classList.add("open");
          input.focus();
          mark("terminal");
        }
        function close() {
          if (term) term.classList.remove("open");
          if (lastFocus && lastFocus.focus) lastFocus.focus();
        }

        function initEggs() {
          /* console */
          var c = (
            getComputedStyle(root).getPropertyValue("--primary-blue") ||
            "#183eeb"
          ).trim();
          console.log("%c<Abdullah />", "font:700 22px monospace;color:" + c);
          console.log(
            "%cCurious? You’re my kind of reader. Try abdullah.help()",
            "font:12px monospace",
          );
          window.abdullah = {
            help: function () {
              console.log(
                "abdullah.about() · abdullah.contact() · abdullah.hire()\nOn the page: press ` or : for a terminal, ? for shortcuts.",
              );
              mark("console");
            },
            about: function () {
              console.log(
                "Software developer in Karachi. HLD & LLD first, code second.",
              );
            },
            contact: function () {
              console.log(link("github") + "\n" + link("linkedin"));
            },
            hire: function () {
              console.log(
                "Status: open to interesting problems. Say hello via the links on the page.",
              );
            },
          };

          /* keyboard: konami, terminal, vim-style nav, help */
          var KONAMI =
            "ArrowUp,ArrowUp,ArrowDown,ArrowDown,ArrowLeft,ArrowRight,ArrowLeft,ArrowRight,b,a";
          var buf = [],
            gAt = 0;
          doc.addEventListener("keydown", function (e) {
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            var t = e.target;
            if (
              t &&
              t.closest &&
              t.closest(
                'input,textarea,select,[contenteditable=""],[contenteditable="true"]',
              )
            )
              return;
            buf.push(e.key.length === 1 ? e.key.toLowerCase() : e.key);
            if (buf.length > 10) buf.shift();
            if (buf.join() === KONAMI) {
              toast("+30 lives\nAchievement: old-school dev");
              for (var i = 0; i < 3; i++)
                setTimeout(function () {
                  burst(
                    window.innerWidth / 2,
                    -20,
                    14,
                    window.innerWidth,
                    window.innerHeight + 40,
                  );
                }, i * 250);
              mark("konami");
              buf = [];
              return;
            }
            if (e.key === "`" || e.key === ":") {
              e.preventDefault();
              open();
              return;
            }
            if (e.key === "?") {
              toast(
                "` or :  terminal\ng h  home    g a  about\ng p  play    g w  work",
              );
              mark("shortcuts");
              return;
            }
            if (gAt && Date.now() - gAt < 1200) {
              var k = e.key.toLowerCase(),
                done = true;
              if (k === "h") window.showSection && window.showSection("hero");
              else if (k === "a")
                window.showSection && window.showSection("about");
              else if (k === "p")
                window.switchMode && window.switchMode("play");
              else if (k === "w")
                window.switchMode && window.switchMode("work");
              else done = false;
              gAt = 0;
              if (done) {
                mark("vim-nav");
                return;
              }
            }
            if (e.key === "g") gAt = Date.now();
          });

          /* avatar: 5 clicks in 2s */
          var av = $(".profile-avatar"),
            taps = [];
          var QUIPS = [
            'git commit -m "added a face"',
            "404: other pose not found",
            "It compiles. Ship it.",
            "Stop poking the avatar. (Keep going.)",
          ];
          if (av)
            av.addEventListener("click", function (e) {
              var now = Date.now();
              taps = taps.filter(function (x) {
                return now - x < 2000;
              });
              taps.push(now);
              if (taps.length >= 5) {
                taps = [];
                toast(QUIPS[(Math.random() * QUIPS.length) | 0]);
                burst(e.clientX, e.clientY, 8, 140, -90);
                mark("avatar");
              }
            });

          /* name: 3 clicks */
          var nm = $("#sidebar h1"),
            n = 0,
            nt;
          if (nm)
            nm.addEventListener("click", function () {
              clearTimeout(nt);
              n++;
              nt = setTimeout(function () {
                n = 0;
              }, 800);
              if (n === 3) {
                n = 0;
                var orig = nm.textContent;
                nm.textContent = 'console.log("Abdullah Shahid");';
                setTimeout(function () {
                  nm.textContent = orig;
                }, 2200);
                mark("name");
              }
            });

          /* hover quips on skill chips */
          var TIPS = {
            Git: "git blame says: not me",
            Docker: "works on my machine → now on yours",
            Kubernetes: "k8s: 8 letters between k and s",
            JavaScript: "0.1 + 0.2 !== 0.3",
            Python: "import this",
            "System Design": "it depends — then it scales",
            Flutter: "everything is a widget",
            "RESTful API": "418 I’m a teapot",
            "LLD & HLD": "boxes first, code later",
          };
          var seen = {};
          $$("#about .about-skill-chip").forEach(function (chip) {
            var tip = TIPS[chip.textContent.trim()];
            if (!tip) return;
            chip.setAttribute("data-tip", tip);
            chip.addEventListener("mouseenter", function () {
              if (!seen.chip) {
                seen.chip = 1;
                mark("hover-tips");
              }
            });
          });

          /* shift + click: glyph pop */
          doc.addEventListener("click", function (e) {
            if (e.shiftKey && !e.target.closest("a,button,input")) {
              burst(e.clientX, e.clientY, 6, 120, -80);
              mark("shift-click");
            }
          });

          /* tab blur */
          var title = doc.title;
          doc.addEventListener("visibilitychange", function () {
            if (doc.hidden) {
              title = doc.title;
              doc.title = "Build still running… 👀";
              mark("tab-blur");
            } else doc.title = title;
          });
        }

        function init() {
          initScrollText();
          initCards();
          initEggs();
        }
        if (doc.readyState === "loading")
          doc.addEventListener("DOMContentLoaded", init);
        else init();
      })();
