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
  let restartBtn = null;
  let modeBtn = null;
  let lastSpawnX = 0;
  let worldOffsetX = 0;

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
      flap();
    }
  };
  const onMouseDown = (e) => {
    if (e.target && e.target.tagName === "BUTTON") return;
    flap();
  };
  const onTouchStart = (e) => {
    if (e.target && e.target.tagName === "BUTTON") return;
    e.preventDefault();
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

  // --- Death & Restart ---
  function hit() {
    if (!zombie.alive) return;
    zombie.alive = false;
    gameOver = true;
    playSfx(assets.fail, 0.9);
    showRestartButton();
  }

  function showRestartButton() {
    if (restartBtn) restartBtn.remove();
    restartBtn = document.createElement("button");
    restartBtn.textContent = "🔁 Restart";
    Object.assign(restartBtn.style, {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      fontSize: "2rem",
      padding: "15px 30px",
      border: "3px solid black",
      borderRadius: "15px",
      background: "#fff",
      zIndex: 9999,
      cursor: "pointer",
      boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
    });
    restartBtn.addEventListener("click", () => {
      restartBtn.remove();
      restartBtn = null;
      startCountdown();
    });
    document.body.appendChild(restartBtn);
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
    ctx.fillText("Score: " + score, 40, 70);
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
  function imagesReady() {
    return [assets.zombie, assets.zombieHit, assets.pole].every(
      (img) => img.complete && img.naturalWidth > 0
    );
  }

  function waitForImagesThenStart() {
    if (imagesReady()) {
      resetGame();
      loop();
      showModeButton(); // 👈 show mode button after game starts
      return;
    }
    let left = 3;
    [assets.zombie, assets.zombieHit, assets.pole].forEach((img) => {
      img.addEventListener("load", () => {
        if (--left === 0) {
          resetGame();
          loop();
          showModeButton(); // show after loading
        }
      });
    });
  }

  waitForImagesThenStart();

  // --- Cleanup ---
  window._modeCleanup = () => {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("mousedown", onMouseDown);
    window.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener("resize", resize);
    if (restartBtn) restartBtn.remove();
    if (modeBtn) modeBtn.remove();
    gameOver = true;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
})();