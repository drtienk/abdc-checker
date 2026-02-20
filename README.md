# ABDC Journal Checker

A simple website where you type a journal name (or title) and check whether it is in the ABDC journal list.

## What it does

- Single search box for journal lookup.
- Loads runtime data from exactly one source: `/data/abdc.json` (served from `public/data/abdc.json`).
- Case-insensitive and punctuation-insensitive matching.
- Normalization trims text, collapses repeated spaces, removes punctuation, is case-insensitive, and treats `&` and `and` as equivalent.
- Clear `FOUND` / `NOT FOUND` status.
- Shows rating for matched journals.
- Shows best suggestions when not found.
- Displays both runtime data path and `Loaded N journals` after data is loaded.

## Data pipeline

Runtime data file:

- `public/data/abdc.json` (served at runtime as `/data/abdc.json`)

It is generated from:

- `data/abdc.xlsx` (preferred source)
- `data/abdc.json` (fallback if the Excel file is missing)

## Repo layout

- `index.html` — single-page UI shell.
- `src/main.js` — data loading, normalization, index lookup, and result rendering.
- `src/styles.css` — styling.
- `data/abdc.xlsx` — source ABDC dataset.
- `public/data/abdc.json` — generated journal data used by the app.
- `scripts/generate_abdc_json.py` — generator script.

## Expected runtime JSON schema

`public/data/abdc.json` should be an array of journal objects. The generator may include these fields:

```json
[
  {
    "title": "Journal Name",
    "rating": "A*",
    "issn": "1234-5678",
    "issn_online": "1234-5679",
    "publisher": "Publisher Name",
    "for_code": "1503",
    "year": "1984"
  }
]