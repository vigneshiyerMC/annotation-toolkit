import { generateSelector } from './selector';
import type { AnnotationDraft, BoundingRect, PageContext } from './types';

const DEFAULT_MAX_OUTER_HTML_LENGTH = 500;

function toBoundingRect(rect: DOMRect): BoundingRect {
  return {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
  };
}

function getPageContext(): PageContext {
  return {
    url: window.location.href,
    title: document.title,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  };
}

function truncateOuterHtml(el: Element, maxLength: number): string {
  const html = el.outerHTML;
  if (html.length <= maxLength) return html;
  return `${html.slice(0, maxLength)}…`;
}

/**
 * Captures a screenshot of just `el`'s bounding box using html2canvas,
 * returned as a PNG data URI. html2canvas is dynamically imported so pages
 * that never enable screenshots don't pay for it.
 */
export async function captureElementScreenshot(el: Element): Promise<string | undefined> {
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    // Nothing visible to capture (e.g. display:none or a zero-size node).
    return undefined;
  }
  try {
    const { default: html2canvas } = await import('html2canvas');
    // `el` itself is the render root, so html2canvas' internal coordinate
    // space starts at (0, 0) for el's own top-left corner — NOT the page's
    // scroll/viewport position. Passing page-absolute x/y here (a previous
    // bug) cropped entirely outside the rendered content and produced a
    // blank canvas. We only need width/height to bound the capture.
    const canvas = await html2canvas(el as HTMLElement, {
      width: rect.width,
      height: rect.height,
      backgroundColor: null,
      // Fixed at 1x regardless of devicePixelRatio: these images are
      // embedded as base64 directly in the Markdown export for pasting
      // into a chat-based coding agent, where payload size (and token
      // cost) matters far more than pixel sharpness.
      scale: 1,
      logging: false,
      useCORS: true,
    });
    if (canvas.width === 0 || canvas.height === 0) return undefined;
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.warn('[annotation-toolkit] Screenshot capture failed:', err);
    return undefined;
  }
}

export interface BuildDraftOptions {
  comment: string;
  screenshot?: string;
  maxOuterHtmlLength?: number;
}

/** Builds an `AnnotationDraft` describing `el` at the current moment. */
export function buildAnnotationDraft(el: Element, options: BuildDraftOptions): AnnotationDraft {
  const maxLength = options.maxOuterHtmlLength ?? DEFAULT_MAX_OUTER_HTML_LENGTH;
  return {
    selector: generateSelector(el),
    outerHTML: truncateOuterHtml(el, maxLength),
    tagName: el.tagName.toLowerCase(),
    classList: Array.from(el.classList),
    rect: toBoundingRect(el.getBoundingClientRect()),
    page: getPageContext(),
    comment: options.comment,
    screenshot: options.screenshot,
  };
}
