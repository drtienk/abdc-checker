# ABDC Journal Checker

A simple website where you type a journal title and check whether it is in the ABDC journal list.

## Data pipeline

The runtime data file is:

- `public/data/abdc.json`

It is generated from:

- `data/abdc.xlsx` (preferred source)
- `data/abdc.json` (fallback if the Excel file is missing)

Generated JSON shape:

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
```

## Replace `data/abdc.xlsx`

1. Put the new ABDC Excel file at `data/abdc.xlsx`.
2. Regenerate runtime JSON:

```bash
npm run generate:data
```

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Start development server (auto-generates JSON first):

```bash
npm run dev
```

3. Build for production (auto-generates JSON first):

```bash
npm run build
```

4. Preview production build:

```bash
npm run preview
```

## Matching behavior

Search matching is:

- case-insensitive
- punctuation-insensitive
- treats `&` the same as `and`
- collapses repeated spaces
- ignores leading `the`

If a journal is not found, the UI shows the top 5 similar titles.
