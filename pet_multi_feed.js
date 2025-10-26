// pet_multi_feed.js — Feed Mode + Gravity + Spawn + Clear + Draggable Menu
(function () {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  resizeCanvas();

  const groundHeight = 100;
  let groundY = canvas.height - groundHeight;

  // === Sounds ===
  const soundPool = {
    yum: [new Audio('yummy.mp3'), new Audio('yummy.mp3'), new Audio('yummy.mp3')],
    yuck: [new Audio('yuck.mp3'), new Audio('yuck.mp3'), new Audio('yuck.mp3')],
    bounce: [new Audio('bounce.mp3'), new Audio('bounce.mp3')],
    frozen: [new Audio('frozen.mp3'), new Audio('frozen.mp3')] // 🧊 new sound for ice lettuce
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
    brainfreeze: new Image(), // 🧊 new reaction image
  };
  petImgs.normal.src = 'base.png';
  petImgs.happy.src = 'base_happy.png';
  petImgs.disgust.src = 'base_disgust.png';
  petImgs.brainfreeze.src = 'base_brainfreeze.png';

  // === Pet ===
  const pet = { 
    x: canvas.width / 2, 
    y: canvas.height - 100 - 150, // stay on floor
    w: 300, 
    h: 300, 
    mood: 'normal' 
  };

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
 const foods = []; // stores active food objects currently spawned

const spawnMap = {
  fish: { 
    name: 'Fish', 
    imgSrc: 'food1.png',   // image file
    liked: true,            // pet will like it (triggers happy reaction)
    w: 200, h: 100,         // width & height
    type: 'normal'          // disappears when eaten
  },
  garlic: { 
    name: 'garlic', 
    imgSrc: 'food2.png',
    liked: false,           // pet dislikes it
    w: 100, h: 100,
    type: 'normal' 
  },
  icelettuce: { 
    name: 'Ice Lettuce',
    imgSrc: 'food3.png',
    liked: true,
    w: 200, h: 200,
    type: 'ice'             // stays visible, causes “brainfreeze”
  },
  brain: { 
    name: 'brain', 
    imgSrc: 'food4.png',   // image file
    liked: true,            // pet will like it (triggers happy reaction)
    w: 100, h: 100,         // width & height
    type: 'normal'          // disappears when eaten
  
  },
};
  function spawnFood(type) {
  const def = spawnMap[type];
  if (!def) return;

  // ✅ recalc floor position safely here
  const floor = canvas.height - groundHeight - 10;

  const f = {
    ...def,
    img: new Image(),
    drag: false,
    visible: true,
    justSpawned: true,
    vy: 0,
    x: pet.x + (Math.random() * 200 - 100),
    y: floor - def.h / 2, // 👈 always correct, matches current ground
  };
  f.img.src = def.imgSrc;
  setTimeout(() => (f.justSpawned = false), 800);
  foods.push(f);
}

  // === Clear System ===
  function clearFoods() {
    foods.length = 0;
  }

  // === Drag System for Foods ===
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
      if (
        p.x > f.x - f.w / 2 &&
        p.x < f.x + f.w / 2 &&
        p.y > f.y - f.h / 2 &&
        p.y < f.y + f.h / 2
      ) {
        activeFood = f;
        f.drag = true;
        f.vy = 0;
        hasMoved = false;
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
    if (activeFood && hasMoved) checkCollision(activeFood);
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
    // 🧊 Special Ice Lettuce reaction (disappears after feed)
    if (f.type === 'ice') {
      pet.mood = 'brainfreeze';
      showBubble('Brrr! 🧊');
      playSound('frozen');
      setTimeout(() => (pet.mood = 'normal'), 1500);
      f.visible = false; // 👈 disappears after being eaten
      return;
    }

    // 🍣 Normal or garlic foods
    pet.mood = f.liked ? 'happy' : 'disgust';
    showBubble(f.liked ? 'Yummy!' : 'Yuck!');
    playSound(f.liked ? 'yum' : 'yuck');
    setTimeout(() => (pet.mood = 'normal'), 1500);
    f.visible = false;
  }
}

  // === Gravity ===
  const gravity = 0.6;
  const bounce = 0.4;
  let floorY = canvas.height - groundHeight - 10;

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
    if (img && img.complete && img.naturalWidth > 0)
      ctx.drawImage(img, pet.x - pet.w / 2, pet.y - pet.h / 2, pet.w, pet.h);
  }

  function drawFoods() {
    for (const f of foods) {
      if (!f.visible) continue;
      const img = f.img;
      if (img && img.complete && img.naturalWidth > 0)
        ctx.drawImage(img, f.x - f.w / 2, f.y - f.h / 2, f.w, f.h);
    }
  }

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
    pet.y = groundY - pet.h / 2; // keep pet on floor
  });

  // === Create Spawn Buttons (Feed Mode Only) ===
  let spawnButtons = document.getElementById('spawn-buttons');
  if (!spawnButtons) {
    spawnButtons = document.createElement('div');
    spawnButtons.id = 'spawn-buttons';
    spawnButtons.style.position = 'fixed';
    spawnButtons.style.top = '20px';
    spawnButtons.style.left = '20px';
    spawnButtons.style.zIndex = '999';
    spawnButtons.innerHTML = `
      <button id="spawnicelettuce">Spawn Ice Lettuce 🧊</button>
      <button id="spawnFish">Spawn Fish 🍣</button>
	  <button id="spawnBrain">Spawn brain 🧠</button>
      <button id="spawngarlic">Spawn garlic 🧄</button>
      <button id="clearFoods">🧹 Clear</button>
    `;
    document.body.appendChild(spawnButtons);
  }

  // Hook up buttons
  const btnFish = document.getElementById('spawnFish');
  const btnBrain = document.getElementById('spawnBrain');
  const btngarlic = document.getElementById('spawngarlic');
  const btnLettuce = document.getElementById('spawnicelettuce');
  const btnClear = document.getElementById('clearFoods');
  if (btnFish) btnFish.addEventListener('click', () => spawnFood('fish'));
  if (btngarlic) btngarlic.addEventListener('click', () => spawnFood('garlic'));
  if (btnBrain) btnBrain.addEventListener('click', () => spawnFood('brain'));
  if (btnLettuce) btnLettuce.addEventListener('click', () => spawnFood('icelettuce'));
  if (btnClear) btnClear.addEventListener('click', clearFoods);

  // === Make Mode Menu Draggable ===
  const menu = document.getElementById('mode-menu');
  if (menu) {
    let offsetX = 0, offsetY = 0, isDragging = false;

    menu.addEventListener('mousedown', e => {
      isDragging = true;
      offsetX = e.clientX - menu.offsetLeft;
      offsetY = e.clientY - menu.offsetTop;
      menu.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', e => {
      if (!isDragging) return;
      menu.style.left = (e.clientX - offsetX) + 'px';
      menu.style.top = (e.clientY - offsetY) + 'px';
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      menu.style.cursor = 'grab';
    });

    // Touch support
    menu.addEventListener('touchstart', e => {
      isDragging = true;
      const t = e.touches[0];
      offsetX = t.clientX - menu.offsetLeft;
      offsetY = t.clientY - menu.offsetTop;
    });
    document.addEventListener('touchmove', e => {
      if (!isDragging) return;
      const t = e.touches[0];
      menu.style.left = (t.clientX - offsetX) + 'px';
      menu.style.top = (t.clientY - offsetY) + 'px';
    });
    document.addEventListener('touchend', () => isDragging = false);
  }

  // === Cleanup ===
  window._modeCleanup = function () {
    listeners.forEach(([ev, fn]) => canvas.removeEventListener(ev, fn));
    window.removeEventListener('resize', resizeCanvas);
    if (bubble) bubble.style.display = 'none';
    if (spawnButtons) spawnButtons.remove(); // remove feed buttons when leaving mode
  };

  window._modeName = 'feed';
})();
