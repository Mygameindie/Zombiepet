// ===========================================================
// 😴 pet_sleep.js — Sleep Mode + Feed Buttons (food, duck, fish)
// ===========================================================
(function () {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // === Images ===
  const imgs = {
    stand: new Image(),
    fall: new Image(),
    fly0: new Image(),
    fly1: new Image(),
    bed: new Image(),
    bedSleep1: new Image(),
    bedSleep2: new Image(),
    blanket1: new Image(),
    duck: new Image(),
    fish: new Image(),
    food: new Image(),
  };

  imgs.stand.src = "base.png";
  imgs.fall.src = "base4.png";
  imgs.fly0.src = "base2.png";
  imgs.fly1.src = "base3.png";
  imgs.bed.src = "bed.png";
  imgs.bedSleep1.src = "bed_sleep1.png";
  imgs.bedSleep2.src = "bed_sleep2.png";
  imgs.blanket1.src = "blanket1.png";
  imgs.duck.src = "duck.png";
  imgs.fish.src = "food1.png";
  imgs.food.src = "food.png"; // optional generic food

  

  // === Pet ===
  const pet = {
    x: canvas.width / 2,
    y: canvas.height / 2 - 150,
    w: 300,
    h: 300,
    dragging: false,
    oldx: 0,
    oldy: 0,
    visible: true,
  };
  pet.oldx = pet.x;
  pet.oldy = pet.y;

  // === Bed ===
  const bed = {
    x: 650,
    y: canvas.height - 300,
    w: 400,
    h: 400,
    state: "normal",
  };

  // === Blanket ===
  const blanket = {
    x: bed.x - 40,
    y: bed.y - 100,
    w: 100,
    h: 100,
    visible: false,
    dragging: false,
  };

  // === Physics ===
  let vy = 0;
  let vx = 0;
  const gravity = 1.0;
  const damping = 0.94;
  const groundY = canvas.height - 100;
  const MIN_IMPACT = 1.5;

  // === Food items ===
  const foods = []; // {x, y, w, h, vy, type, eaten}
  function spawnFood(type = "food") {
    // 🦆🐟 custom sizes
const sizeMap = {
  food: { w: 80, h: 80 },
  duck: { w: 130, h: 130 },
  fish: { w: 130, h: 75 },
};
const { w, h } = sizeMap[type] || { w: 80, h: 80 };

    const f = {
      x: Math.random() * (canvas.width - 200) + 100,
      y: -50,
      w,
      h,
      vy: 0,
      type,
      eaten: false,
      soundPlayed: false,
    };
    foods.push(f);

    // play duck quack immediately when dropping
    if (type === "duck") {
      try {
        duckSound.currentTime = 0;
        duckSound.play();
      } catch (_) {}
    }
  }

  // === UI: Food Buttons ===
  const panel = document.createElement("div");
  panel.id = "food-panel";
  Object.assign(panel.style, {
    position: "fixed",
    right: "20px",
    bottom: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    zIndex: "9999",
    background: "rgba(255,255,255,0.3)",
    padding: "10px",
    borderRadius: "12px",
    backdropFilter: "blur(8px)",
    boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
  });
  document.body.appendChild(panel);

  function makeBtn(label, type) {
    const btn = document.createElement("button");
    btn.textContent = label;
    Object.assign(btn.style, {
      fontSize: "18px",
      padding: "6px 10px",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      background: "rgba(255,255,255,0.6)",
      boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
      transition: "0.2s",
    });
    btn.onmouseenter = () => (btn.style.background = "rgba(255,255,255,0.9)");
    btn.onmouseleave = () => (btn.style.background = "rgba(255,255,255,0.6)");
    btn.onclick = () => spawnFood(type);
    panel.appendChild(btn);
  }

  makeBtn("🦆 Duck", "duck");
  makeBtn("🐟 Fish", "fish");


  // === Helpers ===
  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
    return { x, y };
  }

  // === Drag Logic ===
  function startDrag(e) {
    const p = getPos(e);
    if (
      pet.visible &&
      p.x > pet.x - pet.w / 2 &&
      p.x < pet.x + pet.w / 2 &&
      p.y > pet.y - pet.h / 2 &&
      p.y < pet.y + pet.h / 2
    ) {
      pet.dragging = true;
      vx = vy = 0;
      e.preventDefault();
    }

    if (
      blanket.visible &&
      p.x > blanket.x - blanket.w / 2 &&
      p.x < blanket.x + blanket.w / 2 &&
      p.y > blanket.y - blanket.h / 2 &&
      p.y < blanket.y + blanket.h / 2
    ) {
      blanket.dragging = true;
      e.preventDefault();
    }
  }

  function moveDrag(e) {
    const p = getPos(e);
    if (pet.dragging) {
      pet.x = p.x;
      pet.y = p.y;
    } else if (blanket.dragging) {
      blanket.x = p.x;
      blanket.y = p.y;
    }
  }

  function endDrag() {
    if (pet.dragging) {
      pet.dragging = false;
      pet.oldx = pet.x;
      pet.oldy = pet.y;
      const petBottom = pet.y + pet.h / 2;
      const bedTop = bed.y - bed.h / 2;
      const overlapX = Math.abs(pet.x - bed.x) < (pet.w / 2 + bed.w / 2) * 0.6;
      const overlapY = petBottom > bedTop && petBottom < bed.y + bed.h / 2;
      if (overlapX && overlapY) {
        bed.state = "preSleep";
        blanket.visible = true;
        pet.visible = false;
        vx = vy = 0;
      }
    }

    if (blanket.dragging) {
      blanket.dragging = false;
      const overlapX = Math.abs(blanket.x - bed.x) < (blanket.w / 2 + bed.w / 2) * 0.6;
      const overlapY = Math.abs(blanket.y - bed.y) < (blanket.h / 2 + bed.h / 2) * 0.6;
      if (overlapX && overlapY && bed.state === "preSleep") {
        blanket.visible = false;
        bed.state = "sleeping";
        window._sleepClickBlocked = true;
        setTimeout(() => (window._sleepClickBlocked = false), 100);
      }
    }
  }

  // === Click to wake up ===
  canvas.addEventListener("click", (e) => {
    if (window._sleepClickBlocked) return;
    const p = getPos(e);
    const bedLeft = bed.x - bed.w / 2;
    const bedRight = bed.x + bed.w / 2;
    const bedTop = bed.y - bed.h / 2;
    const bedBottom = bed.y + bed.h / 2;

    if (
      bed.state === "sleeping" &&
      p.x > bedLeft &&
      p.x < bedRight &&
      p.y > bedTop &&
      p.y < bedBottom
    ) {
      bed.state = "normal";
      pet.visible = true;
      blanket.visible = true;
      pet.x = bed.x;
      pet.y = bed.y - bed.h / 2 - pet.h / 2;
      blanket.x = bed.x;
      blanket.y = bed.y - bed.h / 2 + 50;
      vx = vy = 0;
      pet.oldx = pet.x;
      pet.oldy = pet.y;
    }
  });

  // === Events ===
  canvas.addEventListener("mousedown", startDrag);
  canvas.addEventListener("mousemove", moveDrag);
  canvas.addEventListener("mouseup", endDrag);
  canvas.addEventListener("touchstart", startDrag);
  canvas.addEventListener("touchmove", moveDrag);
  canvas.addEventListener("touchend", endDrag);

  // === Resize ===
  function onResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    bed.y = canvas.height - 120;
  }
  window.addEventListener("resize", onResize);

  // === Update ===
  function update() {
    if (pet.visible && bed.state === "normal" && !pet.dragging) {
      const nx = pet.x;
      const ny = pet.y;
      vx = (nx - pet.oldx) * damping;
      vy = (ny - pet.oldy) * damping;
      pet.oldx = nx;
      pet.oldy = ny;
      vy += gravity;
      pet.x += vx;
      pet.y += vy;

      if (pet.y + pet.h / 2 >= groundY) {
        pet.y = groundY - pet.h / 2;
        if (Math.abs(vy) > MIN_IMPACT) vy = -vy * 0.25;
        else vy = 0;
      }
    }

    // Food motion
    for (const f of foods) {
      if (f.eaten) continue;
      f.vy += gravity * 0.5;
      f.y += f.vy;

      // 🦆 Quack when duck lands (only once)
      if (f.type === "duck" && !f.soundPlayed && f.vy > 0 && f.y + f.h / 2 >= groundY) {
        f.soundPlayed = true;
        try {
          duckSound.currentTime = 0;
          duckSound.play();
        } catch (_) {}
      }

      if (f.y + f.h / 2 >= groundY) {
        f.y = groundY - f.h / 2;
        f.vy = 0;
      }

      // 🍽️ Eat collision
      if (
        pet.visible &&
        Math.abs(pet.x - f.x) < (pet.w + f.w) / 2 - 40 &&
        Math.abs(pet.y - f.y) < (pet.h + f.h) / 2 - 40
      ) {
        f.eaten = true;
      }
    }
  }

  // === Draw ===
  function safeDraw(img, x, y, w, h) {
    if (!img || !img.complete || img.naturalWidth === 0) return;
    try {
      ctx.drawImage(img, x, y, w, h);
    } catch (_) {}
  }

  function drawBed() {
    let img = imgs.bed;
    if (bed.state === "preSleep") img = imgs.bedSleep1;
    else if (bed.state === "sleeping") img = imgs.bedSleep2;
    safeDraw(img, bed.x - bed.w / 2, bed.y - bed.h / 2, bed.w, bed.h);
  }

  function drawBlanket() {
    if (!blanket.visible) return;
    safeDraw(
      imgs.blanket1,
      blanket.x - blanket.w / 2,
      blanket.y - blanket.h / 2,
      blanket.w,
      blanket.h
    );
  }

  function drawPet() {
    if (!pet.visible) return;
    let img = imgs.stand;
    if (pet.dragging) img = imgs.fly0;
    else if (vy > 2) img = imgs.fall;
    safeDraw(img, pet.x - pet.w / 2, pet.y - pet.h / 2, pet.w, pet.h);
  }

  function drawFoods() {
    for (const f of foods) {
      if (f.eaten) continue;
      const img =
        f.type === "duck" ? imgs.duck : f.type === "fish" ? imgs.fish : imgs.food;
      safeDraw(img, f.x - f.w / 2, f.y - f.h / 2, f.w, f.h);
    }
  }

  // === Loop ===
  let raf = 0;
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    update();
    drawBed();
    drawBlanket();
    drawFoods();
    drawPet();
    raf = requestAnimationFrame(loop);
  }
  loop();

  // === Cleanup ===
  window._modeCleanup = function () {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", onResize);
    panel.remove();
  };

  window._modeName = "sleep";
})();