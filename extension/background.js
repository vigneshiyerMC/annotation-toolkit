// MV3 service worker. Deliberately uses `activeTab` + `scripting` only —
// no `host_permissions`, no `<all_urls>`, no always-on `content_scripts`.
// The toolkit is only ever injected into a tab the user explicitly clicked
// the toolbar icon on, which is the least-privileged MV3 pattern and avoids
// the broad "read and change all your data on all websites" install
// warning entirely.
//
// Click behavior:
//   1st click on a tab -> inject the toolkit (it auto-mounts on injection).
//   2nd+ click on the same (still-injected) tab -> toggle annotate mode.
// A full page reload/navigation clears the tab's injected state, since the
// injected globals are wiped along with the page.

const injectedTabs = new Set();

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  if (injectedTabs.has(tab.id)) {
    try {
      await chrome.tabs.sendMessage(tab.id, { type: 'toggle-annotate-mode' });
    } catch (err) {
      // Bridge isn't there anymore (e.g. an SPA navigation reset the page
      // without a full reload event) — fall back to re-injecting.
      injectedTabs.delete(tab.id);
      await injectToolkit(tab.id);
    }
    return;
  }

  await injectToolkit(tab.id);
});

async function injectToolkit(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content/annotation-toolkit.js'],
    });
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content/bridge.js'],
    });
    injectedTabs.add(tabId);
  } catch (err) {
    console.error('[annotation-toolkit] injection failed:', err);
  }
}

chrome.tabs.onRemoved.addListener((tabId) => injectedTabs.delete(tabId));

// A fresh navigation (full reload or address change) wipes injected
// globals, so treat the tab as un-injected again.
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    injectedTabs.delete(tabId);
  }
});
