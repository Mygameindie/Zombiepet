// ===========================================================
// 😈 TROLL MODE (Scroll Bar + Hammer Hold + Butter + Water + Mobile)
// ===========================================================

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
  const pet = { x: canvas.width / 2 - 150, y: groundY - 400, w: 400, h: 400 };

  // 🧩 Preload variants
  const baseHammer = new Image();
  baseHammer.src = "base_hammer.png";
  const baseButter = new Image();
  baseButter.src = "base_butter.png";
  const baseWet = new Image();
  baseWet.src = "base_wet.png";

  // === Sounds ===
  const hammerSound = new Audio("hammer.mp3");
  const butterSound = new Audio("butter.mp3");
  const waterSound = new Audio("water.mp3");
  let activeWaterAudio = null;

  [hammerSound, butterSound, waterSound].forEach((s) => {
    if (window.SoundManager) SoundManager.register(s);
  });

  function playSound(audio, volume = 0.9, loop = false) {
    try {
      const clone = audio.cloneNode();
      clone.volume = volume;
      clone.loop = loop;
      clone.currentTime = 0;
      clone.play();
      return clone;
    } catch {
      return null;
    }
  }

  function stopActiveWater() {
    if (activeWaterAudio) {
      try {
        activeWaterAudio.pause();
        activeWaterAudio.currentTime = 0;
      } catch {}
      activeWaterAudio = null;
    }
  }

  // ===========================================================
  // 🧭 SCROLLABLE TOOLBAR
  // ===========================================================
  const trollBar = document.createElement("div");
  trollBar.id = "troll-bar";
  trollBar.classList.add("combined-scroll-bar");
  trollBar.style.position = "fixed";
  trollBar.style.top = "15px";
  trollBar.style.left = "50%";
  trollBar.style.transform = "translateX(-50%)";
  trollBar.style.zIndex = "999";
  trollBar.innerHTML = `
    <button id="hammer-btn">🔨 Hammer</button>
    <button id="butter-btn">🧈 Butter</button>
    <button id="watering-btn">💧 Water</button>
    <button id="remove-btn">❌ Remove</button>
  `;
  document.body.appendChild(trollBar);

  // === Drag-scroll helper (mobile compatible) ===
  function enableDragScroll(scrollElement) {
    let isDown = false;
    let startX, scrollLeft;

    const start = (e) => {
      isDown = true;
      startX = (e.touches ? e.touches[0].pageX : e.pageX) - scrollElement.offsetLeft;
      scrollLeft = scrollElement.scrollLeft;
    };
    const end = () => (isDown = false);
    const move = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = (e.touches ? e.touches[0].pageX : e.pageX) - scrollElement.offsetLeft;
      const walk = (x - startX) * 1.5;
      scrollElement.scrollLeft = scrollLeft - walk;
    };

    scrollElement.addEventListener("mousedown", start);
    scrollElement.addEventListener("touchstart", start, { passive: false });
    scrollElement.addEventListener("mouseup", end);
    scrollElement.addEventListener("mouseleave", end);
    scrollElement.addEventListener("touchend", end);
    scrollElement.addEventListener("mousemove", move);
    scrollElement.addEventListener("touchmove", move, { passive: false });
  }
  enableDragScroll(trollBar);

  // ===========================================================
  // BUTTON LOGIC
  // ===========================================================
  const hammerBtn = document.getElementById("hammer-btn");
  const butterBtn = document.getElementById("butter-btn");
  const waterBtn = document.getElementById("watering-btn");
  const removeBtn = document.getElementById("remove-btn");

  // ===========================================================
  // 🔨 HAMMER MODE (press/hold = hammer face, release = normal)
  // ===========================================================
  function hammerDown(e) {
    e.preventDefault(); // prevent touch highlight
    baseImage.src =
      baseHammer.complete && baseHammer.naturalWidth > 0
        ? baseHammer.src
        : "base_hammer.png";
    playSound(hammerSound);
  }

  function hammerUp() {
    baseImage.src = "base.png";
  }

  // Desktop + Mobile listeners
  hammerBtn.addEventListener("mousedown", hammerDown);
  hammerBtn.addEventListener("touchstart", hammerDown, { passive: false });
  ["mouseup", "mouseleave", "touchend", "touchcancel"].forEach((ev) =>
    hammerBtn.addEventListener(ev, hammerUp)
  );

  // ===========================================================
  // 🧈 BUTTER MODE
  // ===========================================================
  butterBtn.addEventListener("click", () => {
    baseImage.src =
      baseButter.complete && baseButter.naturalWidth > 0
        ? baseButter.src
        : "base_butter.png";
    playSound(butterSound);
  });

  // ===========================================================
  // 💧 WATER MODE — toggle active state
  // ===========================================================
  let waterMode = false;
  waterBtn.addEventListener("click", () => {
    waterMode = !waterMode;
    waterBtn.style.backgroundColor = waterMode ? "#03a9f4" : "";
    if (!waterMode) {
      stopActiveWater();
      can.dragging = false;
      can.x = 100;
      can.y = 100;
    }
  });

  // === Watering Can ===
  const wateringCan = new Image();
  wateringCan.src = "wateringcan.png";
  const can = { x: 100, y: 100, w: 120, h: 120, dragging: false, offsetX: 0, offsetY: 0 };
  let touchingPet = false;

  function isHit(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function getPointerPos(e) {
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX, y: t.clientY };
  }

  function startDrag(e) {
    if (!waterMode) return;
    const pos = getPointerPos(e);
    if (pos.x >= can.x && pos.x <= can.x + can.w && pos.y >= can.y && pos.y <= can.y + can.h) {
      can.dragging = true;
      can.offsetX = pos.x - can.x;
      can.offsetY = pos.y - can.y;
      stopActiveWater();
    }
  }

  function dragMove(e) {
    if (!can.dragging) return;
    const pos = getPointerPos(e);
    can.x = pos.x - can.offsetX;
    can.y = pos.y - can.offsetY;

    const hit = isHit(can, pet);
    if (hit && !touchingPet) {
      baseImage.src = baseWet.complete ? baseWet.src : "base_wet.png";
      stopActiveWater();
      activeWaterAudio = playSound(waterSound, 0.9, true);
      touchingPet = true;
    } else if (!hit && touchingPet) {
      stopActiveWater();
      touchingPet = false;
    }
    e.preventDefault();
  }

  function endDrag() {
    if (can.dragging) {
      can.dragging = false;
      stopActiveWater();
      touchingPet = false;
      can.x = 100;
      can.y = 100;
    }
  }

  const events = [
    ["mousedown", startDrag],
    ["touchstart", startDrag],
    ["mousemove", dragMove],
    ["touchmove", dragMove],
    ["mouseup", endDrag],
    ["mouseleave", endDrag],
    ["touchend", endDrag],
    ["touchcancel", endDrag],
  ];
  events.forEach(([ev, fn]) => canvas.addEventListener(ev, fn, { passive: false }));

  // ===========================================================
  // ❌ REMOVE BUTTON
  // ===========================================================
  removeBtn.addEventListener("click", () => {
    baseImage.src = "base.png";
    stopActiveWater();
    waterMode = false;
    waterBtn.style.backgroundColor = "";
  });

  // ===========================================================
  // 🎨 DRAW LOOP
  // ===========================================================
  let running = true;
  function draw() {
    if (!running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#5c4033";
    ctx.fillRect(0, groundY, canvas.width, groundHeight);

    if (baseImage.complete && baseImage.naturalWidth > 0)
      ctx.drawImage(baseImage, pet.x, pet.y, pet.w, pet.h);

    if (waterMode && wateringCan.complete && wateringCan.naturalWidth > 0)
      ctx.drawImage(wateringCan, can.x, can.y, can.w, can.h);

    requestAnimationFrame(draw);
  }
  draw();

  // ===========================================================
  // 🧹 CLEANUP
  // ===========================================================
  window._modeCleanup = function () {
    running = false;
    trollBar?.remove();
    window.removeEventListener("resize", resizeCanvas);
    events.forEach(([ev, fn]) => canvas.removeEventListener(ev, fn));
    stopActiveWater();
    if (window.SoundManager) SoundManager.stopAll();
    touchingPet = false;
    waterMode = false;
  };
})();