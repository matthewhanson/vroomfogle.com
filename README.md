# Vroomfogle & Company

**Live Site:** https://vroomfogle.com

A curated archive of Shadow World lore, featuring interactive tools, campaign chronicles, and AI-powered exploration of Kulthea.

## Overview

- **Visit Nomikos**: Interactive RAG-powered chat with the Scribes for lore exploration
- **Ask Andraax**: Single-question oracle guarding forbidden knowledge  
- **Legacy of the Y'kin**: Campaign chronicles, timeline, and setting documentation
- Pure HTML/CSS/JS static site deployed via GitHub Pages
- Backend: Serverless Lambda API (nomikos-api.vroomfogle.com)

## Development

### Deployment

GitHub Pages automatically deploys from `main` branch. No build process required:

```bash
git push origin main
```

### Local Testing

```bash
python -m http.server 8000
```

Visit http://localhost:8000

### Legacy of the Y'kin Chronicles

Campaign markdown is synced from the canonical `legacy-of-the-yinka` repository:

```bash
rsync -av --delete ../legacy-of-the-yinka/chronicles/ vroomfogle.com/legacy-of-the-ykin/markdown/chronicles/
rsync -av --delete ../legacy-of-the-yinka/setting/ vroomfogle.com/legacy-of-the-ykin/markdown/setting/
rsync -av --delete ../legacy-of-the-yinka/introduction.md vroomfogle.com/legacy-of-the-ykin/markdown/introduction.md
```

**Workflow:**
1. Edit chronicles in source repo
2. Sync to `legacy-of-the-ykin/markdown/`
3. Commit and push

Pages render markdown client-side with `marked.js` and extract YAML frontmatter for descriptions.

## Issues

Report bugs or request features: [GitHub Issues](https://github.com/matthewhanson/vroomfogle.com/issues)
