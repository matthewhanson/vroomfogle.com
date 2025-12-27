# Vroomfogle & Company

**Live Site:** https://vroomfogle.com

A curated archive of Shadow World lore, featuring interactive tools and resources for exploring the rich universe of Kulthea.

## Overview

Vroomfogle & Company serves as a comprehensive resource hub for Shadow World RPG campaigns. The site provides:

- **Ask Andraax**: Consult with the ancient Loari Elf who guards forbidden knowledge (single Q&A format)
- **Visit Nomikos**: Interactive chat sessions with the Scribes of the great library (multi-turn conversations)
- **Who is Vroomfogle**: Learn about the eccentric archivist who curates these chronicles
- **Future Resources**: Gallery, maps, chronicles, and more coming soon

## Architecture

### Static Frontend
- Pure HTML/CSS/JavaScript (no build process)
- Deployed to GitHub Pages
- Custom domain: vroomfogle.com

### API Integration
- Nomikos API: `https://nomikos-api.vroomfogle.com`
- Serverless Lambda backend (separate repository)
- OpenAI GPT-4o-mini for LLM responses
- RAG (Retrieval Augmented Generation) for lore accuracy

## Project Structure

```
vroomfogle.com/
├── index.html              # Homepage with parallax sections
├── ask-andraax.html        # Single Q&A interface for Andraax persona
├── nomikos.html            # Full chat interface for Scribe persona
├── style.css               # Global styles and theme
├── script.js               # Homepage interactions and parallax effects
├── ask-andraax.js          # Andraax Q&A functionality
├── images/                 # Visual assets
│   ├── vroomfogle-castle.png
│   ├── vroomfogle-pajamas.png
│   ├── vroomfogle-library.png
│   ├── vroomfogle-and-company.png
│   ├── andraax-library.png
│   ├── nomikos-library.png
│   └── vroomfogle-drawing.png
├── CNAME                   # Custom domain configuration
├── .nojekyll              # Disable Jekyll processing
└── README.md              # This file
```

## Features

### Ask Andraax
- Single question/answer format (no conversation history)
- Andraax persona: cryptic, guarding forbidden knowledge
- Classification system prevents revealing dangerous lore
- Era-aware responses (Second Era vs Third Era)

### Visit Nomikos
- Full interactive chat with conversation history
- Scribe persona: straightforward, comprehensive
- Clickable example queries
- Markdown rendering with marked.js
- Multiple RAG searches per response for accuracy
- Era-specific date formatting (SE/TE prefixes)

### Visual Design
- Fantasy RPG aesthetic with purple/gold color scheme
- Parallax scrolling background images
- Responsive design for mobile and desktop
- Smooth animations and transitions
- Glassmorphism effects

## Deployment

### GitHub Pages Setup

The site deploys automatically to GitHub Pages when changes are pushed to the `main` branch.

**Repository Settings:**
1. Go to Settings → Pages
2. Source: Deploy from a branch
3. Branch: `main` / (root)
4. Custom domain: `vroomfogle.com`
5. Enforce HTTPS: ✓

**DNS Configuration:**
Configure your DNS provider with these A records pointing to GitHub Pages:

```
Type: A, Name: @, Value: 185.199.108.153
Type: A, Name: @, Value: 185.199.109.153
Type: A, Name: @, Value: 185.199.110.153
Type: A, Name: @, Value: 185.199.111.153
Type: CNAME, Name: www, Value: matthewhanson.github.io
```

GitHub Pages will automatically serve the site and handle HTTPS certificates after DNS propagates (typically 1-4 hours).

### Deployment Workflow

No build process required! Simply:

```bash
git add .
git commit -m "Update site content"
git push origin main
```

GitHub Pages will automatically deploy changes within 1-2 minutes.

## Development

### Local Testing

Start a local web server:

```bash
python -m http.server 8000
# or
npx serve
```

Visit: http://localhost:8000

### File Organization

- **HTML files**: Self-contained pages (no templates)
- **CSS**: Single global stylesheet with custom properties
- **JavaScript**: Minimal vanilla JS, no frameworks
- **Images**: Optimized PNG files for parallax and cards

### API Endpoints

All API calls go to `nomikos-api.vroomfogle.com`:

- `POST /chat` - Multi-turn conversation with history
- `POST /answer` - Single Q&A (used by Ask Andraax)
- `POST /search` - Raw document search
- `POST /classify` - Question classification (internal)

## Content Guidelines

### Adding New Sections

1. Create section in `index.html`
2. Add corresponding styles in `style.css`
3. Update parallax effects in `script.js` if needed
4. Test on mobile and desktop

### Image Requirements

- Format: PNG with transparency or solid background
- Size: Minimum 1920x1080 for parallax images
- Optimization: Use tools like TinyPNG to reduce file size
- Naming: Use descriptive kebab-case names

### Sensitive Content

**Safe to commit:**
- HTML, CSS, JavaScript files
- Images and static assets
- Public API endpoints (nomikos-api.vroomfogle.com)
- Configuration files (CNAME, .nojekyll)

**DO NOT commit:**
- API keys or secrets (none currently used)
- AWS credentials
- Private documentation
- Source material with copyright restrictions

## Related Projects

- **nomikos**: Backend API (Lambda + CDK)
- **athenaeum**: Core indexing and RAG library
- **nomikos-ui**: Developer tools interface (separate from production site)

## License

All Shadow World lore belongs to Iron Crown Enterprises (ICE). This is a fan site for personal RPG campaigns.

## Troubleshooting

### CNAME Issues
If custom domain doesn't work:
1. Verify DNS propagation: `dig vroomfogle.com`
2. Check GitHub Pages settings
3. Ensure CNAME file contains only: `vroomfogle.com`

### API Connection Errors
- Verify nomikos-api.vroomfogle.com is deployed and running
- Check browser console for CORS errors
- Ensure API returns proper CORS headers

### Parallax Not Working
- Check that images exist in `/images/` directory
- Verify CSS background-image paths
- Test with browser dev tools (Network tab)

## Future Enhancements

- [ ] Gallery section with artwork and character portraits
- [ ] Interactive maps of Kulthea
- [ ] Campaign chronicles and session notes
- [ ] Downloadable resources (PDFs, character sheets)
- [ ] Search functionality across all content
- [ ] Dark/light mode toggle
