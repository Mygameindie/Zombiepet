// ===========================================================
// 🌱 pet_garden.js — Garden Mode (Zombiepet)
// Plant zombie crops in dirt patches, water them to grow,
// harvest with scythe → food flies to bag → feed your pet!
// Based on Purelilypet garden mode, adapted for Zombiepet.
// ===========================================================

(() => {
  if (typeof window._modeCleanup === 'function') {
    try { window._modeCleanup(); } catch (_) {}
  }
  window._modeName = 'garden';

  if (window.SoundManager) window.SoundManager.stopAll();

  // ==============================
  // Canvas
  // ==============================
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // ==============================
  // Layout
  // ==============================
  const FENCE_Y_RATIO = 0.48;

  function getFenceY() { return canvas.height * FENCE_Y_RATIO; }

  function getDirtPatches() {
    const w = canvas.width;
    const fenceY = getFenceY();
    const dirtTop = fenceY + 18;
    const dirtH = Math.min(canvas.height * 0.28, 180);
    const patchW = Math.min(w * 0.24, 200);
    return [
      { x: w * 0.08,             y: dirtTop, w: patchW, h: dirtH },
      { x: w * 0.5 - patchW / 2, y: dirtTop, w: patchW, h: dirtH },
      { x: w * 0.92 - patchW,    y: dirtTop, w: patchW, h: dirtH },
    ];
  }

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

  const petImg = createImg('base.png');
  const wateringCanImg = createImg('wateringcan.png');

  // ==============================
  // Growth timing (seconds)
  // ==============================
  const SEC_GROWING = 7;
  const SEC_READY   = 15;

  // ==============================
  // Garden state (patches + localStorage)
  // ==============================
  const GARDEN_KEY = 'zombiepet_garden';
  const patches = [[], [], []];

  function loadGardenState() {
    try {
      const raw = localStorage.getItem(GARDEN_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (Array.isArray(data.patches)) {
        data.patches.forEach((p, i) => {
          if (Array.isArray(p) && patches[i]) {
            patches[i] = p.map(pl => ({ ...pl }));
          }
        });
      }
    } catch {}
  }

  function saveGardenState() {
    try {
      localStorage.setItem(GARDEN_KEY, JSON.stringify({
        patches: patches.map(p => p.map(pl => ({
          crop: pl.crop, plantedAt: pl.plantedAt, stage: pl.stage, offX: pl.offX || 0,
        }))),
      }));
    } catch {}
  }

  loadGardenState();

  function updateStages() {
    const now = Date.now();
    patches.forEach(patch => {
      patch.forEach(plant => {
        const elapsed = (now - plant.plantedAt) / 1000;
        if (elapsed >= SEC_READY)        plant.stage = 'ready';
        else if (elapsed >= SEC_GROWING) plant.stage = 'growing';
        else                             plant.stage = 'seedling';
      });
    });
  }

  // ==============================
  // Crops config
  // ==============================
  let crops = [];
  const cropImgs = {};

  async function loadCrops() {
    const res = await fetch('garden_items.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('garden_items.json not found');
    const cfg = await res.json();
    crops = cfg.crops || [];
    crops.forEach(c => {
      const img = new Image();
      img.src = c.seedImg;
      cropImgs[c.key] = img;
    });
    buildToolbar();
  }

  // ==============================
  // Tool state
  // ==============================
  let selectedTool = 'plant';
  let selectedCrop = null;

  // ==============================
  // Toolbar DOM
  // ==============================
  let toolbar = null;

  function buildToolbar() {
    if (toolbar) toolbar.remove();
    toolbar = document.createElement('div');
    toolbar.id = 'garden-toolbar';
    toolbar.className = 'mode-ui';
    Object.assign(toolbar.style, {
      position: 'fixed',
      bottom: 'calc(64px + env(safe-area-inset-bottom))',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      flexWrap: 'nowrap',
      gap: '6px',
      background: 'rgba(255,255,255,0.93)',
      borderRadius: '14px',
      padding: '6px 10px',
      zIndex: '9998',
      maxWidth: '92vw',
      overflowX: 'auto',
      overflowY: 'hidden',
      alignItems: 'center',
      boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
    });

    [
      { key: 'plant',  emoji: '🌱', label: 'Plant seed' },
      { key: 'water',  emoji: '💧', label: 'Water (instant grow)' },
      { key: 'scythe', emoji: '🌾', label: 'Harvest ready crops' },
    ].forEach(t => {
      const btn = document.createElement('button');
      btn.dataset.tool = t.key;
      btn.textContent = t.emoji;
      btn.title = t.label;
      applyToolStyle(btn, t.key === selectedTool);
      btn.addEventListener('click', () => {
        selectedTool = t.key;
        updateHighlights();
      });
      toolbar.appendChild(btn);
    });

    const sep = document.createElement('div');
    Object.assign(sep.style, {
      width: '1px',
      background: '#e5e7eb',
      margin: '0 4px',
      alignSelf: 'stretch',
    });
    toolbar.appendChild(sep);

    crops.forEach(crop => {
      const btn = document.createElement('button');
      btn.dataset.crop = crop.key;
      btn.title = crop.label;
      const img = document.createElement('img');
      img.src = crop.seedImg;
      Object.assign(img.style, {
        width: '28px', height: '28px', objectFit: 'contain', display: 'block',
      });
      img.onerror = () => { btn.textContent = crop.label[0] || '?'; };
      btn.appendChild(img);
      applyToolStyle(btn, false);
      btn.addEventListener('click', () => {
        selectedCrop = crop.key;
        selectedTool = 'plant';
        updateHighlights();
      });
      toolbar.appendChild(btn);
    });

    document.body.appendChild(toolbar);

    if (!selectedCrop && crops.length > 0) selectedCrop = crops[0].key;
    updateHighlights();
  }

  function applyToolStyle(btn, active) {
    Object.assign(btn.style, {
      border: active ? '2px solid #f59e0b' : '2px solid #e5e7eb',
      borderRadius: '8px',
      padding: '4px 6px',
      background: active ? '#fef3c7' : 'white',
      cursor: 'pointer',
      fontSize: '18px',
      lineHeight: '1',
    });
  }

  function updateHighlights() {
    if (!toolbar) return;
    toolbar.querySelectorAll('button[data-tool]').forEach(btn => {
      applyToolStyle(btn, btn.dataset.tool === selectedTool);
    });
    toolbar.querySelectorAll('button[data-crop]').forEach(btn => {
      applyToolStyle(btn, btn.dataset.crop === selectedCrop && selectedTool === 'plant');
    });
  }

  // ==============================
  // Bag DOM (shows shared inventory total)
  // ==============================
  let bagEl = null;

  function buildBag() {
    bagEl = document.createElement('div');
    bagEl.id = 'garden-bag';
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
    countEl.id = 'garden-bag-count';
    bagEl.appendChild(countEl);

    const hintEl = document.createElement('span');
    hintEl.textContent = '→ Feed Mode';
    Object.assign(hintEl.style, { fontSize: '11px', color: '#6b7280' });
    bagEl.appendChild(hintEl);

    document.body.appendChild(bagEl);
    updateBagUI();
  }

  function getInventoryTotal() {
    if (!window.PetStats) return 0;
    return Object.values(window.PetStats.getInventory()).reduce((a, b) => a + b, 0);
  }

  function updateBagUI() {
    const countEl = document.getElementById('garden-bag-count');
    if (countEl) countEl.textContent = '🎒 ' + getInventoryTotal();
  }

  // ==============================
  // Feedback text
  // ==============================
  let feedbackText = '';
  let feedbackTimer = 0;

  // ==============================
  // Fly-to-bag animation
  // ==============================
  function flyToBag(screenX, screenY, cropKey) {
    const el = document.createElement('div');
    el.textContent = '🌻';
    Object.assign(el.style, {
      position: 'fixed',
      fontSize: '22px',
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
        transition: 'left 0.55s ease-in, top 0.55s ease-in, opacity 0.55s ease-in',
        left: tx + 'px',
        top: ty + 'px',
        opacity: '0',
      });
      setTimeout(() => {
        el.remove();
        if (window.PetStats) window.PetStats.addInventory(cropKey, 1);
        updateBagUI();
        if (typeof window._refreshFeedToolbar === 'function') window._refreshFeedToolbar();
        if (bagEl) {
          bagEl.style.transform = 'scale(1.35)';
          setTimeout(() => { if (bagEl) bagEl.style.transform = ''; }, 180);
        }
      }, 580);
    });
  }

  // ==============================
  // Canvas interaction
  // ==============================
  function canvasPos(e) {
    const r = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return {
      x: src.clientX - r.left,
      y: src.clientY - r.top,
      screenX: src.clientX,
      screenY: src.clientY,
    };
  }

  let dragPos = null;

  function onDown(e) {
    dragPos = canvasPos(e);
    e.preventDefault();
  }

  function onMove(e) {
    if (!dragPos) return;
    dragPos = canvasPos(e);
    if (e.touches) e.preventDefault();
  }

  function onUp() {
    if (!dragPos) return;
    const p = dragPos;
    dragPos = null;
    handleAction(p);
  }

  function pointInPatch(p, patch) {
    return p.x >= patch.x && p.x <= patch.x + patch.w &&
           p.y >= patch.y && p.y <= patch.y + patch.h;
  }

  function handleAction(p) {
    const dirtPatches = getDirtPatches();
    for (let i = 0; i < dirtPatches.length; i++) {
      const patch = dirtPatches[i];
      if (!pointInPatch(p, patch)) continue;

      if (selectedTool === 'plant' && selectedCrop) {
        patches[i].push({
          crop: selectedCrop,
          plantedAt: Date.now(),
          stage: 'seedling',
          offX: (Math.random() - 0.5) * (patch.w * 0.55),
        });
        saveGardenState();

      } else if (selectedTool === 'water') {
        patches[i].forEach(plant => {
          plant.stage = 'ready';
          plant.plantedAt = Date.now() - SEC_READY * 1000;
        });
        saveGardenState();

      } else if (selectedTool === 'scythe') {
        const ready = patches[i].filter(pl => pl.stage === 'ready');
        if (ready.length === 0) break;

        const canvasRect = canvas.getBoundingClientRect();
        ready.forEach((plant, idx) => {
          const plantCanvasX = patch.x + patch.w / 2 + (plant.offX || 0);
          const plantCanvasY = patch.y + patch.h * 0.35;
          const sx = canvasRect.left + plantCanvasX;
          const sy = canvasRect.top + plantCanvasY;
          setTimeout(() => flyToBag(sx, sy, plant.crop), idx * 140);
        });

        patches[i] = patches[i].filter(pl => pl.stage !== 'ready');
        saveGardenState();
      }
      break;
    }
  }

  canvas.addEventListener('mousedown', onDown, { passive: false });
  canvas.addEventListener('mousemove', onMove, { passive: false });
  canvas.addEventListener('mouseup', onUp);
  canvas.addEventListener('touchstart', onDown, { passive: false });
  canvas.addEventListener('touchmove', onMove, { passive: false });
  canvas.addEventListener('touchend', onUp);

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

  function drawScene() {
    const w = canvas.width;
    const h = canvas.height;
    const fenceY = getFenceY();
    const dirtPatches = getDirtPatches();

    // Sky (eerie zombie-green tint)
    const sky = ctx.createLinearGradient(0, 0, 0, fenceY);
    sky.addColorStop(0, '#c7e4b5');
    sky.addColorStop(1, '#e0f0c0');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, fenceY);

    // Grass
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(0, fenceY, w, h - fenceY);

    // Dirt patches
    dirtPatches.forEach(patch => {
      ctx.fillStyle = '#7c3f14';
      roundRect(patch.x - 2, patch.y - 2, patch.w + 4, patch.h + 4, 10);
      ctx.fill();
      ctx.fillStyle = '#a16207';
      roundRect(patch.x, patch.y, patch.w, patch.h, 8);
      ctx.fill();
      ctx.fillStyle = '#92400e';
      roundRect(patch.x + 5, patch.y + 5, patch.w - 10, patch.h - 10, 5);
      ctx.fill();
    });

    // Pet behind fence
    drawPet(fenceY);

    // Fence (drawn in front of pet)
    drawFence(w, fenceY);

    // Plants on dirt
    drawPlants(dirtPatches);

    // Tool cursor while dragging
    if (dragPos) drawToolCursor(dragPos.x, dragPos.y);

    // Feedback text
    if (feedbackTimer > 0) {
      feedbackTimer--;
      const alpha = Math.min(1, feedbackTimer / 20);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#15803d';
      ctx.fillText(feedbackText, w / 2, h * 0.35);
      ctx.restore();
    }
  }

  function drawFence(w, fenceY) {
    const postW = 10;
    const postSpacing = 55;
    const postTop = fenceY - 28;
    const postH = 70;
    ctx.fillStyle = '#b45309';
    for (let x = 5; x < w; x += postSpacing) {
      roundRect(x, postTop, postW, postH, 3);
      ctx.fill();
    }
    ctx.fillStyle = '#d97706';
    ctx.fillRect(0, fenceY - 14, w, 10);
    ctx.fillRect(0, fenceY + 16, w, 10);
  }

  function drawPet(fenceY) {
    if (!petImg || petImg._failed || !petImg.complete || petImg.naturalWidth === 0) return;
    const petH = Math.min(canvas.height * 0.28, 210);
    const petW = petH;
    const petX = canvas.width * 0.15 - petW / 2;
    const petY = fenceY - petH - 8;
    ctx.drawImage(petImg, petX, petY, petW, petH);
  }

  function drawPlants(dirtPatches) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    dirtPatches.forEach((patch, pi) => {
      patches[pi].forEach(plant => {
        const px = patch.x + patch.w / 2 + (plant.offX || 0);
        const py = patch.y + patch.h * 0.38;

        let emoji = '🌱';
        let size = 20;
        if (plant.stage === 'growing') { emoji = '🌿'; size = 28; }
        else if (plant.stage === 'ready') { emoji = '🌻'; size = 36; }

        if (plant.stage === 'ready') {
          ctx.save();
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 14;
        }

        ctx.font = size + 'px serif';
        ctx.fillText(emoji, px, py);

        // Show food image above ready plant
        if (plant.stage === 'ready' && cropImgs[plant.crop]) {
          const fi = cropImgs[plant.crop];
          if (fi && fi.complete && fi.naturalWidth > 0) {
            ctx.drawImage(fi, px - 14, py - size - 20, 28, 28);
          }
        }

        if (plant.stage === 'ready') ctx.restore();
      });
    });
  }

  function drawToolCursor(x, y) {
    if (selectedTool === 'water') {
      if (wateringCanImg && wateringCanImg.complete && wateringCanImg.naturalWidth > 0 && !wateringCanImg._failed) {
        ctx.drawImage(wateringCanImg, x - 20, y - 44, 44, 44);
      } else {
        ctx.font = '28px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💧', x, y - 20);
      }
    } else {
      const emoji = selectedTool === 'scythe' ? '🌾' : '🌱';
      ctx.font = '28px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, x, y - 20);
    }
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateStages();
    drawScene();
    raf = requestAnimationFrame(loop);
  }

  const saveInterval = setInterval(saveGardenState, 10000);

  // ==============================
  // Init
  // ==============================
  window._gardenMode = true;

  buildBag();
  loadCrops().catch(() => buildToolbar());
  loop();

  // ==============================
  // Cleanup
  // ==============================
  window._modeCleanup = function () {
    running = false;
    cancelAnimationFrame(raf);
    clearInterval(saveInterval);
    canvas.removeEventListener('mousedown', onDown);
    canvas.removeEventListener('mousemove', onMove);
    canvas.removeEventListener('mouseup', onUp);
    canvas.removeEventListener('touchstart', onDown);
    canvas.removeEventListener('touchmove', onMove);
    canvas.removeEventListener('touchend', onUp);
    window.removeEventListener('resize', onResize);
    window._gardenMode = false;
    saveGardenState();
    if (toolbar) { toolbar.remove(); toolbar = null; }
    if (bagEl) { bagEl.remove(); bagEl = null; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
})();
