const $ = document.querySelector.bind(document);

const MAX_CSS_LENGTH = 7500;

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

  $(".main").style.display = "block";

  // Get the textarea element
  const textarea = $(".main-textarea");
  const maxlength = parseInt(textarea.getAttribute('maxlength') || MAX_CSS_LENGTH, 10);
  
  // Replace textarea with a div for CodeMirror 6
  const editorContainer = document.createElement('div');
  editorContainer.className = 'main-editor';
  textarea.parentNode.insertBefore(editorContainer, textarea);
  textarea.style.display = 'none';

  // Create CodeMirror 6 editor
  const { EditorView, basicSetup, css, placeholder } = window.CodeMirrorBundle;
  
  const editor = new EditorView({
    doc: initialCss,
    extensions: [
      basicSetup,
      css(),
      placeholder(textarea.getAttribute('placeholder') || ''),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const cssContent = editor.state.doc.toString();
          chrome.runtime.sendMessage({
            type: "css-changed",
            css: cssContent,
            domain: domain,
          });

          if (cssContent.length > maxlength) {
            $('.main').dataset.tooLong = true;
          } else {
            delete $('.main').dataset.tooLong;
          }
        }
      })
    ],
    parent: editorContainer
  });

  // Focus the editor
  editor.focus();
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
