// trolling.js — Hammer + Butter + Remove + Watering Can + Sound + Drag Hitbox
(() => {
  window._modeName = "trolling";

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  // === Resize ===
  const groundHeight = 100;
  let groundY = 0;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    groundY = canvas.height - groundHeight;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // === Base Pet ===
  const baseImage = new Image();
  baseImage.src = "base.png";

  const pet = {
    x: canvas.width / 2 - 150,
    y: groundY - 400,
    w: 400,
    h: 400,
  };

  // === Sounds ===
  const hammerSound = new Audio("hammer.mp3");
  const butterSound = new Audio("butter.mp3");
  const waterSound = new Audio("water.mp3");
  waterSound.loop = true; // loop water sound while touching

  function playSound(audio) {
    try {
      const s = audio.cloneNode(); // allow overlapping playback
      s.volume = 0.9;
      s.play().catch(() => {});
    } catch {}
  }

  // === Buttons ===
  const uiBox = document.createElement("div");
  uiBox.id = "troll-buttons";
  uiBox.style.position = "absolute";
  uiBox.style.top = "20px";
  uiBox.style.left = "20px";
  uiBox.style.zIndex = "999";
  uiBox.innerHTML = `
    <button id="hammer-btn">🔨 Hammer</button>
    <button id="butter-btn">🧈 Butter</button>
    <button id="remove-btn">❌ Remove</button>
  `;
  document.body.appendChild(uiBox);

  const hammerBtn = document.getElementById("hammer-btn");
  const butterBtn = document.getElementById("butter-btn");
  const removeBtn = document.getElementById("remove-btn");

  // --- HAMMER MODE ---
  if (hammerBtn) {
    const press = () => {
      baseImage.src = "base_hammer.png";
      playSound(hammerSound);
    };
    const release = () => {
      baseImage.src = "base.png";
    };

    hammerBtn.addEventListener("mousedown", press);
    hammerBtn.addEventListener("touchstart", press);
    hammerBtn.addEventListener("mouseup", release);
    hammerBtn.addEventListener("mouseleave", release);
    hammerBtn.addEventListener("touchend", release);
  }

  // --- BUTTER MODE ---
  if (butterBtn) {
    butterBtn.addEventListener("click", () => {
      baseImage.src = "base_butter.png";
      playSound(butterSound);
    });
  }

  // --- REMOVE BUTTON ---
  if (removeBtn) {
    removeBtn.addEventListener("click", () => {
      baseImage.src = "base.png";
      waterSound.pause();
      waterSound.currentTime = 0;
    });
  }

  // === WATERING CAN ===
  const wateringCan = new Image();
  wateringCan.src = "wateringcan.png";
  const can = {
    x: 100,
    y: 100,
    w: 120,
    h: 120,
    dragging: false,
    offsetX: 0,
    offsetY: 0,
  };

  let touchingPet = false;

  function isHit(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  // === Mouse/Touch Drag for Watering Can ===
  function getPointerPos(e) {
    if (e.touches && e.touches[0])
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }

  canvas.addEventListener("mousedown", startDrag);
  canvas.addEventListener("touchstart", startDrag);
  canvas.addEventListener("mousemove", dragMove);
  canvas.addEventListener("touchmove", dragMove);
  canvas.addEventListener("mouseup", endDrag);
  canvas.addEventListener("mouseleave", endDrag);
  canvas.addEventListener("touchend", endDrag);

  function startDrag(e) {
    const pos = getPointerPos(e);
    if (
      pos.x >= can.x &&
      pos.x <= can.x + can.w &&
      pos.y >= can.y &&
      pos.y <= can.y + can.h
    ) {
      can.dragging = true;
      can.offsetX = pos.x - can.x;
      can.offsetY = pos.y - can.y;
    }
  }

  function dragMove(e) {
    if (!can.dragging) return;
    const pos = getPointerPos(e);
    can.x = pos.x - can.offsetX;
    can.y = pos.y - can.offsetY;

    const hit = isHit(can, pet);

    if (hit && !touchingPet) {
      baseImage.src = "base_wet.png";
      waterSound.currentTime = 0;
      waterSound.play().catch(() => {});
      touchingPet = true;
    } else if (!hit && touchingPet) {
      waterSound.pause();
      waterSound.currentTime = 0;
      touchingPet = false;
    }

    e.preventDefault();
  }

  function endDrag() {
    if (can.dragging) {
      can.dragging = false;
      // Stop sound if still playing
      waterSound.pause();
      waterSound.currentTime = 0;
      touchingPet = false;
      // Snap back to original position
      can.x = 100;
      can.y = 100;
    }
  }

  // === DRAW LOOP ===
  let running = true;
  function draw() {
    if (!running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ground
    ctx.fillStyle = "#5c4033";
    ctx.fillRect(0, groundY, canvas.width, groundHeight);

    // pet
    if (baseImage.complete && baseImage.naturalWidth > 0)
      ctx.drawImage(baseImage, pet.x, pet.y, pet.w, pet.h);

    // watering can (always visible)
    if (wateringCan.complete && wateringCan.naturalWidth > 0)
      ctx.drawImage(wateringCan, can.x, can.y, can.w, can.h);

    requestAnimationFrame(draw);
  }
  draw();

  // === Cleanup ===
  window._modeCleanup = function () {
    running = false;
    if (uiBox) uiBox.remove();
    window.removeEventListener("resize", resizeCanvas);
    waterSound.pause();
    waterSound.currentTime = 0;
  };
})();