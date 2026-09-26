import { AnnotationStore } from '../storage';
import { buildAnnotationDraft, captureElementScreenshot } from '../capture';
import { toMarkdown, toJSON } from '../export';
import type { Annotation, MountOptions } from '../types';
import { styles } from './styles';
import { iconClose, iconDown, iconEdit, iconList, iconPencil, iconTrash, iconUp } from './icons';

const HOST_ID = 'annotation-toolkit-host';

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  html?: string
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

/**
 * Owns the toolkit's entire Shadow-DOM UI: the draggable toolbar/FAB, the
 * hover-highlight overlay, the click-to-annotate popover, and the sidebar
 * panel. Kept as a single class since these pieces share a lot of state
 * (annotate mode, hovered element, store) and are simplest to coordinate
 * together.
 */
export class ToolkitUI {
  private hostEl: HTMLElement;
  private shadowRoot: ShadowRoot;
  private store: AnnotationStore;

  private annotateMode = false;
  private screenshotsEnabled: boolean;
  private maxOuterHtmlLength: number;
  private panelOpen = false;
  private pendingPopover: { target: Element; screenshotPromise?: Promise<string | undefined> } | null = null;

  private fabBtn!: HTMLButtonElement;
  private panelBadge!: HTMLElement;
  private highlightEl!: HTMLElement;
  private highlightLabel!: HTMLElement;
  private popoverEl: HTMLElement | null = null;
  private panelEl!: HTMLElement;
  private panelListEl!: HTMLElement;
  private statusEl!: HTMLElement;

  private onMouseMove = (e: MouseEvent) => this.handleMouseMove(e);
  private onClick = (e: MouseEvent) => this.handleClick(e);
  private onKeyDown = (e: KeyboardEvent) => this.handleKeyDown(e);

  constructor(options: MountOptions = {}) {
    this.store = new AnnotationStore();
    this.screenshotsEnabled = options.screenshotsEnabled ?? false;
    this.maxOuterHtmlLength = options.maxOuterHtmlLength ?? 500;

    const container = options.container ?? document.body;
    this.hostEl = document.createElement('div');
    this.hostEl.id = HOST_ID;
    container.appendChild(this.hostEl);
    this.shadowRoot = this.hostEl.attachShadow({ mode: 'open' });

    const styleTag = document.createElement('style');
    styleTag.textContent = styles;
    this.shadowRoot.appendChild(styleTag);

    const root = el('div', 'at-root');
    this.shadowRoot.appendChild(root);

    this.buildToolbar(root);
    this.buildHighlight(root);
    this.buildPanel(root);

    document.addEventListener('mousemove', this.onMouseMove, true);
    document.addEventListener('click', this.onClick, true);
    document.addEventListener('keydown', this.onKeyDown, true);

    this.renderPanelList();
  }

  // ---------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------

  unmount(): void {
    document.removeEventListener('mousemove', this.onMouseMove, true);
    document.removeEventListener('click', this.onClick, true);
    document.removeEventListener('keydown', this.onKeyDown, true);
    this.hostEl.remove();
  }

  setAnnotateMode(enabled: boolean): void {
    this.annotateMode = enabled;
    this.fabBtn.classList.toggle('at-active', enabled);
    this.fabBtn.setAttribute('aria-pressed', String(enabled));
    if (!enabled) {
      this.clearHighlight();
      this.closePopover();
    }
  }

  getAnnotations(): Annotation[] {
    return this.store.getAll();
  }

  // ---------------------------------------------------------------------
  // Toolbar
  // ---------------------------------------------------------------------

  private buildToolbar(root: HTMLElement): void {
    const toolbar = el('div', 'at-toolbar');

    const handle = el('div', 'at-drag-handle', '&#8942;');
    handle.setAttribute('aria-hidden', 'true');
    this.makeDraggable(toolbar, handle);

    const screenshotBtn = el('button', 'at-btn at-toggle') as HTMLButtonElement;
    screenshotBtn.type = 'button';
    screenshotBtn.title = 'Toggle screenshot capture for new annotations';
    screenshotBtn.textContent = '\u{1F4F7}';
    screenshotBtn.setAttribute('aria-pressed', String(this.screenshotsEnabled));
    screenshotBtn.classList.toggle('at-on', this.screenshotsEnabled);
    screenshotBtn.addEventListener('click', () => {
      this.screenshotsEnabled = !this.screenshotsEnabled;
      screenshotBtn.classList.toggle('at-on', this.screenshotsEnabled);
      screenshotBtn.setAttribute('aria-pressed', String(this.screenshotsEnabled));
    });

    const panelToggle = el('button', 'at-btn at-icon-btn') as HTMLButtonElement;
    panelToggle.type = 'button';
    panelToggle.title = 'Show annotations panel';
    panelToggle.innerHTML = iconList;
    const badge = el('span', 'at-badge at-hidden');
    panelToggle.appendChild(badge);
    panelToggle.addEventListener('click', () => this.togglePanel());
    this.panelBadge = badge;

    const fab = el('button', 'at-btn at-fab at-icon-btn') as HTMLButtonElement;
    fab.type = 'button';
    fab.title = 'Toggle Annotate mode';
    fab.setAttribute('aria-pressed', 'false');
    fab.innerHTML = iconPencil;
    fab.addEventListener('click', () => this.setAnnotateMode(!this.annotateMode));
    this.fabBtn = fab;

    toolbar.append(handle, screenshotBtn, panelToggle, fab);
    root.appendChild(toolbar);
  }

  private makeDraggable(toolbar: HTMLElement, handle: HTMLElement): void {
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    const onMove = (e: MouseEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      toolbar.style.left = `${startLeft + dx}px`;
      toolbar.style.top = `${startTop + dy}px`;
      toolbar.style.right = 'auto';
      toolbar.style.bottom = 'auto';
    };
    const onUp = () => {
      dragging = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    handle.addEventListener('mousedown', (e) => {
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = toolbar.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      e.preventDefault();
    });
  }

  // ---------------------------------------------------------------------
  // Hover highlight
  // ---------------------------------------------------------------------

  private buildHighlight(root: HTMLElement): void {
    const highlight = el('div', 'at-highlight');
    const label = el('div', 'at-highlight-label');
    highlight.appendChild(label);
    root.appendChild(highlight);
    this.highlightEl = highlight;
    this.highlightLabel = label;
  }

  private isWithinOwnUI(elm: Element | null): boolean {
    if (!elm) return true;
    if (elm === this.hostEl) return true;
    return this.shadowRoot.contains(elm);
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.annotateMode || this.popoverEl) return;
    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (this.isWithinOwnUI(target)) {
      this.clearHighlight();
      return;
    }
    this.paintHighlight(target as Element);
  }

  private paintHighlight(target: Element): void {
    const rect = target.getBoundingClientRect();
    this.highlightEl.style.display = 'block';
    this.highlightEl.style.left = `${rect.left}px`;
    this.highlightEl.style.top = `${rect.top}px`;
    this.highlightEl.style.width = `${rect.width}px`;
    this.highlightEl.style.height = `${rect.height}px`;

    const idPart = target.id ? `#${target.id}` : '';
    const classPart = target.classList.length > 0 ? `.${Array.from(target.classList).join('.')}` : '';
    this.highlightLabel.textContent = `${target.tagName.toLowerCase()}${idPart}${classPart}`;
  }

  private clearHighlight(): void {
    this.highlightEl.style.display = 'none';
  }

  // ---------------------------------------------------------------------
  // Click-to-annotate popover
  // ---------------------------------------------------------------------

  private handleClick(e: MouseEvent): void {
    if (!this.annotateMode) return;
    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (this.isWithinOwnUI(target)) return;

    e.preventDefault();
    e.stopPropagation();
    if (!target) return;

    this.openPopover(target);
  }

  private openPopover(target: Element): void {
    this.closePopover();
    this.clearHighlight();

    const screenshotPromise = this.screenshotsEnabled ? captureElementScreenshot(target) : undefined;
    this.pendingPopover = { target, screenshotPromise };

    const rect = target.getBoundingClientRect();
    const popover = el('div', 'at-popover');
    const title = el('div', 'at-popover-title');
    title.textContent = `${target.tagName.toLowerCase()}${target.id ? `#${target.id}` : ''}`;
    const textarea = el('textarea');
    textarea.placeholder = 'Describe what should change here…';

    const actions = el('div', 'at-popover-actions');
    const cancelBtn = el('button', 'at-btn at-btn-secondary', 'Cancel') as HTMLButtonElement;
    cancelBtn.type = 'button';
    const saveBtn = el('button', 'at-btn at-btn-primary', 'Save') as HTMLButtonElement;
    saveBtn.type = 'button';

    cancelBtn.addEventListener('click', () => this.closePopover());
    saveBtn.addEventListener('click', () => void this.saveAnnotation(textarea.value));

    actions.append(cancelBtn, saveBtn);
    popover.append(title, textarea, actions);
    this.shadowRoot.querySelector('.at-root')!.appendChild(popover);
    this.popoverEl = popover;

    // Position, clamped to viewport.
    const popW = 300;
    const popH = 160;
    let left = rect.left;
    let top = rect.bottom + 8;
    if (left + popW > window.innerWidth - 8) left = window.innerWidth - popW - 8;
    if (left < 8) left = 8;
    if (top + popH > window.innerHeight - 8) top = rect.top - popH - 8;
    if (top < 8) top = 8;
    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;

    textarea.focus();
  }

  private closePopover(): void {
    this.popoverEl?.remove();
    this.popoverEl = null;
    this.pendingPopover = null;
  }

  private async saveAnnotation(comment: string): Promise<void> {
    const pending = this.pendingPopover;
    if (!pending) return;

    const screenshot = pending.screenshotPromise ? await pending.screenshotPromise : undefined;
    // The popover may have been closed/cancelled while the screenshot was capturing.
    if (this.pendingPopover !== pending) return;

    const draft = buildAnnotationDraft(pending.target, {
      comment,
      screenshot,
      maxOuterHtmlLength: this.maxOuterHtmlLength,
    });
    this.store.add(draft);
    this.closePopover();
    this.renderPanelList();
    this.setStatus('Annotation saved.');
  }

  // ---------------------------------------------------------------------
  // Keyboard
  // ---------------------------------------------------------------------

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key !== 'Escape') return;
    if (this.popoverEl) {
      this.closePopover();
      e.stopPropagation();
      return;
    }
    if (this.annotateMode) {
      this.setAnnotateMode(false);
      e.stopPropagation();
    }
  }

  // ---------------------------------------------------------------------
  // Sidebar panel
  // ---------------------------------------------------------------------

  private buildPanel(root: HTMLElement): void {
    const panel = el('div', 'at-panel');
    this.panelEl = panel;

    const header = el('div', 'at-panel-header');
    header.appendChild(el('h2', undefined, 'Annotations'));
    const closeBtn = el('button', 'at-btn at-icon-sm', iconClose) as HTMLButtonElement;
    closeBtn.type = 'button';
    closeBtn.title = 'Close panel';
    closeBtn.addEventListener('click', () => this.togglePanel(false));
    header.appendChild(closeBtn);

    const actions = el('div', 'at-panel-actions');
    const copyBtn = this.makeActionBtn('Copy Markdown', () => this.copyMarkdown());
    const downloadMdBtn = this.makeActionBtn('Download .md', () => this.download('annotations.md', toMarkdown(this.store.getAll()), 'text/markdown'));
    const downloadJsonBtn = this.makeActionBtn('Download .json', () => this.download('annotations.json', toJSON(this.store.getAll()), 'application/json'));
    actions.append(copyBtn, downloadMdBtn, downloadJsonBtn);

    const status = el('div', 'at-status');
    this.statusEl = status;

    const list = el('div', 'at-panel-list');
    this.panelListEl = list;

    panel.append(header, actions, status, list);
    root.appendChild(panel);
  }

  private makeActionBtn(label: string, onClick: () => void): HTMLButtonElement {
    const btn = el('button', 'at-btn at-btn-secondary', label) as HTMLButtonElement;
    btn.type = 'button';
    btn.addEventListener('click', onClick);
    return btn;
  }

  private togglePanel(force?: boolean): void {
    this.panelOpen = force ?? !this.panelOpen;
    this.panelEl.classList.toggle('at-open', this.panelOpen);
  }

  private setStatus(msg: string): void {
    this.statusEl.textContent = msg;
    window.setTimeout(() => {
      if (this.statusEl.textContent === msg) this.statusEl.textContent = '';
    }, 2500);
  }

  private async copyMarkdown(): Promise<void> {
    const md = toMarkdown(this.store.getAll());
    try {
      await navigator.clipboard.writeText(md);
      this.setStatus('Copied Markdown to clipboard.');
    } catch {
      this.setStatus('Copy failed — clipboard permission denied.');
    }
  }

  private download(filename: string, content: string, mime: string): void {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private renderPanelList(): void {
    const annotations = this.store.getAll();
    this.panelListEl.innerHTML = '';

    this.panelBadge.textContent = String(annotations.length);
    this.panelBadge.classList.toggle('at-hidden', annotations.length === 0);

    if (annotations.length === 0) {
      this.panelListEl.appendChild(el('div', 'at-panel-empty', 'No annotations yet. Toggle Annotate mode and click an element to get started.'));
      return;
    }

    annotations.forEach((annotation, index) => {
      this.panelListEl.appendChild(this.renderItem(annotation, index, annotations.length));
    });
  }

  private renderItem(annotation: Annotation, index: number, total: number): HTMLElement {
    const item = el('div', 'at-item');
    const header = el('div', 'at-item-header');
    header.appendChild(el('span', 'at-item-index', `#${index + 1}`));

    const controls = el('div', 'at-item-controls');
    const upBtn = el('button', 'at-btn at-icon-sm', iconUp) as HTMLButtonElement;
    upBtn.type = 'button';
    upBtn.title = 'Move up';
    upBtn.disabled = index === 0;
    upBtn.addEventListener('click', () => this.moveAnnotation(annotation.id, -1));

    const downBtn = el('button', 'at-btn at-icon-sm', iconDown) as HTMLButtonElement;
    downBtn.type = 'button';
    downBtn.title = 'Move down';
    downBtn.disabled = index === total - 1;
    downBtn.addEventListener('click', () => this.moveAnnotation(annotation.id, 1));

    const editBtn = el('button', 'at-btn at-icon-sm', iconEdit) as HTMLButtonElement;
    editBtn.type = 'button';
    editBtn.title = 'Edit comment';
    editBtn.addEventListener('click', () => this.editAnnotation(item, annotation));

    const deleteBtn = el('button', 'at-btn at-icon-sm', iconTrash) as HTMLButtonElement;
    deleteBtn.type = 'button';
    deleteBtn.title = 'Delete';
    deleteBtn.addEventListener('click', () => {
      this.store.remove(annotation.id);
      this.renderPanelList();
      this.setStatus('Annotation deleted.');
    });

    controls.append(upBtn, downBtn, editBtn, deleteBtn);
    header.appendChild(controls);

    const selector = el('div', 'at-item-selector');
    selector.textContent = annotation.selector;
    selector.title = annotation.selector;

    item.append(header, selector);

    if (annotation.screenshot) {
      const img = el('img', 'at-item-thumb') as HTMLImageElement;
      img.src = annotation.screenshot;
      img.alt = `Screenshot of ${annotation.selector}`;
      item.appendChild(img);
    }

    const comment = el('div', 'at-item-comment');
    comment.textContent = annotation.comment || '(no comment)';
    item.appendChild(comment);

    return item;
  }

  private moveAnnotation(id: string, delta: number): void {
    const all = this.store.getAll();
    const index = all.findIndex((a) => a.id === id);
    if (index === -1) return;
    const newIndex = index + delta;
    if (newIndex < 0 || newIndex >= all.length) return;
    const ids = all.map((a) => a.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(newIndex, 0, moved);
    this.store.reorder(ids);
    this.renderPanelList();
  }

  private editAnnotation(item: HTMLElement, annotation: Annotation): void {
    const commentEl = item.querySelector('.at-item-comment');
    if (!commentEl) return;

    const textarea = el('textarea');
    textarea.value = annotation.comment;

    const actions = el('div', 'at-popover-actions');
    const cancelBtn = el('button', 'at-btn at-btn-secondary', 'Cancel') as HTMLButtonElement;
    cancelBtn.type = 'button';
    const saveBtn = el('button', 'at-btn at-btn-primary', 'Save') as HTMLButtonElement;
    saveBtn.type = 'button';

    cancelBtn.addEventListener('click', () => this.renderPanelList());
    saveBtn.addEventListener('click', () => {
      this.store.update(annotation.id, { comment: textarea.value });
      this.renderPanelList();
      this.setStatus('Annotation updated.');
    });

    actions.append(cancelBtn, saveBtn);
    commentEl.replaceWith(textarea, actions);
    textarea.focus();
  }
}
