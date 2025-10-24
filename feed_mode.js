// pet_multi_feed.js (Feeding Mode)
// Drag various foods to a stationary pet; pet reacts with happy/disgust.
// Exposes window._modeCleanup for safe switching.

(function () {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const groundHeight = 100;
  let groundY = canvas.height - groundHeight;

  // Pet images
  const petImgs = {
    normal: new Image(),
    happy: new Image(),
    disgust: new Image(),
  };
  petImgs.normal.src = 'base.png';
  petImgs.happy.src  = 'base_happy.png';
  petImgs.disgust.src= 'base_disgust.png';

  // Stationary pet
  const pet = {
    x: canvas.width / 2,
    y: groundY - 250,
    w: 180,
    h: 250,
    mood: 'normal',
  };

  // Speech bubble for reactions
  let bubble = document.getElementById('bubble');
  if (!bubble) {
    bubble = document.createElement('div');
    bubble.id = 'bubble';
    bubble.textContent = '';
    document.body.appendChild(bubble);
  }
  function showBubble(text) {
    bubble.style.left = pet.x + 'px';
    bubble.style.top  = (pet.y - pet.h/2 - 16) + 'px';
    bubble.textContent = text;
    bubble.style.display = 'block';
    clearTimeout(showBubble._t);
    showBubble._t = setTimeout(()=> bubble.style.display = 'none', 1200);
  }

  // Foods — add more easily
  let foods = [
    { name: 'apple', imgSrc: 'food1.png', liked: true,  x: 300, y: 0, w: 100, h: 100 },
    { name: 'candy', imgSrc: 'food2.png', liked: false, x: 520, y: 0, w: 100, h: 100 },
  ];
  foods.forEach(f => {
    // ensure visibility adjustment
    
    f.img = new Image();
    f.img.src = f.imgSrc;
    f.y = groundY - f.h;
    f.drag = false;
    f.visible = true;
  });

  // Hint
  const hint = document.getElementById('hint-text');
  if (hint) hint.textContent = 'Drag a food onto the pet';

  // Drag system (foods only)
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
      if (p.x > f.x - f.w/2 && p.x < f.x + f.w/2 &&
          p.y > f.y - f.h/2 && p.y < f.y + f.h/2) {
        f.drag = true;
        e.preventDefault();
        break;
      }
    }
  }
  function move(e) {
    const p = pos(e);
    for (const f of foods) {
      if (f.drag) {
        f.x = p.x; f.y = p.y;
      }
    }
    if (e.touches) e.preventDefault();
  }
  function up() {
    foods.forEach(f => f.drag = false);
  }

  const listeners = [
    ['mousedown', down], ['mousemove', move], ['mouseup', up],
    ['touchstart', down], ['touchmove', move], ['touchend', up],
  ];
  listeners.forEach(([ev, fn]) => canvas.addEventListener(ev, fn, { passive: false }));

  // Collision + reaction
  function collide() {
    for (const f of foods) {
      if (!f.visible) continue;
      const dx = Math.abs(f.x - pet.x);
      const dy = Math.abs(f.y - pet.y);
      const hit = dx < (f.w/2 + pet.w/2) && dy < (f.h/2 + pet.h/2);
      if (hit) {
        pet.mood = f.liked ? 'happy' : 'disgust';
        showBubble(f.liked ? 'Yum!' : 'Yuck!');
        setTimeout(()=> pet.mood = 'normal', 1000);
        f.visible = false;
      }
    }
  }

  // Draw
  function ground() {
    ctx.fillStyle = '#5c4033';
    ctx.fillRect(0, groundY, canvas.width, groundHeight);
  }
  function drawPet() {
    const img = petImgs[pet.mood];
    ctx.drawImage(img, pet.x - pet.w/2, pet.y - pet.h/2, pet.w, pet.h);
  }
  function drawFoods() {
    for (const f of foods) {
      if (f.visible) {
        ctx.drawImage(f.img, f.x - f.w/2, f.y - f.h/2, f.w, f.h);
      }
    }
  }

  let raf = 0;
  function loop() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ground();
    drawPet();
    drawFoods();
    collide();
    // debug overlay
    ctx.fillStyle = 'black';
    ctx.font = '16px sans-serif';
    ctx.fillText('FEED MODE ACTIVE', 12, 24);
    raf = requestAnimationFrame(loop);
  }
  loop();

  function onResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    groundY = canvas.height - groundHeight;
    pet.y = groundY - 250;
    foods.forEach(f => {
    // ensure visibility adjustment
     if (f.y > groundY - f.h/2) f.y = groundY - f.h; });
  }
  window.addEventListener('resize', onResize);

  // Expose cleanup
  window._modeCleanup = function () {
    cancelAnimationFrame(raf);
    listeners.forEach(([ev, fn]) => canvas.removeEventListener(ev, fn));
    window.removeEventListener('resize', onResize);
    if (bubble) bubble.style.display = 'none';
  };
  window._modeName = 'feed';
})();
