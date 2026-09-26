import { beforeEach, describe, expect, it } from 'vitest';
import { AnnotationStore } from '../src/storage';
import type { AnnotationDraft } from '../src/types';

function makeDraft(comment: string): AnnotationDraft {
  return {
    selector: '#el',
    outerHTML: '<div id="el"></div>',
    tagName: 'div',
    classList: [],
    rect: { x: 0, y: 0, width: 10, height: 10, top: 0, right: 10, bottom: 10, left: 0 },
    page: { url: 'https://example.com', title: 'Example', viewportWidth: 1024, viewportHeight: 768 },
    comment,
  };
}

describe('AnnotationStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts empty for a fresh origin', () => {
    const store = new AnnotationStore('https://a.test');
    expect(store.getAll()).toEqual([]);
  });

  it('adds annotations with generated ids and incrementing order', () => {
    const store = new AnnotationStore('https://a.test');
    const first = store.add(makeDraft('first'));
    const second = store.add(makeDraft('second'));

    expect(first.id).toBeTruthy();
    expect(second.id).toBeTruthy();
    expect(first.id).not.toBe(second.id);
    expect(store.getAll().map((a) => a.comment)).toEqual(['first', 'second']);
    expect(store.getAll().map((a) => a.order)).toEqual([0, 1]);
  });

  it('persists annotations across store instances for the same origin (survives "reload")', () => {
    const store1 = new AnnotationStore('https://a.test');
    store1.add(makeDraft('persisted'));

    const store2 = new AnnotationStore('https://a.test');
    expect(store2.getAll().map((a) => a.comment)).toEqual(['persisted']);
  });

  it('scopes annotations by origin', () => {
    const storeA = new AnnotationStore('https://a.test');
    const storeB = new AnnotationStore('https://b.test');
    storeA.add(makeDraft('for a'));
    expect(storeB.getAll()).toEqual([]);
  });

  it('updates a comment and sets updatedAt', () => {
    const store = new AnnotationStore('https://a.test');
    const created = store.add(makeDraft('original'));
    const updated = store.update(created.id, { comment: 'edited' });

    expect(updated?.comment).toBe('edited');
    expect(updated?.updatedAt).toBeTruthy();
    expect(store.getAll()[0].comment).toBe('edited');
  });

  it('returns null when updating a non-existent id', () => {
    const store = new AnnotationStore('https://a.test');
    expect(store.update('missing', { comment: 'x' })).toBeNull();
  });

  it('removes an annotation and renumbers remaining orders', () => {
    const store = new AnnotationStore('https://a.test');
    const a = store.add(makeDraft('a'));
    store.add(makeDraft('b'));
    const c = store.add(makeDraft('c'));

    expect(store.remove(a.id)).toBe(true);
    const remaining = store.getAll();
    expect(remaining.map((x) => x.comment)).toEqual(['b', 'c']);
    expect(remaining.map((x) => x.order)).toEqual([0, 1]);
    expect(remaining.find((x) => x.id === c.id)?.order).toBe(1);
  });

  it('returns false when removing a non-existent id', () => {
    const store = new AnnotationStore('https://a.test');
    expect(store.remove('missing')).toBe(false);
  });

  it('reorders annotations according to the given id order', () => {
    const store = new AnnotationStore('https://a.test');
    const a = store.add(makeDraft('a'));
    const b = store.add(makeDraft('b'));
    const c = store.add(makeDraft('c'));

    store.reorder([c.id, a.id, b.id]);
    expect(store.getAll().map((x) => x.comment)).toEqual(['c', 'a', 'b']);
  });

  it('clears all annotations for the origin', () => {
    const store = new AnnotationStore('https://a.test');
    store.add(makeDraft('a'));
    store.clear();
    expect(store.getAll()).toEqual([]);
  });
});
