// ===========================================================
// 😴 pet_sleep.js — Sleep Mode (bed on left side + draggable blanket system)
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
  };

  imgs.stand.src = "base.png";
  imgs.fall.src = "base4.png";
  imgs.fly0.src = "base2.png";
  imgs.fly1.src = "base3.png";
  imgs.bed.src = "bed.png";
  imgs.bedSleep1.src = "bed_sleep1.png";
  imgs.bedSleep2.src = "bed_sleep2.png";
  imgs.blanket1.src = "blanket1.png";

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
    x: 400, // 🛏️ Left side
    y: canvas.height - 300,
    w: 400,
    h: 400,
    state: "normal", // "normal" | "preSleep" | "sleeping"
  };

  // === Blanket ===
  const blanket = {
    x: bed.x - 200,
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

  // === Helpers ===
  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
    return { x, y };
  }

  // === Drag Start ===
  function startDrag(e) {
    const p = getPos(e);

    // Pet drag start
    if (
      pet.visible &&
      p.x > pet.x - pet.w / 2 &&
      p.x < pet.x + pet.w / 2 &&
      p.y > pet.y - pet.h / 2 &&
      p.y < pet.y + pet.h / 2
    ) {
      pet.dragging = true;
      vx = 0;
      vy = 0;
      e.preventDefault();
    }

    // Blanket drag start
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

  // === Drag Move ===
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

  // === Drag End ===
  function endDrag() {
    // === PET DROP ===
    if (pet.dragging) {
      pet.dragging = false;
      pet.oldx = pet.x;
      pet.oldy = pet.y;

      const petBottom = pet.y + pet.h / 2;
      const bedTop = bed.y - bed.h / 2;
      const overlapX =
        Math.abs(pet.x - bed.x) < (pet.w / 2 + bed.w / 2) * 0.6;
      const overlapY = petBottom > bedTop && petBottom < bed.y + bed.h / 2;

      if (overlapX && overlapY) {
        bed.state = "preSleep"; // bed_sleep1
        blanket.visible = true;
        pet.visible = false;
        vy = 0;
        vx = 0;
      }
    }

    // === BLANKET DROP ===
    if (blanket.dragging) {
      blanket.dragging = false;

      const overlapX =
        Math.abs(blanket.x - bed.x) < (blanket.w / 2 + bed.w / 2) * 0.6;
      const overlapY =
        Math.abs(blanket.y - bed.y) < (blanket.h / 2 + bed.h / 2) * 0.6;

      if (overlapX && overlapY && bed.state === "preSleep") {
        blanket.visible = false;
        bed.state = "sleeping"; // bed_sleep2

        // 🕒 Block clicks briefly (prevent double-click)
        window._sleepClickBlocked = true;
        setTimeout(() => {
          window._sleepClickBlocked = false;
        }, 100); // 0.1s delay
      }
    }
  }

  // === Click to wake up ===
  canvas.addEventListener("click", (e) => {
    if (window._sleepClickBlocked) return; // 🚫 Ignore fast double clicks

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
      // 💤 Wake up logic
      bed.state = "normal"; // back to normal bed
      pet.visible = true;
      blanket.visible = true;

      // 🐾 Pet & 🧣 Blanket both appear at left side of bed


      // 🐾 Pet & 🧣 Blanket both appear at right side of bed
const rightOffset = 120; // adjust if needed

pet.x = bed.x + bed.w / 2 + pet.w / 2 + rightOffset;
pet.y = bed.y - bed.h / 2 - pet.h / 2;

blanket.x = bed.x + bed.w / 2 + blanket.w / 2 + rightOffset / 2;
blanket.y = bed.y - bed.h / 2 + 50; // slightly lower than pet

      vy = 0;
      vx = 0;
      pet.oldx = pet.x;
      pet.oldy = pet.y;
    }
  });

  // === Event Listeners ===
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

  // === Physics Update ===
  function update() {
    if (!pet.visible || bed.state !== "normal") return;

    if (!pet.dragging) {
      const nx = pet.x;
      const ny = pet.y;
      vx = (nx - pet.oldx) * damping;
      vy = (ny - pet.oldy) * damping;
      pet.oldx = nx;
      pet.oldy = ny;

      vy += gravity;
      pet.x += vx;
      pet.y += vy;

      // floor collision
      if (pet.y + pet.h / 2 >= groundY) {
        pet.y = groundY - pet.h / 2;
        if (Math.abs(vy) > MIN_IMPACT) vy = -vy * 0.25;
        else vy = 0;
      }
    }
  }

  // === Draw Helpers ===
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

  // === Main Loop ===
  let raf = 0;
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    update();
    drawBed();
    drawBlanket();
    drawPet();
    raf = requestAnimationFrame(loop);
  }
  loop();

  // === Cleanup ===
  window._modeCleanup = function () {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", onResize);
  };

  window._modeName = "sleep";
})();