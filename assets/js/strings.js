/* ==============================================================
   strings.js — "Skill network": spring-physics tag cloud

   Every tag is a physical node:
     · it springs back to its home position
     · it is tied to other tags with SVG strings (springs)
     · two more strings run to the left / right edge of the screen,
       so tugs travel through the whole net
   Improvements over the original prototype:
     · fixed-timestep simulation (identical feel on 60/120/144 Hz)
     · rAF only runs while the card is on screen & tab is visible
     · measured layout — rows wrap/space themselves, never overlap
     · smooth re-layout on resize (no teleporting)
     · narrow card: auto single zig-zag column
     · phones: the net steps aside — a plain numbered list
     · click (no drag) = pulse + tug through the network
     · entrance animation plays the first time the card is seen
   ============================================================== */
(function stringsNetwork() {
  "use strict";

  var section = document.querySelector(".strings");
  var stage = document.getElementById("stringsStage");
  var svg = document.getElementById("stringsSvg");
  var layer = document.getElementById("stringsLayer");
  var cursorEl = document.getElementById("stringsCursor");
  if (!section || !stage || !svg || !layer) return;

  var NS = "http://www.w3.org/2000/svg";
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)")
    .matches;
  var reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  /* Below this *card* width the scatter becomes one zig-zag column.
     (Measured on the card, not the viewport, so a narrow content
     column — sidebar + padding — is taken into account.) */
  var COLUMN_BREAKPOINT = 560;
  /* Phones: the network steps aside completely and the skills render
     as a plain numbered list (1 — 2 — 3 …): no strings, no drag, no
     physics — CSS lays the rows out, strings.js only toggles the mode. */
  var LIST_BREAKPOINT = 767;
  var listMode = false;

  /* ---------- configuration ---------------------------------- */
  /* y     : row the tag belongs to (rows are measured & spaced by
            the layout pass, x is derived so nothing ever overlaps)
     links : ids of tags this one is stringed to                 */
  var PILLS = [
    {
      id: "pk",
      label: "Software Development",
      active: false,
      y: 44,
      links: ["ip"],
    },
    {
      id: "ip",
      label: "🚀 Product Engineering",
      active: true,
      y: 44,
      links: ["inv"],
    },
    {
      id: "inv",
      label: "Full-Stack Development",
      active: false,
      y: 44,
      links: [],
    },
    {
      id: "data",
      label: "🧠 Product Thinking",
      active: true,
      y: 52,
      links: ["cpd", "disc"],
    },
    {
      id: "cpd",
      label: "Frontend Engineering",
      active: true,
      y: 52,
      links: ["qs"],
    },
    {
      id: "qs",
      label: "Backend Engineering",
      active: false,
      y: 52,
      links: ["pcb"],
    },
    {
      id: "disc",
      label: "🎨 UI/UX & Figma",
      active: false,
      y: 60,
      links: ["pai"],
    },
    {
      id: "pai",
      label: "System Design · HLD/LLD",
      active: true,
      y: 60,
      links: ["pcb"],
    },
    {
      id: "pcb",
      label: "🔌 RESTful APIs",
      active: true,
      y: 60,
      links: [],
    },
    {
      id: "dl",
      label: "🗄️ Database Engineering",
      active: false,
      y: 68,
      links: ["ep"],
    },
    {
      id: "ep",
      label: "Docker · Kubernetes",
      active: false,
      y: 68,
      links: ["dt"],
    },
    {
      id: "dt",
      label: "Quality & Scalability",
      active: false,
      y: 68,
      links: [],
    },
  ];

  var PH = {
    homeK: 0.028, // spring pull toward home position
    linkK: 0.012, // spring between stringed pills
    damp: 0.86, // velocity damping
    dragLerp: 0.35, // how tightly a dragged pill follows the pointer
    maxV: 42, // velocity clamp
    step: 1000 / 60, // fixed timestep (ms)
    maxSteps: 4, // catch-up cap per frame
  };

  /* ---------- helpers --------------------------------------- */
  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  /* "🚀 Product Engineering" → { emoji:"🚀", text:"Product Engineering" } */
  function splitLabel(label) {
    var m = label.match(/^(\S+)\s+([\s\S]+)$/);
    if (m) {
      var isEmoji = false;
      try {
        isEmoji = /\p{Extended_Pictographic}/u.test(m[1]);
      } catch (err) {
        isEmoji = m[1].codePointAt(0) > 0x2070;
      }
      if (isEmoji) return { emoji: m[1], text: m[2] };
    }
    return { emoji: null, text: label };
  }

  /* ---------- build the pills -------------------------------- */
  var nodes = [];
  var byId = {};
  var strings = [];
  var links = [];
  var svgGroup = document.createElementNS(NS, "g");
  svg.appendChild(svgGroup);

  PILLS.forEach(function (cfg, index) {
    var parts = splitLabel(cfg.label);

    var el = document.createElement("div");
    el.className = "strings__pill" + (cfg.active ? " is-active" : "");
    el.setAttribute("data-id", cfg.id);
    /* row index for the phone list (01, 02, …) */
    el.style.setProperty("--i", String(index));

    var inner = document.createElement("div");
    inner.className = "strings__pill-inner";

    if (parts.emoji) {
      var em = document.createElement("span");
      em.className = "strings__emoji";
      em.textContent = parts.emoji;
      inner.appendChild(em);
    }
    var text = document.createElement("span");
    text.textContent = parts.text;
    inner.appendChild(text);

    var dotL = document.createElement("span");
    dotL.className = "strings__dot strings__dot--l";
    var dotR = document.createElement("span");
    dotR.className = "strings__dot strings__dot--r";

    el.appendChild(inner);
    el.appendChild(dotL);
    el.appendChild(dotR);
    layer.appendChild(el);

    var node = {
      cfg: cfg,
      index: index,
      el: el,
      inner: inner,
      w: 0,
      h: 0,
      x: 0,
      y: 0,
      px: 0,
      py: 0,
      hx: 0,
      hy: 0,
      vx: 0,
      vy: 0,
    };
    nodes.push(node);
    byId[cfg.id] = node;
  });

  /* ---------- strings (deduplicated) ------------------------- */
  var W = 0;
  var H = 0;

  function addString(p1fn, p2fn) {
    var line = document.createElementNS(NS, "line");
    svgGroup.appendChild(line);
    strings.push({ line: line, p1: p1fn, p2: p2fn });
  }

  function dotPos(n, side) {
    return side === "left"
      ? { x: n.x - n.w / 2 - 6, y: n.y }
      : { x: n.x + n.w / 2 + 6, y: n.y };
  }

  /* One deliberate string per tag: the outer columns tie back to
     their own screen edge and the middle ones alternate — six left,
     six right. Deterministic offsets keep the diagram calm and
     identical between renders instead of a tangle. */
  PILLS.forEach(function (cfg, idx) {
    var n = byId[cfg.id];
    var col = idx % 3;
    var toLeft = col === 0 ? true : col === 2 ? false : idx % 2 === 0;
    var anchorY = 12 + ((idx * 31) % 76);

    addString(
      function () {
        return { x: toLeft ? 0 : W, y: (anchorY / 100) * H };
      },
      function () {
        return dotPos(n, toLeft ? "left" : "right");
      },
    );
  });

  var edges = {};
  PILLS.forEach(function (cfg) {
    cfg.links.forEach(function (id) {
      var key = [cfg.id, id].sort().join("|");
      if (edges[key]) return;
      edges[key] = true;
      var a = byId[cfg.id];
      var b = byId[id];
      if (!a || !b) return;
      addString(
        function () {
          return a.x <= b.x ? dotPos(a, "right") : dotPos(a, "left");
        },
        function () {
          return a.x <= b.x ? dotPos(b, "left") : dotPos(b, "right");
        },
      );
      links.push({ a: a, b: b, rest: 0 });
    });
  });

  /* ---------- layout ----------------------------------------- */
  var laidOut = false;

  function padX(n) {
    return n.w / 2 + 7;
  }
  function padY(n) {
    return n.h / 2 + 7;
  }

  function snapHome(n, x, y) {
    return {
      x: clamp(x, padX(n), Math.max(padX(n), W - padX(n))),
      y: clamp(y, padY(n), Math.max(padY(n), H - padY(n))),
    };
  }

  function setHome(n, x, y) {
    var s = snapHome(n, x, y);
    n.hx = s.x;
    n.hy = s.y;
  }

  /* The card is bled out of the 980px text column so it — and every
     string — runs from the sidebar to the right edge of the window. */
  function applyBleed() {
    var host = document.getElementById("about");
    var shell = section.parentElement;
    if (!host || !shell) return;
    var hr = host.getBoundingClientRect();
    var sr = shell.getBoundingClientRect();
    if (!hr.width || !sr.width) return;
    /* usable edges = border box minus scrollbar (clientWidth) */
    var hostLeft = hr.left + host.clientLeft;
    var hostRight = hostLeft + host.clientWidth;
    var left = Math.max(0, Math.round(sr.left - hostLeft));
    var right = Math.max(0, Math.round(hostRight - sr.right));
    if (section.style.marginLeft !== -left + "px")
      section.style.marginLeft = -left + "px";
    if (section.style.marginRight !== -right + "px")
      section.style.marginRight = -right + "px";
  }

  /* Split one logical row into lines that actually fit the card, so a
     long label or a narrow window wraps instead of overlapping. */
  function packRow(row, room) {
    var lines = [];
    var line = [];
    var width = 0;
    var MIN = 8;
    row.forEach(function (n) {
      var add = n.w + (line.length ? MIN : 0);
      if (line.length && width + add > room) {
        lines.push({ items: line, width: width });
        line = [];
        width = 0;
        add = n.w;
      }
      width += add;
      line.push(n);
    });
    if (line.length) lines.push({ items: line, width: width });
    return lines;
  }

  /* Rows are derived from the data (each distinct y = one row) and are
     measured first, then evenly distributed — no manual coordinates to
     keep in sync, and nothing can overlap. */
  function computeHomes() {
    var i;
    var lines = [];
    var column = W < COLUMN_BREAKPOINT;

    if (column) {
      /* narrow card: one pill per line, zig-zag column */
      for (i = 0; i < nodes.length; i++) {
        lines.push({ items: [nodes[i]], width: nodes[i].w });
      }
    } else {
      var byY = {};
      nodes.forEach(function (n) {
        var key = String(n.cfg.y);
        if (!byY[key]) byY[key] = [];
        byY[key].push(n);
      });
      Object.keys(byY)
        .sort(function (a, b) {
          return parseFloat(a) - parseFloat(b);
        })
        .forEach(function (key) {
          packRow(byY[key], W - 24).forEach(function (l) {
            lines.push(l);
          });
        });
    }

    /* --- vertical: distribute the lines over the middle band --- */
    var heights = lines.map(function (l) {
      return l.items.reduce(function (m, n) {
        return Math.max(m, n.h);
      }, 0);
    });
    var sumH = heights.reduce(function (a, b) {
      return a + b;
    }, 0);
    var gaps = Math.max(1, lines.length - 1);
    var many = lines.length > 6; /* tall stack: keep it compact */
    /* the 4 rows spread across nearly the whole card, like the ref */
    /* rows sit close together — a tight, deliberate diagram rather
       than a tall sparse cloud (cap keeps tall cards from spreading) */
    var gapY = clamp((H * 0.6 - sumH) / gaps, many ? 5 : 14, many ? 16 : 46);
    var y = (H - (sumH + gapY * gaps)) / 2;

    for (i = 0; i < lines.length; i++) {
      var centerY = y + heights[i] / 2;
      y += heights[i] + gapY;
      var items = lines[i].items;

      if (column) {
        items.forEach(function (n) {
          var col = n.index % 2 ? 0.62 : 0.38; /* zig-zag */
          setHome(n, W * col, centerY);
        });
        continue;
      }

      /* --- horizontal: even gaps inside the line, centred --- */
      var sumW = lines[i].width;
      var gapX =
        items.length > 1 ? clamp((W - 24 - sumW) / (items.length - 1), 8, 30) : 0;
      var x = (W - (sumW + gapX * (items.length - 1))) / 2;
      items.forEach(function (n) {
        setHome(n, x + n.w / 2, centerY);
        x += n.w + gapX;
      });
    }
  }

  /* Final safety net: relax any two homes that still overlap so a
     long label (or a narrow window) can never stack two pills. */
  function separateHomes() {
    var gap = 8;
    for (var iter = 0; iter < 40; iter++) {
      var moved = false;
      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var a = nodes[i];
          var b = nodes[j];
          var ox = (a.w + b.w) / 2 + gap - Math.abs(a.hx - b.hx);
          var oy = (a.h + b.h) / 2 + gap - Math.abs(a.hy - b.hy);
          if (ox <= 0 || oy <= 0) continue;
          moved = true;
          if (ox <= oy) {
            var d = a.hx <= b.hx ? 1 : -1;
            a.hx -= (d * ox) / 2;
            b.hx += (d * ox) / 2;
          } else {
            var dv = a.hy <= b.hy ? 1 : -1;
            a.hy -= (dv * oy) / 2;
            b.hy += (dv * oy) / 2;
          }
        }
      }
      nodes.forEach(function (n) {
        var s = snapHome(n, n.hx, n.hy);
        n.hx = s.x;
        n.hy = s.y;
      });
      if (!moved) break;
    }
  }

  /* hard = place pills on their homes (first run only),
     soft = just move the homes, springs do the travelling        */
  function layout(hard) {
    if (listMode) return false; /* plain list — CSS does the layout */
    applyBleed();
    W = stage.clientWidth;
    H = stage.clientHeight;
    if (!W || !H) return false;

    nodes.forEach(function (n) {
      n.w = n.el.offsetWidth;
      n.h = n.el.offsetHeight;
    });

    computeHomes();
    separateHomes();

    links.forEach(function (l) {
      l.rest = Math.hypot(l.b.hx - l.a.hx, l.b.hy - l.a.hy);
    });

    /* Snap straight to the new homes when nothing can animate them:
       first paint, a forced relayout — or when the loop is parked
       (window resized while the card was off screen), because the
       springs would never run and the pills would keep stale
       coordinates. Otherwise the springs glide them across. */
    var settled = hard || !laidOut || !running;
    if (settled) {
      nodes.forEach(function (n) {
        n.px = n.x = n.hx;
        n.py = n.y = n.hy;
        n.vx = n.vy = 0;
        n.el.style.transform =
          "translate3d(" + (n.x - n.w / 2) + "px," + (n.y - n.h / 2) + "px,0)";
      });
    }

    if (!laidOut) laidOut = true;
    if (settled) render();
    return true;
  }

  /* ---------- simulation ------------------------------------- */
  var drag = { node: null, tx: 0, ty: 0, lx: 0, ly: 0, moved: 0 };
  var pointer = { x: -100, y: -100, cx: -100, cy: -100, inside: false };

  function step() {
    var i;
    var n;

    /* home springs */
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];
      if (n === drag.node) continue;
      n.vx += (n.hx - n.x) * PH.homeK;
      n.vy += (n.hy - n.y) * PH.homeK;
      n.vx *= PH.damp;
      n.vy *= PH.damp;
    }

    /* pill <-> pill string springs (tugs travel through the net) */
    for (i = 0; i < links.length; i++) {
      var l = links[i];
      var dx = l.b.x - l.a.x;
      var dy = l.b.y - l.a.y;
      var d = Math.hypot(dx, dy) || 1;
      var f = (d - l.rest) * PH.linkK;
      var fx = (dx / d) * f;
      var fy = (dy / d) * f;
      if (l.a !== drag.node) {
        l.a.vx += fx;
        l.a.vy += fy;
      }
      if (l.b !== drag.node) {
        l.b.vx -= fx;
        l.b.vy -= fy;
      }
    }

    /* integrate */
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];
      n.px = n.x;
      n.py = n.y;
      if (n === drag.node) {
        n.x += (drag.tx - n.x) * PH.dragLerp;
        n.y += (drag.ty - n.y) * PH.dragLerp;
        n.vx = (n.x - n.px) * 0.6; // remember motion for the release
        n.vy = (n.y - n.py) * 0.6;
      } else {
        n.vx = clamp(n.vx, -PH.maxV, PH.maxV);
        n.vy = clamp(n.vy, -PH.maxV, PH.maxV);
        n.x += n.vx;
        n.y += n.vy;
      }

      /* keep the whole pill inside the card */
      n.x = clamp(n.x, padX(n), Math.max(padX(n), W - padX(n)));
      n.y = clamp(n.y, padY(n), Math.max(padY(n), H - padY(n)));
    }
  }

  function render() {
    var i;

    for (i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      n.el.style.transform =
        "translate3d(" + (n.x - n.w / 2) + "px," + (n.y - n.h / 2) + "px,0)";
    }

    for (i = 0; i < strings.length; i++) {
      var s = strings[i];
      var p = s.p1();
      var q = s.p2();
      s.line.setAttribute("x1", p.x.toFixed(1));
      s.line.setAttribute("y1", p.y.toFixed(1));
      s.line.setAttribute("x2", q.x.toFixed(1));
      s.line.setAttribute("y2", q.y.toFixed(1));
    }

    /* custom cursor follows with a slight lag */
    if (cursorEl && finePointer) {
      pointer.cx += (pointer.x - pointer.cx) * 0.32;
      pointer.cy += (pointer.y - pointer.cy) * 0.32;
      cursorEl.style.transform =
        "translate(" + pointer.cx + "px," + pointer.cy + "px) translate(-50%,-50%)";
    }
  }

  /* ---------- loop (fixed timestep, paused when off screen) --- */
  var running = false;
  var rafId = 0;
  var lastTime = 0;
  var acc = 0;

  function frame(time) {
    if (!running) return;
    if (!lastTime) lastTime = time;
    var dt = time - lastTime;
    lastTime = time;
    if (dt > 250) dt = PH.step; // tab was throttled — don't fast-forward

    acc += dt;
    var steps = 0;
    while (acc >= PH.step && steps < PH.maxSteps) {
      step();
      acc -= PH.step;
      steps++;
    }
    if (acc > PH.step * PH.maxSteps) acc = 0;

    render();
    rafId = window.requestAnimationFrame(frame);
  }

  function start() {
    if (listMode || running || !W || !H) return;
    running = true;
    lastTime = 0;
    acc = 0;
    rafId = window.requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (rafId) window.cancelAnimationFrame(rafId);
    rafId = 0;
  }

  /* ---------- mode switch: network <-> plain list -------------- */
  /* On a small screen the net disappears entirely: `.is-list` makes
     the stage a normal-flow, numbered list of skills. Called on load
     and on every resize (cheap — it bails out when nothing changed). */
  function applyMode() {
    var wantList = window.innerWidth <= LIST_BREAKPOINT;
    if (wantList === listMode) return listMode;
    listMode = wantList;
    section.classList.toggle("is-list", listMode);

    if (listMode) {
      stop();
      drag.node = null;
      if (cursorEl) {
        cursorEl.classList.remove("is-hover", "is-down");
        cursorEl.style.opacity = 0;
      }
      /* the strings bleed out to the window edges — the list sits
         inside the normal content column instead */
      section.style.marginLeft = "";
      section.style.marginRight = "";
      section.classList.remove("is-armed", "is-entering");
      nodes.forEach(function (n) {
        n.el.style.transform = "";
        n.el.classList.remove("is-dragging", "is-pulse");
      });
      laidOut = false;
      /* one-shot staggered fade-in for the rows */
      section.classList.remove("is-list-in");
      void section.offsetWidth;
      section.classList.add("is-list-in");
      window.setTimeout(function () {
        section.classList.remove("is-list-in");
      }, 1600);
    } else {
      section.classList.remove("is-list-in");
      laidOut = false;
      layout(true);
      if (inView) start();
    }
    return listMode;
  }

  /* ---------- drag / click ----------------------------------- */
  nodes.forEach(function (n) {
    n.el.addEventListener("pointerdown", function (e) {
      if (listMode || drag.node || (e.button && e.button !== 0)) return;
      e.preventDefault();
      var r = stage.getBoundingClientRect();
      drag.node = n;
      drag.moved = 0;
      drag.lx = e.clientX;
      drag.ly = e.clientY;
      drag.tx = clamp(e.clientX - r.left, padX(n), Math.max(padX(n), W - padX(n)));
      drag.ty = clamp(e.clientY - r.top, padY(n), Math.max(padY(n), H - padY(n)));
      n.el.classList.add("is-dragging");
      if (cursorEl) cursorEl.classList.add("is-down");
      try {
        n.el.setPointerCapture(e.pointerId);
      } catch (err) {
        /* older browsers: window listeners still work */
      }
      start();
    });

    n.el.addEventListener("pointerenter", function () {
      if (cursorEl) cursorEl.classList.add("is-hover");
    });
    n.el.addEventListener("pointerleave", function () {
      if (cursorEl) cursorEl.classList.remove("is-hover");
    });
  });

  window.addEventListener(
    "pointermove",
    function (e) {
      if (listMode) return;
      var r = stage.getBoundingClientRect();

      if (cursorEl && finePointer) {
        pointer.x = e.clientX - r.left;
        pointer.y = e.clientY - r.top;
        var over =
          e.clientX >= r.left &&
          e.clientX <= r.right &&
          e.clientY >= r.top &&
          e.clientY <= r.bottom;
        if (over !== pointer.inside) {
          pointer.inside = over;
          cursorEl.style.opacity = over ? 1 : 0;
        }
      }

      if (!drag.node) return;
      drag.moved +=
        Math.abs(e.clientX - drag.lx) + Math.abs(e.clientY - drag.ly);
      drag.lx = e.clientX;
      drag.ly = e.clientY;
      drag.tx = clamp(
        e.clientX - r.left,
        padX(drag.node),
        Math.max(padX(drag.node), W - padX(drag.node)),
      );
      drag.ty = clamp(
        e.clientY - r.top,
        padY(drag.node),
        Math.max(padY(drag.node), H - padY(drag.node)),
      );
    },
    { passive: true },
  );

  function endDrag(pulse) {
    if (!drag.node) return;
    var n = drag.node;
    n.el.classList.remove("is-dragging");
    if (cursorEl) cursorEl.classList.remove("is-down");
    drag.node = null;
    if (pulse && drag.moved < 6) tug(n);
    start();
  }

  window.addEventListener("pointerup", function () {
    endDrag(true);
  });
  window.addEventListener("pointercancel", function () {
    endDrag(false);
  });

  /* a click (no real drag) shakes that pill and its neighbours */
  function tug(n) {
    n.el.classList.add("is-pulse");
    window.setTimeout(function () {
      n.el.classList.remove("is-pulse");
    }, 480);

    n.vx += (Math.random() - 0.5) * 5;
    n.vy -= 3 + Math.random() * 2;

    n.cfg.links.forEach(function (id) {
      var m = byId[id];
      if (!m) return;
      var dx = m.x - n.x;
      var dy = m.y - n.y;
      var d = Math.hypot(dx, dy) || 1;
      m.vx += (dx / d) * 3.2;
      m.vy += (dy / d) * 3.2;
    });
    start();
  }

  /* ---------- entrance animation ----------------------------- */
  var entrancePlayed = false;
  function playEntrance() {
    if (entrancePlayed) return;
    entrancePlayed = true;

    if (listMode) {
      /* the list fades in with a CSS stagger (kicked off by applyMode) */
      section.classList.remove("is-armed");
      return;
    }

    if (reducedMotion || !window.gsap) {
      section.classList.remove("is-armed");
      return;
    }

    section.classList.remove("is-armed");
    section.classList.add("is-entering");

    window.gsap.fromTo(
      [layer, svg],
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: "power2.out" },
    );
    window.gsap.from(
      Array.prototype.slice.call(layer.children),
      {
        scale: 0.4,
        opacity: 0,
        y: 14,
        duration: 0.7,
        ease: "back.out(1.7)",
        stagger: 0.05,
        clearProps: "transform,opacity",
      },
    );
    window.gsap.from(
      strings.map(function (s) {
        return s.line;
      }),
      {
        opacity: 0,
        duration: 1.1,
        delay: 0.55,
        ease: "power2.out",
        stagger: 0.012,
        onComplete: function () {
          section.classList.remove("is-entering");
        },
      },
    );
  }

  /* ---------- lifecycle -------------------------------------- */
  if (!reducedMotion && window.gsap) {
    section.classList.add("is-armed"); // no flash before the intro
  }
  if (finePointer) section.classList.add("strings--cursor");

  var inView = false;

  if (window.ResizeObserver) {
    var ro = new window.ResizeObserver(function () {
      applyMode();
      if (listMode) return;
      if (layout(false)) start();
    });
    ro.observe(stage);
  } else {
    window.addEventListener("resize", function () {
      applyMode();
      if (listMode) return;
      if (layout(false)) start();
    });
  }

  /* the mode is decided by the window width, so re-check it on every
     resize — the observer above only sees the resulting stage size */
  window.addEventListener("resize", function () {
    applyMode();
  });

  if (window.IntersectionObserver) {
    var io = new window.IntersectionObserver(
      function (entries) {
        var entry = entries[0];
        inView = entry.isIntersecting;
        if (inView) {
          if (!laidOut) layout(false);
          playEntrance();
          start();
        } else {
          stop();
        }
      },
      { threshold: 0.05 },
    );
    io.observe(stage);
  } else {
    inView = true;
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
    else if (inView) start();
  });

  /* fonts change pill widths → re-measure the homes */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      if (layout(false)) start();
    });
  }

  /* first paint: pick the mode (list on phones, network above),
     then place every pill on its home and start the loop */
  if (!applyMode()) {
    layout(true);
    start();
  }
})();

