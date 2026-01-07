import { EditorView, basicSetup } from 'codemirror';
import { css } from '@codemirror/lang-css';
import { placeholder } from '@codemirror/view';

// Export everything needed for the popup
window.CodeMirrorBundle = {
  EditorView,
  basicSetup,
  css,
  placeholder
};
