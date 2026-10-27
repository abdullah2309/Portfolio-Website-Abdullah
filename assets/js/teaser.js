/* ==============================================================
   teaser.js — "Predict." the code-teaser card in the Play tab

   The pattern professionals ship in a portfolio play section: a
   real snippet, four possible outputs, exactly one of them right.
   Read → commit → instant explanation. Score and best streak are
   kept in localStorage, exactly like the Echo game beside it.

   · 8 curated questions (warm-up → tricky → senior)
   · click or keys 1–4 to answer, Enter / Next to advance
   · no layout measuring — safe to run while the tab is hidden
   ============================================================== */
(function teaserModule() {
  "use strict";

  var QUESTIONS = [
    {
      level: "Warm-up",
      topic: "typeof quirk",
      code: "console.log(typeof null);",
      options: ['"null"', '"undefined"', '"object"', '"boolean"'],
      answer: 2,
      why: 'typeof null returns "object" — a bug from 1995 that the spec still cannot fix without breaking the web. null is a primitive, not an object.',
    },
    {
      level: "Warm-up",
      topic: "Evaluation order",
      code: "let x = 5;\nconsole.log(x++, x, ++x);",
      options: ["5 6 7", "5 5 6", "5 6 8", "6 6 7"],
      answer: 0,
      why: "Arguments evaluate left to right: x++ hands over 5 and leaves x at 6, the middle x reads 6, then ++x bumps x to 7 and returns it.",
    },
    {
      level: "Warm-up",
      topic: "Type coercion",
      code: 'console.log(1 + "2" + 3);\nconsole.log(1 + 2 + "3");',
      options: [
        "\u201c123\u201d, then \u201c33\u201d",
        "\u201c33\u201d, then \u201c123\u201d",
        "\u201c123\u201d, then \u201c123\u201d",
        "\u201c33\u201d, then \u201c33\u201d",
      ],
      answer: 0,
      why: "+ is left-associative: the first line turns into a string the moment it meets \u201c2\u201d, the second stays numeric until it meets \u201c3\u201d. Same digits, different order.",
    },
    {
      level: "Tricky",
      topic: "map callback",
      code: "console.log([1, 2, 3].map(parseInt));",
      options: ["[1, 2, 3]", "[1, NaN, NaN]", "[1, 1, 1]", "[1, 2, NaN]"],
      answer: 1,
      why: "map passes (value, index, array), so the index lands in parseInt's radix slot: radix 0 means \u201cauto\u201d so 1 parses, radix 1 is invalid, and 3 is not a valid base-2 digit.",
    },
    {
      level: "Tricky",
      topic: "Floating point",
      code: "console.log(0.1 + 0.2);\nconsole.log(0.1 + 0.2 === 0.3);",
      options: [
        "0.3 then true",
        "0.30000000000000004 then false",
        "0.3 then false",
        "0.30000000000000004 then true",
      ],
      answer: 1,
      why: "Doubles are stored in base 2 and 0.1 has no exact representation, so the sum is 0.30000000000000004 \u2014 which never equals the literal 0.3. Compare with an epsilon, or work in whole cents.",
    },
    {
      level: "Tricky",
      topic: "CSS specificity",
      code: "p       { color: blue; }   /* 0,0,1 */\n.title  { color: green; }  /* 0,1,0 */\np.title { color: red; }    /* 0,1,1 */",
      options: ["blue", "green", "red", "whichever comes last in the file"],
      answer: 2,
      why: "Specificity outranks source order: element + class (0,1,1) beats class (0,1,0) and element (0,0,1), so the paragraph turns red. Only !important or an equal-weight rule later on would change that.",
    },
    {
      level: "Senior",
      topic: "Event loop",
      code: 'console.log("start");\nsetTimeout(() => console.log("timeout"), 0);\nPromise.resolve().then(() => console.log("promise"));\nconsole.log("end");',
      options: [
        "start, timeout, promise, end",
        "start, end, promise, timeout",
        "start, end, timeout, promise",
        "start, promise, end, timeout",
      ],
      answer: 1,
      why: "Synchronous logs run first (start, end). The microtask queue \u2014 promise callbacks \u2014 always drains before the macrotask queue where the timer waits, so timeout lands last even with a 0ms delay.",
    },
    {
      level: "Senior",
      topic: "Async / await",
      code: 'async function run() {\n  console.log("a");\n  await null;\n  console.log("b");\n}\nrun();\nconsole.log("c");',
      options: ["a, b, c", "a, c, b", "c, a, b", "a, c then nothing"],
      answer: 1,
      why: "await suspends run() and hands control back to the caller, so c prints while the promise is pending. b only resumes as a microtask once the stack is empty.",
    },
  ];

  var host = document.getElementById("teaserStage");
  var playHost = document.getElementById("content-play");
  if (!host) return;

  var el = {
    score: document.getElementById("teaserScore"),
    best: document.getElementById("teaserBest"),
    status: document.getElementById("teaserStatus"),
    meta: document.getElementById("teaserMeta"),
    level: document.getElementById("teaserLevel"),
    topic: document.getElementById("teaserTopic"),
    code: document.getElementById("teaserCode"),
    codeWrap: document.getElementById("teaserCodeWrap"),
    options: document.getElementById("teaserOptions"),
    explain: document.getElementById("teaserExplain"),
    result: document.getElementById("teaserResult"),
    final: document.getElementById("teaserFinal"),
    msg: document.getElementById("teaserMsg"),
    next: document.getElementById("teaserNextBtn"),
    nextLabel: document.getElementById("teaserNextLabel"),
  };
  for (var k in el) {
    if (!el[k]) return;
  }

  var total = QUESTIONS.length;
  var idx = 0;
  var score = 0;
  var answered = false;
  var finished = false;
  var best = 0;

  try {
    best = parseInt(localStorage.getItem("teaserBest") || "0", 10) || 0;
  } catch (err) {
    best = 0;
  }
  el.best.textContent = best;

  /* ---------- tiny syntax highlighter (DOM nodes, no innerHTML) --- */
  var KEYWORDS = {
    const: 1, let: 1, var: 1, function: 1, return: 1, if: 1, else: 1,
    for: 1, while: 1, do: 1, new: 1, typeof: 1, instanceof: 1, class: 1,
    this: 1, async: 1, await: 1, try: 1, catch: 1, finally: 1, throw: 1,
    null: 1, undefined: 1, true: 1, false: 1, in: 1, of: 1, void: 1,
    delete: 1, switch: 1, case: 1, break: 1, continue: 1,
  };
  var BUILTINS = {
    console: 1, log: 1, map: 1, parseInt: 1, Promise: 1, setTimeout: 1,
    Math: 1, JSON: 1, Array: 1, Object: 1, String: 1, Number: 1,
    Boolean: 1, color: 1,
  };
  var TOKEN_RE =
    /(\/\/[^\n]*)|(\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][A-Za-z0-9_$]*)|([\s\S])/g;

  function highlight(target, src) {
    while (target.firstChild) target.removeChild(target.firstChild);
    var m;
    TOKEN_RE.lastIndex = 0;
    while ((m = TOKEN_RE.exec(src))) {
      var cls = "";
      if (m[1] || m[2]) cls = "tk-cmt";
      else if (m[3]) cls = "tk-str";
      else if (m[4]) cls = "tk-num";
      else if (m[5])
        cls = KEYWORDS[m[5]] ? "tk-key" : BUILTINS[m[5]] ? "tk-fn" : "";
      if (cls) {
        var span = document.createElement("span");
        span.className = cls;
        span.textContent = m[0];
        target.appendChild(span);
      } else {
        target.appendChild(document.createTextNode(m[0]));
      }
    }
  }

  /* ---------- rendering --------------------------------------- */
  function setStatus(text, kind) {
    el.status.textContent = text;
    el.status.classList.remove("status-watch", "status-input", "status-error");
    if (kind) el.status.classList.add("status-" + kind);
  }

  function setNextLabel(text) {
    el.nextLabel.textContent = text;
  }

  function render() {
    var q = QUESTIONS[idx];
    var i;
    answered = false;
    finished = false;
    el.next.disabled = true;
    setNextLabel("Next");
    el.explain.hidden = true;
    el.explain.textContent = "";
    el.result.hidden = true;
    el.codeWrap.hidden = false;
    el.meta.hidden = false;
    el.options.hidden = false;

    setStatus("Question " + (idx + 1) + " / " + total);
    el.level.textContent = q.level;
    el.topic.textContent = q.topic;
    highlight(el.code, q.code);

    while (el.options.firstChild) el.options.removeChild(el.options.firstChild);
    el.options.classList.remove("is-locked");

    for (i = 0; i < q.options.length; i++) {
      (function (n) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "teaser-opt";

        var key = document.createElement("span");
        key.className = "teaser-opt__key";
        key.textContent = String.fromCharCode(65 + n);

        var label = document.createElement("span");
        label.className = "teaser-opt__text";
        label.textContent = q.options[n];

        btn.appendChild(key);
        btn.appendChild(label);
        btn.addEventListener("click", function () {
          choose(n, btn);
        });
        el.options.appendChild(btn);
      })(i);
    }
  }

  function choose(pick, btn) {
    if (answered || finished) return;
    answered = true;

    var q = QUESTIONS[idx];
    var buttons = el.options.querySelectorAll(".teaser-opt");
    var i;
    for (i = 0; i < buttons.length; i++) buttons[i].disabled = true;
    el.options.classList.add("is-locked");

    buttons[q.answer].classList.add("is-correct");
    if (pick === q.answer) {
      score += 1;
      el.score.textContent = score;
      setStatus("Correct", "input");
    } else {
      btn.classList.add("is-wrong");
      setStatus("Not quite", "error");
    }

    el.explain.textContent = q.why;
    el.explain.hidden = false;
    el.next.disabled = false;
    setNextLabel(idx === total - 1 ? "Result" : "Next");
  }

  function finish() {
    finished = true;
    var pct = score / total;

    el.codeWrap.hidden = true;
    el.meta.hidden = true;
    el.options.hidden = true;
    el.explain.hidden = true;
    el.result.hidden = false;
    el.final.textContent = score + "/" + total;

    if (pct === 1)
      el.msg.textContent =
        "Perfect read \u2014 you think like the engine. Every trap, no misses.";
    else if (pct >= 0.75)
      el.msg.textContent =
        "Sharp instincts. The tricky tier is exactly what trips up seniors in interviews.";
    else if (pct >= 0.5)
      el.msg.textContent =
        "Solid base \u2014 the coercion and event-loop questions are where the money is.";
    else if (pct > 0)
      el.msg.textContent =
        "These snippets are interview traps on purpose. Run it again and read each line left to right.";
    else
      el.msg.textContent =
        "Rough round \u2014 but every one of these really does show up in technical screens.";

    if (pct >= 0.75) setStatus("Nice work", "input");
    else if (pct >= 0.5) setStatus("Almost there");
    else setStatus("Worth another look", "error");

    if (score > best) {
      best = score;
      el.best.textContent = best;
      try {
        localStorage.setItem("teaserBest", String(best));
      } catch (err) {
        /* private mode — best just won't persist */
      }
    }

    el.next.disabled = false;
    setNextLabel("Play again");
  }

  function next() {
    if (finished) {
      restart();
      return;
    }
    if (!answered) return;
    if (idx < total - 1) {
      idx += 1;
      render();
      return;
    }
    finish();
  }

  function restart() {
    idx = 0;
    score = 0;
    el.score.textContent = score;
    render();
  }

  /* keyboard: 1–4 answers, Enter advances (only while Play is open) */
  document.addEventListener("keydown", function (e) {
    if (!playHost || playHost.classList.contains("hidden")) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    if (
      t &&
      (t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        t.isContentEditable)
    )
      return;

    if (e.key >= "1" && e.key <= "4") {
      var buttons = el.options.querySelectorAll(".teaser-opt");
      var b = buttons[parseInt(e.key, 10) - 1];
      if (b && !b.disabled) {
        b.click();
        e.preventDefault();
      }
    } else if (e.key === "Enter") {
      if (document.activeElement && document.activeElement.tagName === "BUTTON")
        return;
      if (!el.next.disabled) {
        el.next.click();
        e.preventDefault();
      }
    }
  });

  window.teaserNext = next;
  window.teaserRestart = restart;

  render();
})();
