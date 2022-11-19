var elements = document.querySelectorAll("[data-i18n]");
Array.prototype.forEach.call(elements, function (el) {
  el.innerText =
    chrome.i18n.getMessage(el.getAttribute("data-i18n")) ||
    el.getAttribute("data-i18n");
});
