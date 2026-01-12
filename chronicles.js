async function fetchText(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return await res.text();
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
  // Heuristic: attribution is the last non-empty paragraph-like lines (up to 4 lines)
  // that have no terminal punctuation, or look like names/dates.
  const lines = bodyMd.split('\n');
  const nonEmpty = lines.map(l => l.trim()).filter(Boolean);
  if (nonEmpty.length === 0) return { bodyMd, attribution: '' };

  // Consider last 1-4 non-empty lines.
  const tail = nonEmpty.slice(-4);

  // If there's an explicit "Copied from" or a year marker, treat tail as attribution.
  const joinedTail = tail.join(' ');
  const looksLikeAttr = /\b(TE|T\.E\.|Second Era|First Era|Copied from|Andraax|Loremaster)\b/i.test(joinedTail)
    || tail.every(l => l.length <= 80 && !/[.!?]$/.test(l));

  if (!looksLikeAttr) return { bodyMd, attribution: '' };

  const attribution = tail.join('<br>');

  // Remove those tail lines from body (by dropping matching suffix from nonEmpty projection).
  // To preserve body formatting, remove from original by scanning from end.
  let toCut = tail.length;
  const kept = [];
  for (let i = lines.length - 1; i >= 0; i--) {
    const t = lines[i].trim();
    if (toCut > 0 && t !== '' && t === tail[toCut - 1]) {
      toCut--;
      continue;
    }
    kept.push(lines[i]);
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
    container.innerHTML = marked.parse(md);
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
    const sections = splitWritingsByH2(md);

    if (sections.length === 0) {
      grid.innerHTML = '<div class="content-error">No writings found (expected H2 sections).</div>';
      return;
    }

    const cards = sections.map(sec => {
      const { bodyMd, attribution } = extractAttribution(sec.body);
      const bodyHtml = marked.parse(bodyMd);
      const id = slugify(sec.title);

      return `
        <article class="writing-card" id="${id}">
          <h2 class="writing-title">${sec.title}</h2>
          <div class="writing-body">${bodyHtml}</div>
          ${attribution ? `<div class="writing-attribution">${attribution}</div>` : ''}
        </article>
      `;
    }).join('\n');

    grid.innerHTML = cards;
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
      node.innerHTML = marked.parse(md);
    } catch (err) {
      node.innerHTML = `<div class="content-error">${String(err)}</div>`;
    }
  }));
}

// Boot
renderStandardMarkdown();
renderWritingsPage();
renderAttributeMarkdown();
