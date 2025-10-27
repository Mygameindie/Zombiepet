// ===========================================================
// 🧼 SHOWER MODE (SAFE VERSION + WORKING DRAG + CUSTOM HITBOX)
// ===========================================================

(() => {
  window._modeName = "shower";

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  resizeCanvas();

  const groundHeight = 100;
  let groundY = canvas.height - groundHeight;

  // === Base ===
  let baseImage = new Image();
  baseImage.src = "base_bath.png";
  let petX = canvas.width / 2 - 150;
  let petY = groundY - 400;

  // === Sponge ===
  const sponge = {
    img: new Image(),
    x: 100,
    y: 100,
    width: 100,
    height: 100,
    dragging: false,
  };
  sponge.img.src = "sponge.png";

  // === Duckies ===
  const duckies = [];
  const duckImg = new Image();
  duckImg.src = "duck.png";

  // === Sounds ===
  const quackSound = new Audio("quack.mp3");
  const splashSound = new Audio("splash.mp3");

  // === Button ===
  const spawnDuckBtn = document.createElement("button");
  spawnDuckBtn.textContent = "🐤 Spawn Rubber Duck";
  spawnDuckBtn.className = "mode-button";
  spawnDuckBtn.style.position = "absolute";
  spawnDuckBtn.style.top = "20px";
  spawnDuckBtn.style.left = "20px";
  spawnDuckBtn.style.zIndex = "50";
  document.body.appendChild(spawnDuckBtn);

  spawnDuckBtn.onclick = () => {
  const duck = {
    x: Math.random() * (canvas.width - 100),
    y: 0,
    width: 100,
    height: 100,
    vy: 0,
    grabbed: false,
  };
  duckies.push(duck);

  // each spawn = new quack instance (so multiple ducks can overlap sound)
  const quack = new Audio("quack.mp3");
  quack.volume = 0.8; // adjust loudness if needed
  quack.play().catch(() => {});
};

    // ===========================================================
// 🖐️ DRAG LOGIC (Sponge + Duck) — Mouse + Touch, gravity-aware
// ===========================================================
let dragTarget = null;
let offsetX = 0, offsetY = 0;

function getPointerPos(e) {
  const rect = canvas.getBoundingClientRect();
  let clientX, clientY;
  if (e.touches && e.touches[0]) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  return { x: clientX - rect.left, y: clientY - rect.top };
}

function startDrag(e) {
  e.preventDefault();
  const { x, y } = getPointerPos(e);

  // 🧽 sponge first
  if (
    x >= sponge.x &&
    x <= sponge.x + sponge.width &&
    y >= sponge.y &&
    y <= sponge.y + sponge.height
  ) {
    dragTarget = sponge;
    offsetX = x - sponge.x;
    offsetY = y - sponge.y;
    sponge.dragging = true;
    return;
  }

  // 🐤 ducks (topmost first)
  for (let i = duckies.length - 1; i >= 0; i--) {
    const duck = duckies[i];
    if (
      x >= duck.x &&
      x <= duck.x + duck.width &&
      y >= duck.y &&
      y <= duck.y + duck.height
    ) {
      dragTarget = duck;
      offsetX = x - duck.x;
      offsetY = y - duck.y;
      duck.grabbed = true;
      duck.vy = 0; // stop gravity while held
      return;
    }
  }
}

function moveDrag(e) {
  if (!dragTarget) return;
  e.preventDefault();
  const { x, y } = getPointerPos(e);
  dragTarget.x = x - offsetX;
  dragTarget.y = y - offsetY;
}

function stopDrag() {
  if (!dragTarget) return;
  if (dragTarget === sponge) {
    sponge.dragging = false;
  } else if (dragTarget.grabbed) {
    dragTarget.grabbed = false;
    dragTarget.vy = 0; // gravity restarts next frame
  }
  dragTarget = null;
}

function handleTap(e) {
  const { x, y } = getPointerPos(e);
  duckies.forEach((duck) => {
    if (
      x >= duck.x &&
      x <= duck.x + duck.width &&
      y >= duck.y &&
      y <= duck.y + duck.height
    ) {
      const quack = new Audio("quack.mp3");
      quack.volume = 0.8;
      quack.playbackRate = 0.9 + Math.random() * 0.2;
      quack.play().catch(() => {});
    }
  });
}

// Mouse + Touch listeners
["mousedown", "touchstart"].forEach(ev =>
  canvas.addEventListener(ev, startDrag, { passive: false })
);
["mousemove", "touchmove"].forEach(ev =>
  canvas.addEventListener(ev, moveDrag, { passive: false })
);
["mouseup", "touchend"].forEach(ev =>
  canvas.addEventListener(ev, stopDrag, { passive: false })
);
canvas.addEventListener("click", handleTap);
  // ===========================================================
  // 🧩 CUSTOMIZABLE HITBOX SETTINGS
  // ===========================================================
  const hitbox = {
    type: "rect", // "rect" or "circle"
    offsetX: 120,
    offsetY: 90,
    width: 130,
    height: 150,
    radius: 120,
    debug: true,
  };

  function drawHitbox() {
    if (!hitbox.debug) return;
    ctx.save();
    ctx.strokeStyle = "rgba(0,255,0,0)";
    ctx.lineWidth = 2;
    if (hitbox.type === "rect") {
      ctx.strokeRect(
        petX + hitbox.offsetX,
        petY + hitbox.offsetY,
        hitbox.width,
        hitbox.height
      );
    } else {
      ctx.beginPath();
      ctx.arc(petX + 150, petY + 150, hitbox.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function isTouchingHitbox(a) {
    if (hitbox.type === "rect") {
      return isTouching(a, {
        x: petX + hitbox.offsetX,
        y: petY + hitbox.offsetY,
        width: hitbox.width,
        height: hitbox.height,
      });
    } else {
      const cx = petX + 150;
      const cy = petY + 150;
      const dx = a.x + a.width / 2 - cx;
      const dy = a.y + a.height / 2 - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist < hitbox.radius + Math.max(a.width, a.height) / 3;
    }
  }

  // ===========================================================
  // 🪄 UPDATE LOOP
  // ===========================================================
  let running = true;
  function update() {
    if (!running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Base
    if (baseImage.complete && baseImage.naturalWidth > 0)
      ctx.drawImage(baseImage, petX, petY, 400, 400);

    // Sponge (wobble while dragging)
    if (sponge.img.complete && sponge.img.naturalWidth > 0) {
      ctx.save();
      if (sponge.dragging) {
        const wobble = Math.sin(Date.now() / 80) * 0.15;
        ctx.translate(sponge.x + sponge.width / 2, sponge.y + sponge.height / 2);
        ctx.rotate(wobble);
        ctx.drawImage(
          sponge.img,
          -sponge.width / 2,
          -sponge.height / 2,
          sponge.width,
          sponge.height
        );
      } else {
        ctx.drawImage(sponge.img, sponge.x, sponge.y, sponge.width, sponge.height);
      }
      ctx.restore();
    }

  // ✨ Sponge hitting or leaving pet hitbox
const touching = isTouchingHitbox(sponge);

if (touching && !baseImage.src.includes("base_bath2.png")) {
  // when first touches
  baseImage.src = "base_bath2.png";
  try {
    splashSound.currentTime = 0;
    splashSound.play().catch(() => {});
  } catch {}
} else if (!touching && !baseImage.src.includes("base_bath.png")) {
  // when sponge leaves
  baseImage.src = "base_bath.png";
}
    // 🟢 Draw hitbox outline (for tuning)
    drawHitbox();

    // 🐤 Ducks physics
    duckies.forEach((duck) => {
      if (!duck.grabbed) {
        duck.vy += 0.5;
        duck.y += duck.vy;
        if (duck.y + duck.height > groundY) {
          duck.y = groundY - duck.height;
          duck.vy *= -0.3;
        }
      }
      if (duckImg.complete && duckImg.naturalWidth > 0)
        ctx.drawImage(duckImg, duck.x, duck.y, duck.width, duck.height);
    });

    requestAnimationFrame(update);
  }

  function isTouching(a, b) {
    return !(
      a.x + a.width < b.x ||
      a.x > b.x + b.width ||
      a.y + a.height < b.y ||
      a.y > b.y + b.height
    );
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  update();

  // ===========================================================
  // CLEANUP WHEN MODE CHANGES
  // ===========================================================
  window._modeCleanup = function () {
    running = false;
    spawnDuckBtn.remove();
    // easiest safe cleanup: replace canvas node to remove all listeners
    canvas.replaceWith(canvas.cloneNode(true));
  };
})();