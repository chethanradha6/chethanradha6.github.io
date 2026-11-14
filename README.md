# Personal Profile — Chethan Radha Prasad

Source for my portfolio site: a terminal-styled, single-page site built with plain HTML, CSS and JavaScript (no build step), hosted on GitHub Pages.

**Live:** https://chethanradha6.github.io

## Structure

| File | What it holds |
| --- | --- |
| `index.html` | All page content: hero, capabilities, code editor, stats, skills, experience, projects, education, contact |
| `style.css` | Styling, dark/light themes, responsive layout |
| `script.js` | Digital-rain background, typing effects, live code editor, counters, theme toggle, mobile menu |
| `.nojekyll` | Tells GitHub Pages to serve the files as-is |

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy

GitHub Pages serves the `main` branch from the repository root (Settings → Pages → Deploy from a branch → `main` / `/ (root)`). Every push to `main` updates the live site.
