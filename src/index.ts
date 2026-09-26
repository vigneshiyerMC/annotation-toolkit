import { ToolkitUI } from './ui';
import type { AnnotationToolkitInstance, MountOptions } from './types';

export type { Annotation, AnnotationDraft, AnnotationToolkitInstance, MountOptions, PageContext, BoundingRect } from './types';
export { generateSelector } from './selector';
export { toMarkdown, toJSON } from './export';
export { AnnotationStore } from './storage';

/**
 * Mounts the Annotation Toolkit widget onto the page. Safe to call once per
 * page; call `.unmount()` on the returned instance to remove it again.
 *
 * ```ts
 * import { mountAnnotationToolkit } from 'annotation-toolkit';
 * const toolkit = mountAnnotationToolkit({ screenshotsEnabled: true });
 * ```
 */
export function mountAnnotationToolkit(options?: MountOptions): AnnotationToolkitInstance {
  const ui = new ToolkitUI(options);
  return {
    unmount: () => ui.unmount(),
    setAnnotateMode: (enabled: boolean) => ui.setAnnotateMode(enabled),
    getAnnotations: () => ui.getAnnotations(),
  };
}
