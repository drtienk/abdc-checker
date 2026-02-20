#!/usr/bin/env python3
"""Generate public/data/abdc.json from data/abdc.xlsx.

Falls back to data/abdc.json when the XLSX file is unavailable.
"""

from __future__ import annotations

import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
XLSX_PATH = ROOT / "data" / "abdc.xlsx"
LEGACY_JSON_PATH = ROOT / "data" / "abdc.json"
OUTPUT_PATH = ROOT / "public" / "data" / "abdc.json"

NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/package/2006/relationships",
    "docrel": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}


def clean(value: str | None) -> str:
    value = "" if value is None else str(value)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def normalize_year(value: str) -> str:
    if re.fullmatch(r"\d+\.0", value):
        return value.split(".", 1)[0]
    return value


def col_ref(cell_ref: str) -> str:
    # Safer: avoid crash if cell reference is missing/invalid
    m = re.match(r"[A-Z]+", cell_ref or "")
    return m.group(0) if m else ""


def read_shared_strings(zf: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in zf.namelist():
        return []
    root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    values: list[str] = []
    for si in root.findall("main:si", NS):
        parts = [t.text or "" for t in si.findall(".//main:t", NS)]
        values.append("".join(parts))
    return values


def resolve_sheet_path(zf: zipfile.ZipFile) -> str:
    workbook = ET.fromstring(zf.read("xl/workbook.xml"))
    rel_id = None
    for sheet in workbook.findall("main:sheets/main:sheet", NS):
        rel_id = sheet.attrib.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
        if rel_id:
            break
    if not rel_id:
        raise RuntimeError("No worksheet found in workbook")

    rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    for rel in rels.findall("rel:Relationship", NS):
        if rel.attrib.get("Id") == rel_id:
            target = rel.attrib["Target"]
            return target if target.startswith("xl/") else f"xl/{target}"
    raise RuntimeError("Worksheet relationship not found")


def read_cells(zf: zipfile.ZipFile, sheet_path: str, shared: list[str]) -> list[dict[str, str]]:
    root = ET.fromstring(zf.read(sheet_path))
    rows: list[dict[str, str]] = []
    for row in root.findall("main:sheetData/main:row", NS):
        row_data: dict[str, str] = {}
        for cell in row.findall("main:c", NS):
            ref = cell.attrib.get("r", "")
            key = col_ref(ref) if ref else ""
            cell_type = cell.attrib.get("t")
            if cell_type == "inlineStr":
                txt = "".join((t.text or "") for t in cell.findall("main:is/main:t", NS))
            else:
                value_node = cell.find("main:v", NS)
                raw = value_node.text if value_node is not None else ""
                if cell_type == "s" and raw:
                    txt = shared[int(raw)]
                else:
                    txt = raw
                if not txt:
                    formula_node = cell.find("main:f", NS)
                    if formula_node is not None and formula_node.text:
                        txt = formula_node.text
            row_data[key] = clean(txt)
        rows.append(row_data)
    return rows


def normalize_headers(header_row: dict[str, str]) -> dict[str, str]:
    return {k: clean(v).lower() for k, v in header_row.items() if clean(v)}


def find_column(headers: dict[str, str], *candidates: str) -> str | None:
    candidate_set = {c.lower() for c in candidates}
    for col, name in headers.items():
        if name in candidate_set:
            return col
    return None


def parse_from_xlsx() -> list[dict[str, str]]:
    with zipfile.ZipFile(XLSX_PATH) as zf:
        shared = read_shared_strings(zf)
        sheet_path = resolve_sheet_path(zf)
        rows = read_cells(zf, sheet_path, shared)

    if not rows:
        return []

    headers = normalize_headers(rows[0])
    title_col = find_column(headers, "journal title", "title", "journal")
    rating_col = find_column(headers, "2022 rating", "rating")
    issn_col = find_column(headers, "issn")
    issn_online_col = find_column(headers, "issn online", "online issn", "eissn", "e-issn")
    publisher_col = find_column(headers, "publisher")
    for_col = find_column(headers, "for", "for code", "for code(s)", "for1", "for 1")
    year_col = find_column(headers, "year inception", "year")

    output: list[dict[str, str]] = []
    for row in rows[1:]:
        title = clean(row.get(title_col, "")) if title_col else ""
        rating = clean(row.get(rating_col, "")) if rating_col else ""
        if not title:
            continue
        output.append(
            {
                "title": title,
                "rating": rating,
                "issn": clean(row.get(issn_col, "")) if issn_col else "",
                "issn_online": clean(row.get(issn_online_col, "")) if issn_online_col else "",
                "publisher": clean(row.get(publisher_col, "")) if publisher_col else "",
                "for_code": clean(row.get(for_col, "")) if for_col else "",
                "year": normalize_year(clean(row.get(year_col, ""))) if year_col else "",
            }
        )

    output.sort(key=lambda x: x["title"].lower())
    return output


def parse_from_legacy_json() -> list[dict[str, str]]:
    data = json.loads(LEGACY_JSON_PATH.read_text(encoding="utf-8"))
    out: list[dict[str, str]] = []

    for item in data:
        title = clean(item.get("name", ""))
        rating = clean(item.get("rating", "")) or clean(item.get("rank", ""))
        if not title:
            continue
        out.append(
            {
                "title": title,
                "rating": rating,
                "issn": "",
                "issn_online": "",
                "publisher": "",
                "for_code": "",
                "year": "",
            }
        )

    out.sort(key=lambda x: x["title"].lower())
    return out


def main() -> int:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    if XLSX_PATH.exists():
        records = parse_from_xlsx()
        source = XLSX_PATH
    elif LEGACY_JSON_PATH.exists():
        records = parse_from_legacy_json()
        source = LEGACY_JSON_PATH
        print("warning: data/abdc.xlsx not found; generated from fallback data/abdc.json", file=sys.stderr)
    else:
        print("error: neither data/abdc.xlsx nor data/abdc.json exists", file=sys.stderr)
        return 1

    # Optional but nice: ensure stable ordering even if upstream changes
    records.sort(key=lambda x: x.get("title", "").lower())

    OUTPUT_PATH.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"generated {OUTPUT_PATH} with {len(records)} journals from {source}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())