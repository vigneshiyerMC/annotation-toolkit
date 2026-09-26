/**
 * All CSS for the toolkit's shadow DOM UI. Scoped entirely inside the shadow
 * root, so nothing here leaks into (or is affected by) the host page's
 * styles. Uses a neutral, high-contrast dark UI so it reads clearly on top
 * of arbitrary host content.
 */
export const styles = /* css */ `
  :host, * {
    box-sizing: border-box;
  }

  .at-root {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 13px;
    color: #e8e8ea;
  }

  button {
    font-family: inherit;
    cursor: pointer;
  }

  /* ---------- Toolbar / FAB ---------- */

  .at-toolbar {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 2147483000;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px;
    background: #1c1c1f;
    border: 1px solid #3a3a3f;
    border-radius: 999px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
    user-select: none;
  }

  .at-drag-handle {
    width: 14px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    color: #6b6b70;
    letter-spacing: 2px;
  }
  .at-drag-handle:active {
    cursor: grabbing;
  }

  .at-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border: none;
    background: transparent;
    color: #e8e8ea;
    border-radius: 999px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 500;
    line-height: 1;
    transition: background 0.15s ease;
    white-space: nowrap;
  }
  .at-btn:hover {
    background: #2c2c31;
  }
  .at-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .at-fab {
    background: #3358f4;
  }
  .at-fab:hover {
    background: #4368ff;
  }
  .at-fab.at-active {
    background: #e5484d;
  }
  .at-fab.at-active:hover {
    background: #ff5a5f;
  }

  .at-icon-btn {
    width: 34px;
    height: 34px;
    padding: 0;
    border-radius: 50%;
    position: relative;
  }

  .at-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: 999px;
    background: #3358f4;
    color: white;
    font-size: 10px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  .at-toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-radius: 999px;
    color: #b8b8bd;
  }
  .at-toggle.at-on {
    color: #e8e8ea;
  }

  /* ---------- Hover highlight overlay ---------- */

  .at-highlight {
    position: fixed;
    pointer-events: none;
    z-index: 2147483001;
    border: 2px solid #3358f4;
    background: rgba(51, 88, 244, 0.12);
    border-radius: 2px;
    transition: all 0.06s ease-out;
    display: none;
  }

  .at-highlight-label {
    position: absolute;
    top: -22px;
    left: -2px;
    background: #3358f4;
    color: white;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 3px;
    white-space: nowrap;
    max-width: 320px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ---------- Popover (comment editor) ---------- */

  .at-popover {
    position: fixed;
    z-index: 2147483002;
    width: 300px;
    background: #1c1c1f;
    border: 1px solid #3a3a3f;
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .at-popover-title {
    font-weight: 600;
    font-size: 12px;
    color: #b8b8bd;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .at-popover textarea {
    width: 100%;
    min-height: 72px;
    resize: vertical;
    background: #101012;
    border: 1px solid #3a3a3f;
    border-radius: 6px;
    color: #e8e8ea;
    padding: 8px;
    font-family: inherit;
    font-size: 13px;
  }
  .at-popover textarea:focus {
    outline: 2px solid #3358f4;
    outline-offset: -1px;
  }

  .at-popover-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .at-btn-primary {
    background: #3358f4;
    color: white;
  }
  .at-btn-primary:hover {
    background: #4368ff;
  }
  .at-btn-secondary {
    background: #2c2c31;
    color: #e8e8ea;
  }
  .at-btn-secondary:hover {
    background: #3a3a3f;
  }
  .at-btn-danger {
    background: transparent;
    color: #e5484d;
  }
  .at-btn-danger:hover {
    background: rgba(229, 72, 77, 0.15);
  }

  /* ---------- Sidebar panel ---------- */

  .at-panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 340px;
    background: #1c1c1f;
    border-left: 1px solid #3a3a3f;
    z-index: 2147483000;
    display: flex;
    flex-direction: column;
    box-shadow: -8px 0 24px rgba(0, 0, 0, 0.3);
    transform: translateX(100%);
    transition: transform 0.18s ease;
  }
  .at-panel.at-open {
    transform: translateX(0);
  }

  .at-panel-header {
    padding: 14px;
    border-bottom: 1px solid #2c2c31;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .at-panel-header h2 {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
  }

  .at-panel-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 10px 14px;
    border-bottom: 1px solid #2c2c31;
  }
  .at-panel-actions .at-btn {
    font-size: 12px;
    padding: 6px 10px;
  }

  .at-panel-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }

  .at-panel-empty {
    padding: 24px 12px;
    text-align: center;
    color: #6b6b70;
  }

  .at-item {
    background: #101012;
    border: 1px solid #2c2c31;
    border-radius: 8px;
    padding: 10px;
    margin-bottom: 8px;
  }

  .at-item-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 6px;
    margin-bottom: 6px;
  }

  .at-item-index {
    font-weight: 700;
    color: #7c9bff;
    font-size: 12px;
  }

  .at-item-selector {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    color: #6b6b70;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 4px;
  }

  .at-item-comment {
    font-size: 12px;
    color: #d0d0d4;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .at-item-thumb {
    max-width: 100%;
    border-radius: 4px;
    margin-bottom: 6px;
    display: block;
    border: 1px solid #2c2c31;
  }

  .at-item-controls {
    display: flex;
    gap: 4px;
  }

  .at-icon-sm {
    width: 24px;
    height: 24px;
    padding: 0;
    border-radius: 6px;
    font-size: 13px;
    color: #b8b8bd;
  }
  .at-icon-sm:hover {
    background: #2c2c31;
  }

  .at-status {
    padding: 6px 14px;
    font-size: 11px;
    color: #6b6b70;
  }

  .at-hidden {
    display: none !important;
  }

  .at-visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
`;
