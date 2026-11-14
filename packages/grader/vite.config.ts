import { defineConfig } from 'vite';

// The demo page lives in demo/ and imports the engine from ../src and the
// sample questions from ../questions.
export default defineConfig({
  root: 'demo',
  base: './',
  build: {
    outDir: '../dist/demo',
    emptyOutDir: true,
  },
});
