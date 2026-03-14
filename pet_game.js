// ===========================================================
// 🎮 pet_game.js — Flippy Bird (Closer Poles + Slower Countdown + Mode Button)
// ===========================================================
(function () {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  let dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));

  function resize() {
    dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    const cssW = window.innerWidth;
    const cssH = window.innerHeight;
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize, { passive: true });
  resize();

  window._modeName = "game";

  // --- Assets ---
  const assets = {
    zombie: new Image(),
    zombieHit: new Image(),
    pole: new Image(),
    jump: new Audio("jump.mp3"),
    fail: new Audio("fail.mp3"),
  };
  assets.zombie.src = "base_game.png";
  assets.zombieHit.src = "base_game2.png";
  assets.pole.src = "Pole.png";

  // --- Game settings ---
  const GROUND_MARGIN = 40;
  const ZOMBIE_W = 90;
  const ZOMBIE_H = 120;
  const POLE_W = 90;

  let gravity = 0.45;
  let jumpPower = -8.5;
  let speed = 3.8;
  let poleGap = 230;
  let poleDistance = 250; // closer poles

  // --- State ---
  let zombie, poles, score, rafId, gameOver, started;
  let modeBtn = null;
  let lastSpawnX = 0;
  let worldOffsetX = 0;
  let highScore = parseInt(localStorage.getItem("zombiepet_highscore") || "0", 10);

  // --- Play SFX helper ---
  function playSfx(audio, vol = 1.0) {
    try {
      audio.volume = vol;
      if (window.SoundManager && typeof SoundManager.playClone === "function") {
        SoundManager.playClone(audio, vol);
      } else {
        const a = audio.cloneNode();
        a.volume = vol;
        a.play().catch(() => {});
      }
    } catch {}
  }

  // --- Reset ---
  function resetGame() {
    worldOffsetX = 0;
    lastSpawnX = 0;
    zombie = {
      x: Math.max(40, Math.min(window.innerWidth * 0.25, window.innerWidth - ZOMBIE_W - 20)),
      y: Math.max(20, window.innerHeight / 2 - ZOMBIE_H / 2),
      w: ZOMBIE_W,
      h: ZOMBIE_H,
      dy: 0,
      alive: true,
    };
    poles = [];
    score = 0;
    gameOver = false;
    started = true;
    for (let i = 0; i < 2; i++) spawnPole(true);
  }

  // --- Input ---
  function flap() {
    if (!started || !zombie.alive) return;
    zombie.dy = jumpPower;
    playSfx(assets.jump, 0.7);
  }

  const onKeyDown = (e) => {
    if ([" ", "ArrowUp", "w", "W"].includes(e.key)) {
      e.preventDefault();
      if (gameOver) { onGameOverTap(e); return; }
      flap();
    }
  };
  const onMouseDown = (e) => {
    if (e.target && e.target.tagName === "BUTTON") return;
    if (gameOver) { onGameOverTap(e); return; }
    flap();
  };
  const onTouchStart = (e) => {
    if (e.target && e.target.tagName === "BUTTON") return;
    e.preventDefault();
    if (gameOver) { onGameOverTap(e); return; }
    flap();
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("mousedown", onMouseDown);
  window.addEventListener("touchstart", onTouchStart, { passive: false });

  // --- Poles ---
  function spawnPole(initial = false) {
    const minTop = 80;
    const maxTop = Math.max(minTop + 10, window.innerHeight - poleGap - (GROUND_MARGIN + 120));
    const topH = Math.random() * (maxTop - minTop) + minTop;
    const spawnX = initial
      ? window.innerWidth + (poles.length ? poles[poles.length - 1].x + poleDistance : 0)
      : window.innerWidth + POLE_W;

    poles.push({
      x: spawnX,
      w: POLE_W,
      topH,
      bottomY: topH + poleGap,
      passed: false,
    });
    lastSpawnX = worldOffsetX + spawnX;
  }

  function maybeSpawn() {
    const distanceSinceLast = worldOffsetX + window.innerWidth - lastSpawnX;
    if (distanceSinceLast >= poleDistance) spawnPole(false);
  }

  // --- Collision ---
  function collides(z, p) {
    const zx1 = z.x + 5;
    const zx2 = z.x + z.w - 5;
    const zy1 = z.y + 5;
    const zy2 = z.y + z.h - 5;
    const px1 = p.x;
    const px2 = p.x + p.w;
    const overlapX = zx2 > px1 && zx1 < px2;
    if (!overlapX) return false;
    const hitTop = zy1 < p.topH - 4;
    const hitBottom = zy2 > p.bottomY + 6;
    return hitTop || hitBottom;
  }

  // --- Death ---
  let isNewBest = false;
  function hit() {
    if (!zombie.alive) return;
    zombie.alive = false;
    gameOver = true;
    isNewBest = score > 0 && score > highScore;
    if (isNewBest) {
      highScore = score;
      localStorage.setItem("zombiepet_highscore", highScore);
    }
    playSfx(assets.fail, 0.9);
    startGameOverLoop();
  }

  // --- Game Over Screen (drawn on canvas) ---
  let gameOverRaf = null;
  let gameOverAlpha = 0; // fade-in

  function drawGameOver() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const cx = W / 2;
    const cy = H / 2;

    // Dim background (fade in)
    gameOverAlpha = Math.min(gameOverAlpha + 0.045, 0.62);
    ctx.fillStyle = `rgba(0,0,0,${gameOverAlpha})`;
    ctx.fillRect(0, 0, W, H);

    if (gameOverAlpha < 0.25) return; // wait for fade before drawing panel

    // Panel
    const pw = Math.min(360, W * 0.8);
    const ph = isNewBest ? 230 : 200;
    const px = cx - pw / 2;
    const py = cy - ph / 2;
    const r = 20;

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 24;
    ctx.fillStyle = "rgba(255,255,255,0.96)";
    ctx.beginPath();
    ctx.moveTo(px + r, py);
    ctx.lineTo(px + pw - r, py);
    ctx.quadraticCurveTo(px + pw, py, px + pw, py + r);
    ctx.lineTo(px + pw, py + ph - r);
    ctx.quadraticCurveTo(px + pw, py + ph, px + pw - r, py + ph);
    ctx.lineTo(px + r, py + ph);
    ctx.quadraticCurveTo(px, py + ph, px, py + ph - r);
    ctx.lineTo(px, py + r);
    ctx.quadraticCurveTo(px, py, px + r, py);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // "Game Over" title
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 32px Arial";
    ctx.fillStyle = "#cc0000";
    ctx.fillText("Game Over!", cx, py + 42);

    // Score
    ctx.font = "bold 22px Arial";
    ctx.fillStyle = "#111";
    ctx.fillText(`Score: ${score}`, cx, py + 85);

    // Best
    ctx.font = "18px Arial";
    ctx.fillStyle = "#666";
    ctx.fillText(`Best: ${highScore}`, cx, py + 115);

    // New best badge
    if (isNewBest) {
      ctx.font = "bold 18px Arial";
      ctx.fillStyle = "#e65c00";
      ctx.fillText("🏆 New Best!", cx, py + 148);
    }

    // Restart button (drawn as a rounded rect)
    const btnY = py + ph - 46;
    const btnW = 160;
    const btnH = 40;
    const btnX = cx - btnW / 2;
    const btnR = 12;
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.moveTo(btnX + btnR, btnY);
    ctx.lineTo(btnX + btnW - btnR, btnY);
    ctx.quadraticCurveTo(btnX + btnW, btnY, btnX + btnW, btnY + btnR);
    ctx.lineTo(btnX + btnW, btnY + btnH - btnR);
    ctx.quadraticCurveTo(btnX + btnW, btnY + btnH, btnX + btnW - btnR, btnY + btnH);
    ctx.lineTo(btnX + btnR, btnY + btnH);
    ctx.quadraticCurveTo(btnX, btnY + btnH, btnX, btnY + btnH - btnR);
    ctx.lineTo(btnX, btnY + btnR);
    ctx.quadraticCurveTo(btnX, btnY, btnX + btnR, btnY);
    ctx.closePath();
    ctx.fill();

    ctx.font = "bold 18px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText("🔁 Restart", cx, btnY + btnH / 2);
  }

  function startGameOverLoop() {
    gameOverAlpha = 0;
    function tick() {
      // Redraw the last game frame first
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawPolesStatic();
      drawZombie();
      drawScore();
      drawGameOver();
      gameOverRaf = requestAnimationFrame(tick);
    }
    tick();
  }

  // Draw poles without moving them (for game over background)
  function drawPolesStatic() {
    for (const p of poles) {
      ctx.drawImage(assets.pole, p.x, 0, p.w, p.topH);
      const bottomHeight = window.innerHeight - p.bottomY;
      ctx.drawImage(assets.pole, p.x, p.bottomY, p.w, bottomHeight);
    }
  }

  // Click/tap anywhere on canvas to restart (when game over)
  function onGameOverTap(e) {
    if (!gameOver) return;
    if (e.target && e.target.tagName === "BUTTON") return;
    if (gameOverAlpha < 0.5) return; // ignore taps during fade-in
    cancelAnimationFrame(gameOverRaf);
    gameOverRaf = null;
    gameOver = false;
    startCountdown();
  }

  // --- Mode Change Button ---
  function showModeButton() {
    if (modeBtn) return;
    modeBtn = document.createElement("button");
    modeBtn.textContent = "⬅️ Change Mode";
    Object.assign(modeBtn.style, {
      position: "absolute",
      top: "20px",
      right: "20px",
      fontSize: "1.2rem",
      padding: "10px 20px",
      border: "2px solid black",
      borderRadius: "12px",
      background: "#fff",
      zIndex: 9999,
      cursor: "pointer",
      boxShadow: "0 3px 6px rgba(0,0,0,0.25)",
    });
    modeBtn.addEventListener("click", () => {
      // Cleanup and close game
      if (typeof window._modeCleanup === "function") window._modeCleanup();
      if (modeBtn) modeBtn.remove();
      modeBtn = null;
      // You can add your own mode-switch UI here:
      console.log("Pet game closed — ready to switch mode.");
    });
    document.body.appendChild(modeBtn);
  }

  // --- Countdown (slow 1.5s) ---
  function startCountdown() {
    if (rafId) cancelAnimationFrame(rafId);

    let count = 3;
    const interval = setInterval(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.font = "bold 120px Arial";
      ctx.fillStyle = "#000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(count > 0 ? count : "Ready!", window.innerWidth / 2, window.innerHeight / 2);
      count--;
      if (count < -1) {
        clearInterval(interval);
        resetGame();
        loop();
      }
    }, 500);
  }

  // --- Drawing ---
  function drawZombie() {
    const img = zombie.alive ? assets.zombie : assets.zombieHit;
    ctx.drawImage(img, zombie.x, zombie.y, zombie.w, zombie.h);
  }

  function drawScore() {
    ctx.font = "bold 42px Arial";
    ctx.fillStyle = "#000";
    ctx.textAlign = "left";
    ctx.fillText("Score: " + score, 40, 70);
    ctx.font = "bold 24px Arial";
    ctx.fillStyle = "#555";
    ctx.fillText("Best: " + highScore, 40, 104);
  }

  function drawPolesAndCollide() {
    for (let p of poles) {
      p.x -= speed;
      ctx.drawImage(assets.pole, p.x, 0, p.w, p.topH);
      const bottomHeight = window.innerHeight - p.bottomY;
      ctx.drawImage(assets.pole, p.x, p.bottomY, p.w, bottomHeight);
      if (zombie.alive && collides(zombie, p)) hit();
      if (!p.passed && p.x + p.w < zombie.x) {
        p.passed = true;
        score++;
        if (score % 5 === 0) {
          if (poleGap > 160) poleGap -= 6;
          speed = Math.min(speed + 0.2, 7.5);
        }
      }
    }
    poles = poles.filter((p) => p.x + p.w > 0);
  }

  // --- Loop ---
  function loop() {
    if (gameOver) return;
    rafId = requestAnimationFrame(loop);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    zombie.dy += gravity;
    zombie.y += zombie.dy;

    const floorY = window.innerHeight - GROUND_MARGIN - zombie.h;
    if (zombie.y > floorY) {
      zombie.y = floorY;
      hit();
    }
    if (zombie.y < 0) zombie.y = 0;

    worldOffsetX += speed;
    maybeSpawn();

    drawPolesAndCollide();
    drawZombie();
    drawScore();
  }

  // --- Wait for images then start ---
  // Counts only images that aren't already loaded (avoids race with cached images)
  function waitForImagesThenStart() {
    const imgs = [assets.zombie, assets.zombieHit, assets.pole];
    const pending = imgs.filter(img => !img.complete || img.naturalWidth === 0);

    if (pending.length === 0) {
      resetGame();
      loop();
      showModeButton();
      return;
    }

    let left = pending.length;
    pending.forEach((img) => {
      img.addEventListener("load", () => {
        if (--left === 0) {
          resetGame();
          loop();
          showModeButton();
        }
      });
      img.addEventListener("error", () => {
        // Still start even if an image fails to load
        if (--left === 0) {
          resetGame();
          loop();
          showModeButton();
        }
      });
    });
  }

  waitForImagesThenStart();

  // --- Cleanup ---
  window._modeCleanup = () => {
    if (rafId) cancelAnimationFrame(rafId);
    if (gameOverRaf) cancelAnimationFrame(gameOverRaf);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("mousedown", onMouseDown);
    window.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener("resize", resize);
    if (modeBtn) modeBtn.remove();
    gameOver = true;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
})();