# ABDC Journal Checker

A simple website where you type a journal name (or title) and check whether it is in the ABDC journal list.

## Data pipeline

Runtime data file:

- `public/data/abdc.json` (served at runtime as `/data/abdc.json`)

It is generated from:

- `data/abdc.xlsx` (preferred source)
- `data/abdc.json` (fallback if the Excel file is missing)

Generated JSON is an array of journal objects. The generator may include these fields:

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