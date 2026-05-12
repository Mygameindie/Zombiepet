// Connect mode action events to the existing PetStats API.
(() => {
  window.addEventListener("pet:happiness:changed", () => {
    if (window.PetStats && typeof window.PetStats.troll === "function") {
      window.PetStats.troll(0);
    }
  });
})();
