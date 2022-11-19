const $ = document.querySelector.bind(document);

const invalidTabStep = function () {
  $(".invalid-tab").style.display = "block";
};

const permissionStep = function (domain) {
  $(".request-permission-p").innerText = chrome.i18n.getMessage(
    "need_permission",
    Origins.cosmeticDomain(domain)
  );

  $(".request-permission-button").addEventListener("click", function () {
    const origins = Origins.domainToOrigins(domain);
    Permissions.request(origins).then(function () {
      $(".request-permission").style.display = "none";
      mainStep(domain);
    });
  });

  $(".request-permission").style.display = "block";
};

const mainStep = async function (domain) {
  const initialCss = await Persist.get(domain);

  $(".main-textarea-label").innerText = chrome.i18n.getMessage(
    "main_textarea_label",
    Origins.cosmeticDomain(domain)
  );

  $(".main-textarea").innerHTML = initialCss;

  $(".main-textarea").addEventListener("input", function (e) {
    const css = e.target.value;
    chrome.runtime.sendMessage({
      type: "css-changed",
      css: css,
      domain: domain,
    });
  });

  $(".main").style.display = "block";
};

chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
  if (tabs.length !== 1) return;
  const url = tabs[0].url;
  if (!url) return invalidTabStep();
  const origin = Origins.urlToOrigin(url);
  const domain = Origins.originToDomain(origin);

  const allowed = await Permissions.checkOrigin(origin);
  if (allowed) mainStep(domain);
  else permissionStep(domain);
});
