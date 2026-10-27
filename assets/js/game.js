      (function memoryGameModule() {
        const pads = document.querySelectorAll(".pad");
        const roundEl = document.getElementById("gameRound");
        const roundIndEl = document.getElementById("roundIndicator");
        const bestEl = document.getElementById("gameBest");
        const statusEl = document.getElementById("gameStatus");
        const startBtn = document.getElementById("gameStartBtn");
        const flashEl = document.getElementById("gameFlash");
        const soundIcon = document.getElementById("gameSoundIcon");
        const soundLabel = document.getElementById("gameSoundLabel");
        let sequence = [],
          playerInputIndex = 0,
          round = 0;
        let best = parseInt(localStorage.getItem("echoBest") || "0", 10);
        let acceptingInput = false,
          playing = false,
          soundOn = true,
          audioCtx = null;
        const PAD_FREQS = [329.63, 261.63, 392.0, 220.0];
        bestEl.textContent = best;

        function ensureAudio() {
          if (!audioCtx) {
            try {
              audioCtx = new (
                window.AudioContext || window.webkitAudioContext
              )();
            } catch (e) {
              audioCtx = null;
            }
          }
          if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
        }
        function playTone(freq, durationMs) {
          if (!soundOn) return;
          ensureAudio();
          if (!audioCtx) return;
          const osc = audioCtx.createOscillator(),
            gain = audioCtx.createGain();
          osc.type = "sine";
          osc.frequency.value = freq;
          const now = audioCtx.currentTime;
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
          gain.gain.exponentialRampToValueAtTime(
            0.0001,
            now + durationMs / 1000,
          );
          osc.connect(gain).connect(audioCtx.destination);
          osc.start(now);
          osc.stop(now + durationMs / 1000 + 0.05);
        }
        function playErrorTone() {
          if (!soundOn) return;
          ensureAudio();
          if (!audioCtx) return;
          const osc = audioCtx.createOscillator(),
            gain = audioCtx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(180, audioCtx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(
            60,
            audioCtx.currentTime + 0.5,
          );
          const now = audioCtx.currentTime;
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
          osc.connect(gain).connect(audioCtx.destination);
          osc.start(now);
          osc.stop(now + 0.55);
        }
        function lightPad(padIndex, durationMs) {
          const pad = pads[padIndex];
          if (!pad) return;
          pad.classList.add("lit");
          playTone(PAD_FREQS[padIndex], durationMs);
          setTimeout(() => pad.classList.remove("lit"), durationMs);
        }
        function flashError() {
          if (!flashEl) return;
          flashEl.classList.add("flash-error");
          setTimeout(() => flashEl.classList.remove("flash-error"), 400);
        }
        function setStatus(text, kind) {
          if (!statusEl) return;
          statusEl.textContent = text;
          statusEl.classList.remove(
            "status-watch",
            "status-input",
            "status-error",
          );
          if (kind) statusEl.classList.add("status-" + kind);
        }
        function updateRoundDisplay() {
          if (roundEl) roundEl.textContent = round;
          if (roundIndEl) roundIndEl.textContent = round;
        }
        function setPadsDisabled(disabled) {
          pads.forEach((p) => {
            if (disabled) p.classList.add("disabled");
            else p.classList.remove("disabled");
          });
        }

        function startGame() {
          sequence = [];
          round = 0;
          playing = true;
          updateRoundDisplay();
          if (startBtn) {
            startBtn.disabled = true;
            startBtn.innerHTML =
              '<i class="fa-solid fa-circle-notch fa-spin"></i><span>Playing</span>';
          }
          nextRound();
        }
        function nextRound() {
          round += 1;
          updateRoundDisplay();
          sequence.push(Math.floor(Math.random() * 4));
          playerInputIndex = 0;
          acceptingInput = false;
          setPadsDisabled(true);
          setStatus("Watch...", "watch");
          const speed = Math.max(380, 720 - round * 18);
          playSequence(speed);
        }
        function playSequence(stepMs) {
          let i = 0;
          const litDuration = Math.max(220, stepMs * 0.6);
          function step() {
            if (i >= sequence.length) {
              acceptingInput = true;
              setPadsDisabled(false);
              setStatus("Your turn", "input");
              return;
            }
            lightPad(sequence[i], litDuration);
            i++;
            setTimeout(step, stepMs);
          }
          setTimeout(step, 400);
        }
        function handlePadPress(padIndex) {
          if (!acceptingInput || !playing) return;
          const pad = pads[padIndex];
          if (!pad) return;
          pad.classList.add("pressed");
          setTimeout(() => pad.classList.remove("pressed"), 100);
          lightPad(padIndex, 220);
          const expected = sequence[playerInputIndex];
          if (padIndex === expected) {
            playerInputIndex++;
            if (playerInputIndex >= sequence.length) {
              acceptingInput = false;
              setPadsDisabled(true);
              setStatus("Nice! Next round...", "input");
              if (round > best) {
                best = round;
                bestEl.textContent = best;
                localStorage.setItem("echoBest", String(best));
              }
              setTimeout(nextRound, 850);
            }
          } else {
            gameOver();
          }
        }
        function gameOver() {
          playing = false;
          acceptingInput = false;
          setPadsDisabled(true);
          flashError();
          playErrorTone();
          const reached = round - 1;
          setStatus(
            "Game over — Round " + Math.max(0, reached) + " cleared",
            "error",
          );
          if (startBtn) {
            startBtn.disabled = false;
            startBtn.innerHTML =
              '<i class="fa-solid fa-play"></i><span>Play again</span>';
          }
        }
        function resetGame() {
          sequence = [];
          round = 0;
          playerInputIndex = 0;
          playing = false;
          acceptingInput = false;
          updateRoundDisplay();
          setPadsDisabled(true);
          setStatus("Press Start");
          if (startBtn) {
            startBtn.disabled = false;
            startBtn.innerHTML =
              '<i class="fa-solid fa-play"></i><span>Start</span>';
          }
        }
        function toggleSound() {
          soundOn = !soundOn;
          if (soundIcon)
            soundIcon.className = soundOn
              ? "fa-solid fa-volume-high"
              : "fa-solid fa-volume-xmark";
          if (soundLabel) soundLabel.textContent = soundOn ? "Sound" : "Muted";
        }
        function autoStart() {
          ensureAudio();
          if (!playing) resetGame();
        }

        pads.forEach((pad) => {
          const idx = parseInt(pad.dataset.color, 10);
          pad.addEventListener("click", () => handlePadPress(idx));
        });
        setPadsDisabled(true);
        window.gameStart = startGame;
        window.gameReset = resetGame;
        window.gameAutoStart = autoStart;
        window.gameToggleSound = toggleSound;
      })();
