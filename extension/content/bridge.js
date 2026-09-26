// Injected right after `content/annotation-toolkit.js` (which auto-mounts
// itself and exposes `window.AnnotationToolkit`). This bridge lets the
// extension's background service worker drive the already-mounted
// instance — currently just "toggle annotate mode" — without re-mounting
// a second copy of the widget.
(function () {
  if (window.__annotationToolkitBridgeInstalled) return;
  window.__annotationToolkitBridgeInstalled = true;

  let annotateModeOn = false;

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const toolkit = window.AnnotationToolkit;
    const instance = toolkit && toolkit.getInstance && toolkit.getInstance();

    if (!instance) {
      sendResponse({ ok: false, error: 'not-mounted' });
      return;
    }

    if (message.type === 'toggle-annotate-mode') {
      annotateModeOn = !annotateModeOn;
      instance.setAnnotateMode(annotateModeOn);
      sendResponse({ ok: true, annotateModeOn });
      return;
    }

    sendResponse({ ok: false, error: 'unknown-message' });
  });

  // Turn annotate mode on immediately after the first injection so the
  // toolbar click that mounted the toolkit also starts picking right away.
  annotateModeOn = true;
  window.AnnotationToolkit.getInstance().setAnnotateMode(true);
})();
