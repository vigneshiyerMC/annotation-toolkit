import { describe, expect, it } from 'vitest';
import { toMarkdown, toJSON } from '../src/export';
import type { Annotation } from '../src/types';

function makeAnnotation(overrides: Partial<Annotation> = {}): Annotation {
  return {
    id: 'ann_1',
    order: 0,
    selector: '#submit-btn',
    outerHTML: '<button id="submit-btn">Go</button>',
    tagName: 'button',
    classList: ['btn', 'btn-primary'],
    rect: { x: 10, y: 20, width: 80, height: 32, top: 20, right: 90, bottom: 52, left: 10 },
    page: { url: 'https://example.com/app', title: 'Example App', viewportWidth: 1440, viewportHeight: 900 },
    createdAt: '2024-01-01T00:00:00.000Z',
    comment: 'This button should say "Submit" instead of "Go".',
    ...overrides,
  };
}

describe('toMarkdown', () => {
  it('renders a friendly placeholder when there are no annotations', () => {
    const md = toMarkdown([]);
    expect(md).toContain('No annotations captured yet.');
  });

  it('includes a page context header sourced from the first annotation', () => {
    const md = toMarkdown([makeAnnotation()]);
    expect(md).toContain('## Page Context');
    expect(md).toContain('https://example.com/app');
    expect(md).toContain('Example App');
    expect(md).toContain('1440x900');
  });

  it('numbers each annotation section and includes selector + comment', () => {
    const md = toMarkdown([
      makeAnnotation({ id: 'a', order: 0, comment: 'first' }),
      makeAnnotation({ id: 'b', order: 1, comment: 'second' }),
    ]);
    expect(md).toContain('## Annotation 1');
    expect(md).toContain('## Annotation 2');
    expect(md).toContain('first');
    expect(md).toContain('second');
    expect(md).toContain('`#submit-btn`');
  });

  it('embeds the screenshot as a markdown image when present', () => {
    const md = toMarkdown([makeAnnotation({ screenshot: 'data:image/png;base64,AAAA' })]);
    expect(md).toContain('![Annotation 1 screenshot](data:image/png;base64,AAAA)');
  });

  it('omits the screenshot line entirely when not present', () => {
    const md = toMarkdown([makeAnnotation()]);
    expect(md).not.toContain('Screenshot');
  });

  it('includes the truncated outerHTML in a collapsible details block', () => {
    const md = toMarkdown([makeAnnotation()]);
    expect(md).toContain('<details><summary>Element HTML snippet</summary>');
    expect(md).toContain('<button id="submit-btn">Go</button>');
  });
});

describe('toJSON', () => {
  it('round-trips annotations losslessly', () => {
    const annotations = [makeAnnotation({ id: 'a' }), makeAnnotation({ id: 'b', order: 1 })];
    const json = toJSON(annotations);
    expect(JSON.parse(json)).toEqual(annotations);
  });

  it('produces pretty-printed, human-readable JSON', () => {
    const json = toJSON([makeAnnotation()]);
    expect(json).toContain('\n    "id"');
  });
});
