async function fetchText(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return await res.text();
}

function isTableSeparatorLine(line) {
  const t = (line || '').trim();
  // Matches: | --- | :---: | ---: |
  // Allows optional leading/trailing pipes.
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(t);
}

function splitTableRow(line) {
  let t = (line || '').trim();
  if (t.startsWith('|')) t = t.slice(1);
  if (t.endsWith('|')) t = t.slice(0, -1);
  return t.split('|').map(c => c.trim());
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderSimpleMarkdownCell(md) {
  // Keep it conservative: support a few inline markdown bits that appear
  // heavily in the timeline (bold/italic). Anything else stays as text.
  let s = escapeHtml(md);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return s;
}

function pipeTablesToHtml(md) {
  // Marked's bundled build in this repo doesn't enable tables; convert simple
  // pipe tables to HTML so Timeline renders correctly.
  const lines = (md || '').replace(/\r\n/g, '\n').split('\n');
  const out = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const next = lines[i + 1];

    const looksLikeHeader = line && line.includes('|');
    if (looksLikeHeader && isTableSeparatorLine(next)) {
      const headerCells = splitTableRow(line);
      const sepCells = splitTableRow(next);
      const colCount = Math.max(headerCells.length, sepCells.length);

      const bodyRows = [];
      i += 2;
      while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
        const cells = splitTableRow(lines[i]);
        // Only treat as a table row if it matches the column count.
        if (cells.length !== colCount) break;
        bodyRows.push(cells);
        i++;
      }

      const thead = `<thead><tr>${headerCells.map(c => `<th>${renderSimpleMarkdownCell(c)}</th>`).join('')}</tr></thead>`;
      const tbody = bodyRows.length
        ? `<tbody>${bodyRows
            .map(r => `<tr>${r.map(c => `<td>${renderSimpleMarkdownCell(c)}</td>`).join('')}</tr>`)
            .join('')}</tbody>`
        : '';
      out.push(`<table>${thead}${tbody}</table>`);
      continue;
    }

    out.push(line);
    i++;
  }

  return out.join('\n');
}

function unwrapHardWrappedParagraphs(md) {
  // The writings source is hard-wrapped (one sentence spread across multiple
  // lines) for readability in a text editor. In Markdown, single newlines
  // inside a paragraph *should* be treated as spaces. Some parsers/inputs can
  // still turn these into separate paragraphs.
  //
  // This preprocessor joins "soft" line breaks within a paragraph into spaces,
  // while preserving real paragraph breaks (blank lines) and preserving
  // structural lines (headings, lists, blockquotes, code fences).
  const lines = (md || '').replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let inFence = false;

  const isStructural = (t) => {
    if (t.startsWith('```')) return true;
    if (/^#{1,6}\s+/.test(t)) return true;
    if (/^>\s?/.test(t)) return true;
    if (/^\s*([-*+]\s+|\d+\.\s+)/.test(t)) return true;
    if (/^\s{4,}/.test(t)) return true; // indented code
    return false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t = line.trimEnd();

    if (t.startsWith('```')) {
      inFence = !inFence;
      out.push(line);
      continue;
    }

    if (inFence) {
      out.push(line);
      continue;
    }

    // Preserve blank lines as paragraph separators.
    if (t.trim() === '') {
      out.push('');
      continue;
    }

    // Preserve explicit structural lines.
    if (isStructural(t.trim())) {
      out.push(t.trim());
      continue;
    }

    // For normal text lines, merge with previous line if previous is also
    // normal text (i.e., inside a paragraph).
    const prev = out.length ? out[out.length - 1] : '';
    const prevTrim = (prev || '').trim();
    if (prevTrim !== '' && !isStructural(prevTrim)) {
      out[out.length - 1] = prevTrim + ' ' + t.trimStart();
    } else {
      out.push(t.trim());
    }
  }

  return out.join('\n');
}

function stripYamlFrontmatter(md) {
  // Supports a common frontmatter block at the very top of the file:
  // ---\nkey: value\n---
  // Keeps body content intact.
  const withoutBom = md.replace(/^\uFEFF/, '');
  const normalized = withoutBom.replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) return md;
  return normalized.replace(/^---\n[\s\S]*?\n---\n?/, '');
}

function stripLeadingH1(md) {
  // Many of our site pages already show their own title in the HTML header.
  // To avoid duplicate titles, drop the very first Markdown H1 if it appears
  // near the top of the document (allowing a little whitespace).
  const normalized = md.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');

  let i = 0;
  while (i < lines.length && lines[i].trim() === '') i++;

  if (i < lines.length && /^#\s+\S/.test(lines[i])) {
    // Remove the H1 line.
    lines.splice(i, 1);
    // And remove a single blank line after it (common markdown style).
    if (i < lines.length && lines[i].trim() === '') lines.splice(i, 1);
  }

  return lines.join('\n');
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function splitByH2KeepingHeadings(md) {
  // Produces an array of markdown chunks. Each chunk begins with a "##" heading
  // (except an optional preamble chunk above the first H2).
  const normalized = md.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const chunks = [];
  let current = [];

  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      if (current.length) chunks.push(current.join('\n').trim());
      current = [line];
      continue;
    }
    current.push(line);
  }

  if (current.length) chunks.push(current.join('\n').trim());

  // Drop empty chunks
  return chunks.filter(c => c && c.trim().length > 0);
}

function getPageHeaderBgUrl() {
  // Pull the page's header background custom property from the inline style
  // (<header class="page-header" style="--header-bg: url('...')">).
  const header = document.querySelector('.page-header');
  if (!header) return '';
  // Prefer the actual inline style so we can reuse the same URL.
  // This returns exactly the value set (e.g. "url('images/...')").
  return header.style.getPropertyValue('--header-bg').trim();
}

function renderMarkdownWithH2Dividers(container, md) {
  // Ensure pipe tables render even though our vendor Marked build doesn't.
  md = pipeTablesToHtml(md);
  const chunks = splitByH2KeepingHeadings(md);
  if (chunks.length <= 1) {
    container.innerHTML = marked.parse(md);
    return;
  }

  const bg = getPageHeaderBgUrl();
  const parts = [];
  for (let i = 0; i < chunks.length; i++) {
    parts.push(marked.parse(chunks[i]));
    if (i !== chunks.length - 1) {
      parts.push(`<div class="markdown-parallax-divider" style="--divider-bg: ${bg};"></div>`);
    }
  }

  container.innerHTML = parts.join('\n');
}

// (Removed previous empty-<p> cleanup hacks; the root issue is hard-wrapped
// markdown causing line-level paragraphs in some cases. We now normalize the
// markdown string before parsing.)

function splitWritingsByH2(md) {
  md = stripYamlFrontmatter(md);
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const sections = [];

  let current = null;

  for (const line of lines) {
    const m = line.match(/^##\s+(.*)$/);
    if (m) {
      if (current) sections.push(current);
      current = { title: m[1].trim(), bodyLines: [] };
      continue;
    }
    if (!current) continue; // ignore preamble above first H2
    current.bodyLines.push(line);
  }

  if (current) sections.push(current);

  return sections.map(s => ({
    title: s.title,
    body: s.bodyLines.join('\n').trim()
  }));
}

function extractAttribution(bodyMd) {
  // Preferred format: attribution is provided as a trailing blockquote.
  // Example:
  // > **Andraax**
  // > 6814, Second Era...
  // If present, we remove that blockquote from the body and render it separately.
  const normalized = (bodyMd || '').replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');

  // Walk backwards, collecting a contiguous trailing blockquote.
  let i = lines.length - 1;
  while (i >= 0 && lines[i].trim() === '') i--;
  if (i < 0) return { bodyMd: '', attribution: '' };

  const bqLines = [];
  while (i >= 0) {
    const t = lines[i].trim();
    if (t.startsWith('>')) {
      bqLines.push(t);
      i--;
      continue;
    }
    // Allow blank lines within the trailing blockquote run (common markdown style)
    // as long as we already started collecting blockquote lines.
    if (t === '' && bqLines.length > 0) {
      bqLines.push('');
      i--;
      continue;
    }
    break;
  }

  if (bqLines.length > 0) {
    bqLines.reverse();
    const attributionMd = bqLines
      .map(l => l.trim().startsWith('>') ? l.trim().replace(/^>\s?/, '') : '')
      .join('\n')
      .trim();

    const bodyOnly = lines.slice(0, i + 1).join('\n').trim();
    const attribution = attributionMd ? marked.parse(attributionMd) : '';
    return { bodyMd: bodyOnly, attribution };
  }

  // Back-compat fallback: old heuristic for attributions that aren't blockquotes.
  const nonEmpty = lines.map(l => l.trim()).filter(Boolean);
  if (nonEmpty.length === 0) return { bodyMd, attribution: '' };

  const tail = nonEmpty.slice(-4);
  const joinedTail = tail.join(' ');
  const looksLikeAttr = /\b(TE|T\.E\.|Second Era|First Era|Copied from|Andraax|Loremaster)\b/i.test(joinedTail)
    || tail.every(l => l.length <= 80 && !/[.!?]$/.test(l));
  if (!looksLikeAttr) return { bodyMd, attribution: '' };

  const attribution = `<p>${tail.join('<br>')}</p>`;
  let toCut = tail.length;
  const kept = [];
  for (let j = lines.length - 1; j >= 0; j--) {
    const t = lines[j].trim();
    if (toCut > 0 && t !== '' && t === tail[toCut - 1]) {
      toCut--;
      continue;
    }
    kept.push(lines[j]);
  }
  kept.reverse();
  return { bodyMd: kept.join('\n').trim(), attribution };
}

async function renderStandardMarkdown() {
  const container = document.getElementById('content');
  if (!container) return;

  try {
    let md = stripYamlFrontmatter(await fetchText(SOURCE_URL));
    md = stripLeadingH1(md);
    container.classList.remove('content-loading');
    renderMarkdownWithH2Dividers(container, md);
  } catch (err) {
    container.classList.remove('content-loading');
    container.innerHTML = `<div class="content-error">${String(err)}</div>`;
  }
}

async function renderWritingsPage() {
  const grid = document.getElementById('writings');
  if (!grid) return;

  try {
    let md = stripYamlFrontmatter(await fetchText(SOURCE_URL));
    md = stripLeadingH1(md);
    md = unwrapHardWrappedParagraphs(md);
    const sections = splitWritingsByH2(md);

    if (sections.length === 0) {
      grid.innerHTML = '<div class="content-error">No writings found (expected H2 sections).</div>';
      return;
    }

    // Full-width sections with a parallax divider between each writing.
    // We reuse the header image (via --header-bg) as the divider background.
    const bg = getPageHeaderBgUrl();
    const parts = [];

    sections.forEach((sec, idx) => {
      const { bodyMd, attribution } = extractAttribution(sec.body);
      const bodyHtml = marked.parse(bodyMd);
      const id = slugify(sec.title);

      // IMPORTANT: Only treat "Tethior and Krelij" as a writing title.
      // In the source markdown it may appear as a plain text line inside the
      // body, which should NOT be treated as a standalone paragraph.
      // If that line is intended as a subtitle, it should be markdown (e.g.
      // "### The brothers Tethior and Krelij") so Marked renders it as a heading.

      parts.push(`
        <section class="writing-section" id="${id}">
          <div class="writing-section__inner">
            <h2 class="writing-title">${sec.title}</h2>
            <div class="writing-body">${bodyHtml}</div>
            ${attribution ? `<div class="writing-attribution">${attribution}</div>` : ''}
          </div>
        </section>
      `);

      if (idx !== sections.length - 1) {
        parts.push(`<div class="markdown-parallax-divider" style="--divider-bg: ${bg};"></div>`);
      }
    });

    grid.innerHTML = parts.join('\n');

    // No DOM hacks needed: we normalize the markdown string before parsing so
    // the produced HTML has the expected paragraph structure.
  } catch (err) {
    grid.innerHTML = `<div class="content-error">${String(err)}</div>`;
  }
}

async function renderAttributeMarkdown() {
  // Render any elements that declare a markdown source via data-markdown-src.
  // This is used on some legacy pages (like Introduction) that don't use SOURCE_URL.
  const nodes = Array.from(document.querySelectorAll('[data-markdown-src]'));
  if (nodes.length === 0) return;

  await Promise.all(nodes.map(async (node) => {
    const url = node.getAttribute('data-markdown-src');
    if (!url) return;
    try {
      let md = stripYamlFrontmatter(await fetchText(url));
      md = stripLeadingH1(md);
      // data-markdown-src pages don't necessarily have a #content wrapper.
      // Still apply the same "show more of the background image between H2 sections" effect.
      renderMarkdownWithH2Dividers(node, md);
    } catch (err) {
      node.innerHTML = `<div class="content-error">${String(err)}</div>`;
    }
  }));
}

// Boot
renderStandardMarkdown();
renderWritingsPage();
renderAttributeMarkdown();
