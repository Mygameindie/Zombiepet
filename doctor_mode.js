// ===========================================================
// 🩺 DOCTOR MODE
// Pet shows sick face. Drag the medicine to heal them.
// Ported from Purelilypet (single-pet adaptation for Zombiepet)
// ===========================================================

(() => {
  if (typeof window._modeCleanup === 'function') {
    try { window._modeCleanup(); } catch (_) {}
  }
  window._modeName = 'doctor';

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

  const imgSet = {
    sick:   loadImg('base_sick.png'),
    healed: loadImg('base_healed.png'),
    normal: loadImg('base.png'),
  };

  function getImg(key) {
    const img = imgSet[key];
    if (img && !img._failed && img.complete && img.naturalWidth > 0) return img;
    if (imgSet.normal.complete && imgSet.normal.naturalWidth > 0) return imgSet.normal;
    return null;
  }

  // ==============================
  // Pet state
  // ==============================
  const PET_W = 400;
  const PET_H = 450;

  const pet = { phase: 'sick', healTimer: 0 };

  function petX() { return canvas.width * 0.5; }
  function petY() { return groundY - PET_H / 2; }

  // ==============================
  // Medicine (draggable)
  // ==============================
  const PILL_R = 36;

  const medicine = {
    x: canvas.width * 0.25,
    y: canvas.height * 0.25,
    dragging: false,
  };

  // ==============================
  // Drag logic
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
    const dx = p.x - medicine.x;
    const dy = p.y - medicine.y;
    if (Math.sqrt(dx * dx + dy * dy) <= PILL_R + 10) {
      medicine.dragging = true;
      offsetX = dx;
      offsetY = dy;
      e.preventDefault();
    }
  }

  function onMove(e) {
    if (!medicine.dragging) return;
    const p = getPtr(e);
    medicine.x = p.x - offsetX;
    medicine.y = p.y - offsetY;
    if (e.touches) e.preventDefault();
  }

  function onUp() {
    medicine.dragging = false;
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
  // Draw helpers
  // ==============================
  function drawGround() {
    ctx.fillStyle = '#5c4033';
    ctx.fillRect(0, groundY, canvas.width, groundHeight);
  }

  function drawPet() {
    let img;
    if (pet.phase === 'healed') {
      img = getImg('healed');
    } else if (pet.phase === 'sick') {
      img = getImg('sick');
    } else {
      img = getImg('normal');
    }
    if (!img) return;
    ctx.drawImage(img, petX() - PET_W / 2, petY() - PET_H / 2, PET_W, PET_H);
  }

  function drawMedicine() {
    const x = medicine.x;
    const y = medicine.y;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = 8;

    // Left half
    ctx.beginPath();
    ctx.arc(x - PILL_R * 0.4, y, PILL_R, Math.PI * 0.5, Math.PI * 1.5);
    ctx.fillStyle = '#ef4444';
    ctx.fill();

    // Right half
    ctx.beginPath();
    ctx.arc(x + PILL_R * 0.4, y, PILL_R, Math.PI * 1.5, Math.PI * 0.5);
    ctx.fillStyle = '#fafafa';
    ctx.fill();

    // Centre divider
    ctx.beginPath();
    ctx.moveTo(x, y - PILL_R);
    ctx.lineTo(x, y + PILL_R);
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Outline
    ctx.beginPath();
    ctx.roundRect(x - PILL_R - PILL_R * 0.4, y - PILL_R, (PILL_R + PILL_R * 0.4) * 2, PILL_R * 2, PILL_R);
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();

    ctx.save();
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#555';
    ctx.fillText('Medicine', x, y + PILL_R + 18);
    ctx.restore();
  }

  function drawHint() {
    const label = pet.phase === 'sick' ? '😷 Sick!' : pet.phase === 'healed' ? '💚 Healed!' : '';
    if (!label) return;
    ctx.save();
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = pet.phase === 'sick' ? '#ef4444' : '#22c55e';
    ctx.fillText(label, petX(), petY() - PET_H / 2 - 12);
    ctx.restore();
  }

  // ==============================
  // Overlap check: medicine → pet
  // ==============================
  const HEAL_RADIUS = 120;

  function checkHeal() {
    if (pet.phase !== 'sick') return;
    const dx = medicine.x - petX();
    const dy = medicine.y - petY();
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < HEAL_RADIUS) {
      pet.phase = 'healed';
      pet.healTimer = 120;
      if (window.PetStats && typeof window.PetStats.heal === 'function') {
        window.PetStats.heal(0);
      }
      medicine.x = canvas.width * 0.25;
      medicine.y = canvas.height * 0.25;
    }
  }

  // ==============================
  // Update
  // ==============================
  function update() {
    if (pet.phase === 'healed') {
      pet.healTimer--;
      if (pet.healTimer <= 0) {
        pet.phase = 'healthy';
      }
    }
    checkHeal();
  }

  // ==============================
  // Loop
  // ==============================
  let running = true;
  let raf = 0;

  function loop() {
    if (!running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    update();
    drawGround();
    drawPet();
    drawHint();
    drawMedicine();

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
