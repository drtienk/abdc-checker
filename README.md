# ABDC Journal Checker

A simple website where you type a journal name and check whether it is in the ABDC journal list.

## Features

- Search by journal name with case/punctuation-insensitive matching.
- Clear result card for **found** or **not found**.
- If not found, the app suggests similar journal names.
- Journal data is stored in `/data/abdc.json`.

## Project structure

- `index.html` — single-page UI shell.
- `src/main.js` — search logic and result rendering.
- `src/styles.css` — simple clean styling.
- `data/abdc.json` — ABDC journal dataset.

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

4. Preview production build:

```bash
npm run preview
```

## Deploy

This is a static Vite site.

### Vercel

- Framework preset: **Vite**
- Build command: `npm run build`
- Output directory: `dist`

### Netlify

- Build command: `npm run build`
- Publish directory: `dist`

## Updating the journal list

Edit `data/abdc.json` using this shape:

```json
[
  { "name": "Journal Name", "rank": "A*" }
]
```
