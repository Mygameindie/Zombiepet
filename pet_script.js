// ===========================================================
// 🐾 pet_script.js — MAIN NORMAL MODE (FULL + SIZE SUPPORT)
// ===========================================================
(function () {

  // 🔌 allow external pose override (sit, sleep, etc.)
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

  // =========================================================
  // FLY ANIMATION
  // =========================================================
  let frame = 0;
  let timer = 0;
  const speed = 10;

  // =========================================================
  // SOUND
  // =========================================================
  const landSound = new Audio("fly.mp3");
  landSound.volume = 0.6;

  let audioUnlocked = false;
  function unlockAudio() {
    if (audioUnlocked) return;
    landSound.play().then(() => {
      landSound.pause();
      landSound.currentTime = 0;
      audioUnlocked = true;
    }).catch(() => {});
  }

  window.addEventListener("mousedown", unlockAudio, { once: true });
  window.addEventListener("touchstart", unlockAudio, { once: true });

  let onGround = false;

  // =========================================================
  // DRAG CONTROLS
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
    if (pet.dragging) {
      pet.oldx = pet.x;
      pet.oldy = pet.y;

      if (pet.y + pet.h / 2 > groundY) {
        pet.y = groundY - pet.h / 2;
        vy = -Math.max(12, bouncePower * 0.6);
        playImpactSound(0.5);
      }
    }
    pet.dragging = false;
  }

  const listeners = [
    ["mousedown", startDrag],
    ["mousemove", moveDrag],
    ["mouseup", endDrag],
    ["touchstart", startDrag],
    ["touchmove", moveDrag],
    ["touchend", endDrag],
  ];

  listeners.forEach(([ev, fn]) =>
    canvas.addEventListener(ev, fn, { passive: false })
  );

  // =========================================================
  // RESIZE
  // =========================================================
  function onResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    groundY = canvas.height - groundHeight;

    if (pet.y + pet.h / 2 > groundY) {
      pet.y = groundY - pet.h / 2;
      pet.oldy = pet.y;
    }
  }

  window.addEventListener("resize", onResize);

  function playImpactSound(volume = 0.6) {
    if (!audioUnlocked) return;
    try {
      landSound.volume = volume;
      landSound.currentTime = 0;
      landSound.play().catch(() => {});
    } catch {}
  }

  // =========================================================
  // UPDATE
  // =========================================================
  function update() {
    if (!pet.dragging) {
      const vx = (pet.x - pet.oldx) * damping;
      vy = (pet.y - pet.oldy) * damping;

      const prevBottom = pet.oldy + pet.h / 2;

      pet.oldx = pet.x;
      pet.oldy = pet.y;
      pet.x += vx;

      let vyNext = vy + gravity;
      let yNext = pet.y + vyNext;

      const nextBottom = yNext + pet.h / 2;
      const wasAbove = prevBottom < groundY;
      const willBeBelow = nextBottom >= groundY;
      const crossingGround = wasAbove && willBeBelow && vyNext > 0;

      if (crossingGround) {
        pet.y = groundY - pet.h / 2;

        if (vyNext > MIN_IMPACT) {
          vy = -bouncePower;
          if (!onGround) {
            playImpactSound(Math.min(0.2 + vyNext / 30, 1));
          }
        } else {
          vy = 0;
        }
        onGround = true;
      } else {
        pet.y = yNext;
        if (pet.y + pet.h / 2 > groundY) {
          pet.y = groundY - pet.h / 2;
          vy = 0;
          onGround = true;
        } else {
          vy = vyNext;
          onGround = false;
        }
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

    // 🔌 POSE OVERRIDE (SUPPORT Image OR {img,w,h})
    if (typeof window.PET_POSE_OVERRIDE === "function") {
      const pose = window.PET_POSE_OVERRIDE();

      // case 1: object with size
      if (pose && pose.img) {
        const w = pose.w ?? pet.w;
        const h = pose.h ?? pet.h;

        ctx.drawImage(
          pose.img,
          pet.x - w / 2,
          pet.y - h / 2,
          w,
          h
        );
        return;
      }

      // case 2: plain Image (backward compatible)
      if (pose instanceof HTMLImageElement) {
        ctx.drawImage(
          pose,
          pet.x - pet.w / 2,
          pet.y - pet.h / 2,
          pet.w,
          pet.h
        );
        return;
      }
    }

    // ===== NORMAL BASE DRAW =====
    let img = imgs.stand;

    if (pet.y + pet.h / 2 < groundY) {
      if (vy > 5) {
        img = imgs.fall;
      } else {
        timer++;
        if (timer > speed) {
          timer = 0;
          frame = (frame + 1) % 2;
        }
        img = frame ? imgs.fly1 : imgs.fly0;
      }
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
  let raf = 0;
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    update();
    drawGround();
    drawPet();
    raf = requestAnimationFrame(loop);
  }
  loop();

  // =========================================================
  // CLEANUP (MODE SWITCH)
  // =========================================================
  window._modeCleanup = function () {
    cancelAnimationFrame(raf);
    listeners.forEach(([ev, fn]) =>
      canvas.removeEventListener(ev, fn)
    );
    window.removeEventListener("resize", onResize);
    window.PET_POSE_OVERRIDE = null;
  };

  // =========================================================
  // MODE STATE + SIGNAL
  // =========================================================
  window._modeName = "normal";
  window.dispatchEvent(new Event("pet:mode:normal"));

})();