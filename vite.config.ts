import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Library-mode build producing the programmatic outputs:
//  - ES module (for bundlers / `import { mountAnnotationToolkit } from 'annotation-toolkit'`)
//  - CommonJS module (for Node/require consumers)
// The auto-mounting IIFE `<script>` bundle is built separately by
// vite.iife.config.ts from a different entry (src/auto-mount.ts), since it
// needs side-effecting auto-mount behavior that the ESM/CJS entry must not have.
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'AnnotationToolkit',
      fileName: (format) => (format === 'es' ? 'annotation-toolkit.es.js' : 'annotation-toolkit.cjs.js'),
      formats: ['es', 'cjs'],
    },
    sourcemap: true,
    emptyOutDir: false,
  },
});
