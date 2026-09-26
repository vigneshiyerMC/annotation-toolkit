/** Shared types for annotation-toolkit. */

export interface BoundingRect {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PageContext {
  url: string;
  title: string;
  viewportWidth: number;
  viewportHeight: number;
}

export interface Annotation {
  /** Stable unique id (used as React-style key / for CRUD lookups). */
  id: string;
  /** Order among annotations for the current page origin (lower = earlier). */
  order: number;
  /** Best-effort robust CSS selector path to the annotated element. */
  selector: string;
  /** Truncated outerHTML snippet of the annotated element. */
  outerHTML: string;
  /** Lowercased tag name, e.g. "button". */
  tagName: string;
  /** Space-separated class list captured at annotation time. */
  classList: string[];
  /** Bounding rect of the element at the time of annotation. */
  rect: BoundingRect;
  /** Page context captured at the time of annotation. */
  page: PageContext;
  /** ISO-8601 timestamp of when the annotation was created. */
  createdAt: string;
  /** ISO-8601 timestamp of the last edit, if any. */
  updatedAt?: string;
  /** The user's free-form comment / instruction for the coding agent. */
  comment: string;
  /** Optional cropped screenshot of the element as a PNG data URI. */
  screenshot?: string;
}

/** Input needed to create a new annotation (screenshot/comment supplied by UI). */
export interface AnnotationDraft {
  selector: string;
  outerHTML: string;
  tagName: string;
  classList: string[];
  rect: BoundingRect;
  page: PageContext;
  comment: string;
  screenshot?: string;
}

export interface MountOptions {
  /** Root element to attach the toolkit's shadow host to. Defaults to `document.body`. */
  container?: HTMLElement;
  /** Whether screenshot capture is enabled by default. Defaults to `false` (lighter weight). */
  screenshotsEnabled?: boolean;
  /** Max length for captured outerHTML snippets. Defaults to 500. */
  maxOuterHtmlLength?: number;
}

export interface AnnotationToolkitInstance {
  /** Remove the toolkit's UI and listeners from the page. */
  unmount(): void;
  /** Programmatically enter/exit annotate (picker) mode. */
  setAnnotateMode(enabled: boolean): void;
  /** Get all annotations currently persisted for this page's origin. */
  getAnnotations(): Annotation[];
}
