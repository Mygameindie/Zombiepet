// trolling.js — Hammer + Butter + Remove Mode + Sound
(() => {
  window._modeName = "trolling";

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  // === Resize ===
  const groundHeight = 100;
  let groundY = 0;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    groundY = canvas.height - groundHeight;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // === Base Pet ===
  const baseImage = new Image();
  baseImage.src = "base.png";

  const pet = {
    x: canvas.width / 2 - 150,
    y: groundY - 400,
    w: 400,
    h: 400,
  };

  // === Sounds ===
  const hammerSound = new Audio("hammer.mp3");
  const butterSound = new Audio("butter.mp3");

  function playSound(audio) {
    try {
      const s = audio.cloneNode(); // allow overlapping playback
      s.volume = 0.9;
      s.play().catch(() => {});
    } catch {}
  }

  // === Buttons ===
  const uiBox = document.createElement("div");
  uiBox.id = "troll-buttons";
  uiBox.style.position = "absolute";
  uiBox.style.top = "20px";
  uiBox.style.left = "20px";
  uiBox.style.zIndex = "999";
  uiBox.innerHTML = `
    <button id="hammer-btn">🔨 Hammer</button>
    <button id="butter-btn">🧈 Butter</button>
    <button id="remove-btn">❌ Remove</button>
  `;
  document.body.appendChild(uiBox);

  const hammerBtn = document.getElementById("hammer-btn");
  const butterBtn = document.getElementById("butter-btn");
  const removeBtn = document.getElementById("remove-btn");

  // --- HAMMER MODE ---
  if (hammerBtn) {
    const press = () => {
      baseImage.src = "base_hammer.png";
      playSound(hammerSound);
    };
    const release = () => {
      baseImage.src = "base.png";
    };

    // Mouse + touch support
    hammerBtn.addEventListener("mousedown", press);
    hammerBtn.addEventListener("touchstart", press);
    hammerBtn.addEventListener("mouseup", release);
    hammerBtn.addEventListener("mouseleave", release);
    hammerBtn.addEventListener("touchend", release);
  }

  // --- BUTTER MODE ---
  if (butterBtn) {
    butterBtn.addEventListener("click", () => {
      baseImage.src = "base_butter.png";
      playSound(butterSound);
    });
  }

  // --- REMOVE BUTTON ---
  if (removeBtn) {
    removeBtn.addEventListener("click", () => {
      baseImage.src = "base.png";
    });
  }

  // === DRAW LOOP ===
  let running = true;
  function draw() {
    if (!running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ground
    ctx.fillStyle = "#5c4033";
    ctx.fillRect(0, groundY, canvas.width, groundHeight);

    // pet
    if (baseImage.complete && baseImage.naturalWidth > 0)
      ctx.drawImage(baseImage, pet.x, pet.y, pet.w, pet.h);

    requestAnimationFrame(draw);
  }
  draw();

  // === Cleanup ===
  window._modeCleanup = function () {
    running = false;
    if (uiBox) uiBox.remove();
    window.removeEventListener("resize", resizeCanvas);
  };
})();