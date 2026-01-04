/**************************************************
 * pet_link.js (MODE-AWARE CONNECTOR)
 **************************************************/

(function () {
  let plusCleanup = null;

  function attachScriptPlus() {
    if (window.initScriptPlus) {
      plusCleanup = window.initScriptPlus();
    }
  }

  function detachScriptPlus() {
    if (typeof plusCleanup === "function") {
      try { plusCleanup(); } catch {}
    }
    plusCleanup = null;
  }

  // When normal mode loaded
  window.addEventListener("pet:mode:normal", () => {
    attachScriptPlus();
  });

  // When any mode unloads
  window.addEventListener("pet:mode:unload", () => {
    detachScriptPlus();
  });
})();