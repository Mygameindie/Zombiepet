/**************************************************
 * script_plus.js — Sit Pose (FINAL FIRST-LOAD FIX)
 **************************************************/

(function () {

  // =========================================================
  // ⭐ EDIT SIT SIZE HERE ⭐
  // =========================================================
  const SIT_WIDTH  = 135;
  const SIT_HEIGHT = 230;

  // =========================================================
  // INTERNAL STATE
  // =========================================================
  let btn = null;
  let sitMode = false;
  let sitFrame = 0;
  let sitTimer = 0;
  let initialized = false;

  // =========================================================
  // IMAGE LOADING (SAFE)
  // =========================================================
  const sit1 = new Image();
  const sit2 = new Image();

  let ready1 = false;
  let ready2 = false;

  sit1.onload = () => ready1 = true;
  sit2.onload = () => ready2 = true;

  sit1.onerror = () => console.error("❌ sit1.png failed to load");
  sit2.onerror = () => console.error("❌ sit2.png failed to load");

  sit1.src = "sit1.png";
  sit2.src = "sit2.png";

  // =========================================================
  // POSE LOOP
  // =========================================================
  function sitPoseLoop() {
    if (!ready1 || !ready2) return null;

    sitTimer++;
    if (sitTimer > 20) {
      sitTimer = 0;
      sitFrame = (sitFrame + 1) % 2;
    }

    return {
      img: sitFrame === 0 ? sit1 : sit2,
      w: SIT_WIDTH,
      h: SIT_HEIGHT
    };
  }

  // =========================================================
  // STATE CONTROL
  // =========================================================
  function enableSit() {
    sitMode = true;
    window.PET_POSE_OVERRIDE = sitPoseLoop;
    if (btn) btn.textContent = "Normal";
  }

  function disableSit() {
    sitMode = false;
    window.PET_POSE_OVERRIDE = null;
    if (btn) btn.textContent = "Sit";
  }

  function toggleSit() {
    sitMode ? disableSit() : enableSit();
  }

  // =========================================================
  // EXIT SIT WHEN USER INTERACTS WITH PET
  // =========================================================
  function exitSitByInteraction() {
    if (sitMode) disableSit();
  }

  function attachExitListeners() {
    const canvas = document.getElementById("canvas");
    if (!canvas) return;

    canvas.addEventListener("mousedown", exitSitByInteraction);
    canvas.addEventListener("touchstart", exitSitByInteraction, { passive: true });
  }

  function detachExitListeners() {
    const canvas = document.getElementById("canvas");
    if (!canvas) return;

    canvas.removeEventListener("mousedown", exitSitByInteraction);
    canvas.removeEventListener("touchstart", exitSitByInteraction);
  }

  // =========================================================
  // BUTTON
  // =========================================================
  function createButton() {
    if (btn && document.body.contains(btn)) return;

    btn = document.createElement("button");
    btn.id = "sit-btn";
    btn.className = "mode-ui sit-btn";
    btn.textContent = "Sit";

    btn.addEventListener("click", toggleSit);
    document.body.appendChild(btn);

    disableSit();
  }

  // =========================================================
  // INIT / CLEANUP
  // =========================================================
  function init() {
    if (initialized) return;
    initialized = true;

    createButton();
    attachExitListeners();
  }

  function cleanup() {
    initialized = false;
    disableSit();
    detachExitListeners();

    if (btn) {
      btn.removeEventListener("click", toggleSit);
      btn.remove();
      btn = null;
    }
  }

  // =========================================================
  // MODE EVENTS
  // =========================================================
  window.addEventListener("pet:mode:normal", () => {
    cleanup();
    init();
  });

  window.addEventListener("pet:mode:unload", cleanup);

  // =========================================================
  // 🔥 FIRST LOAD GUARANTEE 🔥
  // =========================================================
  if (window._modeName === "normal") {
    init(); // ← THIS is the missing piece
  }

})();