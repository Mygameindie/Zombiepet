// ===========================================================
// 🎤 KARAOKE MODE — Accepts any file (audio, video, image, etc.)
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
  [musicBase1, musicBase2].forEach(img => {
    img.onload = () => { if (++loaded === 2) drawIdle(); };
  });

  let currentBase = musicBase1;
  let animationRunning = false;
  let toggle = false;
  let animationInterval = null;
  let mediaPlayer = null;   // <audio> or <video> element
  let videoEl = null;       // visible <video> DOM overlay
  let imgBitmap = null;     // loaded image to draw on canvas
  let progressUpdater = null;
  let isPlaying = false;
  let isPaused = false;
  let currentBlobUrl = null;
  let currentFileType = null; // "audio" | "video" | "image" | "unknown"

  // === Resize Canvas ===
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (!isPlaying) drawIdle();
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // === Pet drawing ===
  function petScale() {
    return currentFileType === "video" ? 0.18 : 0.3;
  }

  function drawPetFrame() {
    const scale = petScale();
    const img = animationRunning ? currentBase : musicBase1;
    const iw = img.width * scale;
    const ih = img.height * scale;
    // bottom-center for audio/image; bottom-right corner for video
    const x = currentFileType === "video"
      ? canvas.width - iw - 20
      : (canvas.width - iw) / 2;
    const y = canvas.height - ih - 100;
    if (img.complete && img.naturalWidth > 0) ctx.drawImage(img, x, y, iw, ih);
    // 👕 Outfit overlay (pet dances so alternate fly0/fly1)
    if (window.drawOutfitOverlay)
      window.drawOutfitOverlay(ctx, animationRunning ? (currentBase === musicBase1 ? "fly0" : "fly1") : "stand", x, y, iw, ih);
  }

  function drawIdle() {
    if (loaded < 2) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPetFrame();
  }

  // === Animation RAF loop (for audio & image modes) ===
  let animRaf = null;
  function startPetAnimation() {
    animationRunning = true;
    function tick() {
      if (!animationRunning) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw image background if loaded
      if (imgBitmap) {
        const cw = canvas.width, ch = canvas.height;
        const scale = Math.max(cw / imgBitmap.width, ch / imgBitmap.height);
        const dw = imgBitmap.width * scale;
        const dh = imgBitmap.height * scale;
        ctx.drawImage(imgBitmap, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      }

      drawPetFrame();
      animRaf = requestAnimationFrame(tick);
    }
    tick();
  }

  function stopPetAnimation() {
    animationRunning = false;
    if (animRaf) { cancelAnimationFrame(animRaf); animRaf = null; }
  }

  // === Toolbar UI ===
  const toolbar = document.createElement("div");
  toolbar.id = "karaoke-toolbar";
  toolbar.classList.add("combined-scroll-bar");
  Object.assign(toolbar.style, {
    position: "fixed",
    top: "15px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: "9999",
    display: "flex",
    gap: "8px",
    alignItems: "center",
  });

  function makeBtn(text, onClick) {
    const b = document.createElement("button");
    b.textContent = text;
    b.addEventListener("click", onClick);
    toolbar.appendChild(b);
    return b;
  }

  const uploadBtn  = makeBtn("📂 Upload File", () => { if (!isPlaying) uploadInput.click(); });
  const stopBtn    = makeBtn("⏹️ Stop",   () => stopKaraoke());
  const pauseBtn   = makeBtn("⏸️ Pause",  () => togglePause());
  stopBtn.style.display  = "none";
  pauseBtn.style.display = "none";
  document.body.appendChild(toolbar);

  // Also keep the header karaoke-btn working
  const karaokeBtn = document.getElementById("karaoke-btn");
  const onKaraokeClick = () => { if (!isPlaying) uploadInput.click(); };
  karaokeBtn.addEventListener("click", onKaraokeClick);

  // === Hidden file input — accept EVERYTHING ===
  const uploadInput = document.createElement("input");
  uploadInput.type = "file";
  uploadInput.accept = "*/*";           // no filter — any file
  uploadInput.style.display = "none";
  document.body.appendChild(uploadInput);

  // === Progress bar ===
  const progressContainer = document.createElement("div");
  Object.assign(progressContainer.style, {
    position: "fixed",
    bottom: "80px",
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

  // === File name label ===
  const fileLabel = document.createElement("div");
  Object.assign(fileLabel.style, {
    position: "fixed",
    bottom: "96px",
    left: "50%",
    transform: "translateX(-50%)",
    color: "#fff",
    fontSize: "14px",
    textShadow: "0 1px 4px rgba(0,0,0,0.7)",
    display: "none",
    zIndex: "9999",
    maxWidth: "80%",
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace: "nowrap",
  });
  document.body.appendChild(fileLabel);

  // === Pause / Resume ===
  function togglePause() {
    if (!mediaPlayer) return;
    if (!isPaused) {
      mediaPlayer.pause();
      if (videoEl) videoEl.pause();
      isPaused = true;
      pauseBtn.textContent = "▶️ Resume";
      animationRunning = false;
    } else {
      mediaPlayer.play();
      if (videoEl) videoEl.play();
      isPaused = false;
      pauseBtn.textContent = "⏸️ Pause";
      if (currentFileType !== "video") startPetAnimation();
      else animationRunning = true;
    }
  }

  // === Stop everything ===
  function stopKaraoke() {
    stopPetAnimation();

    if (mediaPlayer) {
      try { mediaPlayer.pause(); mediaPlayer.currentTime = 0; } catch {}
      mediaPlayer.src = "";
      mediaPlayer.remove();
      mediaPlayer = null;
    }
    videoEl = null;
    if (currentBlobUrl) {
      URL.revokeObjectURL(currentBlobUrl);
      currentBlobUrl = null;
    }
    imgBitmap = null;

    clearInterval(animationInterval);
    clearInterval(progressUpdater);
    animationInterval = null;
    progressUpdater = null;
    toggle = false;

    progressContainer.style.display = "none";
    progressBar.style.width = "0%";
    fileLabel.style.display = "none";
    stopBtn.style.display  = "none";
    pauseBtn.style.display = "none";
    uploadBtn.textContent  = "📂 Upload File";

    currentBase = musicBase1;
    currentFileType = null;
    isPlaying = false;
    isPaused = false;
    drawIdle();
  }

  // === Detect file type ===
  function detectType(file) {
    const mime = file.type || "";
    if (mime.startsWith("audio/")) return "audio";
    if (mime.startsWith("video/")) return "video";
    if (mime.startsWith("image/")) return "image";
    // Fallback: check extension
    const ext = file.name.split(".").pop().toLowerCase();
    const audioExts = ["mp3","wav","ogg","flac","aac","m4a","opus","wma","aiff"];
    const videoExts = ["mp4","mov","avi","webm","mkv","m4v","wmv","flv","3gp","ogv"];
    const imageExts = ["jpg","jpeg","png","gif","webp","bmp","svg","avif","tiff","ico"];
    if (audioExts.includes(ext)) return "audio";
    if (videoExts.includes(ext)) return "video";
    if (imageExts.includes(ext)) return "image";
    return "unknown";
  }

  // === Show an on-canvas message ===
  function showMessage(text, subtext = "") {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 36px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 - 20);
    if (subtext) {
      ctx.font = "20px Arial";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText(subtext, canvas.width / 2, canvas.height / 2 + 24);
    }
  }

  // === Start progress bar tracking ===
  function startProgress() {
    progressContainer.style.display = "block";
    clearInterval(progressUpdater);
    progressUpdater = setInterval(() => {
      if (!mediaPlayer || !mediaPlayer.duration) return;
      progressBar.style.width = `${(mediaPlayer.currentTime / mediaPlayer.duration) * 100}%`;
    }, 100);
  }

  // === Start frame-swap animation interval ===
  function startFrameSwap() {
    clearInterval(animationInterval);
    animationInterval = setInterval(() => {
      currentBase = toggle ? musicBase1 : musicBase2;
      toggle = !toggle;
    }, 400);
  }

  // === Try to play a media element, show overlay if blocked ===
  async function tryPlay(el) {
    try {
      await el.play();
    } catch {
      // Autoplay blocked — show tap-to-start overlay
      const overlay = document.createElement("div");
      overlay.textContent = "▶️ Tap to start";
      Object.assign(overlay.style, {
        position: "fixed", inset: "0", display: "flex",
        alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.55)", color: "#fff",
        fontSize: "28px", zIndex: "10001", cursor: "pointer",
      });
      document.body.appendChild(overlay);
      const tap = async () => {
        try { await el.play(); } catch {}
        overlay.remove();
      };
      overlay.addEventListener("click", tap, { once: true });
      overlay.addEventListener("touchstart", tap, { once: true });
    }
  }

  // === Handle: AUDIO ===
  async function handleAudio(file) {
    currentFileType = "audio";
    mediaPlayer = document.createElement("audio");
    mediaPlayer.src = currentBlobUrl;
    mediaPlayer.volume = 0.9;
    mediaPlayer.style.display = "none";
    document.body.appendChild(mediaPlayer);

    startFrameSwap();
    startPetAnimation();
    startProgress();
    await tryPlay(mediaPlayer);
    mediaPlayer.addEventListener("ended", stopKaraoke, { once: true });
  }

  // === Handle: VIDEO (audio only — pet dances, no video shown) ===
  async function handleVideo(file) {
    currentFileType = "video";

    // Play through an <audio> element — extracts the audio track from video files
    mediaPlayer = document.createElement("audio");
    mediaPlayer.src = currentBlobUrl;
    mediaPlayer.volume = 0.9;
    mediaPlayer.style.display = "none";
    document.body.appendChild(mediaPlayer);

    startFrameSwap();
    startPetAnimation();
    startProgress();
    await tryPlay(mediaPlayer);
    mediaPlayer.addEventListener("ended", stopKaraoke, { once: true });
  }

  // === Handle: IMAGE ===
  async function handleImage(file) {
    currentFileType = "image";

    // Load image via createImageBitmap for canvas drawing
    try {
      imgBitmap = await createImageBitmap(file);
    } catch {
      showMessage("🖼️ Couldn't load image");
      isPlaying = false;
      return;
    }

    // No audio — just pet dancing in front of image
    startFrameSwap();
    startPetAnimation();
    // No progress bar (no duration)
  }

  // === Handle: UNKNOWN ===
  async function handleUnknown(file) {
    currentFileType = "unknown";
    // Try treating it as audio — works for many formats browsers support
    mediaPlayer = document.createElement("audio");
    mediaPlayer.src = currentBlobUrl;
    mediaPlayer.volume = 0.9;
    mediaPlayer.style.display = "none";
    document.body.appendChild(mediaPlayer);

    // Test if it can play
    mediaPlayer.load();
    await new Promise(res => {
      mediaPlayer.addEventListener("canplay", res, { once: true });
      mediaPlayer.addEventListener("error", res, { once: true });
      setTimeout(res, 2000); // give up after 2s
    });

    if (mediaPlayer.error || mediaPlayer.readyState === 0) {
      // Can't play — show message
      showMessage("🤷 Can't play this file", file.name);
      await new Promise(r => setTimeout(r, 2500));
      stopKaraoke();
      return;
    }

    startFrameSwap();
    startPetAnimation();
    startProgress();
    await tryPlay(mediaPlayer);
    mediaPlayer.addEventListener("ended", stopKaraoke, { once: true });
  }

  // === File chosen ===
  uploadInput.addEventListener("change", async e => {
    const file = e.target.files[0];
    uploadInput.value = ""; // reset so same file can be re-uploaded
    if (!file || isPlaying) return;

    stopKaraoke();
    isPlaying = true;

    currentBlobUrl = URL.createObjectURL(file);
    const type = detectType(file);

    // Update UI
    fileLabel.textContent = file.name;
    fileLabel.style.display = "block";
    stopBtn.style.display  = "inline-block";
    pauseBtn.style.display = type === "image" ? "none" : "inline-block";
    uploadBtn.textContent  = "📂 Change File";

    if (type === "audio")   await handleAudio(file);
    else if (type === "video")  await handleVideo(file);
    else if (type === "image")  await handleImage(file);
    else                        await handleUnknown(file);
  });

  // === Detect mode change via _modeName setter ===
  const origDescriptor = Object.getOwnPropertyDescriptor(window, "_modeName");
  let _modeNameValue = window._modeName || "none";
  Object.defineProperty(window, "_modeName", {
    configurable: true,
    enumerable: true,
    get() { return _modeNameValue; },
    set(value) {
      const old = _modeNameValue;
      _modeNameValue = value;
      if (old === "karaoke" && value !== "karaoke") {
        stopKaraoke();
        uploadInput.value = "";
      }
    },
  });

  // === Cleanup ===
  window._modeCleanup = function () {
    stopKaraoke();
    window.removeEventListener("resize", resizeCanvas);
    karaokeBtn.removeEventListener("click", onKaraokeClick);
    toolbar.remove();
    uploadInput.remove();
    progressContainer.remove();
    fileLabel.remove();
    try {
      if (origDescriptor) {
        Object.defineProperty(window, "_modeName", origDescriptor);
      } else {
        Object.defineProperty(window, "_modeName", {
          configurable: true, enumerable: true, writable: true,
          value: _modeNameValue,
        });
      }
    } catch {}
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  window._modeName = "karaoke";
})();
