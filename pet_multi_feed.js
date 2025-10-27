// pet_multi_feed.js — Feed Mode + Gravity + Ducks Edible + Candy + Spicy Added
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
    frozen: [new Audio('frozen.mp3'), new Audio('frozen.mp3')],
    spicy: [new Audio('spicy.mp3'), new Audio('spicy.mp3')], // 🌶️ new
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

  // 🦆 Quack sound
  function playQuack() {
    const q = new Audio('quack.mp3');
    q.volume = 0.8;
    q.playbackRate = 0.9 + Math.random() * 0.2;
    q.play().catch(() => {});
  }

  // === Pet Images ===
  const petImgs = {
    normal: new Image(),
    happy: new Image(),
    disgust: new Image(),
    brainfreeze: new Image(),
    spicy: new Image(), // 🌶️ new mood
  };
  petImgs.normal.src = 'base.png';
  petImgs.happy.src = 'base_happy.png';
  petImgs.disgust.src = 'base_disgust.png';
  petImgs.brainfreeze.src = 'base_brainfreeze.png';
  petImgs.spicy.src = 'base_spicy.png'; // 🌶️ spicy face

  // === Pet ===
  const pet = { 
    x: canvas.width / 2, 
    y: canvas.height - 100 - 150,
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

  // === Foods (Duck + Candy + Spicy) ===
  const foods = [];

  const spawnMap = {
    fish: { name: 'Fish', imgSrc: 'food1.png', liked: true, w: 200, h: 100, type: 'normal' },
    garlic: { name: 'Garlic', imgSrc: 'food2.png', liked: false, w: 100, h: 100, type: 'normal' },
    icelettuce: { name: 'Ice Lettuce', imgSrc: 'food3.png', liked: true, w: 100, h: 100, type: 'ice' },
    brain: { name: 'Brain', imgSrc: 'food4.png', liked: true, w: 100, h: 100, type: 'normal' },
    duck: { name: 'Rubber Duck', imgSrc: 'duck.png', liked: false, w: 120, h: 120, type: 'normal' },
    candy: { name: 'Candy', imgSrc: 'candy.png', liked: true, w: 100, h: 100, type: 'ice' },
    spicy: { name: 'chili', imgSrc: 'chili.png', liked: true, w: 100, h: 100, type: 'spicy' }, // 🌶️ new
  };

  function spawnFood(type) {
    const def = spawnMap[type];
    if (!def) return;

    const f = {
      ...def,
      img: new Image(),
      drag: false,
      visible: true,
      justSpawned: true,
      vy: 0,
      x: pet.x + (Math.random() * 200 - 100),
      y: pet.y - 300,
    };
    f.img.src = def.imgSrc;
    setTimeout(() => (f.justSpawned = false), 800);
    foods.push(f);

    // Quack when spawning duck
    if (type === 'duck') playQuack();
  }

  // === Clear System ===
  function clearFoods() {
    foods.length = 0;
  }

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
      if (f.type === 'ice') {
        pet.mood = 'brainfreeze';
        showBubble('Brrr! 🧊');
        playSound('frozen');
        setTimeout(() => (pet.mood = 'normal'), 1500);
        f.visible = false;
        return;
      }

      // 🌶️ Spicy effect
      if (f.type === 'spicy') {
        pet.mood = 'spicy';
        showBubble('Spicy! 🌶️');
        playSound('spicy');
        setTimeout(() => (pet.mood = 'normal'), 1500);
        f.visible = false;
        return;
      }

      // 🦆 Duck
      if (f.name === 'Rubber Duck') playQuack();

      // Default reaction
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
    pet.y = groundY - pet.h / 2;
  });

  // === Buttons ===
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
      <button id="spawnBrain">Spawn Brain 🧠</button>
      <button id="spawngarlic">Spawn Garlic 🧄</button>
      <button id="spawnDuck">Spawn Duck 🦆</button>
      <button id="spawncandy">Spawn Candy 🍬</button>
      <button id="spawnSpicy">Spawn Spicy 🌶️</button>
      <button id="clearFoods">🧹 Clear</button>
    `;
    document.body.appendChild(spawnButtons);
  }

  const btnFish = document.getElementById('spawnFish');
  const btnBrain = document.getElementById('spawnBrain');
  const btngarlic = document.getElementById('spawngarlic');
  const btnLettuce = document.getElementById('spawnicelettuce');
  const btnDuck = document.getElementById('spawnDuck');
  const btnCandy = document.getElementById('spawncandy');
  const btnSpicy = document.getElementById('spawnSpicy');
  const btnClear = document.getElementById('clearFoods');

  if (btnFish) btnFish.addEventListener('click', () => spawnFood('fish'));
  if (btngarlic) btngarlic.addEventListener('click', () => spawnFood('garlic'));
  if (btnBrain) btnBrain.addEventListener('click', () => spawnFood('brain'));
  if (btnLettuce) btnLettuce.addEventListener('click', () => spawnFood('icelettuce'));
  if (btnDuck) btnDuck.addEventListener('click', () => spawnFood('duck'));
  if (btnCandy) btnCandy.addEventListener('click', () => spawnFood('candy'));
  if (btnSpicy) btnSpicy.addEventListener('click', () => spawnFood('spicy'));
  if (btnClear) btnClear.addEventListener('click', clearFoods);

  // === Cleanup ===
  window._modeCleanup = function () {
    listeners.forEach(([ev, fn]) => canvas.removeEventListener(ev, fn));
    window.removeEventListener('resize', resizeCanvas);
    if (bubble) bubble.style.display = 'none';
    if (spawnButtons) spawnButtons.remove();
  };

  window._modeName = 'feed';
})();