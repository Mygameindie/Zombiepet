// ===========================================================
// 🐾 FEED MODE (Instant Sound + Gravity + Scroll Bar + Mobile)
// ===========================================================
(function () {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  resizeCanvas();

  const groundHeight = 100;
  let groundY = canvas.height - groundHeight;

  // ===========================================================
  // 🎵 INSTANT SOUND POOLS
  // ===========================================================
  const soundPool = {
    yum: [new Audio("yummy.mp3"), new Audio("yummy.mp3"), new Audio("yummy.mp3")],
    yuck: [new Audio("yuck.mp3"), new Audio("yuck.mp3"), new Audio("yuck.mp3")],
    bounce: [new Audio("bounce.mp3"), new Audio("bounce.mp3")],
    frozen: [new Audio("frozen.mp3"), new Audio("frozen.mp3")],
    spicy: [new Audio("spicy.mp3"), new Audio("spicy.mp3")],
    quack: [new Audio("quack.mp3"), new Audio("quack.mp3"), new Audio("quack.mp3")],
  };
  let soundIndex = 0;

  function playSound(key, volume = 0.9, rate = 1.0) {
    const pool = soundPool[key];
    if (!pool) return;
    const s = pool[soundIndex % pool.length];
    soundIndex++;
    try {
      s.pause();
      s.currentTime = 0;
      s.volume = volume;
      s.playbackRate = rate;
      s.play();
    } catch {}
  }

  // ===========================================================
  // 🦆 Quack Helper (instant, random pitch)
  // ===========================================================
  function playQuack() {
    playSound("quack", 0.9, 0.9 + Math.random() * 0.2);
  }

  // ===========================================================
  // 🐾 PET IMAGES
  // ===========================================================
  const petImgs = {
    normal: new Image(),
    happy: new Image(),
    disgust: new Image(),
    brainfreeze: new Image(),
    spicy: new Image(),
  };
  petImgs.normal.src = "base.png";
  petImgs.happy.src = "base_happy.png";
  petImgs.disgust.src = "base_disgust.png";
  petImgs.brainfreeze.src = "base_brainfreeze.png";
  petImgs.spicy.src = "base_spicy.png";

  const pet = {
    x: canvas.width / 2,
    y: canvas.height - 100 - 150,
    w: 300,
    h: 300,
    mood: "normal",
  };

  // ===========================================================
  // 💬 TEXT BUBBLE
  // ===========================================================
  let bubble = document.getElementById("bubble");
  if (!bubble) {
    bubble = document.createElement("div");
    bubble.id = "bubble";
    bubble.style.position = "absolute";
    bubble.style.transform = "translate(-50%, -100%)";
    bubble.style.background = "rgba(255,255,255,0.95)";
    bubble.style.borderRadius = "10px";
    bubble.style.padding = "6px 10px";
    bubble.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
    bubble.style.pointerEvents = "none";
    bubble.style.fontSize = "14px";
    bubble.style.display = "none";
    document.body.appendChild(bubble);
  }

  function showBubble(text) {
    bubble.style.left = pet.x + "px";
    bubble.style.top = pet.y - pet.h / 2 - 40 + "px";
    bubble.textContent = text;
    bubble.style.display = "block";
    clearTimeout(showBubble._t);
    showBubble._t = setTimeout(() => (bubble.style.display = "none"), 1200);
  }

  // ===========================================================
  // 🍽️ FOODS
  // ===========================================================
  const foods = [];

  const spawnMap = {
    fish: { name: "Fish", imgSrc: "food1.png", liked: true, w: 200, h: 100, type: "normal" },
    garlic: { name: "Garlic", imgSrc: "food2.png", liked: false, w: 100, h: 100, type: "normal" },
    icelettuce: { name: "Ice Lettuce", imgSrc: "food3.png", liked: true, w: 100, h: 100, type: "ice" },
    brain: { name: "Brain", imgSrc: "food4.png", liked: true, w: 100, h: 100, type: "normal" },
    duck: { name: "Rubber Duck", imgSrc: "duck.png", liked: false, w: 120, h: 120, type: "normal" },
    candy: { name: "Candy", imgSrc: "candy.png", liked: true, w: 100, h: 100, type: "ice" },
    spicy: { name: "Chili", imgSrc: "chili.png", liked: true, w: 100, h: 150, type: "spicy" },
  };

  function spawnFood(type) {
    const def = spawnMap[type];
    if (!def) return;

    const f = {
      ...def,
      img: new Image(),
      drag: false,
      visible: true,
      justSpawned: true,
      vy: 0,
      x: pet.x + (Math.random() * 200 - 100),
      y: pet.y - 300,
    };
    f.img.src = def.imgSrc;
    setTimeout(() => (f.justSpawned = false), 800);
    foods.push(f);

    if (type === "duck") playQuack();
  }

  function clearFoods() {
    foods.length = 0;
  }

  // ===========================================================
  // 🖐️ DRAG LOGIC (Mobile + Desktop)
  // ===========================================================
  let activeFood = null;
  let hasMoved = false;

  function pos(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.touches ? e.touches[0].clientX : e.clientX) - r.left,
      y: (e.touches ? e.touches[0].clientY : e.clientY) - r.top,
    };
  }

  function down(e) {
    const p = pos(e);
    for (const f of foods) {
      if (!f.visible) continue;
      if (
        p.x > f.x - f.w / 2 &&
        p.x < f.x + f.w / 2 &&
        p.y > f.y - f.h / 2 &&
        p.y < f.y + f.h / 2
      ) {
        activeFood = f;
        f.drag = true;
        f.vy = 0;
        hasMoved = false;
        e.preventDefault();
        return;
      }
    }
  }

  function move(e) {
    if (!activeFood) return;
    const p = pos(e);
    activeFood.x = p.x;
    activeFood.y = p.y;
    hasMoved = true;
    if (e.touches) e.preventDefault();
  }

  function up() {
    if (activeFood && hasMoved) checkCollision(activeFood);
    if (activeFood) activeFood.drag = false;
    activeFood = null;
  }

  const listeners = [
    ["mousedown", down],
    ["mousemove", move],
    ["mouseup", up],
    ["touchstart", down],
    ["touchmove", move],
    ["touchend", up],
  ];
  listeners.forEach(([ev, fn]) => canvas.addEventListener(ev, fn, { passive: false }));

  // ===========================================================
  // 💥 COLLISION DETECTION
  // ===========================================================
  function checkCollision(f) {
    if (!f.visible || f.justSpawned) return;
    const dx = Math.abs(f.x - pet.x);
    const dy = Math.abs(f.y - pet.y);
    const hit = dx < f.w / 2 + pet.w / 2 && dy < f.h / 2 + pet.h / 2;
    if (!hit) return;

    // Reaction types
    if (f.type === "ice") {
      pet.mood = "brainfreeze";
      showBubble("Brrr! 🧊");
      playSound("frozen");
      if (window.PetStats) window.PetStats.feedSpecial(0, "ice");
    } else if (f.type === "spicy") {
      pet.mood = "spicy";
      showBubble("Spicy! 🌶️");
      playSound("spicy");
      if (window.PetStats) window.PetStats.feedSpecial(0, "spicy");
    } else {
      if (f.name === "Rubber Duck") playQuack();
      pet.mood = f.liked ? "happy" : "disgust";
      showBubble(f.liked ? "Yummy!" : "Yuck!");
      playSound(f.liked ? "yum" : "yuck");
      if (window.PetStats) window.PetStats.feed(0, f.liked);
    }

    f.visible = false;
    setTimeout(() => (pet.mood = "normal"), 1500);
  }

  // ===========================================================
  // 🌍 GRAVITY + DRAW
  // ===========================================================
  const gravity = 0.6;
  const bounce = 0.4;
  let floorY = canvas.height - groundHeight - 10;

  function applyGravity() {
    for (const f of foods) {
      if (f.drag || !f.visible) continue;
      if (f.y + f.h / 2 < floorY) {
        f.vy = (f.vy || 0) + gravity;
        f.y += f.vy;
      } else {
        f.y = floorY - f.h / 2;
        f.vy = -(f.vy || 0) * bounce;
        if (Math.abs(f.vy) < 0.8) f.vy = 0;
      }
    }
  }

  function ground() {
    ctx.fillStyle = "#5c4033";
    ctx.fillRect(0, groundY, canvas.width, groundHeight);
  }

  function drawPet() {
    const img = petImgs[pet.mood];
    if (img && img.complete && img.naturalWidth > 0)
      ctx.drawImage(img, pet.x - pet.w / 2, pet.y - pet.h / 2, pet.w, pet.h);
    // 👕 Outfit overlay
    if (window.drawOutfitOverlay)
      window.drawOutfitOverlay(ctx, "stand", pet.x - pet.w / 2, pet.y - pet.h / 2, pet.w, pet.h);
  }

  function drawFoods() {
    for (const f of foods) {
      if (!f.visible) continue;
      const img = f.img;
      if (img && img.complete && img.naturalWidth > 0)
        ctx.drawImage(img, f.x - f.w / 2, f.y - f.h / 2, f.w, f.h);
    }
  }

  let rafId = 0;
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ground();
    drawPet();
    applyGravity();
    drawFoods();
    rafId = requestAnimationFrame(loop);
  }
  loop();

  // ===========================================================
  // 📱 RESIZE
  // ===========================================================
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", () => {
    resizeCanvas();
    groundY = canvas.height - groundHeight;
    pet.y = groundY - pet.h / 2;
  });

  // ===========================================================
  // 🧭 SCROLLABLE FEED TOOLBAR
  // ===========================================================
  let spawnButtons = document.getElementById("spawn-buttons");
  if (!spawnButtons) {
    spawnButtons = document.createElement("div");
    spawnButtons.id = "spawn-buttons";
    spawnButtons.classList.add("combined-scroll-bar");
    spawnButtons.style.position = "fixed";
    spawnButtons.style.top = "15px";
    spawnButtons.style.left = "50%";
    spawnButtons.style.transform = "translateX(-50%)";
    spawnButtons.style.zIndex = "999";
    spawnButtons.innerHTML = `
      <button id="spawnFish">🐟 Fish</button>
	        <button id="spawnBrain">🧠 Brain</button>
      <button id="spawngarlic">🧄 Garlic</button>
      <button id="spawnicelettuce">🥬 Ice Lettuce</button>

      <button id="spawnDuck">🦆 Duck</button>
      <button id="spawncandy">🍬 Candy</button>
      <button id="spawnSpicy">🌶️ Spicy</button>
      <button id="clearFoods">🧹 Clear</button>
    `;
    document.body.appendChild(spawnButtons);
  }

  // --- Enable drag-scroll
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
  enableDragScroll(spawnButtons);

  // --- Button Events + Inventory badges ---
  const btnMap = {
    spawnFish: "fish",
    spawngarlic: "garlic",
    spawnBrain: "brain",
    spawnicelettuce: "icelettuce",
    spawnDuck: "duck",
    spawncandy: "candy",
    spawnSpicy: "spicy",
  };

  // Map spawnMap key → button id (reverse of btnMap)
  const keyToBtn = {};
  for (const id in btnMap) keyToBtn[btnMap[id]] = id;

  function refreshInventoryBadges() {
    const inv = (window.PetStats && typeof window.PetStats.getInventory === 'function')
      ? window.PetStats.getInventory()
      : {};
    for (const id in btnMap) {
      const el = document.getElementById(id);
      if (!el) continue;
      const key = btnMap[id];
      const count = inv[key] || 0;
      // Store original label once
      if (!el.dataset.baseLabel) el.dataset.baseLabel = el.textContent;
      if (count > 0) {
        el.textContent = el.dataset.baseLabel + ' ×' + count;
        el.style.outline = '2px solid #22c55e';
      } else {
        el.textContent = el.dataset.baseLabel;
        el.style.outline = '';
      }
    }
  }

  for (const id in btnMap) {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", () => {
      const key = btnMap[id];
      // Use one from inventory if available
      if (window.PetStats && typeof window.PetStats.useInventory === 'function') {
        window.PetStats.useInventory(key);
      }
      spawnFood(key);
      refreshInventoryBadges();
    });
  }
  document.getElementById("clearFoods").onclick = clearFoods;

  // Register refresh hook for garden mode to call
  window._refreshFeedToolbar = refreshInventoryBadges;

  // Initial badge render
  refreshInventoryBadges();

  // ===========================================================
  // 🧹 CLEANUP
  // ===========================================================
  window._modeCleanup = function () {
    cancelAnimationFrame(rafId);
    listeners.forEach(([ev, fn]) => canvas.removeEventListener(ev, fn));
    window.removeEventListener("resize", resizeCanvas);
    if (bubble) bubble.style.display = "none";
    if (spawnButtons) spawnButtons.remove();
    window._refreshFeedToolbar = null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  window._modeName = "feed";
})();