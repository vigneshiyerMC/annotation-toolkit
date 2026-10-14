/**
 * Generates a best-effort, robust CSS selector for a DOM element so an
 * annotation can be re-located later (e.g. by a coding agent reading the
 * export, or by future tooling). Preference order:
 *   1. `[data-testid="..."]` on the element itself
 *   2. `#id` on the element itself
 *   3. `[aria-label="..."]` on the element itself
 *   4. `[role="..."]` combined with tag name
 *   5. Fallback: a full tag+nth-child path from the nearest stable ancestor
 *      (an ancestor matched by one of the above strategies) up to <body>.
 */

const STABLE_ATTR_TESTID = 'data-testid';

function escapeAttrValue(value: string): string {
  return value.replace(/"/g, '\\"');
}

/** Returns a selector fragment that uniquely-ish identifies just this one element, if possible. */
function directSelectors(el: Element): string[] {
  const selectors: string[] = [];
  const testId = el.getAttribute(STABLE_ATTR_TESTID);
  if (testId) {
    selectors.push(`[${STABLE_ATTR_TESTID}="${escapeAttrValue(testId)}"]`);
  }

  if (el.id) {
    // CSS.escape is unavailable in some minimal test environments; do a simple escape.
    const escapedId = /^[a-zA-Z][\w-]*$/.test(el.id) ? el.id : CSS.escape(el.id);
    selectors.push(`#${escapedId}`);
  }

  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) {
    selectors.push(`[aria-label="${escapeAttrValue(ariaLabel)}"]`);
  }

  const role = el.getAttribute('role');
  if (role) {
    selectors.push(`${el.tagName.toLowerCase()}[role="${escapeAttrValue(role)}"]`);
  }

  return selectors;
}

function uniqueSelector(el: Element, selectors: string[]): string | null {
  const doc = el.ownerDocument;
  for (const selector of selectors) {
    try {
      const matches = doc.querySelectorAll(selector);
      if (matches.length === 1 && matches[0] === el) return selector;
    } catch {
      // Ignore selectors that cannot be parsed by this document's CSS engine.
    }
  }
  return null;
}

/** Builds a `tag:nth-child(n)` fragment for an element relative to its parent. */
function nthChildFragment(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const parent = el.parentElement;
  if (!parent) return tag;

  const siblings = Array.from(parent.children);
  const index = siblings.indexOf(el) + 1;
  return `${tag}:nth-child(${index})`;
}

/**
 * Generates a CSS selector that can be used to (re-)locate `el`.
 * The result is not guaranteed to be globally unique but is designed to be
 * as short and stable as possible while remaining accurate for the common
 * case of a single-page document snapshot.
 */
export function generateSelector(el: Element): string {
  const direct = uniqueSelector(el, directSelectors(el));
  if (direct) return direct;

  const path: string[] = [];
  let current: Element | null = el;

  while (current && current.tagName.toLowerCase() !== 'body') {
    path.unshift(nthChildFragment(current));
    const currentDirect = uniqueSelector(current, directSelectors(current));
    if (currentDirect) {
      const selector = [currentDirect, ...path.slice(1)].join(' > ');
      try {
        const matches = el.ownerDocument.querySelectorAll(selector);
        if (matches.length === 1 && matches[0] === el) return selector;
      } catch {
        // Continue building a body-rooted path if the scoped path is invalid.
      }
    }
    current = current.parentElement;
  }

  // Root the path at body and confirm it resolves uniquely in this document.
  const bodyPath = ['body', ...path].join(' > ');
  try {
    const matches = el.ownerDocument.querySelectorAll(bodyPath);
    if (matches.length === 1 && matches[0] === el) return bodyPath;
  } catch {
    // Detached elements may not have a queryable path; retain best-effort output.
  }
  return bodyPath;
}
