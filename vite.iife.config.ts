import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Builds the standalone, auto-mounting IIFE bundle from src/auto-mount.ts
// so a host page can use it via a single zero-build-step <script> tag:
//   <script src="annotation-toolkit.js"></script>
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
