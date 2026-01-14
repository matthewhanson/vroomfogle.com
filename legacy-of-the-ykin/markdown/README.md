# Synced content

This directory contains a **mirrored copy** of the campaign source files from the repo directory:

- `legacy-of-the-yinka/`

Treat those source files as the **source of truth**. The files here are synced into the website so the static pages can load markdown without reaching outside the site root.

## Sync

Run this from the repo root (the directory that contains both `legacy-of-the-yinka/` and `vroomfogle.com/`):

```bash
rsync -av --delete legacy-of-the-yinka/chronicles/ vroomfogle.com/legacy-of-the-ykin/markdown/chronicles/
rsync -av --delete legacy-of-the-yinka/setting/ vroomfogle.com/legacy-of-the-ykin/markdown/setting/
rsync -av --delete legacy-of-the-yinka/introduction.md vroomfogle.com/legacy-of-the-ykin/markdown/introduction.md
```

Notes:
- `--delete` keeps the mirror clean if files are removed from the source.
- These commands use **relative paths** (no machine-specific absolute paths).
