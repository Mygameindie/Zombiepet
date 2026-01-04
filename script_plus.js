/**************************************************
 * script_plus.js — Sit Pose Toggle (FINAL + FIX SIZE)
 * Sit size: h = 100px, w = 50px
 **************************************************/

(function () {

  let btn = null;
  let sitMode = false;
  let sitFrame = 0;
  let sitTimer = 0;

  // =========================================================
  // IMAGE LOADING
  // =========================================================
  const sit1 = new Image();
  const sit2 = new Image();

  let sitReady1 = false;
  let sitReady2 = false;

  sit1.onload = () => sitReady1 = true;
  sit2.onload = () => sitReady2 = true;

  sit1.src = "sit1.png";
  sit2.src = "sit2.png";

  // =========================================================
  // FIXED SIZE (⭐ EDIT HERE)
  // =========================================================
  const SIT_HEIGHT = 230; // px
  const SIT_WIDTH  = 135;  // px

  // =========================================================
  // POSE LOOP
  // =========================================================
  function sitPoseLoop() {
    if (!sitReady1 || !sitReady2) return null;

    sitTimer++;
    if (sitTimer > 20) {
      sitTimer = 0;
      sitFrame = (sitFrame + 1) % 2;
    }

    const img = sitFrame === 0 ? sit1 : sit2;

    // ⭐ ATTACH SIZE FOR CANVAS RENDERER
    img._forceWidth  = SIT_WIDTH;
    img._forceHeight = SIT_HEIGHT;

    return img;
  }

  // =========================================================
  // STATE
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
  // EXIT ON CLICK
  // =========================================================
  function exitSit() {
    if (sitMode) disableSit();
  }

  // =========================================================
  // BUTTON
  // =========================================================
  function createButton() {
    if (btn) return;

    btn = document.createElement("button");
    btn.id = "sit-btn";
    btn.className = "mode-ui sit-btn";
    btn.textContent = "Sit";
    btn.addEventListener("click", toggleSit);
    document.body.appendChild(btn);
  }

  // =========================================================
  // INIT
  // =========================================================
  function init() {
    createButton();

    const canvas = document.getElementById("canvas");
    if (canvas) {
      canvas.addEventListener("mousedown", exitSit);
      canvas.addEventListener("touchstart", exitSit, { passive: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();