#!/usr/bin/env python3
"""Import the official YFK construction rate PDF into deterministic JSON files."""

from __future__ import annotations

import argparse
import difflib
import hashlib
import json
import re
import shutil
import subprocess
import tempfile
import urllib.request
from collections import Counter
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Iterable

import pdfplumber

SOURCE_URL = (
    "https://webdosya.csb.gov.tr/v2/yfk/2026/08/"
    "2026-a-ustos-rayi-ler-20260803151053.pdf"
)
ANNOUNCEMENT_URL = (
    "https://yfk.csb.gov.tr/2026-yilina-ait-guncellenmis-aylik-rayic-ve-birim-"
    "fiyat-listeleri-agustos-ayi-03-agustos-2026-tarihinde-yayinlanmis-olup-"
    "01-agustos-2026-tarihinden-itibaren-gecerlidir-114984"
)
SOURCE_VERSION_ID = "yfk-insaat-2026-08"
EXPECTED_KIND_COUNTS = {
    "equipment": 260,
    "labor": 113,
    "material": 5145,
    "transport": 3,
}
CODE_RE = re.compile(r"^10\.\d{3}\.\d{4}$")
OCR_CODE_RE = re.compile(r"10[. ]?(\d{3})[. ]?(\d{4})")
PRICE_RE = re.compile(r"([\d.]+,\d{2})\s*$")
BLOCK_RE = re.compile(r"(?ms)^(10\.\d{3}\.\d{4})\s+(.*?)(?=^10\.\d{3}\.\d{4}\s+|\Z)")
SKIP_TEXT = {
    "Birim",
    "Güncel Fiyatlar",
    "Poz No",
    "Tanım",
    "TÜİK Endeksleriyle",
    "(TL)",
}


@dataclass
class RawRecord:
    code: str
    context: str
    kind: str
    name: str
    page: int
    price_kurus: int
    unit: str


def clean_cell(value: object) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip(" |\t\r\n")


def parse_price_kurus(value: str) -> int:
    normalized = value.replace(".", "").replace(",", ".")
    return round(float(normalized) * 100)


def item_kind(code: str) -> str:
    if code.startswith("10.100."):
        return "labor"
    if code.startswith("10.110."):
        return "transport"
    if code.startswith("10.120."):
        return "equipment"
    return "material"


def is_generic_heading(value: str) -> bool:
    comparable = value.replace("�", "").strip()
    if not comparable or value in SKIP_TEXT:
        return True
    letters = "".join(char for char in comparable if char.isalpha())
    return len(letters) > 3 and letters.upper() == letters


def extract_structured_records(pdf_path: Path) -> tuple[list[RawRecord], dict[int, list[str]]]:
    records: list[RawRecord] = []
    page_contexts: dict[int, list[str]] = {}
    active_context = ""
    pending_context: list[str] = []

    seen_codes: set[str] = set()
    fallback_records: list[RawRecord] = []

    with pdfplumber.open(pdf_path) as pdf:
        for page_number, page in enumerate(pdf.pages, start=1):
            table = page.extract_table() or []
            page_contexts[page_number] = []

            recovered_rows: dict[int, tuple[str, str, str]] = {}
            for row_index, row in enumerate(table):
                if not row or len(row) < 4:
                    continue
                code, description, unit, price = (clean_cell(cell) for cell in row[:4])
                if not CODE_RE.fullmatch(code) or (description and price):
                    continue

                # Some machinery rows are vertically split by the PDF producer:
                # description/unit/price are emitted just before the row containing
                # the code. Rejoin those cells deterministically before parsing.
                lower_bound = max(-1, row_index - 6)
                for candidate_index in range(row_index - 1, lower_bound, -1):
                    candidate = table[candidate_index]
                    if not candidate or len(candidate) < 4:
                        continue
                    candidate_code, candidate_description, candidate_unit, candidate_price = (
                        clean_cell(cell) for cell in candidate[:4]
                    )
                    if CODE_RE.fullmatch(candidate_code):
                        break
                    if candidate_description and candidate_price and (
                        not price or candidate_price == price
                    ):
                        continuation_parts: list[str] = []
                        for next_row in table[row_index + 1 : row_index + 5]:
                            if not next_row or len(next_row) < 4:
                                continue
                            next_code, next_description, _next_unit, next_price = (
                                clean_cell(cell) for cell in next_row[:4]
                            )
                            if CODE_RE.fullmatch(next_code) or next_price:
                                break
                            if next_description and not is_generic_heading(next_description):
                                continuation_parts.append(next_description)
                                break

                        recovered_description = " ".join(
                            [candidate_description, description, *continuation_parts]
                        )
                        recovered_unit = unit or candidate_unit
                        if not recovered_unit:
                            following_text = " ".join(continuation_parts)
                            recovered_unit = "gün" if "ndelik" in skeleton(following_text) else "birim"
                        recovered_rows[row_index] = (
                            recovered_description,
                            recovered_unit,
                            candidate_price,
                        )
                        break

            for row_index, row in enumerate(table):
                if not row or len(row) < 4:
                    continue
                code, description, unit, price = (clean_cell(cell) for cell in row[:4])

                if row_index in recovered_rows:
                    recovered_description, recovered_unit, recovered_price = recovered_rows[row_index]
                    description = recovered_description
                    unit = unit or recovered_unit
                    price = price or recovered_price

                if CODE_RE.fullmatch(code) and price:
                    if pending_context:
                        active_context = " ".join(pending_context)
                        pending_context = []

                    record = RawRecord(
                            code=code,
                            context=active_context,
                            kind=item_kind(code),
                            name=description or code,
                            page=page_number,
                            price_kurus=parse_price_kurus(price),
                            unit=unit or "birim",
                        )
                    records.append(record)
                    seen_codes.add(code)
                    continue

                if not code and description and not unit and not price:
                    if is_generic_heading(description):
                        pending_context = []
                        active_context = ""
                    elif description not in SKIP_TEXT:
                        pending_context.append(description)
                        page_contexts[page_number].append(description)

            page_text = page.extract_text() or ""
            for match in BLOCK_RE.finditer(page_text):
                code, block = match.groups()
                if code in seen_codes:
                    continue
                price_match = re.search(r"([\d.]+,\d{2})(?:\s|$)", block)
                if not price_match:
                    continue
                before_price = clean_cell(block[: price_match.start()])
                tokens = before_price.split()
                if not tokens:
                    continue
                unit = tokens[-1]
                description = " ".join(tokens[:-1]) or code
                fallback_records.append(
                    RawRecord(
                        code=code,
                        context=active_context,
                        kind=item_kind(code),
                        name=description,
                        page=page_number,
                        price_kurus=parse_price_kurus(price_match.group(1)),
                        unit=unit,
                    )
                )
                seen_codes.add(code)

    records.extend(fallback_records)

    unique: dict[str, RawRecord] = {}
    for record in records:
        if record.code in unique:
            raise ValueError(f"Duplicate code found: {record.code}")
        unique[record.code] = record
    return list(unique.values()), page_contexts


def find_program(name: str, known_paths: Iterable[Path]) -> str | None:
    discovered = shutil.which(name)
    if discovered:
        return discovered
    for path in known_paths:
        if path.exists():
            return str(path)
    return None


def normalize_code(value: str) -> str | None:
    match = OCR_CODE_RE.search(value)
    return f"10.{match.group(1)}.{match.group(2)}" if match else None


def skeleton(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.lower().replace("ı", "i").replace("�", ""))


def transfer_missing_characters(lossy: str, ocr: str) -> str:
    """Use OCR only where the PDF text layer contains replacement characters."""
    if "�" not in lossy or not ocr:
        return lossy

    matcher = difflib.SequenceMatcher(a=lossy.lower(), b=ocr.lower(), autojunk=False)
    output: list[str] = []
    for operation, left_start, left_end, right_start, right_end in matcher.get_opcodes():
        left = lossy[left_start:left_end]
        right = ocr[right_start:right_end]
        if "�" not in left:
            output.append(left)
            continue
        if operation in {"equal", "replace"} and len(left) == len(right):
            output.append("".join(r if l == "�" else l for l, r in zip(left, right)))
        else:
            output.append(left)
    return "".join(output)


def best_ocr_context(lossy: str, lines: list[str]) -> str | None:
    target = skeleton(lossy)
    if len(target) < 6:
        return None
    scored = [
        (difflib.SequenceMatcher(a=target, b=skeleton(line), autojunk=False).ratio(), line)
        for line in lines
        if not normalize_code(line)
    ]
    if not scored:
        return None
    score, line = max(scored)
    return line if score >= 0.58 else None


def ocr_pages(pdf_path: Path, page_count: int, dpi: int) -> dict[int, list[str]]:
    pdftoppm = find_program(
        "pdftoppm",
        [
            Path.home()
            / ".cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe"
        ],
    )
    tesseract = find_program(
        "tesseract",
        [Path("C:/Program Files/Tesseract-OCR/tesseract.exe")],
    )
    if not pdftoppm or not tesseract:
        raise RuntimeError("OCR requires pdftoppm and Tesseract with Turkish language data")

    results: dict[int, list[str]] = {}
    with tempfile.TemporaryDirectory(prefix="yfk-ocr-") as temporary_directory:
        temporary = Path(temporary_directory)
        for page_number in range(1, page_count + 1):
            image_prefix = temporary / f"page-{page_number:03d}"
            subprocess.run(
                [
                    pdftoppm,
                    "-f",
                    str(page_number),
                    "-singlefile",
                    "-r",
                    str(dpi),
                    "-png",
                    str(pdf_path),
                    str(image_prefix),
                ],
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            completed = subprocess.run(
                [tesseract, f"{image_prefix}.png", "stdout", "-l", "tur+eng", "--psm", "3"],
                check=True,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
            )
            results[page_number] = [clean_cell(line) for line in completed.stdout.splitlines() if clean_cell(line)]
            print(f"OCR {page_number}/{page_count}", flush=True)
    return results


def improve_records_with_ocr(
    records: list[RawRecord], page_contexts: dict[int, list[str]], ocr: dict[int, list[str]]
) -> None:
    by_code: dict[str, str] = {}
    for lines in ocr.values():
        for line in lines:
            code = normalize_code(line)
            if code:
                by_code[code] = line

    repaired_contexts: dict[str, str] = {}
    for page, contexts in page_contexts.items():
        lines = ocr.get(page, [])
        for context in contexts:
            candidate = best_ocr_context(context, lines)
            if candidate:
                repaired_contexts[context] = transfer_missing_characters(context, candidate)

    for record in records:
        ocr_line = by_code.get(record.code, "")
        if ocr_line:
            without_code = OCR_CODE_RE.sub("", ocr_line, count=1).strip(" |([{\t")
            price_match = PRICE_RE.search(without_code)
            if price_match:
                without_code = without_code[: price_match.start()].strip()
            record.name = transfer_missing_characters(record.name, without_code)
            record.unit = transfer_missing_characters(record.unit, without_code)
        record.context = repaired_contexts.get(record.context, record.context)


def record_to_json(record: RawRecord) -> dict[str, object]:
    return {
        "category": {
            "labor": "İşçilik",
            "transport": "Taşıt",
            "equipment": "Makine ve Araç",
            "material": "Malzeme",
        }[record.kind],
        "code": record.code,
        "kind": record.kind,
        "name": record.name,
        "sourceVersionId": SOURCE_VERSION_ID,
        "unit": record.unit,
        "unitPriceKurus": record.price_kurus,
    }


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=Path("tools/yfk-importer/tmp/source.pdf"))
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("src/features/costs/data/generated/yfk-2026-08.json"),
    )
    parser.add_argument("--ocr", action="store_true")
    parser.add_argument("--ocr-dpi", type=int, default=200)
    args = parser.parse_args()

    args.source.parent.mkdir(parents=True, exist_ok=True)
    if not args.source.exists():
        urllib.request.urlretrieve(SOURCE_URL, args.source)

    records, page_contexts = extract_structured_records(args.source)
    with pdfplumber.open(args.source) as pdf:
        page_count = len(pdf.pages)

    if args.ocr:
        improve_records_with_ocr(records, page_contexts, ocr_pages(args.source, page_count, args.ocr_dpi))

    items = [record_to_json(record) for record in records]
    kind_counts = Counter(str(item["kind"]) for item in items)
    replacement_character_count = sum(
        str(item[field]).count("�") for item in items for field in ("name", "unit")
    )
    placeholder_name_count = sum(item["name"] == item["code"] for item in items)
    non_positive_price_count = sum(int(item["unitPriceKurus"]) <= 0 for item in items)
    metadata = {
        "authority": "T.C. Çevre, Şehircilik ve İklim Değişikliği Bakanlığı - YFK",
        "checksum": sha256(args.source),
        "currency": "TRY",
        "id": SOURCE_VERSION_ID,
        "itemKinds": ["labor", "transport", "equipment", "material"],
        "label": "YFK 2026 Ağustos İnşaat Rayiçleri",
        "publishedAt": "2026-08-03",
        "sourceUrl": ANNOUNCEMENT_URL,
        "validFrom": "2026-08-01",
    }
    report = {
        "generatedAt": datetime.now(UTC).isoformat(),
        "itemCount": len(items),
        "kindCounts": dict(sorted(kind_counts.items())),
        "pageCount": page_count,
        "placeholderNameCount": placeholder_name_count,
        "nonPositivePriceCount": non_positive_price_count,
        "replacementCharacterCount": replacement_character_count,
        "uniqueCodeCount": len({str(item["code"]) for item in items}),
    }

    if dict(sorted(kind_counts.items())) != EXPECTED_KIND_COUNTS:
        raise ValueError(
            f"Incomplete catalog: expected {EXPECTED_KIND_COUNTS}, got {dict(kind_counts)}"
        )
    if replacement_character_count:
        raise ValueError(
            f"Catalog contains {replacement_character_count} replacement characters"
        )
    if placeholder_name_count or non_positive_price_count:
        raise ValueError(
            "Catalog contains placeholder names or non-positive prices: "
            f"{placeholder_name_count=}, {non_positive_price_count=}"
        )

    write_json(args.output, items)
    write_json(args.output.with_name("yfk-2026-08-source.json"), metadata)
    write_json(args.output.with_name("yfk-2026-08-validation.json"), report)
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
