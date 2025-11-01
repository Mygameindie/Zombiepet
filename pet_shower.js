// ===========================================================
// 🧼 SHOWER MODE (Instant Sound + Scroll Bar + Mobile Support)
// ===========================================================

(() => {
  if (window.SoundManager) SoundManager.stopAll();
  window._modeName = "shower";

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  resizeCanvas();

  const groundHeight = 100;
  let groundY = canvas.height - groundHeight;

  // === Base ===
  let baseImage = new Image();
  baseImage.src = "base_bath.png";
  let petX = canvas.width / 2 - 150;
  let petY = groundY - 400;

  // === Sponge ===
  const sponge = {
    img: new Image(),
    x: 100,
    y: 100,
    width: 100,
    height: 100,
    dragging: false,
  };
  sponge.img.src = "sponge.png";

  // === Duckies & Coneheads ===
  const duckies = [];
  const duckImg = new Image();
  duckImg.src = "duck.png";

  const coneheads = [];
  const coneheadImg = new Image();
  coneheadImg.src = "conehead.png";

  // ===========================================================
  // 🎵 INSTANT SOUND SYSTEM (preload pools)
  // ===========================================================
  // ===========================================================
// 🎵 INSTANT SOUND SYSTEM (preload pools)
// ===========================================================
const soundPool = {
  quack: [new Audio("quack.mp3"), new Audio("quack.mp3"), new Audio("quack.mp3")],
  splash: [new Audio("splash.mp3"), new Audio("splash.mp3")],
  bubble: [new Audio("bubble.mp3"), new Audio("bubble.mp3")],
  foam: [new Audio("foam.mp3"), new Audio("foam.mp3")],
  conehead: [new Audio("conehead.mp3"), new Audio("conehead.mp3")], // ✅ added
};
  let soundIndex = 0;

  function playInstantSound(key, volume = 0.9, rate = 1.0) {
    const pool = soundPool[key];
    if (!pool) return;
    const s = pool[soundIndex % pool.length];
    soundIndex++;
    try {
      s.pause();
      s.currentTime = 0;
      s.volume = volume;
      s.playbackRate = rate;
      s.play();
    } catch {}
  }

  // ===========================================================
  // 🧭 SCROLLABLE TOOLBAR
  // ===========================================================
  const showerBar = document.createElement("div");
  showerBar.id = "shower-bar";
  showerBar.classList.add("combined-scroll-bar");
  showerBar.style.position = "fixed";
  showerBar.style.top = "15px";
  showerBar.style.left = "50%";
  showerBar.style.transform = "translateX(-50%)";
  showerBar.style.zIndex = "999";
  showerBar.innerHTML = `
    <button id="spawnDuckBtn">🐤 Rubber Duck</button>
    <button id="spawnConeheadBtn">🔺 Conehead</button>
    <button id="spawnBubbleBtn">🫧 Bubble</button>
    <button id="spawnFoamBtn">🧼 Foam</button>
    <button id="clearBathBtn">🧹 Clear</button>
  `;
  document.body.appendChild(showerBar);

  // === Drag-scroll helper (mobile + desktop) ===
  function enableDragScroll(scrollElement) {
    let isDown = false;
    let startX, scrollLeft;
    const start = (e) => {
      isDown = true;
      startX = (e.touches ? e.touches[0].pageX : e.pageX) - scrollElement.offsetLeft;
      scrollLeft = scrollElement.scrollLeft;
    };
    const end = () => (isDown = false);
    const move = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = (e.touches ? e.touches[0].pageX : e.pageX) - scrollElement.offsetLeft;
      scrollElement.scrollLeft = scrollLeft - (x - startX) * 1.5;
    };
    scrollElement.addEventListener("mousedown", start);
    scrollElement.addEventListener("touchstart", start, { passive: false });
    scrollElement.addEventListener("mouseup", end);
    scrollElement.addEventListener("mouseleave", end);
    scrollElement.addEventListener("touchend", end);
    scrollElement.addEventListener("mousemove", move);
    scrollElement.addEventListener("touchmove", move, { passive: false });
  }
  enableDragScroll(showerBar);

  // ===========================================================
  // 🧩 BUTTON ACTIONS (Instant Sounds)
  // ===========================================================
  document.getElementById("spawnDuckBtn").onclick = () => {
    const duck = {
      x: Math.random() * (canvas.width - 100),
      y: 0,
      width: 150,
      height: 150,
      vy: 0,
      grabbed: false,
    };
    duckies.push(duck);
    playInstantSound("quack", 0.9, 0.9 + Math.random() * 0.2);
  };

  document.getElementById("spawnConeheadBtn").onclick = () => {
  const cone = {
    x: Math.random() * (canvas.width - 100),
    y: 0,
    width: 100,
    height: 150,
    vy: 0,
    grabbed: false,
  };
  coneheads.push(cone);

  // ✅ Play sound when conehead spawns
  playInstantSound("conehead", 0.9, 0.95 + Math.random() * 0.1);
};
  document.getElementById("spawnBubbleBtn").onclick = () => {
    playInstantSound("bubble");
    baseImage.src = "base_bath2.png";
  };

  document.getElementById("spawnFoamBtn").onclick = () => {
    playInstantSound("foam");
    baseImage.src = "base_bath2.png";
  };

  document.getElementById("clearBathBtn").onclick = () => {
    duckies.length = 0;
    coneheads.length = 0;
    baseImage.src = "base_bath.png";
  };

  // ===========================================================
  // 🖐️ DRAG LOGIC (Sponge + Duck + Conehead)
  // ===========================================================
  let dragTarget = null;
  let offsetX = 0,
    offsetY = 0;

  function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function startDrag(e) {
    e.preventDefault();
    const { x, y } = getPointerPos(e);

    if (
      x >= sponge.x &&
      x <= sponge.x + sponge.width &&
      y >= sponge.y &&
      y <= sponge.y + sponge.height
    ) {
      dragTarget = sponge;
      offsetX = x - sponge.x;
      offsetY = y - sponge.y;
      sponge.dragging = true;
      return;
    }

    for (let i = duckies.length - 1; i >= 0; i--) {
      const duck = duckies[i];
      if (
        x >= duck.x &&
        x <= duck.x + duck.width &&
        y >= duck.y &&
        y <= duck.y + duck.height
      ) {
        dragTarget = duck;
        offsetX = x - duck.x;
        offsetY = y - duck.y;
        duck.grabbed = true;
        duck.vy = 0;
        return;
      }
    }

    for (let i = coneheads.length - 1; i >= 0; i--) {
      const cone = coneheads[i];
      if (
        x >= cone.x &&
        x <= cone.x + cone.width &&
        y >= cone.y &&
        y <= cone.y + cone.height
      ) {
        dragTarget = cone;
        offsetX = x - cone.x;
        offsetY = y - cone.y;
        cone.grabbed = true;
        cone.vy = 0;
        return;
      }
    }
  }

  function moveDrag(e) {
    if (!dragTarget) return;
    e.preventDefault();
    const { x, y } = getPointerPos(e);
    dragTarget.x = x - offsetX;
    dragTarget.y = y - offsetY;
  }

  function stopDrag() {
    if (!dragTarget) return;
    if (dragTarget === sponge) {
      sponge.dragging = false;
    } else if (dragTarget.grabbed) {
      dragTarget.grabbed = false;
      dragTarget.vy = 0;
    }
    dragTarget = null;
  }

  ["mousedown", "touchstart"].forEach((ev) =>
    canvas.addEventListener(ev, startDrag, { passive: false })
  );
  ["mousemove", "touchmove"].forEach((ev) =>
    canvas.addEventListener(ev, moveDrag, { passive: false })
  );
  ["mouseup", "touchend"].forEach((ev) =>
    canvas.addEventListener(ev, stopDrag, { passive: false })
  );

  // ===========================================================
  // 🧩 HITBOX (for sponge washing)
  // ===========================================================
  const hitbox = {
    type: "rect",
    offsetX: 120,
    offsetY: 90,
    width: 130,
    height: 150,
    radius: 120,
    debug: false,
  };

  function drawHitbox() {
    if (!hitbox.debug) return;
    ctx.save();
    ctx.strokeStyle = "rgba(0,255,0,0.3)";
    ctx.lineWidth = 2;
    if (hitbox.type === "rect") {
      ctx.strokeRect(
        petX + hitbox.offsetX,
        petY + hitbox.offsetY,
        hitbox.width,
        hitbox.height
      );
    } else {
      ctx.beginPath();
      ctx.arc(petX + 150, petY + 150, hitbox.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function isTouching(a, b) {
    return !(
      a.x + a.width < b.x ||
      a.x > b.x + b.width ||
      a.y + a.height < b.y ||
      a.y > b.y + b.height
    );
  }

  function isTouchingHitbox(a) {
    if (hitbox.type === "rect") {
      return isTouching(a, {
        x: petX + hitbox.offsetX,
        y: petY + hitbox.offsetY,
        width: hitbox.width,
        height: hitbox.height,
      });
    } else {
      const cx = petX + 150;
      const cy = petY + 150;
      const dx = a.x + a.width / 2 - cx;
      const dy = a.y + a.height / 2 - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist < hitbox.radius + Math.max(a.width, a.height) / 3;
    }
  }

  // ===========================================================
  // 🪄 UPDATE LOOP
  // ===========================================================
  let running = true;
  let raf = 0;
  function update() {
    if (!running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (baseImage.complete && baseImage.naturalWidth > 0)
      ctx.drawImage(baseImage, petX, petY, 400, 400);

    // Sponge
    if (sponge.img.complete && sponge.img.naturalWidth > 0) {
      ctx.save();
      if (sponge.dragging) {
        const wobble = Math.sin(Date.now() / 80) * 0.15;
        ctx.translate(sponge.x + sponge.width / 2, sponge.y + sponge.height / 2);
        ctx.rotate(wobble);
        ctx.drawImage(
          sponge.img,
          -sponge.width / 2,
          -sponge.height / 2,
          sponge.width,
          sponge.height
        );
      } else {
        ctx.drawImage(sponge.img, sponge.x, sponge.y, sponge.width, sponge.height);
      }
      ctx.restore();
    }

    // Touch logic
    const touching = isTouchingHitbox(sponge);
    if (touching && !baseImage.src.includes("base_bath2.png")) {
      baseImage.src = "base_bath2.png";
      playInstantSound("splash");
    } else if (!touching && !baseImage.src.includes("base_bath.png")) {
      baseImage.src = "base_bath.png";
    }

    drawHitbox();

    // Ducks
    duckies.forEach((duck) => {
      if (!duck.grabbed) {
        duck.vy += 0.5;
        duck.y += duck.vy;
        if (duck.y + duck.height > groundY) {
          duck.y = groundY - duck.height;
          duck.vy *= -0.3;
        }
      }
      if (duckImg.complete && duckImg.naturalWidth > 0)
        ctx.drawImage(duckImg, duck.x, duck.y, duck.width, duck.height);
    });

    // Coneheads
    coneheads.forEach((cone) => {
      if (!cone.grabbed) {
        cone.vy += 0.5;
        cone.y += cone.vy;
        if (cone.y + cone.height > groundY) {
          cone.y = groundY - cone.height;
          cone.vy *= -0.3;
        }
      }
      if (coneheadImg.complete && coneheadImg.naturalWidth > 0)
        ctx.drawImage(coneheadImg, cone.x, cone.y, cone.width, cone.height);
    });

    raf = requestAnimationFrame(update);
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  update();

  // ===========================================================
  // 🧹 CLEANUP
  // ===========================================================
  window._modeCleanup = function () {
    running = false;
    cancelAnimationFrame(raf);
    showerBar?.remove();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const newCanvas = canvas.cloneNode(true);
    canvas.parentNode.replaceChild(newCanvas, canvas);
  };
})();