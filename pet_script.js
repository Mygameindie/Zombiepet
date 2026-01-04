// ===========================================================
// 🐾 pet_script.js — MAIN NORMAL MODE (FINAL + POSE SIZE SUPPORT)
// ===========================================================
(function () {

  // 🔌 allow external pose override (sit, etc.)
  window.PET_POSE_OVERRIDE = null;

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const groundHeight = 100;
  let groundY = canvas.height - groundHeight;

  // =========================================================
  // IMAGES
  // =========================================================
  const imgs = {
    stand: new Image(),
    fall: new Image(),
    fly0: new Image(),
    fly1: new Image(),
  };

  imgs.stand.src = "base.png";
  imgs.fall.src  = "base4.png";
  imgs.fly0.src  = "base2.png";
  imgs.fly1.src  = "base3.png";

  // =========================================================
  // PET STATE
  // =========================================================
  const pet = {
    x: canvas.width / 2,
    y: canvas.height - groundHeight - 150,
    w: 300,
    h: 300,
    dragging: false,
    oldx: 0,
    oldy: 0,
  };

  pet.oldx = pet.x;
  pet.oldy = pet.y;

  // =========================================================
  // PHYSICS
  // =========================================================
  let vy = 0;
  const gravity = 1.2;
  const damping = 0.985;
  const bouncePower = 25;
  const MIN_IMPACT = 2.0;

  let frame = 0;
  let timer = 0;
  const speed = 10;
  let onGround = false;

  // =========================================================
  // DRAG
  // =========================================================
  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
    return { x, y };
  }

  function startDrag(e) {
    const p = getPos(e);
    if (
      p.x > pet.x - pet.w / 2 &&
      p.x < pet.x + pet.w / 2 &&
      p.y > pet.y - pet.h / 2 &&
      p.y < pet.y + pet.h / 2
    ) {
      pet.dragging = true;
      e.preventDefault();
    }
  }

  function moveDrag(e) {
    if (!pet.dragging) return;
    const p = getPos(e);
    pet.x = p.x;
    pet.y = p.y;
    if (e.touches) e.preventDefault();
  }

  function endDrag() {
    pet.dragging = false;
  }

  ["mousedown","mousemove","mouseup","touchstart","touchmove","touchend"]
    .forEach(ev => canvas.addEventListener(ev,
      ev.includes("move") ? moveDrag :
      ev.includes("down") ? startDrag : endDrag,
      { passive:false }
    ));

  // =========================================================
  // UPDATE
  // =========================================================
  function update() {
    if (!pet.dragging) {
      const vx = (pet.x - pet.oldx) * damping;
      vy = (pet.y - pet.oldy) * damping;

      pet.oldx = pet.x;
      pet.oldy = pet.y;

      pet.x += vx;
      vy += gravity;
      pet.y += vy;

      if (pet.y + pet.h / 2 > groundY) {
        pet.y = groundY - pet.h / 2;
        vy = 0;
        onGround = true;
      } else {
        onGround = false;
      }
    }
  }

  // =========================================================
  // DRAW
  // =========================================================
  function drawGround() {
    ctx.fillStyle = "#5c4033";
    ctx.fillRect(0, groundY, canvas.width, groundHeight);
  }

  function drawPet() {

    // 🔌 POSE OVERRIDE (sit, etc.)
    if (window.PET_POSE_OVERRIDE) {
      const img = window.PET_POSE_OVERRIDE();
      if (img) {
        const w = img._forceWidth  || pet.w;
        const h = img._forceHeight || pet.h;

        ctx.drawImage(
          img,
          pet.x - w / 2,
          pet.y - h / 2,
          w,
          h
        );
        return;
      }
    }

    let img = imgs.stand;

    if (pet.y + pet.h / 2 < groundY) {
      timer++;
      if (timer > speed) {
        timer = 0;
        frame = (frame + 1) % 2;
      }
      img = frame ? imgs.fly1 : imgs.fly0;
    }

    ctx.drawImage(
      img,
      pet.x - pet.w / 2,
      pet.y - pet.h / 2,
      pet.w,
      pet.h
    );
  }

  // =========================================================
  // LOOP
  // =========================================================
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    update();
    drawGround();
    drawPet();
    requestAnimationFrame(loop);
  }
  loop();

  // 🔔 notify plus scripts
  window.dispatchEvent(new Event("pet:mode:normal"));

})();