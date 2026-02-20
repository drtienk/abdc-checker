#!/usr/bin/env python3
"""Generate public/data/abdc.json from data/abdc.xlsx."""

from __future__ import annotations

import json
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

NS = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
COL_REF_RE = re.compile(r"([A-Z]+)")


def col_to_index(col: str) -> int:
    index = 0
    for char in col:
        index = (index * 26) + (ord(char) - ord("A") + 1)
    return index - 1


def cell_value(cell: ET.Element, shared_strings: list[str]) -> str:
    value_node = cell.find("x:v", NS)
    if value_node is None or value_node.text is None:
        return ""

    if cell.attrib.get("t") == "s":
        return shared_strings[int(value_node.text)]

    return value_node.text


def load_shared_strings(book: zipfile.ZipFile) -> list[str]:
    root = ET.fromstring(book.read("xl/sharedStrings.xml"))
    values = []
    for item in root.findall("x:si", NS):
        parts = [node.text or "" for node in item.findall(".//x:t", NS)]
        values.append("".join(parts))
    return values


def parse_sheet(path: Path) -> list[dict[str, str]]:
    with zipfile.ZipFile(path) as book:
        shared = load_shared_strings(book)
        sheet = ET.fromstring(book.read("xl/worksheets/sheet1.xml"))

    rows = sheet.findall(".//x:sheetData/x:row", NS)
    if not rows:
        return []

    headers: dict[int, str] = {}
    for cell in rows[0].findall("x:c", NS):
        ref = cell.attrib.get("r", "")
        match = COL_REF_RE.match(ref)
        if not match:
            continue
        headers[col_to_index(match.group(1))] = cell_value(cell, shared)

    journals = []
    for row in rows[1:]:
        row_data: dict[str, str] = {}
        for cell in row.findall("x:c", NS):
            ref = cell.attrib.get("r", "")
            match = COL_REF_RE.match(ref)
            if not match:
                continue
            idx = col_to_index(match.group(1))
            header = headers.get(idx)
            if header:
                row_data[header] = cell_value(cell, shared).strip()

        name = row_data.get("Journal Title", "").strip()
        rating = row_data.get("2022 rating", "").strip()
        if not name:
            continue

        journals.append({"name": name, "rating": rating})

    journals.sort(key=lambda item: item["name"].lower())
    return journals


def main() -> None:
    source = Path("data/abdc.xlsx")
    output = Path("public/data/abdc.json")

    journals = parse_sheet(source)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(journals, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(f"Wrote {len(journals)} journals to {output}")


if __name__ == "__main__":
    main()
