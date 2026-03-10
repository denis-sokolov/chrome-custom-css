import { Origins } from "../lib/origins.js";
import { Permissions } from "../lib/permissions.js";
import { Persist } from "../lib/persist.js";

const $ = document.querySelector.bind(document) as (
  selector: string
) => HTMLElement;

const invalidTabStep = function () {
  $(".invalid-tab").style.display = "block";
};

const permissionStep = function (domain: string) {
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

const mainStep = async function (domain: string) {
  let currentSettings = await Persist.get(domain);

  $(".main-textarea-label").innerText = chrome.i18n.getMessage(
    "main_textarea_label",
    Origins.cosmeticDomain(domain)
  );

  $(".main").style.display = "block";

  // Have to create the editor after the element is visible,
  // or initially the cursor is not displayed.
  // @ts-expect-error
  const editor = CodeMirror.fromTextArea($(".main-textarea"), {
    autofocus: true,
  });

  function sync() {
    chrome.runtime.sendMessage({
      type: "settings-changed",
      settings: currentSettings,
      domain: domain,
    });
  }

  editor.on("change", function () {
    currentSettings.css = editor.getValue();
    sync();

    const maxlength = $(".main-textarea").getAttribute("maxlength");
    if (currentSettings.css.length > Number(maxlength))
      $(".main").dataset["tooLong"] = true as never as string;
    else delete $(".main").dataset["tooLong"];
  });

  editor.setValue(currentSettings.css);

  const textInput = $(".text-attributes input") as HTMLInputElement;
  textInput.value = currentSettings.textAttributesSelector;
  textInput.addEventListener("input", function () {
    currentSettings.textAttributesSelector = textInput.value;
    sync();
  });
};

chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
  if (tabs.length !== 1) return;
  const url = tabs[0]!.url;
  if (!url) return invalidTabStep();
  const origin = Origins.urlToOrigin(url);
  const domain = Origins.originToDomain(origin);

  const allowed = await Permissions.checkOrigin(origin);
  if (allowed) mainStep(domain);
  else permissionStep(domain);
});
