// ===========================================================
// 🌾 pet_farm.js — Farm Mode (Zombiepet)
// Pond: fish spawn every 2s, click to collect → fish inventory
// Duck pen: ducks spawn every 2s, click to collect → duck inventory
// ===========================================================

(() => {
  if (typeof window._modeCleanup === 'function') {
    try { window._modeCleanup(); } catch (_) {}
  }
  window._modeName = 'farm';

  if (window.SoundManager) window.SoundManager.stopAll();

  // ==============================
  // Canvas
  // ==============================
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // ==============================
  // Images
  // ==============================
  function createImg(src) {
    const img = new Image();
    img._failed = false;
    img.onerror = () => { img._failed = true; };
    img.src = src;
    return img;
  }

  const petImg   = createImg('base.png');
  const fishImg  = createImg('food1.png');
  const duckImg  = createImg('duck.png');

  // ==============================
  // Layout regions
  // ==============================
  function getPond() {
    return {
      cx: canvas.width * 0.25,
      cy: canvas.height * 0.62,
      rx: Math.min(canvas.width * 0.2, 160),
      ry: Math.min(canvas.height * 0.18, 130),
    };
  }

  function getPen() {
    const margin = 20;
    const x = canvas.width * 0.54;
    const y = canvas.height * 0.42;
    const w = Math.min(canvas.width * 0.38, 340);
    const h = Math.min(canvas.height * 0.42, 310);
    return { x, y, w, h };
  }

  // ==============================
  // Animals
  // ==============================
  const MAX_FISH  = 8;
  const MAX_DUCKS = 8;
  let fishes = [];
  let ducks  = [];

  function randomInEllipse(cx, cy, rx, ry) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * 0.82;
    return { x: cx + Math.cos(angle) * rx * r, y: cy + Math.sin(angle) * ry * r };
  }

  function randomInRect(pen) {
    const pad = 30;
    return {
      x: pen.x + pad + Math.random() * (pen.w - pad * 2),
      y: pen.y + pad + Math.random() * (pen.h - pad * 2),
    };
  }

  function spawnFish() {
    if (fishes.length >= MAX_FISH) return;
    const pond = getPond();
    const pos = randomInEllipse(pond.cx, pond.cy, pond.rx, pond.ry);
    fishes.push({
      x: pos.x, y: pos.y,
      phase: Math.random() * Math.PI * 2,
      dir: Math.random() > 0.5 ? 1 : -1,
      scale: 0,
    });
  }

  function spawnDuck() {
    if (ducks.length >= MAX_DUCKS) return;
    const pen = getPen();
    const pos = randomInRect(pen);
    ducks.push({
      x: pos.x, y: pos.y,
      phase: Math.random() * Math.PI * 2,
      dir: Math.random() > 0.5 ? 1 : -1,
      scale: 0,
      walkX: (Math.random() - 0.5) * 0.6,
    });
  }

  // Initial population
  for (let i = 0; i < 2; i++) { spawnFish(); spawnDuck(); }

  // Spawn interval
  const spawnInterval = setInterval(() => {
    spawnFish();
    spawnDuck();
  }, 2000);

  // ==============================
  // Bag DOM
  // ==============================
  let bagEl = null;

  function buildBag() {
    bagEl = document.createElement('div');
    bagEl.id = 'farm-bag';
    bagEl.className = 'mode-ui';
    Object.assign(bagEl.style, {
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(255,255,255,0.93)',
      borderRadius: '12px',
      padding: '6px 12px',
      fontSize: '15px',
      zIndex: '9999',
      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2px',
      minWidth: '60px',
      transition: 'transform 0.15s',
    });
    const countEl = document.createElement('span');
    countEl.id = 'farm-bag-count';
    bagEl.appendChild(countEl);
    const hintEl = document.createElement('span');
    hintEl.textContent = '→ Feed Mode';
    Object.assign(hintEl.style, { fontSize: '11px', color: '#6b7280' });
    bagEl.appendChild(hintEl);
    document.body.appendChild(bagEl);
    updateBagUI();
  }

  function getInvTotal() {
    if (!window.PetStats) return 0;
    const inv = window.PetStats.getInventory();
    return (inv.fish || 0) + (inv.duck || 0);
  }

  function updateBagUI() {
    if (!window.PetStats) return;
    const inv = window.PetStats.getInventory();
    const el = document.getElementById('farm-bag-count');
    if (el) el.textContent = `🐟×${inv.fish||0}  🦆×${inv.duck||0}`;
  }

  // ==============================
  // Fly-to-bag animation
  // ==============================
  function flyToBag(screenX, screenY, key) {
    const emoji = key === 'fish' ? '🐟' : '🦆';
    const el = document.createElement('div');
    el.textContent = emoji;
    Object.assign(el.style, {
      position: 'fixed',
      fontSize: '28px',
      left: screenX + 'px',
      top: screenY + 'px',
      zIndex: '99999',
      pointerEvents: 'none',
      transition: 'none',
    });
    document.body.appendChild(el);

    const bagRect = bagEl
      ? bagEl.getBoundingClientRect()
      : { left: window.innerWidth - 80, top: 10, width: 60, height: 30 };
    const tx = bagRect.left + bagRect.width / 2;
    const ty = bagRect.top + bagRect.height / 2;

    requestAnimationFrame(() => {
      Object.assign(el.style, {
        transition: 'left 0.45s ease-in, top 0.45s ease-in, opacity 0.45s, font-size 0.45s',
        left: tx + 'px',
        top: ty + 'px',
        opacity: '0',
        fontSize: '14px',
      });
      setTimeout(() => {
        el.remove();
        if (window.PetStats) window.PetStats.addInventory(key, 1);
        updateBagUI();
        if (typeof window._refreshFeedToolbar === 'function') window._refreshFeedToolbar();
        if (bagEl) {
          bagEl.style.transform = 'scale(1.3)';
          setTimeout(() => { if (bagEl) bagEl.style.transform = ''; }, 160);
        }
      }, 460);
    });
  }

  // ==============================
  // Input
  // ==============================
  function getPtr(e) {
    const r = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return {
      x: src.clientX - r.left,
      y: src.clientY - r.top,
      screenX: src.clientX,
      screenY: src.clientY,
    };
  }

  function dist2(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  function onDown(e) {
    const p = getPtr(e);
    const HIT = 38;

    // Check fish first
    for (let i = fishes.length - 1; i >= 0; i--) {
      if (dist2(p, fishes[i]) < HIT) {
        const f = fishes[i];
        fishes.splice(i, 1);
        flyToBag(p.screenX, p.screenY, 'fish');
        e.preventDefault();
        return;
      }
    }

    // Check ducks
    for (let i = ducks.length - 1; i >= 0; i--) {
      if (dist2(p, ducks[i]) < HIT) {
        ducks.splice(i, 1);
        flyToBag(p.screenX, p.screenY, 'duck');
        e.preventDefault();
        return;
      }
    }

    e.preventDefault();
  }

  canvas.addEventListener('mousedown', onDown, { passive: false });
  canvas.addEventListener('touchstart', onDown, { passive: false });

  // ==============================
  // Draw helpers
  // ==============================
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawBackground() {
    const w = canvas.width;
    const h = canvas.height;
    const skyH = h * 0.36;
    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, skyH);
    sky.addColorStop(0, '#c7e4b5');
    sky.addColorStop(1, '#e0f0c0');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, skyH);
    // Grass
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(0, skyH, w, h - skyH);
  }

  function drawPet() {
    if (!petImg || petImg._failed || !petImg.complete || petImg.naturalWidth === 0) return;
    const ph = Math.min(canvas.height * 0.22, 160);
    const pw = ph;
    const px = canvas.width * 0.5 - pw / 2;
    const py = canvas.height * 0.09;
    ctx.drawImage(petImg, px, py, pw, ph);
  }

  function drawPond() {
    const p = getPond();
    // Shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.ellipse(p.cx + 5, p.cy + 6, p.rx, p.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    // Water
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.ellipse(p.cx, p.cy, p.rx, p.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    // Shimmer
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    ctx.ellipse(p.cx - p.rx * 0.25, p.cy - p.ry * 0.3, p.rx * 0.28, p.ry * 0.13, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Rim
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(p.cx, p.cy, p.rx, p.ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    // Label
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#0369a1';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('🎣 Pond — tap fish to collect', p.cx, p.cy - p.ry - 6);
  }

  function drawPen() {
    const pen = getPen();
    // Ground inside pen
    ctx.fillStyle = '#bbf7d0';
    roundRect(pen.x, pen.y, pen.w, pen.h, 6);
    ctx.fill();
    // Fence posts + rails
    const postW = 9;
    const postSpacing = 44;
    const railH = 8;
    ctx.fillStyle = '#b45309';
    // Top & bottom posts
    for (let x = pen.x; x <= pen.x + pen.w; x += postSpacing) {
      ctx.fillRect(x - postW / 2, pen.y - 12, postW, pen.h + 24);
    }
    // Left & right posts
    for (let y = pen.y; y <= pen.y + pen.h; y += postSpacing) {
      ctx.fillRect(pen.x - 12, y - postW / 2, pen.w + 24, postW);
    }
    ctx.fillStyle = '#d97706';
    ctx.fillRect(pen.x - 12, pen.y - 6,  pen.w + 24, railH); // top rail
    ctx.fillRect(pen.x - 12, pen.y + pen.h - railH / 2, pen.w + 24, railH); // bottom rail
    ctx.fillRect(pen.x - 6,  pen.y - 12, railH, pen.h + 24); // left rail
    ctx.fillRect(pen.x + pen.w - railH / 2, pen.y - 12, railH, pen.h + 24); // right rail
    // Label
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = '#92400e';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('🦆 Pen — tap ducks to collect', pen.x + pen.w / 2, pen.y - 14);
  }

  function drawFishes(now) {
    fishes.forEach(f => {
      if (f.scale < 1) f.scale = Math.min(1, f.scale + 0.06);
      const bob = Math.sin(now * 1.8 + f.phase) * 5;
      ctx.save();
      ctx.translate(f.x, f.y + bob);
      ctx.scale(f.dir * f.scale, f.scale);
      if (fishImg && fishImg.complete && fishImg.naturalWidth > 0 && !fishImg._failed) {
        ctx.drawImage(fishImg, -22, -18, 44, 36);
      } else {
        ctx.font = '28px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🐟', 0, 0);
      }
      ctx.restore();
    });
  }

  function drawDucks(now) {
    ducks.forEach(d => {
      if (d.scale < 1) d.scale = Math.min(1, d.scale + 0.06);
      // Gentle waddle: bob up and down
      const bob = Math.abs(Math.sin(now * 3 + d.phase)) * 4;
      // Slow drift sideways
      d.x += d.walkX;
      const pen = getPen();
      const pad = 28;
      if (d.x < pen.x + pad || d.x > pen.x + pen.w - pad) {
        d.walkX *= -1;
        d.dir *= -1;
      }
      ctx.save();
      ctx.translate(d.x, d.y - bob);
      ctx.scale(d.dir * d.scale, d.scale);
      if (duckImg && duckImg.complete && duckImg.naturalWidth > 0 && !duckImg._failed) {
        ctx.drawImage(duckImg, -24, -24, 48, 48);
      } else {
        ctx.font = '28px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🦆', 0, 0);
      }
      ctx.restore();
    });
  }

  function drawSpawnCounters() {
    // Small counters near each area label showing how many are ready to collect
    const pond = getPond();
    const pen  = getPen();
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    roundRect(pond.cx - 30, pond.cy - pond.ry - 30, 60, 20, 6);
    ctx.fill();
    ctx.fillStyle = '#0369a1';
    ctx.fillText(fishes.length + ' ready', pond.cx, pond.cy - pond.ry - 20);

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    roundRect(pen.x + pen.w / 2 - 30, pen.y - 34, 60, 20, 6);
    ctx.fill();
    ctx.fillStyle = '#92400e';
    ctx.fillText(ducks.length + ' ready', pen.x + pen.w / 2, pen.y - 24);
  }

  // ==============================
  // Resize
  // ==============================
  function onResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', onResize);

  // ==============================
  // Loop
  // ==============================
  let running = true;
  let raf = 0;

  function loop() {
    if (!running) return;
    const now = Date.now() / 1000;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawPet();
    drawPond();
    drawPen();
    drawFishes(now);
    drawDucks(now);
    drawSpawnCounters();
    raf = requestAnimationFrame(loop);
  }

  buildBag();
  loop();

  // ==============================
  // Cleanup
  // ==============================
  window._modeCleanup = function () {
    running = false;
    cancelAnimationFrame(raf);
    clearInterval(spawnInterval);
    canvas.removeEventListener('mousedown', onDown);
    canvas.removeEventListener('touchstart', onDown);
    window.removeEventListener('resize', onResize);
    if (bagEl) { bagEl.remove(); bagEl = null; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
})();
