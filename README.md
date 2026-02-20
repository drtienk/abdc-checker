# ABDC Journal Checker

A simple website where you type a journal name and check whether it is in the ABDC journal list.

## Features

- Single search box for journal lookup.
- Loads runtime data from exactly one source: `/data/abdc.json` (served from `public/data/abdc.json`).
- Case-insensitive and punctuation-insensitive matching.
- Normalization also trims text, collapses repeated spaces, removes invisible characters, and treats `&` and `and` as equivalent.
- Clear `FOUND` / `NOT FOUND` status.
- Shows rating for matched journals.
- Shows best suggestions when not found.
- Displays both runtime data path and `Loaded N journals` after data is loaded.
- Optional debug mode for misses via `?debug=1`.

## Project structure

- `index.html` — single-page UI shell.
- `src/main.js` — data loading, normalization, index lookup, and result rendering.
- `src/styles.css` — styling.
- `data/abdc.xlsx` — source ABDC dataset.
- `public/data/abdc.json` — generated journal data used by the app.
- `scripts/generate_abdc_json.py` — generator script.

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Generate data from the spreadsheet:

```bash
python scripts/generate_abdc_json.py
```

3. Start dev server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

## Regenerating journal data

Whenever `data/abdc.xlsx` changes, run:

```bash
python scripts/generate_abdc_json.py
```

## Regression test

Use this input and verify it returns `FOUND` with the official title and rating:

- `Advances in Accounting Behavioral Research`
