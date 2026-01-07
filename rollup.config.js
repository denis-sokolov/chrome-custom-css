import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/popup/codemirror-bundle.js',
  output: {
    file: '.tmp/codemirror.bundle.js',
    format: 'iife',
    name: 'CodeMirrorBundle',
    sourcemap: false
  },
  plugins: [
    nodeResolve(),
    terser()
  ]
};
