(function () {
  // Idempotent injection.
  // We’re in private scope, so the scope could be more trivial,
  // but this is clearer.
  if (window.customCssByDenisLock) return;
  window.customCssByDenisLock = true;

  const style = document.createElement("style");
  style.setAttribute("data-custom-css-by-denis", "");
  document.head.appendChild(style);

  chrome.runtime.onMessage.addListener(function (msg) {
    if (msg.type === "your-css-changed") {
      style.innerHTML = msg.css;
    }
  });
})();
