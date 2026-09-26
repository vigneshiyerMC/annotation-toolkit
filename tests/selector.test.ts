import { describe, expect, it } from 'vitest';
import { generateSelector } from '../src/selector';

function render(html: string): void {
  document.body.innerHTML = html;
}

describe('generateSelector', () => {
  it('prefers data-testid over everything else', () => {
    render(`
      <div id="wrapper">
        <button data-testid="submit-btn" class="btn btn-primary" aria-label="Submit">Go</button>
      </div>
    `);
    const el = document.querySelector('[data-testid="submit-btn"]')!;
    expect(generateSelector(el)).toBe('[data-testid="submit-btn"]');
  });

  it('falls back to #id when there is no data-testid', () => {
    render(`<div><span id="price-tag" aria-label="Price">$9</span></div>`);
    const el = document.getElementById('price-tag')!;
    expect(generateSelector(el)).toBe('#price-tag');
  });

  it('falls back to aria-label when there is no id/data-testid', () => {
    render(`<div><button aria-label="Close dialog">X</button></div>`);
    const el = document.querySelector('button')!;
    expect(generateSelector(el)).toBe('[aria-label="Close dialog"]');
  });

  it('falls back to role when there is no aria-label/id/data-testid', () => {
    render(`<div><div role="alert">Careful!</div></div>`);
    const el = document.querySelector('[role="alert"]')!;
    expect(generateSelector(el)).toBe('div[role="alert"]');
  });

  it('walks up to a stable ancestor and builds an nth-child path', () => {
    render(`
      <div id="card-list">
        <div class="card"><p>one</p></div>
        <div class="card"><p>two</p></div>
        <div class="card"><p><span>target</span></p></div>
      </div>
    `);
    const el = document.querySelectorAll('.card')[2].querySelector('span')!;
    expect(generateSelector(el)).toBe('#card-list > div:nth-child(3) > p:nth-child(1) > span:nth-child(1)');
  });

  it('falls back to a body-rooted path when no ancestor is stable', () => {
    render(`<div><section><p>hi <em>there</em></p></section></div>`);
    const el = document.querySelector('em')!;
    const selector = generateSelector(el);
    expect(selector.startsWith('body > ')).toBe(true);
    expect(selector.endsWith('em:nth-child(1)')).toBe(true);
    // The generated selector should actually resolve back to the same element.
    expect(document.querySelector(selector)).toBe(el);
  });

  it('escapes quotes in attribute values', () => {
    render(`<div><button aria-label='Say "hi"'>Hi</button></div>`);
    const el = document.querySelector('button')!;
    expect(generateSelector(el)).toBe('[aria-label="Say \\"hi\\""]');
  });
});
