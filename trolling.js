// trolling.js — Hammer + Butter + Remove + Watering Can + Sound + Safe Cleanup
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
  waterSound.loop = true;

  // register globally
  [hammerSound, butterSound, waterSound].forEach(s => SoundManager.register(s));

  function playSound(audio, volume = 0.9) {
    SoundManager.playClone(audio, volume);
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
      waterSound.loop = false;
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

  function getPointerPos(e) {
    if (e.touches && e.touches[0])
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }

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
      waterSound.pause();
      waterSound.currentTime = 0;
      touchingPet = false;
      can.x = 100;
      can.y = 100;
    }
  }

  // === EVENTS ARRAY (for easy cleanup) ===
  const events = [
    ["mousedown", startDrag],
    ["touchstart", startDrag],
    ["mousemove", dragMove],
    ["touchmove", dragMove],
    ["mouseup", endDrag],
    ["mouseleave", endDrag],
    ["touchend", endDrag],
  ];

  events.forEach(([ev, fn]) => canvas.addEventListener(ev, fn, { passive: false }));

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

    // watering can
    if (wateringCan.complete && wateringCan.naturalWidth > 0)
      ctx.drawImage(wateringCan, can.x, can.y, can.w, can.h);

    requestAnimationFrame(draw);
  }
  draw();

  // === CLEANUP ===
  window._modeCleanup = function () {
    running = false;
    if (uiBox) uiBox.remove();
    window.removeEventListener("resize", resizeCanvas);

    // 🚫 remove all listeners (stops hitbox & drag completely)
    events.forEach(([ev, fn]) => canvas.removeEventListener(ev, fn));

    // 🔇 stop any active sounds
    try {
      waterSound.pause();
      waterSound.currentTime = 0;
      waterSound.loop = false;
    } catch {}
    if (window.SoundManager) SoundManager.stopAll();

    touchingPet = false;
  };
})();