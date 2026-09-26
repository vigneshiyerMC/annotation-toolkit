import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Builds the auto-mounting entry as a native ES module
// (`dist/annotation-toolkit.auto.js`), for the recommended zero-build-step
// `<script type="module" src="...">` usage. Unlike the classic IIFE build
// (vite.iife.config.ts), Rollup's "es" format supports real code-splitting,
// so the dynamic `import('html2canvas')` in capture.ts is emitted as a
// separate chunk that's only fetched the first time a user actually
// captures a screenshot — not paid for on every page load.
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/auto-mount.ts'),
      name: 'AnnotationToolkitAuto',
      fileName: () => 'annotation-toolkit.auto.js',
      formats: ['es'],
    },
    sourcemap: true,
    emptyOutDir: false,
  },
});
