// pet_multi_feed.js — Centered + Gravity Version (Audio Pool Fixed)

(function () {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  resizeCanvas();

  const groundHeight = 100;
  let groundY = canvas.height - groundHeight;

  // === Sounds (pooled, reliable) ===
  const yumSoundSrc = 'yummy.mp3';
  const yuckSoundSrc = 'yuck.mp3';
  const bounceSoundSrc = 'bounce.mp3'; // optional

  // preload small sound pools
  const soundPool = {
    yum: [new Audio(yumSoundSrc), new Audio(yumSoundSrc), new Audio(yumSoundSrc)],
    yuck: [new Audio(yuckSoundSrc), new Audio(yuckSoundSrc), new Audio(yuckSoundSrc)],
    bounce: [new Audio(bounceSoundSrc), new Audio(bounceSoundSrc)]
  };
  let soundIndex = 0;

  function playSound(key) {
    const pool = soundPool[key];
    if (!pool) return;
    const s = pool[soundIndex % pool.length];
    try {
      s.pause();
      s.currentTime = 0;
      s.play().catch(() => {});
    } catch {}
    soundIndex++;
  }

  // === Pet Images ===
  const petImgs = {
    normal: new Image(),
    happy: new Image(),
    disgust: new Image(),
  };
  petImgs.normal.src = 'base.png';
  petImgs.happy.src = 'base_happy.png';
  petImgs.disgust.src = 'base_disgust.png';

  // === Pet (centered) ===
  const pet = { x: canvas.width / 2, y: canvas.height / 2, w: 180, h: 250, mood: 'normal' };

  // === Bubble ===
  let bubble = document.getElementById('bubble');
  if (!bubble) {
    bubble = document.createElement('div');
    bubble.id = 'bubble';
    bubble.style.position = 'absolute';
    bubble.style.transform = 'translate(-50%, -100%)';
    bubble.style.background = 'rgba(255,255,255,0.95)';
    bubble.style.borderRadius = '10px';
    bubble.style.padding = '6px 10px';
    bubble.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    bubble.style.pointerEvents = 'none';
    bubble.style.fontSize = '14px';
    bubble.style.display = 'none';
    document.body.appendChild(bubble);
  }
  function showBubble(text) {
    bubble.style.left = pet.x + 'px';
    bubble.style.top = pet.y - pet.h / 2 - 40 + 'px';
    bubble.textContent = text;
    bubble.style.display = 'block';
    clearTimeout(showBubble._t);
    showBubble._t = setTimeout(() => (bubble.style.display = 'none'), 1200);
  }

  // === Foods ===
  const foods = [
    { name: 'Fish', imgSrc: 'food1.png', liked: true,  x: 300, y: canvas.height / 2 + 180, w: 100, h: 100 },
    { name: 'candy', imgSrc: 'food2.png', liked: false, x: 520, y: canvas.height / 2 + 180, w: 100, h: 100 },
  ];
  foods.forEach(f => {
    f.img = new Image();
    f.img.src = f.imgSrc;
    f.drag = false;
    f.visible = true;
    f.justSpawned = true;
    f.vy = 0;
    f.origX = f.x;
    f.origY = f.y;
    setTimeout(() => (f.justSpawned = false), 800);
  });

  // === Drag System ===
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

      // quick rectangle check first (fast reject)
      if (
        p.x > f.x - f.w / 2 &&
        p.x < f.x + f.w / 2 &&
        p.y > f.y - f.h / 2 &&
        p.y < f.y + f.h / 2
      ) {
        // fine-grained alpha check
        const img = f.img;
        if (img && img.complete && img.naturalWidth > 0) {
          // Create an offscreen canvas to test pixel alpha
          const testCanvas = document.createElement('canvas');
          testCanvas.width = f.w;
          testCanvas.height = f.h;
          const testCtx = testCanvas.getContext('2d');
          testCtx.drawImage(img, 0, 0, f.w, f.h);
          const pixel = testCtx.getImageData(
            Math.floor((p.x - (f.x - f.w / 2))),
            Math.floor((p.y - (f.y - f.h / 2))),
            1, 1
          ).data;

          // alpha channel test (pixel[3] > 20 means visible)
          if (pixel[3] < 20) continue;
        }

        activeFood = f;
        f.drag = true;
        f.vy = 0;
        hasMoved = false;
        f.offsetX = 0;
        f.offsetY = 0;
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
    if (activeFood && hasMoved) {
      checkCollision(activeFood);
    }
    if (activeFood) activeFood.drag = false;
    activeFood = null;
  }

  const listeners = [
    ['mousedown', down],
    ['mousemove', move],
    ['mouseup', up],
    ['touchstart', down],
    ['touchmove', move],
    ['touchend', up],
  ];
  listeners.forEach(([ev, fn]) => canvas.addEventListener(ev, fn, { passive: false }));

  // === Collision ===
  function checkCollision(f) {
    if (!f.visible || f.justSpawned) return;

    const dx = Math.abs(f.x - pet.x);
    const dy = Math.abs(f.y - pet.y);
    const hit = dx < (f.w / 2 + pet.w / 2) && dy < (f.h / 2 + pet.h / 2);

    if (hit) {
      pet.mood = f.liked ? 'happy' : 'disgust';
      showBubble(f.liked ? 'Yummy!' : 'Yuck!');
      playSound(f.liked ? 'yum' : 'yuck');
      setTimeout(() => (pet.mood = 'normal'), 1000);
      f.visible = false;

      // === Respawn back at original position
      setTimeout(() => {
        f.visible = true;
        f.x = f.origX;
        f.y = f.origY;
        f.vy = 0;
        f.justSpawned = true;
        setTimeout(() => (f.justSpawned = false), 500);
      }, 3000);
    }
  }

  // === Simple Gravity ===
  const gravity = 0.6;
  const bounce = 0.4;
  let floorY = canvas.height / 2 + 200;

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
        // Uncomment if you have a bounce sound:
        // playSound('bounce');
      }
    }
  }

  // === Draw ===
  function ground() {
    ctx.fillStyle = '#5c4033';
    ctx.fillRect(0, groundY, canvas.width, groundHeight);
  }

  function drawPet() {
    const img = petImgs[pet.mood];
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, pet.x - pet.w / 2, pet.y - pet.h / 2, pet.w, pet.h);
    } else {
      ctx.fillStyle = '#ffe5b4';
      ctx.fillRect(pet.x - pet.w / 2, pet.y - pet.h / 2, pet.w, pet.h);
      ctx.fillStyle = '#333';
      ctx.fillText('Pet', pet.x - 20, pet.y + 5);
    }
  }

   function drawFoods() {
    for (const f of foods) {
      if (!f.visible) continue;
      const img = f.img;
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, f.x - f.w / 2, f.y - f.h / 2, f.w, f.h);
      } else {
        ctx.fillStyle = f.liked ? '#8bc34a' : '#ff7043';
        ctx.fillRect(f.x - f.w / 2, f.y - f.h / 2, f.w, f.h); // 🔹 square instead of circle
		// for top-centered drawing
const foodLeft = f.x - f.w / 2;
const foodRight = f.x + f.w / 2;
const foodTop = f.y;          // top edge
const foodBottom = f.y + f.h; // bottom edge
      }
    }
  }



    // === Main Loop ===
   // === Main Loop ===
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ground();
    drawPet();
    applyGravity();
    drawFoods();
    requestAnimationFrame(loop);
  }
  loop();

  // === Resize ===
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', () => {
    resizeCanvas();
    groundY = canvas.height - groundHeight;
    pet.y = groundY - 250;
    foods.forEach(f => (f.y = groundY - 100));
  });

  // === Cleanup ===
  window._modeCleanup = function () {
    listeners.forEach(([ev, fn]) => canvas.removeEventListener(ev, fn));
    window.removeEventListener('resize', resizeCanvas);
    if (bubble) bubble.style.display = 'none';
  };
  window._modeName = 'feed';
})();