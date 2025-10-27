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

  // Auto-load Normal on first open
  loadMode('pet_script.js', 'Normal Mode');
})();