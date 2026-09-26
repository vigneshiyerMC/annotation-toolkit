# Annotation Toolkit

A standalone, framework-agnostic widget you can drop into **any** running web
app — dev or prod, no matter what it's built with — to let a user visually
annotate the UI and hand off the results to an AI coding agent (GitHub
Copilot, Claude, Cursor, etc.).

It renders inside a Shadow DOM, so it never collides with the host page's
styles, and has zero runtime framework dependency.

## What it does

1. A small floating toggle button (bottom-right, draggable) enters/exits
   **Annotate mode**.
2. While in Annotate mode, hovering highlights the element under the cursor.
   Clicking it opens a popover with a textarea for a comment (`Esc` closes
   the popover, or exits Annotate mode if no popover is open).
3. Each annotation captures: a robust CSS selector, a truncated `outerHTML`
   snippet, tag name, class list, bounding rect, page URL/title, a
   timestamp, the comment, and (optionally) a cropped screenshot of just
   that element via [html2canvas](https://github.com/niklasvh/html2canvas).
   Screenshot capture is off by default (toggle it in the toolbar) since
   it's the heaviest part of the capture.
4. A sidebar panel lists all annotations collected in the current session,
   persisted in `localStorage` keyed by page origin (so a reload doesn't
   lose your work). Each annotation can be edited, deleted, or reordered.
5. Export everything as a single **Markdown** document (Copy to clipboard
   or Download) designed to be pasted directly into a coding agent chat, or
   as **JSON** for programmatic/MCP-style consumption.

## Quick start

There are three ways to get the toolkit onto a page — pick based on how
much control you want over the target app:

| Method | Best for | Needs app code changes? |
|---|---|---|
| [ES module script tag](#recommended-es-module-script-tag) | Any app, drop-in | One `<script>` tag |
| [npm / bundler import](#npm--bundler-import) | Apps that already build with Vite/webpack/Next | One import, ideally dev-only |
| [Chrome extension](./extension/README.md) | Any site, zero app changes at all | None |

### Recommended: ES module script tag

```html
<script type="module" src="https://your-cdn-or-host/annotation-toolkit.auto.js"></script>
```

This is the build to reach for by default. It's the same auto-mounting
behavior as the classic bundle below, but because it's shipped as a real ES
module, the browser only fetches the (much larger) `html2canvas` dependency
**on demand**, the first time a screenshot is actually captured — not on
page load. `annotation-toolkit.auto.js` itself is ~28 KB; `html2canvas`
(~254 KB) is a separate lazy chunk fetched from the same folder/CDN.

To opt out of auto-mounting (e.g. to control exactly when it mounts):

```html
<script>window.__ANNOTATION_TOOLKIT_NO_AUTOMOUNT__ = true;</script>
<script type="module" src="annotation-toolkit.auto.js"></script>
<script type="module">
  const toolkit = window.AnnotationToolkit.mountAnnotationToolkit({ screenshotsEnabled: true });
</script>
```

### Classic script tag (no `type="module"` support)

```html
<script src="https://your-cdn-or-host/annotation-toolkit.js"></script>
```

Works the same way, but `html2canvas` is bundled in eagerly (this format
can't code-split a dynamic `import()`), so the initial download is ~225 KB
regardless of whether screenshots are ever used. Only reach for this if
your target page genuinely can't load a module script.

### npm / bundler import

```bash
npm install annotation-toolkit
```

```ts
import { mountAnnotationToolkit } from 'annotation-toolkit';

const toolkit = mountAnnotationToolkit({
  screenshotsEnabled: false, // default; toggle in the UI or here
});

// Later, to remove it:
toolkit.unmount();
```

#### Dev-mode-only integration (recommended for this path)

This is a debugging/design-feedback tool, not something you want shipping
to production users. Gate it behind your framework's dev-mode check, the
same pattern tools like `react-grab` and Vite's own plugins use:

**Vite**
```ts
if (import.meta.env.DEV) {
  import('annotation-toolkit').then(({ mountAnnotationToolkit }) => mountAnnotationToolkit());
}
```

**Next.js** (in `app/layout.tsx` or similar)
```tsx
{process.env.NODE_ENV === 'development' && (
  <script type="module" src="/annotation-toolkit.auto.js" />
)}
```

**Webpack / CRA / plain bundler**
```ts
if (process.env.NODE_ENV === 'development') {
  import('annotation-toolkit').then(({ mountAnnotationToolkit }) => mountAnnotationToolkit());
}
```

This way the ~28 KB module (and the `html2canvas` chunk, only if used) is
never part of your production bundle or served to real users — tree-
shaking/dead-code elimination drops the whole branch in a production build.

### Chrome extension (no target-app changes at all)

If you don't control the target app's source (a client's site, a
third-party product, a staging deploy you can't edit), use the
[Chrome extension](./extension/README.md) instead: it injects the same
core widget via `chrome.scripting.executeScript` on a toolbar-icon click,
with no `host_permissions` and no code changes to the site itself. See
`extension/README.md` for load-unpacked instructions.

## Local development

```bash
npm install
npm test          # Vitest unit tests
npm run build     # Builds dist/ (ESM, CJS, and the IIFE <script> bundle)
```

To try the demo:

```bash
npm run build
npx serve .        # or any static file server, from the repo root
# open http://localhost:<port>/demo/
```

`demo/index.html` is a plain HTML page with sample UI that loads the built
`dist/annotation-toolkit.js` via a `<script>` tag — no build step required
for the demo itself once `dist/` exists.

## Annotation → export format mapping

Each `Annotation` object (see `src/types.ts`) is serialized as follows.

### Markdown (`toMarkdown`)

```md
# UI Annotations

The following are user-provided annotations on specific UI elements, captured for a coding agent to act on.

## Page Context
- **URL:** https://example.com/app
- **Title:** Example App
- **Viewport:** 1440x900

## Annotation 1
- **Location:** `button` element at (10, 20), 80x32px
- **Selector:** `#upgrade-btn`
- **Classes:** `demo-btn`
- **Screenshot:**

  ![Annotation 1 screenshot](data:image/png;base64,...)

**Comment:**

This button's label should say "Upgrade to Pro" for clarity.

<details><summary>Element HTML snippet</summary>

```html
<button class="demo-btn" id="upgrade-btn">Upgrade now</button>
```

</details>
```

This is intentionally clean and low-boilerplate — one instruction-shaped
section per annotation, ready to paste into an agent chat.

### JSON (`toJSON`)

Pretty-printed JSON array of `Annotation` objects, suitable for programmatic
consumption or future MCP-style tool integrations.

## Roadmap

- **Chrome extension** — a Manifest V3 wrapper is now available under
  [`extension/`](./extension/README.md) for annotating sites you don't
  control the source of. `activeTab`/`scripting` only, no host permissions.
- **Source-mapping to file:line** — resolving an annotated DOM element back
  to the exact source file/line that rendered it is still not implemented,
  but there's now a concrete path informed by
  [`react-grab`](https://github.com/aidenybai/react-grab): for React apps
  in dev builds, it's possible to walk the React Fiber tree at runtime
  (via a library like `bippy`) to recover `componentName`/`filePath`/
  `lineNumber` **without** requiring a custom Vite/Babel plugin in the
  target app. The plan is to attempt this at annotation-capture time,
  falling back to the current CSS-selector-only annotation whenever it's
  not a React app or the info isn't available (Vue/Angular/plain HTML
  would still need a build-time plugin for true source-mapping).

