// ===========================================================
// 🐾 pet_script.js — Impact sound on landing + submerged bounce
// - Triggers sound right at ground impact (before velocity flip)
// - Bounces even if starting a frame below ground
// - Pops/bounces when releasing drag underground
// ===========================================================
(function () {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const groundHeight = 100;
  let groundY = canvas.height - groundHeight;

  // === Images ===
  const imgs = {
    stand: new Image(),
    fall:  new Image(),
    fly0:  new Image(),
    fly1:  new Image(),
  };
  imgs.stand.src = 'base.png';
  imgs.fall.src  = 'base4.png';
  imgs.fly0.src  = 'base2.png';
  imgs.fly1.src  = 'base3.png';

  // === Pet ===
  const pet = {
    x: canvas.width / 2,
    y: canvas.height - 100 - 150, // ground(100) + half height(150)
    w: 300,
    h: 300,
    mood: 'normal',
    dragging: false,
    oldx: 0,
    oldy: 0,
  };
  pet.oldx = pet.x;
  pet.oldy = pet.y;

  // === Physics (Verlet-like) ===
  let vy = 0;                   // current vertical velocity (derived from prev positions)
  const gravity = 1.2;
  const damping = 0.985;
  const bouncePower = 25;       // upward velocity after bounce
  const MIN_IMPACT = 2.0;       // ignore micro bounces

  // === Fly animation ===
  let frame = 0, timer = 0, speed = 10;

  // === Sound (landing thud/whoosh at impact) ===
  const landSound = new Audio('fly.mp3'); // swap to 'land.mp3' if you have it
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
  window.addEventListener('mousedown', unlockAudio, { once: true });
  window.addEventListener('touchstart', unlockAudio, { once: true });

  // Cooldown to avoid double-fires
  let lastImpactTime = 0;
  const IMPACT_COOLDOWN_MS = 120;

  // === Optional stats UI (safe if not used) ===
  let statsEl = document.getElementById('stats');
  if (!statsEl) {
    statsEl = document.createElement('div');
    statsEl.id = 'stats';
    statsEl.innerHTML = `
      <div class="bar"><span id="hygiene-bar" style="width:100%"></span></div>
      <div class="bar"><span id="hunger-bar"  style="width:100%"></span></div>
      <div class="bar"><span id="energy-bar"  style="width:100%"></span></div>
    `;
    const ui = document.getElementById('ui');
    if (ui) ui.appendChild(statsEl);
  }

  // === Drag controls ===
  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
    return { x, y };
  }
  function startDrag(e) {
    const p = getPos(e);
    if (
      p.x > pet.x - pet.w/2 && p.x < pet.x + pet.w/2 &&
      p.y > pet.y - pet.h/2 && p.y < pet.y + pet.h/2
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
      // If released while underground, pop out with a small bounce
      if (pet.y + pet.h/2 > groundY) {
        pet.y = groundY - pet.h/2;
        vy = -Math.max(12, bouncePower * 0.6); // gentle bounce out
        // play a soft impact sound to match the pop
        const now = performance.now();
        if (audioUnlocked && (now - lastImpactTime) > IMPACT_COOLDOWN_MS) {
          try {
            landSound.volume = 0.5;
            landSound.currentTime = 0;
            landSound.play();
            lastImpactTime = now;
          } catch (_) {}
        }
      }
    }
    pet.dragging = false;
  }

  const listeners = [
    ['mousedown', startDrag],
    ['mousemove', moveDrag],
    ['mouseup',   endDrag],
    ['touchstart', startDrag],
    ['touchmove',  moveDrag],
    ['touchend',   endDrag],
  ];
  listeners.forEach(([ev, fn]) => canvas.addEventListener(ev, fn, { passive: false }));

  // === Resize ===
  function onResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    groundY = canvas.height - groundHeight;
    // If after resize we are underground, clamp to ground
    if (pet.y + pet.h/2 > groundY) {
      pet.y = groundY - pet.h/2;
      pet.oldy = pet.y;
    }
  }
  window.addEventListener('resize', onResize);

  // === Update with crossing & submerged detection ===
  function update() {
    if (!pet.dragging) {
      const vx = (pet.x - pet.oldx) * damping;
      vy = (pet.y - pet.oldy) * damping;

      // Save previous bottom edge BEFORE integration
      const prevBottom = pet.oldy + pet.h/2;

      // Integrate position
      pet.oldx = pet.x;
      pet.oldy = pet.y;
      pet.x += vx;

      // predict next y using current vy + gravity
      let vyNext = vy + gravity;
      let yNext = pet.y + vyNext;

      // Predicted next bottom edge
      const nextBottom = yNext + pet.h/2;

      // --- Ground tests ---
      const wasAbove = (prevBottom < groundY);
      const willBeBelow = (nextBottom >= groundY);
      const wasUnderground = (prevBottom >= groundY);
      const crossingGround = wasAbove && willBeBelow && (vyNext > 0);

      // If already inside the ground this frame, treat as an impact too
      const submergedImpact = wasUnderground && willBeBelow;

      if (crossingGround || submergedImpact) {
        // Place exactly on ground
        pet.y = groundY - pet.h/2;

        // Impact speed (ensure at least a small bounce if submerged)
        const impactSpeed = Math.max(vyNext, submergedImpact ? (MIN_IMPACT + 0.01) : vyNext);

        // 🔊 Play landing sound BEFORE flipping velocity
        const now = performance.now();
        if (audioUnlocked && impactSpeed > MIN_IMPACT && (now - lastImpactTime) > IMPACT_COOLDOWN_MS) {
          try {
            // Scale volume a bit with impact
            const vol = Math.min(0.2 + (impactSpeed / 30), 1.0);
            landSound.volume = Math.max(0, Math.min(vol, 1));
            landSound.currentTime = 0;
            landSound.play();
            lastImpactTime = now;
          } catch (_) {}
        }

        // Bounce out if impact is meaningful (or we were submerged)
        if (impactSpeed > MIN_IMPACT) {
          vy = -bouncePower;
        } else {
          vy = 0;
        }
      } else {
        // No collision this frame — commit predicted motion
        pet.y = yNext;

        // If we've ended up under ground due to numeric issues, clamp
        if (pet.y + pet.h/2 > groundY) {
          pet.y = groundY - pet.h/2;
          vy = 0;
        } else {
          // keep the computed next velocity
          vy = vyNext;
        }
      }
    }
  }

  // === Draw ===
  function drawGround() {
    ctx.fillStyle = '#5c4033';
    ctx.fillRect(0, groundY, canvas.width, groundHeight);
  }

  function drawPet() {
    let img = imgs.stand;
    if (pet.y + pet.h/2 < groundY) {
      if (vy > 5) {
        img = imgs.fall;
      } else {
        timer++;
        if (timer > speed) { timer = 0; frame = (frame + 1) % 2; }
        img = frame ? imgs.fly1 : imgs.fly0;
      }
    }
    ctx.drawImage(img, pet.x - pet.w/2, pet.y - pet.h/2, pet.w, pet.h);
  }

  // === Loop ===
  let raf = 0;
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    update();
    drawGround();
    drawPet();
    raf = requestAnimationFrame(loop);
  }
  loop();

  // === Cleanup for mode switch ===
  window._modeCleanup = function () {
    cancelAnimationFrame(raf);
    listeners.forEach(([ev, fn]) => canvas.removeEventListener(ev, fn));
    window.removeEventListener('resize', onResize);
  };
  window._modeName = 'normal';
})();