// pet_modes.js
// Controls which mode is active. Ensures only ONE mode script runs at a time.

(function () {
  const hint = document.getElementById('hint-text');

  let activeScriptEl = null;

  function unloadActiveMode() {
    // Call cleanup from the currently loaded mode if provided
    if (window._modeCleanup && typeof window._modeCleanup === 'function') {
      try { window._modeCleanup(); } catch (e) { console.warn('cleanup error', e); }
    }
    window._modeCleanup = null;
    window._modeName = null;

    // Remove previously injected script element
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
      
    };
    s.onerror = () => {

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

  // Auto-load Normal on first open
  loadMode('pet_script.js', 'Normal Mode');
})();
