import type { Annotation } from './types';

/**
 * Serializes annotations into a single Markdown document designed to be
 * pasted directly into an AI coding agent chat. Keeps things clean and
 * skimmable: a page-context header, then one numbered section per
 * annotation with just the facts an agent needs to locate and act on it.
 */
export function toMarkdown(annotations: Annotation[]): string {
  if (annotations.length === 0) {
    return '# UI Annotations\n\nNo annotations captured yet.\n';
  }

  const first = annotations[0];
  const lines: string[] = [];

  lines.push('# UI Annotations');
  lines.push('');
  lines.push(
    'The following are user-provided annotations on specific UI elements, captured for a coding agent to act on.'
  );
  lines.push('');
  lines.push('## Page Context');
  lines.push(`- **URL:** ${first.page.url}`);
  lines.push(`- **Title:** ${first.page.title}`);
  lines.push(`- **Viewport:** ${first.page.viewportWidth}x${first.page.viewportHeight}`);
  lines.push('');

  annotations.forEach((annotation, i) => {
    const n = i + 1;
    lines.push(`## Annotation ${n}`);
    lines.push(`- **Location:** \`${annotation.tagName}\` element at (${Math.round(annotation.rect.x)}, ${Math.round(annotation.rect.y)}), ${Math.round(annotation.rect.width)}x${Math.round(annotation.rect.height)}px`);
    lines.push(`- **Selector:** \`${annotation.selector}\``);
    if (annotation.classList.length > 0) {
      lines.push(`- **Classes:** \`${annotation.classList.join(' ')}\``);
    }
    if (annotation.screenshot) {
      lines.push(`- **Screenshot:**`);
      lines.push('');
      lines.push(`  ![Annotation ${n} screenshot](${annotation.screenshot})`);
    }
    lines.push('');
    lines.push('**Comment:**');
    lines.push('');
    lines.push(annotation.comment.trim() || '_(no comment provided)_');
    lines.push('');
    lines.push('<details><summary>Element HTML snippet</summary>');
    lines.push('');
    lines.push('```html');
    lines.push(annotation.outerHTML);
    lines.push('```');
    lines.push('');
    lines.push('</details>');
    lines.push('');
  });

  return lines.join('\n').trimEnd() + '\n';
}

/** Serializes annotations as pretty-printed JSON for programmatic / MCP-style consumption. */
export function toJSON(annotations: Annotation[]): string {
  return JSON.stringify(annotations, null, 2);
}
