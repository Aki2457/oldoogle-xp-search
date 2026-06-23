# Oldoogle XP Search

Windows XP styled Oldoogle search interface with live Apify-backed result widgets, Chromium and Firefox extension builds, and Windows launcher packaging.

## Setup

1. Copy `.env.example` to `.env`.
2. Add your Apify token:

```env
APIFY_TOKEN=your_apify_token_here
```

3. Install dependencies:

```bash
npm install
```

4. Run locally:

```bash
npm start
```

Open `http://localhost:3000`.

## Builds

Build the Windows launcher:

```bash
npm run build:exe
```

Package browser extensions:

```bash
npm run package:extensions
```

Download Chromium and create a local Oldoogle Chromium launcher:

```bash
npm run download:chromium
```

Generated files are written to `dist/` and are intentionally ignored by git.

