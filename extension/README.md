# Annotation Toolkit — Chrome Extension

A thin Manifest V3 wrapper that lets you use Annotation Toolkit on **any
site**, without the target app having to add a script tag at all.

## How it works

- No `content_scripts`, no `host_permissions`, no `<all_urls>`. The
  extension only asks for `activeTab` + `scripting`, so Chrome never shows
  the "read and change all your data on all websites" warning, and it only
  ever touches the one tab you explicitly click the icon on.
- **1st click** on the toolbar icon injects the toolkit (reusing the exact
  same `dist/annotation-toolkit.js` build used by the npm package) into the
  current tab and turns annotate mode **on** immediately.
- **2nd+ click** toggles annotate mode off/on for that tab.
- A full page reload/navigation clears the injected state, so the next
  click re-injects fresh.
- Once injected, everything else — picking elements, adding comments,
  exporting Markdown/JSON, clearing — happens in the toolkit's own floating
  panel exactly as it does anywhere else. The extension's only job is
  getting it onto the page.

## Load it locally (unpacked)

1. Run `npm run build:extension` from the package root (builds `dist/` and
   copies the classic bundle into `extension/content/`).
2. Open `chrome://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select this `extension/` folder.
5. Pin the extension, then click its icon on any tab to start annotating.

## Files

- `manifest.json` — MV3 manifest, `activeTab`/`scripting` only, no popup
  (so `chrome.action.onClicked` fires directly on icon click).
- `background.js` — service worker; tracks which tabs already have the
  toolkit injected and either injects it or sends a toggle message.
- `content/annotation-toolkit.js` — the built classic-IIFE bundle (build
  artifact — regenerate with `npm run build:extension`, don't hand-edit).
- `content/bridge.js` — small script injected right after the bundle; reads
  `window.AnnotationToolkit.getInstance()` (the auto-mounted instance) and
  exposes a `toggle-annotate-mode` message handler for the background
  worker to call.

## Known limitations / roadmap

- No cross-tab annotation list in the popup yet — the in-page panel is the
  source of truth (annotations persist to `localStorage`, scoped per
  origin, same as the npm package).
- Source-mapping (real `file:line`, not just a CSS selector) is still on
  the roadmap. `react-grab` (github.com/aidenybai/react-grab) shows this is
  doable for React apps in dev builds by walking the React Fiber tree at
  runtime (via its `bippy` library) — no target-app build plugin required.
  That's a promising follow-up: detect a React root, best-effort resolve
  `componentName`/`filePath`/`lineNumber` from fiber `_debugSource`, and
  fall back to the current CSS-selector-only annotation when it's not a
  React app or the info isn't available.
