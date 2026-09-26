import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildAnnotationDraft, captureElementScreenshot } from '../src/capture';

const toDataURL = vi.fn(() => 'data:image/png;base64,mockedcanvasdata');

vi.mock('html2canvas', () => ({
  default: vi.fn(async (_el: HTMLElement, _options: unknown) => ({
    width: 100,
    height: 40,
    toDataURL,
  })),
}));

function render(html: string): Element {
  document.body.innerHTML = html;
  return document.body.firstElementChild!;
}

function stubRect(el: Element, rect: Partial<DOMRect>) {
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    width: 100,
    height: 40,
    top: 0,
    right: 100,
    bottom: 40,
    left: 0,
    toJSON: () => ({}),
    ...rect,
  } as DOMRect);
}

describe('captureElementScreenshot', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does NOT pass page-absolute x/y crop coordinates to html2canvas', async () => {
    const el = render('<button>Buy now</button>');
    stubRect(el, { left: 437, top: 812, width: 100, height: 40 });

    const html2canvas = (await import('html2canvas')).default as unknown as ReturnType<
      typeof vi.fn
    >;

    await captureElementScreenshot(el);

    expect(html2canvas).toHaveBeenCalledTimes(1);
    const [, options] = html2canvas.mock.calls[0];
    // Regression guard: el is the render root, so html2canvas' internal
    // coordinate space starts at el's own (0, 0). Passing the element's
    // page-absolute position as x/y (a previous bug) crops entirely outside
    // the rendered content and produces a blank canvas.
    expect(options).not.toHaveProperty('x');
    expect(options).not.toHaveProperty('y');
    expect(options.width).toBe(100);
    expect(options.height).toBe(40);
  });

  it('returns a data URI on success', async () => {
    const el = render('<button>Buy now</button>');
    stubRect(el, {});
    const result = await captureElementScreenshot(el);
    expect(result).toBe('data:image/png;base64,mockedcanvasdata');
  });

  it('skips capture for zero-size elements instead of producing a blank image', async () => {
    const el = render('<div style="display:none">Hidden</div>');
    stubRect(el, { width: 0, height: 0 });
    const html2canvas = (await import('html2canvas')).default as unknown as ReturnType<
      typeof vi.fn
    >;
    const result = await captureElementScreenshot(el);
    expect(result).toBeUndefined();
    expect(html2canvas).not.toHaveBeenCalled();
  });

  it('returns undefined and does not throw when html2canvas rejects', async () => {
    const el = render('<button>Buy now</button>');
    stubRect(el, {});
    const html2canvas = (await import('html2canvas')).default as unknown as ReturnType<
      typeof vi.fn
    >;
    html2canvas.mockImplementationOnce(async () => {
      throw new Error('tainted canvas');
    });
    const result = await captureElementScreenshot(el);
    expect(result).toBeUndefined();
  });
});

describe('buildAnnotationDraft', () => {
  it('includes the provided screenshot data URI on the draft', () => {
    const el = render('<button id="cta">Buy now</button>');
    stubRect(el, {});
    const draft = buildAnnotationDraft(el, {
      comment: 'Make this pop',
      screenshot: 'data:image/png;base64,abc',
    });
    expect(draft.screenshot).toBe('data:image/png;base64,abc');
    expect(draft.selector).toBe('#cta');
  });

  it('leaves screenshot undefined when none was captured', () => {
    const el = render('<button id="cta2">Buy now</button>');
    stubRect(el, {});
    const draft = buildAnnotationDraft(el, { comment: 'No shot' });
    expect(draft.screenshot).toBeUndefined();
  });
});
