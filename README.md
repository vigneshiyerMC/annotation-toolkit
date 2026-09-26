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

### Script tag (zero build step)

```html
<script src="https://your-cdn-or-host/annotation-toolkit.js"></script>
```

That's it — the toolkit auto-mounts itself and the floating toggle button
appears in the bottom-right corner. To opt out of auto-mounting (e.g. to
control exactly when it mounts), set a flag before the script loads:

```html
<script>window.__ANNOTATION_TOOLKIT_NO_AUTOMOUNT__ = true;</script>
<script src="annotation-toolkit.js"></script>
<script>
  // Full API is exposed as window.AnnotationToolkit:
  const toolkit = window.AnnotationToolkit.mountAnnotationToolkit({ screenshotsEnabled: true });
</script>
```

### npm / ES module

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

- **Source-mapping to file:line** — resolving an annotated DOM element back
  to the exact source file/line that rendered it (e.g. via a Vite or Babel
  plugin that injects location metadata during development builds) is a
  planned enhancement and is **not** implemented in this version. Today,
  annotations are located via CSS selector + captured HTML only.

