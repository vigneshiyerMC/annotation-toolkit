import { mountAnnotationToolkit } from './index';

/**
 * Side-effecting entry used only for the standalone IIFE build
 * (`dist/annotation-toolkit.js`), so a host page can drop in a single
 * `<script src="annotation-toolkit.js"></script>` tag with zero build step
 * and zero extra JS. It auto-mounts the toolkit on load and also exposes
 * `window.AnnotationToolkit` with the full programmatic API for pages that
 * want more control (e.g. multiple instances, custom container).
 *
 * Set `window.__ANNOTATION_TOOLKIT_NO_AUTOMOUNT__ = true` before this script
 * runs to opt out of the automatic mount.
 */

declare global {
  interface Window {
    __ANNOTATION_TOOLKIT_NO_AUTOMOUNT__?: boolean;
    AnnotationToolkit?: typeof api;
  }
}

const api = { mountAnnotationToolkit };

if (typeof window !== 'undefined') {
  window.AnnotationToolkit = api;

  if (!window.__ANNOTATION_TOOLKIT_NO_AUTOMOUNT__) {
    const start = () => mountAnnotationToolkit();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
      start();
    }
  }
}

export { mountAnnotationToolkit };
