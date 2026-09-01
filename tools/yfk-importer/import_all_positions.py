#!/usr/bin/env python3
"""Import all current YFK construction, mechanical and electrical catalogs."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import urllib.request
from collections import Counter
from dataclasses import dataclass
from pathlib import Path

import pdfplumber

CODE_RE = re.compile(r"^\d{2}\.\d{3}\.\d{4}$")
PRICE_RE = re.compile(r"^\d{1,3}(?:\.\d{3})*,\d{2}$")


@dataclass(frozen=True)
class SourceConfig:
    category: str
    discipline: str
    expected_count: int
    filename: str
    id: str
    kind: str
    label: str
    record_type: str
    url: str


SOURCES = (
    SourceConfig("İnşaat Birim Fiyatı", "construction", 1_878, "construction-unit.pdf", "yfk-insaat-birim-fiyat-2026-08", "construction", "YFK 2026 Ağustos İnşaat Birim Fiyatları", "unit_price", "https://webdosya.csb.gov.tr/v2/yfk/2026/08/2026-a-ustos-in-aat-birim-fiyatlar-20260803151108.pdf"),
    SourceConfig("Mekanik Rayiç", "mechanical", 5_601, "mechanical-rate.pdf", "yfk-mekanik-rayic-2026-08", "mechanical", "YFK 2026 Ağustos Mekanik Tesisat Rayiçleri", "rate", "https://webdosya.csb.gov.tr/v2/yfk/2026/08/Mekanik-Tesisat-2026-A-ustos-Rayi-leri-20260803151125.pdf"),
    SourceConfig("Mekanik Birim Fiyatı", "mechanical", 5_680, "mechanical-unit.pdf", "yfk-mekanik-birim-fiyat-2026-08", "mechanical", "YFK 2026 Ağustos Mekanik Tesisat Birim Fiyatları", "unit_price", "https://webdosya.csb.gov.tr/v2/yfk/2026/08/Mekanik-Tesisat-2026-A-ustos-Birim-Fiyatlar-20260803151136.pdf"),
    SourceConfig("Elektrik Rayiç", "electrical", 5_702, "electrical-rate.pdf", "yfk-elektrik-rayic-2026-08", "electrical", "YFK 2026 Ağustos Elektrik Tesisat Rayiçleri", "rate", "https://webdosya.csb.gov.tr/v2/yfk/2026/08/2026-a-ustos-elektrik-rayi-ler-20260803151152.pdf"),
    SourceConfig("Elektrik Birim Fiyatı", "electrical", 5_911, "electrical-unit.pdf", "yfk-elektrik-birim-fiyat-2026-08", "electrical", "YFK 2026 Ağustos Elektrik Tesisat Birim Fiyatları", "unit_price", "https://webdosya.csb.gov.tr/v2/yfk/2026/08/2026-a-ustos-elektrik-birim-fiyatlar-20260803151207.pdf"),
)


def clean_cell(value: object) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip(" |\t\r\n")


def clean_description(value: str) -> str:
    return re.sub(r"\s+([,.;:)])", r"\1", clean_cell(value))


def is_heading(value: str) -> bool:
    text = clean_cell(value).strip(":")
    letters = "".join(character for character in text if character.isalpha())
    return bool(letters) and (letters.upper() == letters or value.rstrip().endswith(":"))


def parse_kurus(value: str) -> int | None:
    normalized = clean_cell(value)
    if normalized in {"---", "-", "—"}:
        return 0
    if not PRICE_RE.fullmatch(normalized):
        return None
    return round(float(normalized.replace(".", "").replace(",", ".")) * 100)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def download(config: SourceConfig, directory: Path) -> Path:
    path = directory / config.filename
    if not path.exists():
        print(f"Downloading {config.label}", flush=True)
        urllib.request.urlretrieve(config.url, path)
    return path


def row_cells(row: list[object] | None) -> list[str]:
    cells = [clean_cell(cell) for cell in (row or [])[:5]]
    return cells + [""] * (5 - len(cells))


def find_leading_row(table: list[list[object]], row_index: int, current_prices: list[int | None]) -> tuple[str, str, list[int | None]] | None:
    for candidate_index in range(row_index - 1, max(-1, row_index - 8), -1):
        code, description, unit, first_price, second_price = row_cells(table[candidate_index])
        if CODE_RE.fullmatch(code):
            break
        candidate_prices = [parse_kurus(first_price), parse_kurus(second_price)]
        has_price = candidate_prices[0] is not None or candidate_prices[1] is not None
        prices_match = all(current is None or candidate is None or current == candidate for current, candidate in zip(current_prices, candidate_prices))
        if description and has_price and prices_match:
            return description, unit, candidate_prices
    return None


def following_description(table: list[list[object]], row_index: int) -> list[str]:
    fragments: list[str] = []
    for next_row in table[row_index + 1 : row_index + 5]:
        code, description, _unit, first_price, second_price = row_cells(next_row)
        if CODE_RE.fullmatch(code) or parse_kurus(first_price) is not None or parse_kurus(second_price) is not None:
            break
        if description and not is_heading(description):
            fragments.append(description)
            if len(fragments) == 2:
                break
    return fragments


def extract_source(config: SourceConfig, pdf_path: Path) -> tuple[list[dict[str, object]], int]:
    records: dict[str, dict[str, object]] = {}
    with pdfplumber.open(pdf_path) as pdf:
        page_count = len(pdf.pages)
        for page_number, page in enumerate(pdf.pages, start=1):
            table = page.extract_table() or []
            for row_index, row in enumerate(table):
                code, description, unit, first_price, second_price = row_cells(row)
                if not CODE_RE.fullmatch(code):
                    continue
                prices = [parse_kurus(first_price), parse_kurus(second_price)]
                leading = find_leading_row(table, row_index, prices) if not description or prices[0] is None else None
                description_parts: list[str] = []
                if leading:
                    description_parts.append(leading[0])
                    unit = unit or leading[1]
                    prices = [current if current is not None else candidate for current, candidate in zip(prices, leading[2])]
                if description:
                    description_parts.append(description)
                description_parts.extend(following_description(table, row_index))
                name = clean_description(" ".join(description_parts)) or code
                base_price_kurus = prices[0] or 0
                installation_price_kurus = prices[1] or 0
                total_price_kurus = base_price_kurus + installation_price_kurus
                item = {
                    "category": config.category,
                    "code": code,
                    "kind": config.kind,
                    "metadata": {
                        "baseUnitPriceKurus": base_price_kurus,
                        "discipline": config.discipline,
                        "installationPriceKurus": installation_price_kurus,
                        "page": page_number,
                        "priced": total_price_kurus > 0,
                        "recordType": config.record_type,
                    },
                    "name": name,
                    "sourceVersionId": config.id,
                    "unit": unit or "birim",
                    "unitPriceKurus": total_price_kurus,
                }
                if code in records:
                    raise ValueError(f"Duplicate first-column code in {config.id}: {code}")
                records[code] = item
            if page_number % 25 == 0 or page_number == page_count:
                print(f"{config.id}: {page_number}/{page_count}", flush=True)
    return list(records.values()), page_count


def source_metadata(config: SourceConfig, pdf_path: Path) -> dict[str, object]:
    return {
        "authority": "T.C. Çevre, Şehircilik ve İklim Değişikliği Bakanlığı - YFK",
        "checksum": sha256(pdf_path),
        "currency": "TRY",
        "id": config.id,
        "itemKinds": [config.kind],
        "label": config.label,
        "publishedAt": "2026-08-03",
        "sourceUrl": config.url,
        "validFrom": "2026-08-01",
    }


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--download-directory", type=Path, default=Path("tools/yfk-importer/tmp/all-positions"))
    parser.add_argument("--output-directory", type=Path, default=Path("src/features/costs/data/generated"))
    args = parser.parse_args()
    args.download_directory.mkdir(parents=True, exist_ok=True)
    all_items: list[dict[str, object]] = []
    metadata: list[dict[str, object]] = []
    source_reports: list[dict[str, object]] = []
    for config in SOURCES:
        pdf_path = download(config, args.download_directory)
        items, page_count = extract_source(config, pdf_path)
        all_items.extend(items)
        metadata.append(source_metadata(config, pdf_path))
        source_reports.append({
            "expectedItemCount": config.expected_count,
            "id": config.id,
            "itemCount": len(items),
            "pageCount": page_count,
            "placeholderNameCount": sum(item["name"] == item["code"] for item in items),
            "unpricedItemCount": sum(int(item["unitPriceKurus"]) == 0 for item in items),
            "uniqueCodeCount": len({str(item["code"]) for item in items}),
        })
        if len(items) != config.expected_count:
            raise ValueError(
                f"Unexpected item count in {config.id}: {len(items)} != {config.expected_count}"
            )
    kind_counts = Counter(str(item["kind"]) for item in all_items)
    replacement_character_count = sum(str(item[field]).count("�") for item in all_items for field in ("name", "unit"))
    placeholder_name_count = sum(item["name"] == item["code"] for item in all_items)
    report = {
        "itemCount": len(all_items),
        "kindCounts": dict(sorted(kind_counts.items())),
        "placeholderNameCount": placeholder_name_count,
        "replacementCharacterCount": replacement_character_count,
        "sources": source_reports,
    }
    if replacement_character_count or placeholder_name_count:
        raise ValueError(f"Generated catalogs contain invalid text: {replacement_character_count=}, {placeholder_name_count=}")
    for source_report in source_reports:
        if source_report["itemCount"] != source_report["uniqueCodeCount"]:
            raise ValueError(f"Duplicate codes in {source_report['id']}")
    write_json(args.output_directory / "yfk-2026-08-all-positions.json", all_items)
    write_json(args.output_directory / "yfk-2026-08-all-position-sources.json", metadata)
    write_json(args.output_directory / "yfk-2026-08-all-positions-validation.json", report)
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
