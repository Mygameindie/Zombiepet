// ===========================================================
// 🎮 pet_game.js — Flippy Bird Game (Final Precise Collision)
// ===========================================================
(function () {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  window._modeName = "game";

  // === Assets ===
  const zombieImg = new Image();
  zombieImg.src = "base_game.png";
  const zombieHitImg = new Image();
  zombieHitImg.src = "base_game2.png";
  const poleImg = new Image();
  poleImg.src = "Pole.png";

  const jumpSound = new Audio("jump.mp3");
  const failSound = new Audio("fail.mp3");

  // === Constants ===
  const GROUND_MARGIN = 40;
  let gravity = 0.45;
  let jumpPower = -8.5;
  let speed = 3.8;
  let poleGap = 230;
  let poleDistance = 350;

  // === State ===
  let zombie, poles, score, frame, gameOver;
  let restartBtn = null;

  function resetGame() {
    zombie = {
      x: canvas.width * 0.25,
      y: canvas.height / 2,
      w: 130,
      h: 120,
      dy: 0,
      alive: true
    };
    poles = [];
    score = 0;
    frame = 0;
    gameOver = false;
  }

  // === Controls ===
function flap() {
  if (!zombie.alive) return;
  zombie.dy = jumpPower;
  if (window.SoundManager) SoundManager.playClone(jumpSound, 0.7);
}

// Detect platform type and bind correctly
if ("ontouchstart" in window) {
  // Mobile / touchscreen
  window.addEventListener("touchstart", (e) => {
  // Allow button taps (e.g. Restart)
  if (e.target.tagName === "BUTTON") return;
  e.preventDefault(); // block only canvas taps
  flap();
}, { passive: false });
} else {
  // Desktop
  window.addEventListener("mousedown", flap);
  window.addEventListener("keydown", (e) => {
    if ([" ", "ArrowUp", "w", "W"].includes(e.key)) {
      e.preventDefault();
      flap();
    }
  });
}

  // === Spawn pole ===
  function spawnPole() {
    const minTop = 80;
    const maxTop = canvas.height - poleGap - 200;
    const topH = Math.random() * (maxTop - minTop) + minTop;
    poles.push({
      x: canvas.width,
      w: 90,
      topH,
      bottomY: topH + poleGap,
      passed: false
    });
  }

  // === Accurate collision ===
  function collides(z, p) {
    // Slightly shrink zombie hitbox for transparent padding
    const zx1 = z.x + 5;
    const zx2 = z.x + z.w - 5;
    const zy1 = z.y + 5;
    const zy2 = z.y + z.h - 5;

    const overlapX = zx2 > p.x && zx1 < p.x + p.w;
    if (!overlapX) return false;

    // Top pole zone
    const topPoleBottom = p.topH - 4;
    const hitTop = zy1 < topPoleBottom && zy2 > 0;

    // Bottom pole zone — start exactly where drawn
    const bottomStart = p.bottomY + 10; // shifted down 10px for pole transparency
    const hitBottom = zy2 > bottomStart;

    return hitTop || hitBottom;
  }

  // === Death ===
  function hit() {
    if (!zombie.alive) return;
    zombie.alive = false;
    gameOver = true;
    if (window.SoundManager) SoundManager.playClone(failSound, 0.9);
    setTimeout(showRestartButton, 600);
  }

  // === Restart button ===
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
      boxShadow: "0 4px 8px rgba(0,0,0,0.3)"
    });
    restartBtn.addEventListener("click", () => {
      restartBtn.remove();
      startGame();
    });
    document.body.appendChild(restartBtn);
  }

  // === Game loop ===
  function update() {
    if (!gameOver) requestAnimationFrame(update);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // physics
    zombie.dy += gravity;
    zombie.y += zombie.dy;

    // floor
    if (zombie.y + zombie.h >= canvas.height - GROUND_MARGIN) {
      zombie.y = canvas.height - GROUND_MARGIN - zombie.h;
      hit();
    }
    if (zombie.y < 0) zombie.y = 0;

    // --- pole spawning control ---
if (!poles.length) {
  // first pole at start
  spawnPole();
} else {
  const lastPole = poles[poles.length - 1];
  // distance since last pole
  if (canvas.width - lastPole.x >= poleDistance) {
    spawnPole();
  }
}

    for (let p of poles) {
      p.x -= speed;

      // draw top
      ctx.drawImage(poleImg, p.x, 0, p.w, p.topH);
      // draw bottom
      const bottomHeight = canvas.height - p.bottomY;
      ctx.drawImage(poleImg, p.x, p.bottomY, p.w, bottomHeight);

      // precise collision check
      if (zombie.alive && collides(zombie, p)) hit();

      // scoring
      if (!p.passed && p.x + p.w < zombie.x) {
        p.passed = true;
        score++;
        if (score % 5 === 0 && poleGap > 160) {
          poleGap -= 6;
          speed += 0.2;
        }
      }
    }

    poles = poles.filter(p => p.x + p.w > 0);

    // draw zombie
    ctx.drawImage(zombie.alive ? zombieImg : zombieHitImg, zombie.x, zombie.y, zombie.w, zombie.h);

    // score
    ctx.font = "bold 42px Arial";
    ctx.fillStyle = "#000";
    ctx.fillText("Score: " + score, 40, 70);
  }

  function startGame() {
    resetGame();
    update();
  }

  startGame();

  window._modeCleanup = () => {
    window.removeEventListener("keydown", flap);
    window.removeEventListener("mousedown", flap);
    window.removeEventListener("touchstart", flap);
    window.removeEventListener("resize", resize);
    if (restartBtn) restartBtn.remove();
    gameOver = true;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
})();