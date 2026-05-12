// ===========================================================
// 😈 TROLL MODE — Hammer (click-to-arm + pixel-perfect hit) + Butter + Water
// Hammer: arm it, then click/tap the pet → swing animation + sound
// Butter & Water: Zombiepet-original interactions
// ===========================================================

(() => {
  window._modeName = "trolling";

  const canvas = document.getElementById("canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // === Resize ===
  const groundHeight = 100;
  let groundY = 0;
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    groundY = canvas.height - groundHeight;
    pet.x = canvas.width / 2 - pet.w / 2;
    pet.y = groundY - pet.h;
  }
  window.addEventListener("resize", resizeCanvas);

  // === Base Pet ===
  function createImg(src) {
    const img = new Image();
    img._failed = false;
    img.onerror = () => { img._failed = true; };
    img.src = src;
    return img;
  }

  const imgs = {
    normal: createImg("base.png"),
    hurt:   createImg("base_disgust.png"),
    butter: createImg("base_butter.png"),
    wet:    createImg("base_wet.png"),
  };

  const pet = { x: 0, y: 0, w: 400, h: 400, hurtUntil: 0, recoilUntil: 0 };

  // init positions after pet defined
  resizeCanvas();

  // === Sounds ===
  const hammerSound = new Audio("hammer.mp3");
  const butterSound = new Audio("butter.mp3");
  const waterSound  = new Audio("water.mp3");
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
      clone.play().catch(() => {});
      if (window.SoundManager) SoundManager.register(clone);
      return clone;
    } catch { return null; }
  }

  function stopActiveWater() {
    if (activeWaterAudio) {
      try { activeWaterAudio.pause(); activeWaterAudio.currentTime = 0; } catch {}
      activeWaterAudio = null;
    }
  }

  // ===========================================================
  // 💔 HAPPINESS PENALTY
  // ===========================================================
  const TROLL_HAPPINESS_DAMAGE = 5;

  function clampHappiness(value) {
    return Math.max(0, Math.min(100, value));
  }

  function setHappinessValue(target, key, amount) {
    if (!target || typeof target[key] !== "number") return null;
    target[key] = clampHappiness(target[key] - amount);
    return target[key];
  }

  function decreasePetHappiness(amount = TROLL_HAPPINESS_DAMAGE) {
    let happiness = null;

    // Support the most common global pet stat shapes without requiring a duplicate stat system.
    happiness = setHappinessValue(window.petStats, "happiness", amount) ?? happiness;
    happiness = setHappinessValue(window.petState, "happiness", amount) ?? happiness;
    happiness = setHappinessValue(window.petData, "happiness", amount) ?? happiness;
    happiness = setHappinessValue(window.PetStats, "happiness", amount) ?? happiness;

    if (typeof window.happiness === "number") {
      window.happiness = clampHappiness(window.happiness - amount);
      happiness = window.happiness;
    }

    // Fallback persistence for projects that store happiness directly in localStorage.
    if (happiness === null) {
      const saved = Number(localStorage.getItem("petHappiness") ?? localStorage.getItem("happiness"));
      happiness = clampHappiness(Number.isFinite(saved) ? saved - amount : 100 - amount);
    }

    localStorage.setItem("petHappiness", String(happiness));
    localStorage.setItem("happiness", String(happiness));

    const percent = `${happiness}%`;
    ["happiness", "pet-happiness", "happiness-value"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(happiness);
    });
    ["happiness-bar", "pet-happiness-bar"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.style.width = percent;
    });

    window.dispatchEvent(new CustomEvent("pet:happiness:changed", {
      detail: { happiness, delta: -amount, source: "trolling" }
    }));
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
    <button id="hammer-btn" title="Arm hammer, then tap the pet">🔨 Hammer</button>
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
      scrollElement.scrollLeft = scrollLeft - (x - startX) * 1.5;
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
  // 🔨 HAMMER — click to arm, then click pet (pixel-perfect)
  // ===========================================================
  const hammerCursor = document.createElement("div");
  hammerCursor.id = "hammer-cursor";
  hammerCursor.textContent = "🔨";
  hammerCursor.style.display = "none";
  document.body.appendChild(hammerCursor);

  // Inject CSS animation so it always works regardless of external stylesheet
  const hammerStyle = document.createElement("style");
  hammerStyle.textContent = `
    #hammer-cursor {
      position: fixed;
      left: 0; top: 0;
      transform: translate(-50%, -55%) rotate(-18deg);
      font-size: 48px;
      pointer-events: none;
      z-index: 1000;
      filter: drop-shadow(0 2px 2px rgba(0,0,0,.25));
    }
    #hammer-cursor.swing {
      animation: hammerSwing .32s ease-in-out;
      transform-origin: 70% 30%;
    }
    @keyframes hammerSwing {
      0%   { transform: translate(-50%, -55%) rotate(-18deg); }
      55%  { transform: translate(-50%, -55%) rotate(65deg) translateY(6px); }
      100% { transform: translate(-50%, -55%) rotate(-18deg); }
    }
    #troll-bar button.active { outline: 2px solid rgba(255,255,255,.65); }
  `;
  document.head.appendChild(hammerStyle);

  let hammerArmed = false;
  let isSwinging = false;

  const hammerBtn  = document.getElementById("hammer-btn");
  const butterBtn  = document.getElementById("butter-btn");
  const waterBtn   = document.getElementById("watering-btn");
  const removeBtn  = document.getElementById("remove-btn");

  function setHammerArmed(on) {
    hammerArmed = !!on;
    hammerBtn.classList.toggle("active", hammerArmed);
    hammerCursor.style.display = "none";
  }

  hammerBtn.addEventListener("click", () => setHammerArmed(!hammerArmed));

  // ===========================================================
  // 🎯 Pixel-perfect hit test (opaque pixels only)
  // ===========================================================
  const alphaMask = { data: null, w: 0, h: 0 };
  const ALPHA_THRESHOLD = 10;

  function rebuildAlphaMask(img) {
    try {
      const oc = document.createElement("canvas");
      oc.width  = img.naturalWidth  || img.width;
      oc.height = img.naturalHeight || img.height;
      const octx = oc.getContext("2d", { willReadFrequently: true });
      octx.drawImage(img, 0, 0);
      const id = octx.getImageData(0, 0, oc.width, oc.height);
      alphaMask.data = id.data;
      alphaMask.w = oc.width;
      alphaMask.h = oc.height;
    } catch {
      alphaMask.data = null;
    }
  }

  imgs.normal.addEventListener("load", () => rebuildAlphaMask(imgs.normal));
  if (imgs.normal.complete && imgs.normal.naturalWidth > 0) rebuildAlphaMask(imgs.normal);

  function getCanvasPoint(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches && e.touches[0];
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top)  * (canvas.height / rect.height),
      clientX,
      clientY,
    };
  }

  function isOpaqueHit(px, py) {
    if (px < pet.x || px > pet.x + pet.w || py < pet.y || py > pet.y + pet.h) return false;
    // fallback to rect if mask not ready
    if (!alphaMask.data || !alphaMask.w || !alphaMask.h) return true;
    const ix = Math.floor((px - pet.x) * (alphaMask.w / pet.w));
    const iy = Math.floor((py - pet.y) * (alphaMask.h / pet.h));
    if (ix < 0 || ix >= alphaMask.w || iy < 0 || iy >= alphaMask.h) return false;
    return alphaMask.data[(iy * alphaMask.w + ix) * 4 + 3] > ALPHA_THRESHOLD;
  }

  // ===========================================================
  // 🔨 Hit + timing
  // ===========================================================
  const SWING_MS  = 320;
  const IMPACT_AT = 0.62;

  function doHammerHit(didHit, clientX, clientY) {
    if (!hammerArmed || isSwinging) return;
    isSwinging = true;

    hammerCursor.style.left    = clientX + "px";
    hammerCursor.style.top     = clientY + "px";
    hammerCursor.style.display = "block";

    hammerCursor.classList.remove("swing");
    void hammerCursor.offsetWidth; // force reflow to restart animation
    hammerCursor.classList.add("swing");

    const impactTimer = setTimeout(() => {
      if (didHit) {
        playSound(hammerSound, 0.95);
        decreasePetHappiness();
        pet.recoilUntil = Date.now() + 120;
        pet.hurtUntil   = Date.now() + 450;
      }
    }, Math.floor(SWING_MS * IMPACT_AT));

    setTimeout(() => {
      clearTimeout(impactTimer);
      hammerCursor.classList.remove("swing");
      hammerCursor.style.display = "none";
      isSwinging = false;
    }, SWING_MS + 30);
  }

  function onCanvasDown(e) {
    if (!hammerArmed) return;
    const p = getCanvasPoint(e);
    const hit = isOpaqueHit(p.x, p.y);
    e.preventDefault();
    doHammerHit(hit, p.clientX, p.clientY);
  }

  canvas.addEventListener("mousedown", onCanvasDown);
  canvas.addEventListener("touchstart", onCanvasDown, { passive: false });

  // ===========================================================
  // 🧈 BUTTER MODE
  // ===========================================================
  let currentState = "normal"; // "normal" | "butter" | "wet"

  butterBtn.addEventListener("click", () => {
    currentState = "butter";
    playSound(butterSound);
    decreasePetHappiness();
  });

  // ===========================================================
  // 💧 WATER MODE — toggle active state
  // ===========================================================
  let waterMode = false;
  const wateringCan = new Image();
  wateringCan.src = "wateringcan.png";
  const can = { x: 100, y: 100, w: 120, h: 120, dragging: false, offsetX: 0, offsetY: 0 };
  let touchingPet = false;

  waterBtn.addEventListener("click", () => {
    waterMode = !waterMode;
    waterBtn.style.backgroundColor = waterMode ? "#03a9f4" : "";
    if (!waterMode) {
      stopActiveWater();
      can.dragging = false;
      can.x = 100;
      can.y = 100;
      if (currentState === "wet") currentState = "normal";
    }
  });

  function isHit(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function getPointerPos(e) {
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX, y: t.clientY };
  }

  function startWaterDrag(e) {
    if (!waterMode || hammerArmed) return;
    const pos = getPointerPos(e);
    if (pos.x >= can.x && pos.x <= can.x + can.w && pos.y >= can.y && pos.y <= can.y + can.h) {
      can.dragging = true;
      can.offsetX = pos.x - can.x;
      can.offsetY = pos.y - can.y;
      stopActiveWater();
    }
  }

  function dragWaterMove(e) {
    if (!can.dragging) return;
    const pos = getPointerPos(e);
    can.x = pos.x - can.offsetX;
    can.y = pos.y - can.offsetY;

    const petRect = { x: pet.x, y: pet.y, w: pet.w, h: pet.h };
    const hit = isHit(can, petRect);
    if (hit && !touchingPet) {
      currentState = "wet";
      stopActiveWater();
      activeWaterAudio = playSound(waterSound, 0.9, true);
      decreasePetHappiness();
      touchingPet = true;
    } else if (!hit && touchingPet) {
      stopActiveWater();
      touchingPet = false;
    }
    e.preventDefault();
  }

  function endWaterDrag() {
    if (can.dragging) {
      can.dragging = false;
      stopActiveWater();
      touchingPet = false;
      can.x = 100;
      can.y = 100;
    }
  }

  const waterEvents = [
    ["mousedown", startWaterDrag],
    ["touchstart", startWaterDrag],
    ["mousemove", dragWaterMove],
    ["touchmove", dragWaterMove],
    ["mouseup", endWaterDrag],
    ["mouseleave", endWaterDrag],
    ["touchend", endWaterDrag],
    ["touchcancel", endWaterDrag],
  ];
  waterEvents.forEach(([ev, fn]) => canvas.addEventListener(ev, fn, { passive: false }));

  // ===========================================================
  // ❌ REMOVE BUTTON
  // ===========================================================
  removeBtn.addEventListener("click", () => {
    currentState = "normal";
    setHammerArmed(false);
    pet.hurtUntil = 0;
    pet.recoilUntil = 0;
    stopActiveWater();
    waterMode = false;
    waterBtn.style.backgroundColor = "";
    touchingPet = false;
  });

  // ===========================================================
  // 🎨 DRAW LOOP
  // ===========================================================
  let running = true;
  let rafId = 0;
  function draw() {
    if (!running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ground
    ctx.fillStyle = "#5c4033";
    ctx.fillRect(0, groundY, canvas.width, groundHeight);

    const now = Date.now();
    const recoil   = (pet.recoilUntil && now < pet.recoilUntil) ? 10 : 0;
    const wantHurt = (pet.hurtUntil   && now < pet.hurtUntil);

    // pick image: hurt takes priority, then state
    let img;
    if (wantHurt)               img = imgs.hurt;
    else if (currentState === "butter") img = imgs.butter;
    else if (currentState === "wet")    img = imgs.wet;
    else                                img = imgs.normal;

    if (img && !img._failed && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, pet.x, pet.y + recoil, pet.w, pet.h);
    }

    // 👕 Outfit overlay
    if (window.drawOutfitOverlay)
      window.drawOutfitOverlay(ctx, "stand", pet.x, pet.y + recoil, pet.w, pet.h);

    // 💧 Watering can
    if (waterMode && wateringCan.complete && wateringCan.naturalWidth > 0)
      ctx.drawImage(wateringCan, can.x, can.y, can.w, can.h);

    rafId = requestAnimationFrame(draw);
  }
  draw();

  // ===========================================================
  // 🧹 CLEANUP
  // ===========================================================
  window._modeCleanup = function () {
    running = false;
    cancelAnimationFrame(rafId);
    trollBar?.remove();
    hammerCursor?.remove();
    hammerStyle?.remove();
    window.removeEventListener("resize", resizeCanvas);
    canvas.removeEventListener("mousedown", onCanvasDown);
    canvas.removeEventListener("touchstart", onCanvasDown);
    waterEvents.forEach(([ev, fn]) => canvas.removeEventListener(ev, fn));
    stopActiveWater();
    if (window.SoundManager) SoundManager.stopAll();
    waterMode = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
})();
