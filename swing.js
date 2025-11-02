// ===========================================================
// 🪁 pet_swing.js — Real Gravity Strength (Low = Floaty, High = Fast)
// ===========================================================
(() => {
  if (window.SoundManager) SoundManager.stopAll();
  window._modeName = "swing";

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  const swingImg = new Image();
  swingImg.src = "base_swing.png";

  const swing = {
    x: 0,
    y: 0,
    w: 200,
    h: 1000,
    angle: 0,
    velocity: 0,
    pulling: false,
    pullAngle: 0,
  };

  // === physics parameters ===
  let GRAVITY = 9.8;   // dynamic
  let DAMPING = 0.995; // air resistance
  const MAX_PULL = 50; // max pull angle
  const PIVOT_ABOVE = 250;
  const ROPE_OFFSET = 200;

  // === resize ===
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    swing.x = canvas.width / 2;
    swing.y = -PIVOT_ABOVE;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // ===========================================================
  // ⚡ Force Slider (pull left)
  // ===========================================================
  let power = 0;
  const forceSlider = document.createElement("input");
  Object.assign(forceSlider, { type: "range", min: "0", max: "100", value: "0" });
  Object.assign(forceSlider.style, {
    position: "fixed",
    left: "50%",
    bottom: "40px",
    transform: "translateX(-50%)",
    width: "300px",
    height: "16px",
    zIndex: "9999",
    appearance: "none",
    background: "linear-gradient(90deg, #39f, #4ef)",
    borderRadius: "10px",
    boxShadow: "0 0 6px rgba(0,0,0,0.3)",
  });
  document.body.appendChild(forceSlider);

  // ===========================================================
  // 🌍 Gravity Slider (controls gravity strength)
  // ===========================================================
  const gravitySlider = document.createElement("input");
  Object.assign(gravitySlider, {
    type: "range",
    min: "1",  // start at 1 for visible movement
    max: "25", // up to 25 for fast gravity
    step: "0.1",
    value: GRAVITY,
  });
  Object.assign(gravitySlider.style, {
    position: "fixed",
    left: "50%",
    bottom: "80px",
    transform: "translateX(-50%)",
    width: "300px",
    height: "16px",
    zIndex: "9999",
    appearance: "none",
    background: "linear-gradient(90deg, #0af, #f93)",
    borderRadius: "10px",
    boxShadow: "0 0 6px rgba(0,0,0,0.3)",
  });
  document.body.appendChild(gravitySlider);

  // === slider thumb style ===
  const style = document.createElement("style");
  style.textContent = `
    input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: white;
      border: 2px solid #007bff;
      box-shadow: 0 0 4px rgba(0,0,0,0.3);
      cursor: pointer;
      transition: transform 0.1s;
    }
    input[type=range]::-webkit-slider-thumb:active {
      transform: scale(1.2);
    }
  `;
  document.head.appendChild(style);

  // ===========================================================
  // 🎮 Force Control
  // ===========================================================
  forceSlider.addEventListener("input", () => {
    power = forceSlider.value / 100;
    swing.pulling = true;
    swing.pullAngle = -power * MAX_PULL; // tilt left
  });

  forceSlider.addEventListener("change", () => {
    swing.pulling = false;
    swing.angle = swing.pullAngle;
    swing.velocity = 0;
    swing.pullAngle = 0;
    power = 0;
    forceSlider.value = 0;
  });

  // ===========================================================
  // 🌌 Gravity Control
  // ===========================================================
  gravitySlider.addEventListener("input", () => {
    GRAVITY = parseFloat(gravitySlider.value);
  });

  // ===========================================================
  // 🧮 Physics
  // ===========================================================
  function updatePhysics() {
    if (swing.pulling) return;

    // Pendulum gravity force
    const accel = -GRAVITY * Math.sin((swing.angle * Math.PI) / 180);
    swing.velocity += accel;
    swing.angle += swing.velocity;
    swing.velocity *= DAMPING;

    // bounce back within 180°
    if (swing.angle > 180) swing.angle = 180;
    if (swing.angle < -180) swing.angle = -180;
  }

  // ===========================================================
  // 🎨 Draw
  // ===========================================================
  function drawSwing() {
    ctx.save();
    ctx.translate(swing.x, swing.y);
    const angle = swing.pulling ? swing.pullAngle : swing.angle;
    ctx.rotate((angle * Math.PI) / 180);
    ctx.translate(-swing.w / 2, ROPE_OFFSET);
    if (swingImg.complete && swingImg.naturalWidth > 0) {
      ctx.drawImage(swingImg, 0, 0, swing.w, swing.h);
    }
    ctx.restore();
  }

  function drawText() {
    ctx.font = "18px Arial";
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.fillText("⬅️ Pull Left → Release → Swing", canvas.width / 2, canvas.height - 160);
    ctx.fillText(`Gravity: ${GRAVITY.toFixed(1)} (higher = faster swing)`, canvas.width / 2, canvas.height - 130);
    ctx.fillText(`Angle: ${swing.angle.toFixed(1)}°`, canvas.width / 2, canvas.height - 100);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawSwing();
    drawText();
  }

  // ===========================================================
  // 🔁 Loop
  // ===========================================================
  let running = true;
  let raf;
  function loop() {
    if (!running) return;
    updatePhysics();
    draw();
    raf = requestAnimationFrame(loop);
  }
  loop();

  // ===========================================================
  // 🧹 Cleanup
  // ===========================================================
  window._modeCleanup = function () {
    running = false;
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resizeCanvas);
    forceSlider.remove();
    gravitySlider.remove();
    style.remove();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const newCanvas = canvas.cloneNode(true);
    canvas.parentNode.replaceChild(newCanvas, canvas);
  };
})();