import type { Annotation, AnnotationDraft } from './types';

const STORAGE_PREFIX = 'annotation-toolkit:';

function storageKey(origin: string): string {
  return `${STORAGE_PREFIX}${origin}`;
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `ann_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Persists annotations to `localStorage`, scoped by page origin so that
 * different apps/sites loading the toolkit don't collide, and a reload of
 * the same origin restores prior annotations.
 */
export class AnnotationStore {
  private origin: string;

  constructor(origin: string = typeof window !== 'undefined' ? window.location.origin : 'default') {
    this.origin = origin;
  }

  private read(): Annotation[] {
    try {
      const raw = localStorage.getItem(storageKey(this.origin));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private write(annotations: Annotation[]): void {
    localStorage.setItem(storageKey(this.origin), JSON.stringify(annotations));
  }

  getAll(): Annotation[] {
    return this.read().sort((a, b) => a.order - b.order);
  }

  add(draft: AnnotationDraft): Annotation {
    const all = this.read();
    const now = new Date().toISOString();
    const annotation: Annotation = {
      id: generateId(),
      order: all.length,
      createdAt: now,
      ...draft,
    };
    all.push(annotation);
    this.write(all);
    return annotation;
  }

  update(id: string, changes: Partial<Pick<Annotation, 'comment' | 'screenshot'>>): Annotation | null {
    const all = this.read();
    const index = all.findIndex((a) => a.id === id);
    if (index === -1) return null;
    const updated: Annotation = {
      ...all[index],
      ...changes,
      updatedAt: new Date().toISOString(),
    };
    all[index] = updated;
    this.write(all);
    return updated;
  }

  remove(id: string): boolean {
    const all = this.read();
    const filtered = all.filter((a) => a.id !== id);
    if (filtered.length === all.length) return false;
    // Re-number remaining orders to stay contiguous.
    filtered
      .sort((a, b) => a.order - b.order)
      .forEach((a, i) => {
        a.order = i;
      });
    this.write(filtered);
    return true;
  }

  /** Reorders annotations to match the given array of ids (full or partial reordering). */
  reorder(orderedIds: string[]): Annotation[] {
    const all = this.read();
    const byId = new Map(all.map((a) => [a.id, a]));
    orderedIds.forEach((id, i) => {
      const a = byId.get(id);
      if (a) a.order = i;
    });
    const result = Array.from(byId.values()).sort((a, b) => a.order - b.order);
    this.write(result);
    return result;
  }

  clear(): void {
    this.write([]);
  }
}
