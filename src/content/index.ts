/**
 * We do this over chrome.scripting.insertCSS as the latter adds the styles with
 * a lower priority than the <style> tag at the end of <head>.
 */

(function () {
  // Idempotent injection.
  // We’re in private scope, so the scope could be more trivial,
  // but this is clearer.
  if ((window as any).customCssByDenisLock) return;
  (window as any).customCssByDenisLock = true;

  const style = document.createElement("style");
  style.setAttribute("data-custom-css-by-denis", "");
  document.head.appendChild(style);

  const textLength = 300;

  const applyTextAttribute = function (el: Element) {
    const text = el.textContent;
    if (text && text.trim()) el.setAttribute("text", text.slice(0, textLength));
    else el.removeAttribute("text");
  };

  let textAttributeObserver: MutationObserver | null = null;
  let textAttributeSelector: string | null = null;
  const updateTextAttributes = function (selector: string) {
    selector = selector.trim();
    if (selector === textAttributeSelector && textAttributeObserver) return;
    if (textAttributeObserver) {
      textAttributeObserver.disconnect();
      textAttributeObserver = null;
    }
    document
      .querySelectorAll("[text]")
      .forEach((el) => el.removeAttribute("text"));
    textAttributeSelector = selector;
    if (!selector) return;

    let elements;
    try {
      elements = document.querySelectorAll(selector);
    } catch (e) {
      /* Invalid selector */ return;
    }
    elements.forEach(applyTextAttribute);
    textAttributeObserver = new MutationObserver(function (mutations) {
      const toUpdate = new Set<Element>();
      mutations.forEach(function (mutation) {
        let node: Node | null = mutation.target;
        if (node.nodeType === Node.TEXT_NODE) {
          node = node.parentElement;
          if (!node) return;
        }
        while (node && node.nodeType === Node.ELEMENT_NODE) {
          toUpdate.add(node as Element);
          node = node.parentElement;
        }
        mutation.addedNodes.forEach(function (added) {
          if (added.nodeType === Node.ELEMENT_NODE) {
            toUpdate.add(added as Element);
            (added as Element)
              .querySelectorAll("*")
              .forEach((child) => toUpdate.add(child));
          }
        });
      });
      toUpdate.forEach(function (el) {
        if (el.matches(selector)) applyTextAttribute(el);
      });
    });
    textAttributeObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  };

  chrome.runtime.onMessage.addListener(function (msg) {
    if (msg.type === "your-settings-changed") {
      style.innerHTML = msg.settings.css;
      updateTextAttributes(msg.settings.textAttributesSelector);
    }
  });
})();
