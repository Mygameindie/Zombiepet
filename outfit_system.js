// ===========================================================
// 👕 outfit_system.js (GLOBAL) — load once, used by every mode
// ===========================================================
(() => {
  // ---------- helpers ----------
  function createImg(src) {
    const img = new Image();
    img._failed = false;
    img.onerror = () => { img._failed = true; };
    img.src = src;
    return img;
  }

  function loadOutfit(prefix) {
    return {
      stand: createImg(`${prefix}_stand.png`),
      fall: createImg(`${prefix}_fall.png`),
      fly0: createImg(`${prefix}_fly0.png`),
      fly1: createImg(`${prefix}_fly1.png`),
      sleep: createImg(`${prefix}_sleep.png`),
    };
  }

  // ---------- global state ----------
  // 0 = base/naked, 1..4 = outfits
  window.currentOutfit = (typeof window.currentOutfit === "number") ? window.currentOutfit : 1;

  // expose outfits globally (so every mode can use it)
  window.outfits = window.outfits || {
    0: loadOutfit("outfit0"),
    1: loadOutfit("outfit1"),
    2: loadOutfit("outfit2"),
    3: loadOutfit("outfit3"),
    4: loadOutfit("outfit4"),
  };

  // ---------- button (idempotent; prevents stacking) ----------
  let clothesBtn = window.clothesBtn;
  if (!clothesBtn) {
    clothesBtn = document.createElement("button");
    clothesBtn.innerText = "Change Clothes";
    clothesBtn.style.position = "fixed";
    clothesBtn.style.bottom = "70px";
    clothesBtn.style.right = "20px";
    clothesBtn.style.padding = "10px 20px";
    clothesBtn.style.fontSize = "16px";
    clothesBtn.style.cursor = "pointer";
    clothesBtn.style.zIndex = "9999";
    document.body.appendChild(clothesBtn);

    window.clothesBtn = clothesBtn;
  }

  function updateButtonLabel() {
    clothesBtn.innerText =
      window.currentOutfit === 0 ? "Change Clothes (Base)" : `Change Clothes (Outfit ${window.currentOutfit})`;
  }
  updateButtonLabel();

  // Returns sorted outfit IDs, always including base (0) at the front.
  function getOutfitCycleList() {
    const ids = window.outfits
      ? Object.keys(window.outfits).map(n => Number(n)).filter(n => Number.isFinite(n))
      : [];
    ids.sort((a, b) => a - b);
    if (!ids.includes(0)) ids.unshift(0);
    return Array.from(new Set(ids));
  }

  if (!clothesBtn._outfitListenerBound) {
    clothesBtn._outfitListenerBound = true;

    clothesBtn.addEventListener("click", () => {
      // ❌ no changing in shower
      if (window._modeName === "shower") return;

      const cycle = getOutfitCycleList();
      if (!cycle.length) { window.currentOutfit = 0; updateButtonLabel(); return; }

      let idx = cycle.indexOf(window.currentOutfit);
      if (idx < 0) idx = 0;

      // advance, skipping outfits with missing stand image
      for (let step = 0; step < cycle.length; step++) {
        idx = (idx + 1) % cycle.length;
        const nextId = cycle[idx];
        window.currentOutfit = nextId;

        if (nextId === 0) break;

        const set = window.outfits && window.outfits[nextId];
        const stand = set && set.stand;
        if (stand && !stand._failed) break;
      }

      updateButtonLabel();
    });
  }

  // ---------- safe draw ----------
  function safeDraw(ctx, img, x, y, w, h) {
    if (!img || img._failed || !img.complete || img.naturalWidth === 0) return false;
    ctx.drawImage(img, x, y, w, h);
    return true;
  }

  // ---------- global render helper ----------
  // Call this AFTER you draw the base image in any mode.
  // state can be: "stand" | "fall" | "fly0" | "fly1" | "sleep"
  // ✅ returns true if something was drawn, else false
  // Optional petIndex param (ignored for single-pet, kept for API compat)
  window.drawOutfitOverlay = function (ctx, state, x, y, w, h, petIndex) {
    if (window._modeName === "shower") return false;           // shower never shows clothes
    const id = (typeof window.currentOutfit === "number") ? window.currentOutfit : 0;
    if (id === 0) return false;                                 // base
    const set = window.outfits && window.outfits[id];
    if (!set) return false;

    // Try requested state first; if missing/failed, fall back to stand.
    let img = set[state];
    if (!img || img._failed || (img.complete && img.naturalWidth === 0)) img = set.stand;

    return safeDraw(ctx, img, x, y, w, h);
  };

  // ---------- helpers for shower ----------
  window.enterShowerClothesRules = function () {
    // ✅ remember previous outfit so we can restore
    if (typeof window._prevOutfitBeforeShower !== "number") {
      window._prevOutfitBeforeShower = window.currentOutfit;
    }
    window.currentOutfit = 0; // force base
    if (window.clothesBtn) window.clothesBtn.style.display = "none";
    updateButtonLabel();
  };

  window.exitShowerClothesRules = function () {
    // ✅ restore previous outfit if available
    if (typeof window._prevOutfitBeforeShower === "number") {
      window.currentOutfit = window._prevOutfitBeforeShower;
      delete window._prevOutfitBeforeShower;
    }
    if (window.clothesBtn) window.clothesBtn.style.display = "block";
    updateButtonLabel();
  };

  // Expose setActivePet (no-op for single pet, kept for API compatibility)
  if (!window.setActivePet) {
    window.setActivePet = function () {};
  }
})();
