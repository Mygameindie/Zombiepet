// ===========================================================
// 🎧 GLOBAL SOUND MANAGER (shared across all modes)
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

// pet_modes.js
// Controls which mode is active. Ensures only ONE mode script runs at a time.

(function () {
  const hint = document.getElementById('hint-text');

  let activeScriptEl = null;

  function unloadActiveMode() {
    if (window._modeCleanup && typeof window._modeCleanup === 'function') {
      try { window._modeCleanup(); } catch (e) { console.warn('cleanup error', e); }
    }
    window._modeCleanup = null;
    window._modeName = null;

    if (activeScriptEl) {
      activeScriptEl.remove();
      activeScriptEl = null;
    }
  }

  function loadMode(src, label) {
	  if (window.SoundManager) SoundManager.stopAll();
    unloadActiveMode();

    const s = document.createElement('script');
    s.src = src + '?v=' + Date.now(); // cache-bust during dev
    s.onload = () => {
      if (hint) hint.textContent = label + ' Loaded';

      window._modeName = label;
    };
    s.onerror = () => {
      console.error('Failed to load', src);
      if (hint) hint.textContent = 'Error loading ' + label;
    };
    document.body.appendChild(s);
    activeScriptEl = s;
  }

  document.getElementById('normal-btn').addEventListener('click', () => {
    loadMode('pet_script.js', 'Normal Mode');
  });
    // 🎤 New Karaoke Mode
  document.getElementById('karaoke-btn').addEventListener('click', () => {
    loadMode('music.js', 'Karaoke Mode');
  });

  document.getElementById('feed-btn').addEventListener('click', () => {
    loadMode('pet_multi_feed.js', 'Feeding Mode');
  });

  document.getElementById('shower-btn').addEventListener('click', () => {
    loadMode('pet_shower.js', 'Shower Mode');
  });

  // 🧈 New Trolling Mode
  document.getElementById('troll-btn').addEventListener('click', () => {
    loadMode('trolling.js', 'Trolling Mode');
  });

    // 😴 New Sleep Mode
  document.getElementById('sleep-btn').addEventListener('click', () => {
    loadMode('pet_sleep.js', 'Sleep Mode');
  });
  
  // Auto-load Normal on first open
  loadMode('pet_script.js', 'Normal Mode');
})();