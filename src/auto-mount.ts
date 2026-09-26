import { mountAnnotationToolkit } from './index';
import type { AnnotationToolkitInstance } from './types';

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

let mountedInstance: AnnotationToolkitInstance | undefined;

/**
 * Returns the auto-mounted instance (once mounted), so external code that
 * didn't call `mountAnnotationToolkit()` itself — e.g. a Chrome extension's
 * injected bridge script — can still control it (toggle annotate mode,
 * read annotations) without mounting a second copy.
 *
 * This must be a real named export (not just a plain object property) so
 * it survives Vite/Rollup's IIFE build: that build generates its own
 * `var AnnotationToolkit = (factory)(...)` wrapper from this module's
 * exports, which runs *after* — and overwrites — any manual
 * `window.AnnotationToolkit = ...` assignment below. Exporting the getter
 * ensures Rollup attaches the *same* closure-backed function to whichever
 * object ends up as `window.AnnotationToolkit`.
 */
export function getInstance(): AnnotationToolkitInstance | undefined {
  return mountedInstance;
}

const api = { mountAnnotationToolkit, getInstance };

if (typeof window !== 'undefined') {
  window.AnnotationToolkit = api;

  if (!window.__ANNOTATION_TOOLKIT_NO_AUTOMOUNT__) {
    const start = () => {
      mountedInstance = mountAnnotationToolkit();
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
      start();
    }
  }
}

export { mountAnnotationToolkit };

