import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Builds the legacy, auto-mounting IIFE bundle from src/auto-mount.ts for
// host pages that need a classic (non-module) <script src="..."> tag:
//   <script src="annotation-toolkit.js"></script>
//
// Caveat: Rollup's IIFE format cannot code-split, so the dynamic
// `import('html2canvas')` in capture.ts gets eagerly inlined into this
// single file (~225KB) instead of being fetched lazily on first use. Every
// page load pays that cost even if screenshots are never enabled. Prefer
// `dist/annotation-toolkit.auto.js` (built by vite.auto-es.config.ts) via
// `<script type="module" src="...">` when the host can use ES modules —
// it lazy-loads html2canvas correctly and is ~28KB up front.
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/auto-mount.ts'),
      name: 'AnnotationToolkit',
      fileName: () => 'annotation-toolkit.js',
      formats: ['iife'],
    },
    sourcemap: true,
    emptyOutDir: false,
  },
});
