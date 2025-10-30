// ===========================================================
// 🎤 ONE-CLICK KARAOKE MODE + AUTO CANCEL ON MODE CHANGE (fixed upload)
// ===========================================================
(() => {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  // === Load pet images ===
  const musicBase1 = new Image();
  const musicBase2 = new Image();
  musicBase1.src = "base_music1.png";
  musicBase2.src = "base_music2.png";

  let loaded = 0;
  const total = 2;
  [musicBase1, musicBase2].forEach(img => {
    img.onload = () => {
      loaded++;
      if (loaded === total) drawIdle();
    };
  });

  let currentBase = musicBase1;
  let animationRunning = false;
  let toggle = false;
  let animationInterval = null;
  let mediaPlayer = null;
  let progressUpdater = null;
  let isPlaying = false;
  let currentMode = "none";
  let isPaused = false;

  // === Resize Canvas ===
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawIdle();
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // === Idle ===
  function drawIdle() {
    if (loaded < total) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scale = 0.3;
    const imgWidth = musicBase1.width * scale;
    const imgHeight = musicBase1.height * scale;
    const x = (canvas.width - imgWidth) / 2;
    const y = canvas.height - imgHeight - 100;
    ctx.drawImage(musicBase1, x, y, imgWidth, imgHeight);
  }

  // === Dance animation ===
  function drawPet() {
    if (!animationRunning || loaded < total) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawIdle();
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scale = 0.3;
    const imgWidth = currentBase.width * scale;
    const imgHeight = currentBase.height * scale;
    const x = (canvas.width - imgWidth) / 2;
    const y = canvas.height - imgHeight - 100;
    ctx.drawImage(currentBase, x, y, imgWidth, imgHeight);

    if (animationRunning) requestAnimationFrame(drawPet);
  }

  // === Upload input ===
  const uploadInput = document.createElement("input");
  uploadInput.type = "file";
  uploadInput.accept = "audio/*,video/*";
  uploadInput.style.display = "none";
  document.body.appendChild(uploadInput);

  // === Progress bar ===
  const progressContainer = document.createElement("div");
  Object.assign(progressContainer.style, {
    position: "fixed",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "80%",
    height: "10px",
    background: "rgba(255,255,255,0.3)",
    borderRadius: "10px",
    overflow: "hidden",
    display: "none",
    zIndex: "9999",
  });
  const progressBar = document.createElement("div");
  Object.assign(progressBar.style, {
    height: "100%",
    width: "0%",
    background: "linear-gradient(90deg, #00bfff, #ff00ff)",
    transition: "width 0.1s linear",
  });
  progressContainer.appendChild(progressBar);
  document.body.appendChild(progressContainer);

  // === Pause button ===
  const pauseBtn = document.createElement("button");
  pauseBtn.textContent = "⏸️ Pause";
  Object.assign(pauseBtn.style, {
    position: "fixed",
    bottom: "40px",
    right: "20px",
    zIndex: "10000",
    display: "none",
    background: "rgba(255,255,255,0.8)",
    border: "2px solid #999",
    borderRadius: "10px",
    padding: "10px 15px",
    fontSize: "18px",
    cursor: "pointer",
  });
  document.body.appendChild(pauseBtn);

  // === Karaoke button (one-click safe upload) ===
  const karaokeBtn = document.getElementById("karaoke-btn");
  karaokeBtn.addEventListener("click", () => {
    if (isPlaying) return;
    currentMode = "karaoke";
    drawIdle();
    uploadInput.click(); // ✅ open file picker under same gesture
  });

  // === Stop karaoke (stop all music + animation) ===
  function stopKaraoke() {
    if (mediaPlayer) {
      try {
        mediaPlayer.pause();
        mediaPlayer.currentTime = 0;
      } catch (e) {}
      mediaPlayer.src = "";
      mediaPlayer.remove();
      mediaPlayer = null;
    }

    clearInterval(animationInterval);
    clearInterval(progressUpdater);
    animationInterval = null;
    progressUpdater = null;
    animationRunning = false;
    toggle = false;

    progressContainer.style.display = "none";
    progressBar.style.width = "0%";
    pauseBtn.style.display = "none";

    currentBase = musicBase1;
    isPlaying = false;
    isPaused = false;
    drawIdle();
  }

  // === Pause/Resume ===
  pauseBtn.addEventListener("click", () => {
    if (!mediaPlayer) return;
    if (!isPaused) {
      mediaPlayer.pause();
      isPaused = true;
      pauseBtn.textContent = "▶️ Resume";
    } else {
      mediaPlayer.play();
      isPaused = false;
      pauseBtn.textContent = "⏸️ Pause";
    }
  });

  // === Detect mode change (instant auto-stop for all buttons) ===
let _modeNameValue = window._modeName || "none";
Object.defineProperty(window, "_modeName", {
  get() {
    return _modeNameValue;
  },
  set(value) {
    const old = _modeNameValue;
    _modeNameValue = value;
    if (old === "karaoke" && value !== "karaoke") {
      stopKaraoke();
      uploadInput.value = "";
    }
    currentMode = value;
  },
});

// ✅ Also catch any click on other mode buttons
document.addEventListener("click", (e) => {
  // If a button changes mode, stop karaoke
  if (
    currentMode === "karaoke" &&
    e.target &&
    e.target.id &&
    e.target.id !== "karaoke-btn"
  ) {
    // common mode button ids you might have
    const id = e.target.id.toLowerCase();
    if (
      id.includes("feed") ||
      id.includes("troll") ||
      id.includes("bath") ||
      id.includes("dance") ||
      id.includes("game") ||
      id.includes("normal") ||
	  id.includes("sleep") ||
      id.includes("mode") // fallback for anything with 'mode'
    ) {
      stopKaraoke();
      uploadInput.value = "";
      window._modeName = id.replace("-btn", "");
      currentMode = window._modeName;
    }
  }
});

  // === File chosen — autoplay-safe ===
  uploadInput.addEventListener("change", async e => {
    const file = e.target.files[0];
    if (!file || isPlaying) return;

    stopKaraoke(); // clean start
    isPlaying = true;

    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith("video/");
    mediaPlayer = document.createElement(isVideo ? "video" : "audio");
    mediaPlayer.src = url;
    mediaPlayer.style.display = "none";
    mediaPlayer.volume = 0.9;
    if (isVideo) {
      mediaPlayer.playsInline = true;
      mediaPlayer.muted = false;
    }
    document.body.appendChild(mediaPlayer);

    // === Start animation ===
    animationRunning = true;
    drawPet();
    clearInterval(animationInterval);
    animationInterval = setInterval(() => {
      currentBase = toggle ? musicBase1 : musicBase2;
      toggle = !toggle;
    }, 400);

    // === Progress bar + pause button ===
    progressContainer.style.display = "block";
    pauseBtn.style.display = "block";
    clearInterval(progressUpdater);
    progressUpdater = setInterval(() => {
      if (!mediaPlayer.duration) return;
      const percent = (mediaPlayer.currentTime / mediaPlayer.duration) * 100;
      progressBar.style.width = `${percent}%`;
    }, 100);

    // ✅ Try to play immediately
    try {
      await mediaPlayer.play();
    } catch (err) {
      const overlay = document.createElement("div");
      overlay.textContent = "🎬 Tap to start playback";
      Object.assign(overlay.style, {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.5)",
        color: "white",
        fontSize: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: "9999",
      });
      document.body.appendChild(overlay);
      const tapToPlay = async () => {
        await mediaPlayer.play();
        overlay.remove();
        document.removeEventListener("click", tapToPlay);
        document.removeEventListener("touchstart", tapToPlay);
      };
      document.addEventListener("click", tapToPlay, { once: true });
      document.addEventListener("touchstart", tapToPlay, { once: true });
    }
  });
})();