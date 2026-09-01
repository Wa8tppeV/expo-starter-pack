#!/usr/bin/env python3
"""Import official August 2026 ILBANK and KVGM/VGM position catalogs.

The two ILBANK tariff grids that do not publish position codes are counted in
validation, but are deliberately not materialized as synthetic CatalogItems.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import subprocess
import urllib.request
from collections import Counter, defaultdict
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path


ILBANK_CODE_PATTERN = r"\d{2}\.\d{3}\.\d{4}"
VGM_CODE_PATTERN = (
    r"(?:\d{2}\.(?:V|KTB)[A-Z0-9./-]+|"
    r"V\.[A-Z0-9./-]+|KTB\.[A-Z0-9./-]+)"
)
PRICE_RE = re.compile(r"^-?\d{1,3}(?:\.\d{3})*,\d{2}$")
UNIT_RE = re.compile(
    r"^(?:ad|adet|ha|m|m2|m3|m²|m³|kg|ton|sa|saat|gün|tk\.?|takım|km|"
    r"nokta(?:/ad)?|sayfa|pafta|da|b\.ad|lt|kwh|mt|kt|kg/m2|cm²|cm|"
    r"metre|dakika|mmxm²?)$",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class SourceConfig:
    authority: str
    category: str
    code_pattern: str
    excluded_tariff_grid_count: int
    expected_count: int
    filename: str
    id: str
    institution: str
    label: str
    page_count: int
    prefix_pattern: str
    record_type: str
    row_radius: float
    url: str


@dataclass(frozen=True)
class Word:
    page: int
    text: str
    x: float
    y: float


ILBANK_AUTHORITY = "İller Bankası A.Ş."
ILBANK_BASE_URL = "https://www.ilbank.gov.tr/storage/uploads/reports"

SOURCES = (
    SourceConfig(
        ILBANK_AUTHORITY,
        "Jeolojik-Jeoteknik Etüt, Jeofizik ve Laboratuvar Deneyleri",
        ILBANK_CODE_PATTERN,
        0,
        103,
        "ilbank-1-etut.pdf",
        "ilbank-2026-08-etut-laboratuvar",
        "İLBANK",
        "İLBANK 2026 Ağustos Etüt ve Laboratuvar Birim Fiyatları",
        3,
        r"41\.(?:100|200|300)\.\d{4}",
        "unit_price",
        8.0,
        f"{ILBANK_BASE_URL}/1-2026-yili-agustos-ayi-etut-isleri-ve-laboratuvar-deneyleri-birim-fiyatlari-listesi.pdf",
    ),
    SourceConfig(
        ILBANK_AUTHORITY,
        "İçme Suyu, Jeotermal Sondaj, Kuyu Test ve Ölçüm İşleri",
        ILBANK_CODE_PATTERN,
        0,
        139,
        "ilbank-2-sondaj.pdf",
        "ilbank-2026-08-sondaj-jeotermal",
        "İLBANK",
        "İLBANK 2026 Ağustos Sondaj ve Jeotermal Kuyu Birim Fiyatları",
        5,
        r"41\.(?:500|600|700)\.\d{4}",
        "unit_price",
        8.0,
        f"{ILBANK_BASE_URL}/2-2026-yili-agustos-ayi-sondaj-isleri-ile-jeotermal-kuyu-test-ve-olcum-isleri-birim-fiyatlari-listesi.pdf",
    ),
    SourceConfig(
        ILBANK_AUTHORITY,
        "Sayısal Halihazır Harita Alımı İşleri",
        ILBANK_CODE_PATTERN,
        374,
        372,
        "ilbank-3-harita.pdf",
        "ilbank-2026-08-sayisal-harita",
        "İLBANK",
        "İLBANK 2026 Ağustos Sayısal Halihazır Harita Birim Fiyatları",
        21,
        r"42\.\d{3}\.\d{4}",
        "unit_price",
        8.0,
        f"{ILBANK_BASE_URL}/3-2026-yili-agustos-ayi-sayisal-halihazir-harita-alimi-isleri-birim-fiyatlari-listesi.pdf",
    ),
    SourceConfig(
        ILBANK_AUTHORITY,
        "İmar Planı Yapım İşleri Tarife Gridleri",
        ILBANK_CODE_PATTERN,
        100,
        0,
        "ilbank-4-imar.pdf",
        "ilbank-2026-08-imar-plani",
        "İLBANK",
        "İLBANK 2026 Ağustos İmar Planı Yapım İşleri Tarifeleri",
        1,
        r"41\.\d{3}\.\d{4}",
        "uncoded_tariff_grid",
        8.0,
        f"{ILBANK_BASE_URL}/4-2026-yili-agustos-ayi-imar-plani-yapim-isleri-birim-fiyatlari-listesi.pdf",
    ),
    SourceConfig(
        ILBANK_AUTHORITY,
        "Altyapı Tesisleri",
        ILBANK_CODE_PATTERN,
        0,
        2_962,
        "ilbank-5-altyapi.pdf",
        "ilbank-2026-08-altyapi",
        "İLBANK",
        "İLBANK 2026 Ağustos Altyapı Tesisleri Birim Fiyatları",
        98,
        r"43\.[567]\d{2}\.\d{4}",
        "unit_price",
        8.0,
        f"{ILBANK_BASE_URL}/5-2026-yili-agustos-ayi-altyapi-tesisleri-birim-fiyatlari-listesi.pdf",
    ),
    SourceConfig(
        ILBANK_AUTHORITY,
        "Rayiçler ve Alt Analizler",
        ILBANK_CODE_PATTERN,
        0,
        2_575,
        "ilbank-6-rayic.pdf",
        "ilbank-2026-08-rayic-alt-analiz",
        "İLBANK",
        "İLBANK 2026 Ağustos Rayiçler ve Alt Analizler",
        59,
        r"(?:40\.\d{3}|41\.(?:500|600)|43\.(?:100|115|120))\.\d{4}",
        "rate_and_subanalysis",
        8.0,
        f"{ILBANK_BASE_URL}/6-2026-yili-agustos-ayi-rayicler-ve-alt-analizler-listesi.pdf",
    ),
    SourceConfig(
        "T.C. Kültür ve Turizm Bakanlığı / Vakıflar Genel Müdürlüğü",
        "Eski Eser, Restorasyon, Konservasyon, Müze ve Tesisat İşleri",
        VGM_CODE_PATTERN,
        0,
        3_911,
        "vgm-agustos.pdf",
        "kvgm-vgm-2026-08-eski-eser",
        "KVGM/VGM",
        "Kültür ve Turizm Bakanlığı / VGM 2026 Ağustos Birim Fiyat Eki",
        148,
        VGM_CODE_PATTERN,
        "unit_price_and_rate",
        9.0,
        "https://cdn.vgm.gov.tr/duyuru/duyuru_7703_040826/agustos-2026-guncellenmis-birim-fiyatlar.pdf",
    ),
)


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip(" |\t\r\n")


def normalize_unit(value: str) -> str:
    raw = clean_text(value)
    normalized = raw.casefold().rstrip(".")
    aliases = {
        "ad": "ad",
        "adet": "ad",
        "b.ad": "ad",
        "da": "da",
        "gün": "gün",
        "ha": "ha",
        "kg": "kg",
        "km": "km",
        "kt": "kutu",
        "kwh": "kWh",
        "lt": "lt",
        "m": "m",
        "m2": "m²",
        "m²": "m²",
        "m3": "m³",
        "m³": "m³",
        "metre": "m",
        "mt": "m",
        "nokta/ad": "nokta",
        "sa": "sa",
        "saat": "sa",
        "tk": "takım",
        "takım": "takım",
        "ton": "ton",
    }
    return aliases.get(normalized, raw) or "belirtilmemiş"


def parse_kurus(value: str) -> int:
    amount = Decimal(value.replace(".", "").replace(",", "."))
    return int((amount * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def download(config: SourceConfig, directory: Path) -> Path:
    path = directory / config.filename
    if path.exists():
        return path
    print(f"Downloading {config.label}", flush=True)
    request = urllib.request.Request(config.url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request) as response, path.open("wb") as stream:
        shutil.copyfileobj(response, stream)
    return path


def read_words(path: Path, pdftotext: str) -> tuple[list[Word], int]:
    process = subprocess.run(
        [pdftotext, "-tsv", str(path), "-"],
        check=True,
        capture_output=True,
    )
    text = process.stdout.decode("utf-8")
    words: list[Word] = []
    page_count = 0
    for line in text.splitlines()[1:]:
        fields = line.split("\t", 11)
        if len(fields) != 12 or fields[0] != "5":
            continue
        page = int(fields[1])
        page_count = max(page_count, page)
        value = fields[11]
        if value.startswith("###"):
            continue
        words.append(Word(page, value, float(fields[6]), float(fields[7])))
    return words, page_count


def row_bounds(anchors: list[Word], index: int, radius: float) -> tuple[float, float]:
    anchor = anchors[index]
    lower = (anchors[index - 1].y + anchor.y) / 2 if index else anchor.y - radius
    upper = (
        (anchor.y + anchors[index + 1].y) / 2
        if index + 1 < len(anchors)
        else anchor.y + radius
    )
    return max(lower, anchor.y - radius), min(upper, anchor.y + radius)


def extract(config: SourceConfig, path: Path, pdftotext: str) -> tuple[list[dict[str, object]], int]:
    words, page_count = read_words(path, pdftotext)
    if page_count != config.page_count:
        raise ValueError(f"Unexpected page count for {config.id}: {page_count} != {config.page_count}")

    code_re = re.compile(rf"^(?:{config.code_pattern})$", re.IGNORECASE)
    pages: dict[int, list[Word]] = defaultdict(list)
    for word in words:
        pages[word.page].append(word)

    items: list[dict[str, object]] = []
    for page_number in range(1, page_count + 1):
        page_words = pages[page_number]
        anchors = sorted(
            (word for word in page_words if word.x < 120 and code_re.fullmatch(word.text)),
            key=lambda word: word.y,
        )
        for index, anchor in enumerate(anchors):
            lower, upper = row_bounds(anchors, index, config.row_radius)
            row_words = [
                word
                for word in page_words
                if word is not anchor and lower <= word.y < upper
            ]

            unit_matches = sorted(
                (word for word in row_words if UNIT_RE.fullmatch(word.text)),
                key=lambda word: word.x,
            )
            if not unit_matches:
                unit_lower, unit_upper = row_bounds(anchors, index, 12.0)
                unit_matches = sorted(
                    (
                        word
                        for word in page_words
                        if unit_lower <= word.y < unit_upper
                        and word.x >= 300
                        and UNIT_RE.fullmatch(word.text)
                    ),
                    key=lambda word: word.x,
                )
            unit_word = unit_matches[-1] if unit_matches else None
            unit = normalize_unit(unit_word.text) if unit_word else "belirtilmemiş"

            minimum_price_x = (unit_word.x + 5) if unit_word else 390
            price_words = sorted(
                (
                    word
                    for word in row_words
                    if word.x > minimum_price_x and PRICE_RE.fullmatch(word.text)
                ),
                key=lambda word: word.x,
            )
            if not price_words:
                price_words = sorted(
                    (
                        word
                        for word in row_words
                        if word.x >= 390 and PRICE_RE.fullmatch(word.text)
                    ),
                    key=lambda word: word.x,
                )

            description_right = min(405.0, (unit_word.x - 2) if unit_word else 405.0)
            description_words = sorted(
                (
                    word
                    for word in row_words
                    if 110 <= word.x < description_right
                    and not PRICE_RE.fullmatch(word.text)
                ),
                key=lambda word: (round(word.y, 1), word.x),
            )
            name = clean_text(" ".join(word.text for word in description_words))

            component_prices = [parse_kurus(word.text) for word in price_words]
            row_text = clean_text(" ".join(word.text for word in row_words)).casefold()
            metadata: dict[str, object] = {
                "institution": config.institution,
                "page": page_number,
                "recordType": config.record_type,
            }
            if component_prices:
                base_price = component_prices[0]
                installation_price = component_prices[1] if len(component_prices) >= 2 else 0
                deinstallation_price = component_prices[2] if len(component_prices) >= 3 else 0
                status = "fixed"
                priced = True
                unit_price = base_price + installation_price
                metadata["baseUnitPriceKurus"] = base_price
                if len(component_prices) >= 2:
                    metadata["installationPriceKurus"] = installation_price
                if len(component_prices) >= 3:
                    metadata["deinstallationPriceKurus"] = deinstallation_price
            elif "fatura" in row_text:
                status = "invoice"
                priced = False
                unit_price = 0
            elif "formül" in row_text or "formul" in row_text:
                status = "formula"
                priced = False
                unit_price = 0
            else:
                status = "unpriced"
                priced = False
                unit_price = 0

            metadata["priceStatus"] = status
            metadata["priced"] = priced
            items.append(
                {
                    "category": config.category,
                    "code": anchor.text.upper(),
                    "kind": "construction",
                    "metadata": metadata,
                    "name": name,
                    "sourceVersionId": config.id,
                    "tags": [config.institution, config.category],
                    "unit": unit,
                    "unitPriceKurus": unit_price,
                }
            )

    if len(items) != config.expected_count:
        raise ValueError(f"Unexpected item count for {config.id}: {len(items)} != {config.expected_count}")
    return items, page_count


def source_json(config: SourceConfig, path: Path) -> dict[str, object]:
    return {
        "authority": config.authority,
        "checksum": sha256(path),
        "currency": "TRY",
        "excludedTariffGridCount": config.excluded_tariff_grid_count,
        "id": config.id,
        "institution": config.institution,
        "itemKinds": ["construction"],
        "label": config.label,
        "pageCount": config.page_count,
        "publishedAt": "2026-08-04",
        "recordCount": config.expected_count,
        "recordType": config.record_type,
        "sourceUrl": config.url,
        "validFrom": "2026-08-01",
    }


def text_quality_count(items: list[dict[str, object]], markers: tuple[str, ...]) -> int:
    return sum(
        sum(str(item[field]).count(marker) for marker in markers)
        for item in items
        for field in ("name", "unit")
    )


def report_for(config: SourceConfig, items: list[dict[str, object]], page_count: int) -> dict[str, object]:
    codes = [str(item["code"]) for item in items]
    prefix_re = re.compile(rf"^(?:{config.prefix_pattern})$", re.IGNORECASE)
    return {
        "blankNameCount": sum(not clean_text(str(item["name"])) for item in items),
        "blankUnitCount": sum(not clean_text(str(item["unit"])) for item in items),
        "controlCharacterCount": sum(
            sum(ord(character) < 32 for character in str(item[field]))
            for item in items
            for field in ("name", "unit")
        ),
        "duplicateCodeCount": len(codes) - len(set(codes)),
        "excludedTariffGridCount": config.excluded_tariff_grid_count,
        "expectedItemCount": config.expected_count,
        "genericUnitCount": sum(item["unit"] == "belirtilmemiş" for item in items),
        "id": config.id,
        "itemCount": len(items),
        "mojibakeMarkerCount": text_quality_count(items, ("Ã", "Ä", "Å")),
        "overlongNameCount": sum(len(clean_text(str(item["name"]))) > 500 for item in items),
        "pageCount": page_count,
        "placeholderNameCount": sum(
            clean_text(str(item["name"])).casefold() == str(item["code"]).casefold()
            for item in items
        ),
        "prefixInvalidCount": sum(not prefix_re.fullmatch(code) for code in codes),
        "pricedItemCount": sum(bool(item["metadata"]["priced"]) for item in items),
        "replacementCharacterCount": text_quality_count(items, ("�",)),
        "unpricedItemCount": sum(not bool(item["metadata"]["priced"]) for item in items),
        "uniqueCodeCount": len(set(codes)),
    }


def validate(validation: dict[str, object]) -> None:
    if validation["itemCount"] != 10_062:
        raise ValueError(f"Combined item count gate failed: {validation['itemCount']} != 10062")
    if validation["institutionCounts"] != {"İLBANK": 6_151, "KVGM/VGM": 3_911}:
        raise ValueError(f"Institution count gate failed: {validation['institutionCounts']}")
    if validation["excludedTariffGridCount"] != 474:
        raise ValueError("Uncoded tariff grid count gate failed")
    if validation["duplicateCodeCount"] or validation["syntheticCodeCount"]:
        raise ValueError("Global code uniqueness/provenance gate failed")

    for source in validation["sources"]:
        if source["itemCount"] != source["expectedItemCount"]:
            raise ValueError(f"Source count gate failed: {source}")
        if source["uniqueCodeCount"] != source["itemCount"]:
            raise ValueError(f"Source uniqueness gate failed: {source['id']}")
        for key in (
            "blankNameCount",
            "blankUnitCount",
            "controlCharacterCount",
            "duplicateCodeCount",
            "mojibakeMarkerCount",
            "overlongNameCount",
            "placeholderNameCount",
            "prefixInvalidCount",
            "replacementCharacterCount",
        ):
            if source[key]:
                raise ValueError(f"Quality gate {key} failed for {source['id']}: {source[key]}")


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--download-directory",
        type=Path,
        default=Path("tools/yfk-importer/tmp/other-institutions-2026-08"),
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
    args.download_directory.mkdir(parents=True, exist_ok=True)

    all_items: list[dict[str, object]] = []
    source_documents: list[dict[str, object]] = []
    source_reports: list[dict[str, object]] = []
    for config in SOURCES:
        path = download(config, args.download_directory)
        items, page_count = extract(config, path, args.pdftotext)
        all_items.extend(items)
        source_documents.append(source_json(config, path))
        source_reports.append(report_for(config, items, page_count))
        print(f"{config.id}: {len(items)} coded items", flush=True)

    codes = [str(item["code"]) for item in all_items]
    validation = {
        "duplicateCodeCount": len(codes) - len(set(codes)),
        "excludedTariffGridCount": sum(source.excluded_tariff_grid_count for source in SOURCES),
        "institutionCounts": dict(Counter(str(item["metadata"]["institution"]) for item in all_items)),
        "itemCount": len(all_items),
        "kindCounts": dict(Counter(str(item["kind"]) for item in all_items)),
        "negativePriceItemCount": sum(int(item["unitPriceKurus"]) < 0 for item in all_items),
        "priceStatusCounts": dict(Counter(str(item["metadata"]["priceStatus"]) for item in all_items)),
        "sourceCount": len(SOURCES),
        "sources": source_reports,
        "syntheticCodeCount": 0,
        "uniqueCodeCount": len(set(codes)),
        "zeroPriceItemCount": sum(int(item["unitPriceKurus"]) == 0 for item in all_items),
    }
    validate(validation)

    base = args.output_directory / "official-2026-08-ilbank-vgm-positions"
    write_json(base.with_suffix(".json"), all_items)
    write_json(base.with_name(base.name + "-sources.json"), source_documents)
    write_json(base.with_name(base.name + "-validation.json"), validation)
    print(json.dumps(validation, ensure_ascii=False, indent=2), flush=True)


if __name__ == "__main__":
    main()
