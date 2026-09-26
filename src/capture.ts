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
  try {
    const { default: html2canvas } = await import('html2canvas');
    const rect = el.getBoundingClientRect();
    const canvas = await html2canvas(el as HTMLElement, {
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY,
      width: rect.width,
      height: rect.height,
      logging: false,
      useCORS: true,
    });
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
