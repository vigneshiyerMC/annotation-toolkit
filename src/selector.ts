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
function directSelector(el: Element): string | null {
  const testId = el.getAttribute(STABLE_ATTR_TESTID);
  if (testId) {
    return `[${STABLE_ATTR_TESTID}="${escapeAttrValue(testId)}"]`;
  }

  if (el.id) {
    // CSS.escape is unavailable in some minimal test environments; do a simple escape.
    const escapedId = /^[a-zA-Z][\w-]*$/.test(el.id) ? el.id : CSS.escape(el.id);
    return `#${escapedId}`;
  }

  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) {
    return `[aria-label="${escapeAttrValue(ariaLabel)}"]`;
  }

  const role = el.getAttribute('role');
  if (role) {
    return `${el.tagName.toLowerCase()}[role="${escapeAttrValue(role)}"]`;
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
  const direct = directSelector(el);
  if (direct) return direct;

  const path: string[] = [nthChildFragment(el)];
  let current: Element | null = el.parentElement;

  while (current && current.tagName.toLowerCase() !== 'body') {
    const currentDirect = directSelector(current);
    if (currentDirect) {
      path.unshift(currentDirect);
      return path.join(' > ');
    }
    path.unshift(nthChildFragment(current));
    current = current.parentElement;
  }

  // Reached <body> (or ran out of ancestors) without finding a stable anchor.
  path.unshift('body');
  return path.join(' > ');
}
