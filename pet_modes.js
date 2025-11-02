// ===========================================================
// 🧱 GLOBAL FOCUS & INPUT LOCK (prevents focus/scroll/zoom)
// ===========================================================
(function () {
  document.body.style.userSelect = "none";
  document.body.style.webkitUserSelect = "none";
  document.body.style.touchAction = "none";
  document.body.style.overflow = "hidden";
  document.body.style.margin = "0";
  document.body.style.padding = "0";
  document.body.style.height = "100vh";

  window.addEventListener("keydown", (e) => {
    const keys = [" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    if (keys.includes(e.key)) e.preventDefault();
  });

  let lastTouch = 0;
  document.addEventListener(
    "touchend",
    (e) => {
      const now = Date.now();
      if (now - lastTouch < 350) e.preventDefault();
      lastTouch = now;
    },
    { passive: false }
  );
})();

// ===========================================================
// 🎧 GLOBAL SOUND MANAGER
// ===========================================================
if (!window.SoundManager) {
  window.SoundManager = {
    active: [],
    register(s) {
      this.active.push(s);
    },
    stopAll() {
      this.active.forEach(a => {
        try {
          a.pause();
          a.currentTime = 0;
        } catch {}
      });
      this.active = [];
    },
    playClone(base, volume = 0.9) {
      try {
        const s = base.cloneNode();
        s.volume = volume;
        s.play().catch(() => {});
        this.register(s);
      } catch {}
    }
  };
}

// ===========================================================
// 🧩 MODE MANAGER — All modes are now full modes
// ===========================================================
(function () {
  const hint = document.getElementById("hint");
  let activeScriptEl = null;

  function unloadActiveMode() {
    // 1️⃣ Cleanup function
    if (window._modeCleanup && typeof window._modeCleanup === "function") {
      try { window._modeCleanup(); } catch (e) { console.warn("cleanup error", e); }
    }
    window._modeCleanup = null;
    window._modeName = null;

    // 2️⃣ Remove leftover UI elements (reset/game overlays etc.)
    document.querySelectorAll(".mode-ui, .game-ui, #reset-button").forEach(el => el.remove());

    // 3️⃣ Remove script element
    if (activeScriptEl) {
      activeScriptEl.remove();
      activeScriptEl = null;
    }
  }

  function loadMode(src, label) {
    if (window.SoundManager) SoundManager.stopAll();

    // Always unload previous mode
    unloadActiveMode();

    const s = document.createElement("script");
    s.src = src + "?v=" + Date.now(); // cache-bust for dev
    s.onload = () => {
      if (hint) hint.textContent = `${label} Loaded`;
      window._modeName = label;
    };
    s.onerror = () => {
      console.error("Failed to load", src);
      if (hint) hint.textContent = `Error loading ${label}`;
    };
    document.body.appendChild(s);
    activeScriptEl = s;
  }

  // 🎮 MODE BUTTONS
  document.getElementById("normal-btn").addEventListener("click", () => {
    loadMode("pet_script.js", "Normal Mode");
  });

  document.getElementById("karaoke-btn").addEventListener("click", () => {
    loadMode("music.js", "Karaoke Mode");
  });

  document.getElementById("feed-btn").addEventListener("click", () => {
    loadMode("pet_multi_feed.js", "Feeding Mode");
  });

  document.getElementById("shower-btn").addEventListener("click", () => {
    loadMode("pet_shower.js", "Shower Mode");
  });

  document.getElementById("troll-btn").addEventListener("click", () => {
    loadMode("trolling.js", "Trolling Mode");
  });

  document.getElementById("sleep-btn").addEventListener("click", () => {
    loadMode("pet_sleep.js", "Sleep Mode");
  });

  document.getElementById("game-btn").addEventListener("click", () => {
    loadMode("pet_game.js", "Game Mode");
  });

  document.getElementById("swing-btn").addEventListener("click", () => {
  loadMode("swing.js", "Swing Mode");
});

  // Auto-load Normal Mode
  loadMode("pet_script.js", "Normal Mode");
})();

// ===========================================================
// 🌐 UNIVERSAL MODE HANDLER
// ===========================================================
window.switchMode = function (newModeInit) {
  if (window._modeCleanup) {
    try { window._modeCleanup(); } catch (e) {
      console.warn("Previous mode cleanup failed:", e);
    }
  }
  window._modeCleanup = null;
  window._modeName = null;
  if (typeof newModeInit === "function") newModeInit();
};