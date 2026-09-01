#!/usr/bin/env python3
"""Safely import the official DSİ 2026 unit-price PDF.

The PDF contains ordinary fixed prices, formulas, invoice/tariff based rows and
one position with several component prices. Only codes printed in the left
"POZ NO" column are accepted. Numeric coefficients in descriptions and code
references embedded in prose are therefore never interpreted as prices/codes.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import subprocess
from collections import Counter, defaultdict
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path


SOURCE_ID = "dsi-2026-unit-prices"
SOURCE_LABEL = "DSİ 2026 Yılı Birim Fiyatları"
SOURCE_URL = "https://dsi.gov.tr/Sayfa/Detay/738"
EXPECTED_CHECKSUM = "cdee74afaa12adca65ec027ceabab25b104174c236e4d8d18e90c2c646c75049"
EXPECTED_PAGE_COUNT = 79
EXPECTED_RAW_ANCHOR_COUNT = 1_976
EXPECTED_DUPLICATE_CODES = {"51.550.1015", "51.550.1020"}
EXPECTED_BLANK_PRICE_CODES = {"52.180.1039"}
PACKED_FIXED_PRICE_OVERRIDES = {
    # The source text layer places these two visibly separate price cells only
    # 0.48 pt apart. Their printed order is unambiguous on PDF page 7.
    "50.205.1401": "253,00",
    "50.205.1402": "328,00",
}

CODE_RE = re.compile(r"^\d{2}\.\d{3}\.\d{4}(?:/[A-Z0-9]+)?$", re.IGNORECASE)
CODE_REFERENCE_RE = re.compile(r"^\d{2}\.\d{3}\.\d{4},?$")
PRICE_RE = re.compile(r"^-?\d{1,3}(?:\.\d{3})*,\d{2}$")
DASH_RE = re.compile(r"^-{1,3}$")


@dataclass(frozen=True)
class Word:
    page: int
    block: int
    paragraph: int
    line: int
    text: str
    x: float
    y: float
    width: float


@dataclass(frozen=True)
class Anchor:
    code: str
    page: int
    x: float
    y: float


@dataclass(frozen=True)
class VisualLine:
    page: int
    y: float
    words: tuple[Word, ...]

    def text_between(self, left: float, right: float) -> str:
        return clean_text(" ".join(word.text for word in self.words if left <= word.x < right))


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip(" |\t\r\n")


def normalize_compare(value: str) -> str:
    return re.sub(r"\W+", " ", value.casefold(), flags=re.UNICODE).strip()


def parse_kurus(value: str) -> int:
    amount = Decimal(value.replace(".", "").replace(",", "."))
    return int((amount * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def read_words(path: Path, pdftotext: str) -> tuple[list[Word], int]:
    process = subprocess.run(
        [pdftotext, "-tsv", str(path), "-"],
        check=True,
        capture_output=True,
    )
    words: list[Word] = []
    page_count = 0
    for raw_line in process.stdout.decode("utf-8").splitlines()[1:]:
        fields = raw_line.split("\t", 11)
        if len(fields) != 12 or fields[0] != "5":
            continue
        page = int(fields[1])
        page_count = max(page_count, page)
        text = fields[11]
        if not text or text.startswith("###"):
            continue
        words.append(
            Word(
                page=page,
                block=int(fields[2]),
                paragraph=int(fields[3]),
                line=int(fields[4]),
                text=text,
                x=float(fields[6]),
                y=float(fields[7]),
                width=float(fields[8]),
            )
        )
    return words, page_count


def make_visual_lines(words: list[Word]) -> dict[int, list[VisualLine]]:
    by_page: dict[int, list[Word]] = defaultdict(list)
    for word in words:
        by_page[word.page].append(word)

    result: dict[int, list[VisualLine]] = {}
    for page, page_words in by_page.items():
        rows: list[list[Word]] = []
        for word in sorted(page_words, key=lambda value: (value.y, value.x)):
            if rows and abs(rows[-1][0].y - word.y) <= 1.5:
                rows[-1].append(word)
            else:
                rows.append([word])
        result[page] = [
            VisualLine(page, sum(word.y for word in row) / len(row), tuple(sorted(row, key=lambda value: value.x)))
            for row in rows
        ]
    return result


def find_anchors(words: list[Word]) -> tuple[list[Anchor], int]:
    anchors: list[Anchor] = []
    reference_like_count = 0
    for word in words:
        raw = word.text.upper()
        if word.x < 100 and CODE_RE.fullmatch(raw):
            anchors.append(Anchor(raw, word.page, word.x, word.y))
        elif word.x >= 100 and CODE_REFERENCE_RE.fullmatch(raw):
            reference_like_count += 1
    return sorted(anchors, key=lambda value: (value.page, value.y)), reference_like_count


def is_heading(text: str) -> bool:
    normalized = clean_text(text)
    if not normalized:
        return True
    folded = normalized.casefold()
    if any(marker in folded for marker in ("poz no", "yapilan işin tanimi", "yapılan işin tanımı", "ölçü birimi", "fiyati (tl)", "fiyatı (tl)")):
        return True
    letters = [character for character in normalized if character.isalpha()]
    return bool(letters) and len(normalized) < 110 and all(not character.islower() for character in letters)


def category_for(code: str) -> str:
    if code.startswith("50."):
        return "Rayiçler"
    if code.startswith("52."):
        return "Sulama ve Taşkın Kontrol İnşaatı"
    if code.startswith("55."):
        return "Barajlar ve HES İnşaatı"
    if code.startswith("56.2"):
        return "Kamulaştırma İşleri"
    if code.startswith("56.3"):
        return "Arazi Toplulaştırması"
    if code.startswith("56.8"):
        return "Laboratuvar Hizmetleri"
    if code.startswith("56.9"):
        return "İşletme Bakım Faaliyetleri"
    if code.startswith(("56.1", "56.4")):
        return "Harita İşleri"
    if code.startswith(("56.5", "56.6", "51.550.")):
        return "Jeoteknik Hizmetler ve Yeraltısuları"
    return "DSİ Birim Fiyatları"


def normalize_unit(value: str) -> str:
    raw = clean_text(value)
    folded = raw.casefold().rstrip(".")
    aliases = {
        "ad": "ad",
        "adet": "ad",
        "dekar": "da",
        "ha": "ha",
        "kg": "kg",
        "km": "km",
        "litre": "lt",
        "m": "m",
        "metre": "m",
        "m²": "m²",
        "m³": "m³",
        "sayfa": "sayfa",
        "saat": "sa",
        "ton": "ton",
        "1000 adet": "1000 ad",
    }
    return aliases.get(folded, raw) or "belirtilmemiş"


def line_price_signal(line: VisualLine) -> tuple[str, str] | None:
    right = [word.text for word in line.words if word.x >= 475]
    if not right:
        return None
    joined = clean_text(" ".join(right))
    for token in right:
        if PRICE_RE.fullmatch(token):
            return "fixed", token
    folded = joined.casefold()
    if "formül" in folded or "formul" in folded:
        return "formula", joined
    if "tarif" in folded:
        return "tariff", joined
    if "fatura" in folded:
        return "invoice", joined
    if DASH_RE.fullmatch(joined):
        return "unpriced", joined
    return None


def line_unit(line: VisualLine) -> str:
    return normalize_unit(line.text_between(405, 475))


def line_description(line: VisualLine) -> str:
    return line.text_between(112, 425)


def numbered_component_cluster(lines: list[VisualLine]) -> tuple[float, float] | None:
    candidates = [
        line
        for line in lines
        if re.match(r"^\d+\s*-", line_description(line)) and line_price_signal(line)
    ]
    if len(candidates) < 2:
        return None
    return min(line.y for line in candidates) - 2, max(line.y for line in candidates) + 2


def connected_description_lines(lines: list[VisualLine], anchor_y: float) -> list[str]:
    candidates = [
        (line.y, line_description(line))
        for line in lines
        if line_description(line) and "YAPILAN İŞİN TANIMI" not in line_description(line)
    ]
    if not candidates:
        return []
    nearest_index = min(range(len(candidates)), key=lambda index: abs(candidates[index][0] - anchor_y))
    first = nearest_index
    last = nearest_index
    while first > 0 and candidates[first][0] - candidates[first - 1][0] <= 12.6:
        first -= 1
    while last + 1 < len(candidates) and candidates[last + 1][0] - candidates[last][0] <= 12.6:
        last += 1
    return [text for _, text in candidates[first : last + 1]]


def item_name(description_lines: list[str], status: str) -> str:
    raw_cleaned = [clean_text(line) for line in description_lines]
    raw_cleaned = [line for line in raw_cleaned if line]
    cleaned = [line for line in raw_cleaned if not is_heading(line)]
    # A few legitimate DSİ descriptions are printed entirely in capitals.
    # Falling back to those row-local lines is safer than fabricating a name.
    if not cleaned:
        cleaned = raw_cleaned
    if not cleaned:
        return ""
    if status in {"formula", "multiple_components"}:
        prefix: list[str] = []
        for line in cleaned:
            if re.match(r"^(?:Hal\s+\d+|\d+\s*-|[FSQhBK][0-9o]*\s*=)", line, re.IGNORECASE):
                break
            prefix.append(line)
            if len(" ".join(prefix)) >= 220:
                break
        if prefix:
            return clean_text(" ".join(prefix))[:500]
    return clean_text(" ".join(cleaned))[:500]


def extract(path: Path, pdftotext: str) -> tuple[list[dict[str, object]], dict[str, object]]:
    words, page_count = read_words(path, pdftotext)
    if page_count != EXPECTED_PAGE_COUNT:
        raise ValueError(f"Unexpected page count: {page_count} != {EXPECTED_PAGE_COUNT}")

    lines_by_page = make_visual_lines(words)
    anchors, reference_like_count = find_anchors(words)
    if len(anchors) != EXPECTED_RAW_ANCHOR_COUNT:
        raise ValueError(f"Unexpected left-column anchor count: {len(anchors)} != {EXPECTED_RAW_ANCHOR_COUNT}")

    anchors_by_page: dict[int, list[Anchor]] = defaultdict(list)
    for anchor in anchors:
        anchors_by_page[anchor.page].append(anchor)

    candidates: list[dict[str, object]] = []
    uncertain: list[dict[str, object]] = []
    for page, page_anchors in sorted(anchors_by_page.items()):
        page_lines = lines_by_page[page]
        component_cluster = numbered_component_cluster(page_lines)
        component_owner: Anchor | None = None
        if component_cluster:
            owners = [
                anchor
                for anchor in page_anchors
                if component_cluster[0] <= anchor.y <= component_cluster[1]
            ]
            if len(owners) == 1:
                component_owner = owners[0]
            else:
                component_cluster = None
        for index, anchor in enumerate(page_anchors):
            lower = (page_anchors[index - 1].y + anchor.y) / 2 if index else 62.0
            upper = (anchor.y + page_anchors[index + 1].y) / 2 if index + 1 < len(page_anchors) else 780.0
            if component_cluster and anchor == component_owner:
                lower = min(lower, component_cluster[0] - 12)
                upper = max(upper, component_cluster[1] + 12)

            row_lines = [line for line in page_lines if lower <= line.y < upper]
            if component_cluster and anchor != component_owner:
                row_lines = [
                    line
                    for line in row_lines
                    if not (component_cluster[0] <= line.y <= component_cluster[1])
                ]
            signals: list[dict[str, object]] = []
            for line in row_lines:
                signal = line_price_signal(line)
                if not signal:
                    continue
                signal_kind, raw_value = signal
                component: dict[str, object] = {
                    "description": line_description(line),
                    "kind": signal_kind,
                    "rawValue": raw_value,
                    "unit": line_unit(line),
                }
                if signal_kind == "fixed":
                    component["unitPriceKurus"] = parse_kurus(raw_value)
                signals.append(component)

            override_price = PACKED_FIXED_PRICE_OVERRIDES.get(anchor.code)
            if override_price:
                anchor_line = min(page_lines, key=lambda line: abs(line.y - anchor.y))
                signals = [
                    {
                        "description": line_description(anchor_line),
                        "kind": "fixed",
                        "rawValue": override_price,
                        "unit": line_unit(anchor_line),
                        "unitPriceKurus": parse_kurus(override_price),
                    }
                ]

            row_description_lines = [line_description(line) for line in row_lines]
            row_full_text = clean_text(" ".join(row_description_lines))
            folded = row_full_text.casefold()

            if len(signals) == 1:
                status = str(signals[0]["kind"])
                unit_price = int(signals[0].get("unitPriceKurus", 0))
            elif len(signals) > 1:
                status = "multiple_components"
                unit_price = 0
            elif "formül" in folded or "formul" in folded or re.search(r"\b[FS]\s*=", row_full_text):
                status = "formula"
                unit_price = 0
            elif "fatura" in folded:
                status = "invoice"
                unit_price = 0
            elif "tarif" in folded:
                status = "tariff"
                unit_price = 0
            elif anchor.code in EXPECTED_BLANK_PRICE_CODES:
                status = "unpriced"
                unit_price = 0
            else:
                uncertain.append({"code": anchor.code, "page": page, "reason": "no_safe_price_signal"})
                continue

            units = [str(signal["unit"]) for signal in signals if str(signal["unit"]) != "belirtilmemiş"]
            if units and len(set(units)) == 1:
                unit = units[0]
            elif len(set(units)) > 1:
                unit = "çeşitli"
            else:
                nearest_unit_lines = sorted(row_lines, key=lambda line: abs(line.y - anchor.y))
                unit = next(
                    (line_unit(line) for line in nearest_unit_lines if line_unit(line) != "belirtilmemiş"),
                    "belirtilmemiş",
                )

            description_lines = (
                row_description_lines
                if status in {"formula", "multiple_components"}
                or anchor.code in PACKED_FIXED_PRICE_OVERRIDES
                or "/" in anchor.code
                else connected_description_lines(page_lines, anchor.y)
            )
            full_text = clean_text(" ".join(description_lines))
            name = item_name(description_lines, status)
            if not name:
                uncertain.append(
                    {
                        "code": anchor.code,
                        "page": page,
                        "reason": "blank_name",
                    }
                )
                continue

            metadata: dict[str, object] = {
                "institution": "DSİ",
                "page": page,
                "priceStatus": status,
                "priced": status == "fixed",
                "recordType": "unit_price_and_rate",
            }
            if unit == "belirtilmemiş":
                metadata["officialUnitBlank"] = True
            if status == "multiple_components":
                metadata["componentCount"] = len(signals)
                metadata["componentsJson"] = json.dumps(signals, ensure_ascii=False, separators=(",", ":"))
            elif status == "formula":
                metadata["formulaText"] = full_text[:4_000]
            if len(full_text) > len(name):
                metadata["fullDescription"] = full_text[:4_000]

            candidates.append(
                {
                    "category": category_for(anchor.code),
                    "code": anchor.code,
                    "kind": "construction",
                    "metadata": metadata,
                    "name": name,
                    "sourceVersionId": SOURCE_ID,
                    "tags": ["DSİ", category_for(anchor.code)],
                    "unit": unit,
                    "unitPriceKurus": unit_price,
                }
            )

    grouped: dict[str, list[dict[str, object]]] = defaultdict(list)
    for candidate in candidates:
        grouped[str(candidate["code"])].append(candidate)

    duplicate_codes = {code for code, records in grouped.items() if len(records) > 1}
    conflicting_duplicates: list[str] = []
    items: list[dict[str, object]] = []
    for code, records in grouped.items():
        if len(records) == 1:
            items.append(records[0])
            continue
        signatures = {
            (
                normalize_compare(str(record["name"])),
                str(record["unit"]),
                int(record["unitPriceKurus"]),
                str(record["metadata"]["priceStatus"]),
            )
            for record in records
        }
        if len(signatures) != 1:
            conflicting_duplicates.append(code)
            uncertain.extend(
                {"code": code, "page": record["metadata"]["page"], "reason": "conflicting_duplicate"}
                for record in records
            )
            continue
        kept = records[0]
        kept["metadata"]["duplicateSourcePages"] = ",".join(str(record["metadata"]["page"]) for record in records)
        items.append(kept)

    items.sort(key=lambda item: str(item["code"]))
    searchable_text = "\n".join(
        clean_text(str(item[field]))
        for item in items
        for field in ("name", "unit")
    )
    validation = {
        "blankNameCount": sum(not clean_text(str(item["name"])) for item in items),
        "blankUnitCount": sum(not clean_text(str(item["unit"])) for item in items),
        "categoryCounts": dict(Counter(str(item["category"]) for item in items)),
        "codePatternInvalidCount": sum(not CODE_RE.fullmatch(str(item["code"])) for item in items),
        "codeReferenceTokenCount": reference_like_count,
        "conflictingDuplicateCodes": conflicting_duplicates,
        "controlCharacterCount": sum(ord(character) < 32 and character not in "\n\t" for character in searchable_text),
        "duplicateCodeCount": len(duplicate_codes),
        "duplicateCodes": sorted(duplicate_codes),
        "duplicateOccurrenceCount": sum(len(records) - 1 for records in grouped.values()),
        "excludedUncertainCount": len(uncertain),
        "excludedUncertainRecords": uncertain,
        "formulaPricedCount": sum(
            item["metadata"]["priceStatus"] == "formula" and int(item["unitPriceKurus"]) != 0
            for item in items
        ),
        "fullDescriptionCount": sum("fullDescription" in item["metadata"] for item in items),
        "itemCount": len(items),
        "genericUnitCount": sum(item["unit"] == "belirtilmemiş" for item in items),
        "kindCounts": dict(Counter(str(item["kind"]) for item in items)),
        "mojibakeMarkerCount": sum(searchable_text.count(marker) for marker in ("Ã", "Ä", "Å")),
        "multipleComponentFlattenedCount": sum(
            item["metadata"]["priceStatus"] == "multiple_components" and int(item["unitPriceKurus"]) != 0
            for item in items
        ),
        "pageCount": page_count,
        "priceStatusCounts": dict(Counter(str(item["metadata"]["priceStatus"]) for item in items)),
        "pricedItemCount": sum(bool(item["metadata"]["priced"]) for item in items),
        "rawAnchorCount": len(anchors),
        "replacementCharacterCount": searchable_text.count("�"),
        "slashSuffixCodeCount": sum("/" in str(item["code"]) for item in items),
        "sourceChecksum": sha256(path),
        "syntheticCodeCount": 0,
        "uniqueCodeCount": len({str(item["code"]) for item in items}),
        "zeroPriceItemCount": sum(int(item["unitPriceKurus"]) == 0 for item in items),
    }
    return items, validation


def validate(validation: dict[str, object]) -> None:
    if validation["pageCount"] != EXPECTED_PAGE_COUNT:
        raise ValueError("Page count gate failed")
    if validation["rawAnchorCount"] != EXPECTED_RAW_ANCHOR_COUNT:
        raise ValueError("Anchor count gate failed")
    if set(validation["duplicateCodes"]) != EXPECTED_DUPLICATE_CODES:
        raise ValueError(f"Unexpected duplicate codes: {validation['duplicateCodes']}")
    if validation["duplicateOccurrenceCount"] != 2:
        raise ValueError("Duplicate occurrence gate failed")
    if validation["slashSuffixCodeCount"] != 2:
        raise ValueError("Official slash-suffix code gate failed")
    if validation["syntheticCodeCount"]:
        raise ValueError("Synthetic code gate failed")
    if validation["blankNameCount"] or validation["blankUnitCount"]:
        raise ValueError("Blank field gate failed")
    for key in (
        "codePatternInvalidCount",
        "controlCharacterCount",
        "formulaPricedCount",
        "mojibakeMarkerCount",
        "multipleComponentFlattenedCount",
        "replacementCharacterCount",
    ):
        if validation[key]:
            raise ValueError(f"Quality gate {key} failed: {validation[key]}")
    if validation["uniqueCodeCount"] != validation["itemCount"]:
        raise ValueError("Uniqueness gate failed")
    if validation["conflictingDuplicateCodes"]:
        raise ValueError(f"Conflicting duplicate gate failed: {validation['conflictingDuplicateCodes']}")
    if validation["itemCount"] + validation["excludedUncertainCount"] != 1_974:
        raise ValueError("Accounting gate failed")
    if validation["priceStatusCounts"].get("multiple_components") != 1:
        raise ValueError("Multiple-component preservation gate failed")
    if validation["priceStatusCounts"] != {
        "fixed": 1_944,
        "formula": 10,
        "invoice": 9,
        "multiple_components": 1,
        "tariff": 4,
        "unpriced": 6,
    }:
        raise ValueError(f"Price status gate failed: {validation['priceStatusCounts']}")
    if validation["genericUnitCount"] != 8:
        raise ValueError("Official blank-unit gate failed")
    if validation["sourceChecksum"] != EXPECTED_CHECKSUM:
        raise ValueError("Checksum gate failed")


def source_json(path: Path, record_count: int) -> dict[str, object]:
    return {
        "authority": "T.C. Tarım ve Orman Bakanlığı / Devlet Su İşleri Genel Müdürlüğü",
        "checksum": sha256(path),
        "currency": "TRY",
        "id": SOURCE_ID,
        "institution": "DSİ",
        "itemKinds": ["construction"],
        "label": SOURCE_LABEL,
        "pageCount": EXPECTED_PAGE_COUNT,
        "publishedAt": "2026-01-28",
        "recordCount": record_count,
        "recordType": "unit_price_and_rate",
        "sourceUrl": SOURCE_URL,
        "validFrom": "2026-01-01",
    }


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("tools/yfk-importer/tmp/kgm-dsi-2026/dsi-2026-unit-prices.pdf"),
    )
    parser.add_argument(
        "--output-directory",
        type=Path,
        default=Path("src/features/costs/data/generated"),
    )
    parser.add_argument("--pdftotext", default=shutil.which("pdftotext"))
    args = parser.parse_args()
    if not args.pdftotext:
        raise RuntimeError("Poppler pdftotext is required")
    if not args.input.exists():
        raise FileNotFoundError(args.input)
    checksum = sha256(args.input)
    if checksum != EXPECTED_CHECKSUM:
        raise ValueError(f"Unexpected source checksum: {checksum}")

    items, validation = extract(args.input, args.pdftotext)
    validate(validation)
    base = args.output_directory / "dsi-2026-positions"
    write_json(base.with_suffix(".json"), items)
    write_json(base.with_name(base.name + "-sources.json"), [source_json(args.input, len(items))])
    write_json(base.with_name(base.name + "-validation.json"), validation)
    print(json.dumps(validation, ensure_ascii=False, indent=2), flush=True)


if __name__ == "__main__":
    main()
