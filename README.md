# UserPlugins Script Generator

Static React + Vite app that builds install scripts for **Equicord** and **Vencord** with a chosen set of user plugins.

## Features

- **Client selection**: Equicord, Vencord, or a custom fork URL.
- **Plugin catalog**: Bundled from `src/data/plugins.json` (display names, descriptions, GitHub URLs). Optional extra repos merged in via the GitHub API.
- **Branch picker**: Load remote branches for selected plugins (rate-limited API calls).
- **Script output**: PowerShell 7+, PowerShell 5, or CMD/Batch.
- **Options**: Git vs ZIP, install path, dependency installers (winget/scoop/choco), Discord branch for inject, OpenAsar.

## Project layout

```
VBPGenerator/
├── index.html                 # Vite entry HTML
├── vite.config.js             # base: '/VBPGenerator/' for GitHub Pages
├── data/
│   └── plugins.md             # Optional source table for npm run build:plugins (gitignored if you keep it local)
├── scripts/
│   └── build-plugins-json.mjs # Writes src/data/plugins.json from data/plugins.md
└── src/
    ├── main.jsx               # React root
    ├── index.css              # Global styles
    ├── data/
    │   └── plugins.json       # Catalog imported by the app (committed)
    ├── app/
    │   └── App.jsx            # Root layout, form state, modal
    ├── assets/
    │   └── logo.svg
    ├── components/
    │   └── PluginSelectionSection.jsx
    ├── lib/
    │   ├── pluginCatalog.js   # Normalize bundled catalog rows
    │   └── pluginUtils.js     # pluginKey, URL helpers
    ├── services/
    │   └── githubPluginApi.js # GitHub REST: resolve URL, list branches
    └── generator/
        └── installScriptGenerator.js  # PowerShell / batch text output
```

## Development

```bash
npm install
npm run dev
```

Edit the catalog directly in `src/data/plugins.json`, or maintain a markdown table in `data/plugins.md` and regenerate:

```bash
npm run build:plugins
```

(`data/plugins.md` is listed in `.gitignore` so you can keep a private source file; commit `src/data/plugins.json` for the live catalog.)

## Deployment (GitHub Pages)

This repo is a **project** site: [https://o9-9.github.io/VBPGenerator/](https://o9-9.github.io/VBPGenerator/). Keep `base: '/VBPGenerator/'` in `vite.config.js` unless you change the hosting path.

1. `npm run build`
2. Publish the `dist` output (e.g. `gh-pages` branch or Actions).
