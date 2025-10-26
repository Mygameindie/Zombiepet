// pet_script.js (Normal Mode)
// Physics + idle/fly/fall animation, optional need bars.
// Exposes window._modeCleanup to allow mode switching safely.

(function () {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const groundHeight = 100;
  let groundY = canvas.height - groundHeight;

  // Images
  const imgs = {
    stand: new Image(),
    fall: new Image(),
    fly0: new Image(),
    fly1: new Image(),
  };
  imgs.stand.src = 'base.png';
  imgs.fall.src  = 'base4.png';
  imgs.fly0.src  = 'base2.png';
  imgs.fly1.src  = 'base3.png';

  // Pet state
  const pet = {
    x: canvas.width / 2,
    y: groundY - 250,
    w: 300,
    h: 300,
    oldx: null,
    oldy: null,
    dragging: false,
  };
  pet.oldx = pet.x;
  pet.oldy = pet.y;

  // Physics
  let vy = 0;
  const gravity = 1.2;
  const damping = 0.985;

  // Fly anim
  let frame = 0, timer = 0, speed = 10;

  // Optional: needs (hidden in this mode but can be re-enabled)
  let statsEl = document.getElementById('stats');
  if (!statsEl) {
    statsEl = document.createElement('div');
    statsEl.id = 'stats';
    statsEl.innerHTML = `
      <div class="bar"><span id="hygiene-bar" style="width:100%"></span></div>
      <div class="bar"><span id="hunger-bar"  style="width:100%"></span></div>
      <div class="bar"><span id="energy-bar"  style="width:100%"></span></div>
    `;
    document.getElementById('ui').appendChild(statsEl);
  }

  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
    return { x, y };
  }

  function startDrag(e) {
    const p = getPos(e);
    if (p.x > pet.x - pet.w/2 && p.x < pet.x + pet.w/2 &&
        p.y > pet.y - pet.h/2 && p.y < pet.y + pet.h/2) {
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
    }
    pet.dragging = false;
  }

  const listeners = [
    ['mousedown', startDrag],
    ['mousemove', moveDrag],
    ['mouseup', endDrag],
    ['touchstart', startDrag],
    ['touchmove', moveDrag],
    ['touchend', endDrag],
  ];
  listeners.forEach(([ev, fn]) => canvas.addEventListener(ev, fn, { passive: false }));

  // Resize
  function onResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    groundY = canvas.height - groundHeight;
    if (pet.y + pet.h/2 > groundY) {
      pet.y = groundY - pet.h/2;
      pet.oldy = pet.y;
    }
  }
  window.addEventListener('resize', onResize);

  // Loop
  let raf = 0;
  function update() {
    if (!pet.dragging) {
      const vx = (pet.x - pet.oldx) * damping;
      vy = (pet.y - pet.oldy) * damping;
      pet.oldx = pet.x;
      pet.oldy = pet.y;
      pet.x += vx;
      pet.y += vy + gravity;

      if (pet.y + pet.h/2 > groundY) {
        pet.y = groundY - pet.h/2;
        vy = 0;
      }
    }
  }
  function drawGround() {
    ctx.fillStyle = '#5c4033';
    ctx.fillRect(0, groundY, canvas.width, groundHeight);
  }
  function drawPet() {
    let img = imgs.stand;
    if (pet.y + pet.h/2 < groundY) {
      if (vy > 5) img = imgs.fall;
      else {
        timer++;
        if (timer > speed) { timer = 0; frame = (frame + 1) % 2; }
        img = frame ? imgs.fly1 : imgs.fly0;
      }
    }
    ctx.drawImage(img, pet.x - pet.w/2, pet.y - pet.h/2, pet.w, pet.h);
  }
  function loop() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    update();
    drawGround();
    drawPet();
    raf = requestAnimationFrame(loop);
  }
  loop();

  // Expose cleanup to switch modes
  window._modeCleanup = function () {
    cancelAnimationFrame(raf);
    listeners.forEach(([ev, fn]) => canvas.removeEventListener(ev, fn));
    window.removeEventListener('resize', onResize);
    // leave the canvas drawn; UI bars can remain
  };
  window._modeName = 'normal';
})();
