// ===========================================================
// 🛝 PLAYGROUND MODE
// Pet auto-walks and bounces. Drag the ball to kick it at them!
// Ported from Purelilypet (single-pet adaptation for Zombiepet)
// ===========================================================

(() => {
  if (typeof window._modeCleanup === 'function') {
    try { window._modeCleanup(); } catch (_) {}
  }
  window._modeName = 'playground';

  if (window.SoundManager) window.SoundManager.stopAll();

  // ==============================
  // Canvas
  // ==============================
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();

  const groundHeight = 100;
  let groundY = canvas.height - groundHeight;

  // ==============================
  // Images
  // ==============================
  function loadImg(src) {
    const img = new Image();
    img._failed = false;
    img.onerror = () => { img._failed = true; };
    img.src = src;
    return img;
  }

  const baseSet = {
    stand: loadImg('base.png'),
    fly0:  loadImg('base2.png'),
    fly1:  loadImg('base3.png'),
    fall:  loadImg('base4.png'),
  };

  function safeDraw(img, x, y, w, h) {
    if (!img || img._failed || !img.complete || img.naturalWidth === 0) return;
    ctx.drawImage(img, x, y, w, h);
  }

  // ==============================
  // Pet state
  // ==============================
  const PET_W = 300;
  const PET_H = 350;
  const gravity = 1.2;

  const pet = {
    x: canvas.width * 0.5,
    y: 0,
    vx: 0,
    vy: 0,
    dir: 1,
    onGround: true,
    dragging: false,
    lastX: 0,
    lastY: 0,
    frame: 0,
    frameTimer: 0,
    jumpCooldown: 0,
  };
  pet.y = groundY - PET_H / 2;

  // ==============================
  // Ball
  // ==============================
  const BALL_R = 28;
  const ball = {
    x: canvas.width * 0.25,
    y: canvas.height * 0.3,
    vx: 0,
    vy: 0,
    dragging: false,
    lastX: 0,
    lastY: 0,
  };

  // ==============================
  // Drag
  // ==============================
  let offsetX = 0, offsetY = 0;

  function getPtr(e) {
    const r = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: cx - r.left, y: cy - r.top };
  }

  function onDown(e) {
    const p = getPtr(e);

    // Check pet first
    if (
      p.x >= pet.x - PET_W / 2 &&
      p.x <= pet.x + PET_W / 2 &&
      p.y >= pet.y - PET_H / 2 &&
      p.y <= pet.y + PET_H / 2
    ) {
      pet.dragging = true;
      pet.vx = 0;
      pet.vy = 0;
      pet.onGround = false;
      offsetX = p.x - pet.x;
      offsetY = p.y - pet.y;
      pet.lastX = p.x;
      pet.lastY = p.y;
      e.preventDefault();
      return;
    }

    // Check ball
    const dx = p.x - ball.x;
    const dy = p.y - ball.y;
    if (Math.sqrt(dx * dx + dy * dy) <= BALL_R + 12) {
      ball.dragging = true;
      ball.vx = 0;
      ball.vy = 0;
      offsetX = dx;
      offsetY = dy;
      ball.lastX = p.x;
      ball.lastY = p.y;
      e.preventDefault();
    }
  }

  function onMove(e) {
    const p = getPtr(e);
    if (pet.dragging) {
      pet.lastX = pet.x;
      pet.lastY = pet.y;
      pet.x = p.x - offsetX;
      pet.y = p.y - offsetY;
      // Update facing direction while dragging
      if (pet.x - pet.lastX < 0) pet.dir = -1;
      else if (pet.x - pet.lastX > 0) pet.dir = 1;
      if (e.touches) e.preventDefault();
      return;
    }
    if (!ball.dragging) return;
    ball.lastX = ball.x;
    ball.lastY = ball.y;
    ball.x = p.x - offsetX;
    ball.y = p.y - offsetY;
    if (e.touches) e.preventDefault();
  }

  function onUp() {
    if (pet.dragging) {
      pet.dragging = false;
      pet.vx = (pet.x - pet.lastX) * 1.4;
      pet.vy = (pet.y - pet.lastY) * 1.4;
      return;
    }
    if (!ball.dragging) return;
    ball.dragging = false;
    ball.vx = (ball.x - ball.lastX) * 1.4;
    ball.vy = (ball.y - ball.lastY) * 1.4;
  }

  canvas.addEventListener('mousedown', onDown);
  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('mouseup', onUp);
  canvas.addEventListener('touchstart', onDown, { passive: false });
  canvas.addEventListener('touchmove', onMove, { passive: false });
  canvas.addEventListener('touchend', onUp);

  // ==============================
  // Resize
  // ==============================
  function onResize() {
    resizeCanvas();
    groundY = canvas.height - groundHeight;
  }
  window.addEventListener('resize', onResize);

  // ==============================
  // Physics update
  // ==============================
  function updateBall() {
    if (ball.dragging) return;

    ball.vy += gravity;
    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.y + BALL_R >= groundY) {
      ball.y = groundY - BALL_R;
      ball.vy *= -0.55;
      ball.vx *= 0.85;
      if (Math.abs(ball.vy) < 1.5) ball.vy = 0;
    }

    if (ball.x - BALL_R < 0) { ball.x = BALL_R; ball.vx = Math.abs(ball.vx) * 0.7; }
    if (ball.x + BALL_R > canvas.width) { ball.x = canvas.width - BALL_R; ball.vx = -Math.abs(ball.vx) * 0.7; }
  }

  function updatePet() {
    if (pet.dragging) return;

    if (pet.jumpCooldown > 0) pet.jumpCooldown--;

    // Apply velocity and gravity
    pet.vy += gravity;
    pet.x += pet.vx;
    pet.y += pet.vy;

    // Ground bounce
    if (pet.y + PET_H / 2 >= groundY) {
      pet.y = groundY - PET_H / 2;
      pet.vy *= -0.45;
      pet.vx *= 0.85;
      if (Math.abs(pet.vy) < 2) { pet.vy = 0; pet.onGround = true; }
      else pet.onGround = false;
    } else {
      pet.onGround = false;
    }

    // Wall bounce
    if (pet.x - PET_W / 2 < 0) {
      pet.x = PET_W / 2;
      pet.vx = Math.abs(pet.vx) * 0.7;
      pet.dir = 1;
    }
    if (pet.x + PET_W / 2 > canvas.width) {
      pet.x = canvas.width - PET_W / 2;
      pet.vx = -Math.abs(pet.vx) * 0.7;
      pet.dir = -1;
    }

    // Ceiling bounce
    if (pet.y - PET_H / 2 < 0) {
      pet.y = PET_H / 2;
      pet.vy = Math.abs(pet.vy) * 0.6;
    }

    // Ball collision → bounce pet
    const dx = ball.x - pet.x;
    const dy = ball.y - (pet.y - PET_H * 0.15);
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < BALL_R + 80 && pet.onGround && pet.jumpCooldown === 0) {
      pet.vy = -18;
      pet.onGround = false;
      pet.jumpCooldown = 60;
      ball.vx = dx > 0 ? Math.abs(ball.vx) + 4 : -(Math.abs(ball.vx) + 4);
      ball.vy = -10;
      if (window.PetStats && typeof window.PetStats.playground === 'function') {
        window.PetStats.playground(0);
      }
    }

    // Animate frames
    pet.frameTimer++;
    if (pet.frameTimer > 8) {
      pet.frameTimer = 0;
      pet.frame = (pet.frame + 1) % 2;
    }
  }

  // ==============================
  // Draw
  // ==============================
  function drawGround() {
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(0, groundY, canvas.width, 14);
    ctx.fillStyle = '#5c4033';
    ctx.fillRect(0, groundY + 14, canvas.width, groundHeight - 14);
  }

  function drawBall() {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(ball.x, groundY + 6, Math.max(8, BALL_R - Math.max(0, groundY - ball.y - BALL_R) * 0.3), 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fill();

    const grad = ctx.createRadialGradient(ball.x - BALL_R * 0.3, ball.y - BALL_R * 0.3, BALL_R * 0.1, ball.x, ball.y, BALL_R);
    grad.addColorStop(0, '#fde68a');
    grad.addColorStop(0.5, '#f59e0b');
    grad.addColorStop(1, '#b45309');
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_R, -0.4, 0.4);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
  }

  function getPetState() {
    if (!pet.onGround) {
      return pet.vy > 5 ? 'fall' : (pet.frame === 0 ? 'fly0' : 'fly1');
    }
    return 'stand';
  }

  function drawPet() {
    const state = getPetState();
    const img = baseSet[state];

    ctx.save();
    if (pet.dir === -1) {
      ctx.translate(pet.x, 0);
      ctx.scale(-1, 1);
      safeDraw(img, -PET_W / 2, pet.y - PET_H / 2, PET_W, PET_H);
    } else {
      safeDraw(img, pet.x - PET_W / 2, pet.y - PET_H / 2, PET_W, PET_H);
    }
    ctx.restore();
  }

  // ==============================
  // Loop
  // ==============================
  let running = true;
  let raf = 0;

  function loop() {
    if (!running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    updateBall();
    updatePet();

    drawGround();
    drawBall();
    drawPet();

    raf = requestAnimationFrame(loop);
  }

  loop();

  // ==============================
  // Cleanup
  // ==============================
  window._modeCleanup = function () {
    running = false;
    cancelAnimationFrame(raf);
    canvas.removeEventListener('mousedown', onDown);
    canvas.removeEventListener('mousemove', onMove);
    canvas.removeEventListener('mouseup', onUp);
    canvas.removeEventListener('touchstart', onDown);
    canvas.removeEventListener('touchmove', onMove);
    canvas.removeEventListener('touchend', onUp);
    window.removeEventListener('resize', onResize);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

})();
