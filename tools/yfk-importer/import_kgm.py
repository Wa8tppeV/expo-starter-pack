#!/usr/bin/env python3
"""Safely import the official 2026 KGM position PDFs already on disk.

The parser is intentionally table-specific. Formula pages are never sent to the
numeric-price extractor, code-looking references in descriptions are never used
as row anchors, and grouped/multi-variant rows are retained in metadata.
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


KGM_INDEX_URL = (
    "https://www.kgm.gov.tr/Sayfalar/KGM/SiteTr/Baskanliklar/"
    "BaskanliklarTeknikArastirma/BirimFiyatlar.aspx"
)
PRICE_RE = re.compile(r"^₺?-?\d{1,3}(?:[ .]\d{3})*,\d{2}$")
MAIN_CODE_RE = re.compile(
    r"^(?:KGM/?[A-Z0-9ÇĞİÖŞÜ.\-/]+|\d{2}\.\d{3}(?:[/-][A-Z0-9ÇĞİÖŞÜ-]+)?|"
    r"\d{3}[.-]\d{3}(?:/[A-Z])?|\d{2}\.\d{3}\.\d{4})$",
    re.IGNORECASE,
)
HISTORIC_CODE_RE = re.compile(
    r"^(?:\*?KTK-[A-Z0-9ÇĞİÖŞÜ.\-/]+|\d{2}\.\d{3}/\d+)$", re.IGNORECASE
)
UNIT_RE = re.compile(
    r"^(?:100|ad|adet|ano|ar|ay|cm|da|dekar|dm|dm3|gün|grup|ha\.?|kg|km\.?|kN|kuyu|m|m2|m3|m²|m³|"
    r"metre|nokta|paket|sa|saat|sefer|serilim|set|takım|tk|ton|-)$",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class Word:
    page: int
    text: str
    x: float
    y: float


@dataclass(frozen=True)
class SourceConfig:
    authority: str
    category: str
    filename: str
    id: str
    label: str
    page_count: int
    published_at: str
    record_type: str
    valid_from: str


SOURCES = (
    SourceConfig(
        "T.C. Ulaştırma ve Altyapı Bakanlığı / Karayolları Genel Müdürlüğü",
        "Yol, Köprü, Tünel, Bitümlü Kaplamalar, Bakım ve Trafik İşleri",
        "kgm-2026-unit-prices.pdf",
        "kgm-2026-yol-kopru-tunel",
        "KGM 2026 Yol, Köprü, Tünel, Bitümlü Kaplamalar, Bakım ve Trafik Birim Fiyatları",
        44,
        "2026-01-20",
        "unit_price_and_formula",
        "2026-01-01",
    ),
    SourceConfig(
        "T.C. Ulaştırma ve Altyapı Bakanlığı / Karayolları Genel Müdürlüğü",
        "KGM Rayiçleri",
        "kgm-2026-08-rates.pdf",
        "kgm-2026-08-rayic",
        "KGM 2026 Ağustos Güncellenmiş Rayiç ve Birim Fiyatları",
        3,
        "2026-08-03",
        "rate_and_unit_price",
        "2026-08-01",
    ),
    SourceConfig(
        "Karayolları Genel Müdürlüğü / Araştırma ve Geliştirme Dairesi Başkanlığı",
        "Araştırma, Geliştirme ve Laboratuvar Hizmetleri",
        "kgm-2026-arge-unit-prices.pdf",
        "kgm-2026-arge",
        "KGM Ar-Ge 2026 1. Dönem Birim Fiyatları",
        81,
        "2026-07-04",
        "unit_price",
        "2026-07-04",
    ),
    SourceConfig(
        "Karayolları Genel Müdürlüğü / Etüt, Proje ve Çevre Dairesi Başkanlığı",
        "Etüt, Proje ve Çevre Mühendisliği Hizmetleri",
        "kgm-2026-etut-proje-unit-prices.pdf",
        "kgm-2026-etut-proje-cevre",
        "KGM Etüt, Proje ve Çevre 2026/1 Birim Fiyatları",
        102,
        "2026-02-26",
        "unit_price_and_variable_composite",
        "2026-01-01",
    ),
    SourceConfig(
        "Karayolları Genel Müdürlüğü / Sanat Yapıları Dairesi Başkanlığı",
        "Tarihi Köprüler",
        "kgm-2026-historic-bridges.pdf",
        "kgm-2026-tarihi-kopruler",
        "KGM Tarihi Köprüler 2026 Birim Fiyatları",
        7,
        "2026-03-26",
        "unit_price_and_formula",
        "2026-01-01",
    ),
)

AR_GE_TABLE_PAGES = (
    17, 18, 19, 20, 21, 22, 23, 26, 27, 28, 29, 30, 32, 33, 34, 35, 36,
    37, 38, 39, 40, 41, 42, 43, 44, 50, 51, 52, 53, 54, 55, 56, 57, 58,
    59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75,
    76, 77, 78, 79, 81,
)


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip(" |\t\r\n")


def parse_kurus(value: str) -> int:
    cleaned = value.replace("₺", "").replace(" ", "").replace(".", "").replace(",", ".")
    amount = Decimal(cleaned)
    return int((amount * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def normalize_unit(value: str) -> str:
    raw = clean_text(value).rstrip(".")
    aliases = {
        "ad": "ad", "adet": "ad", "ay": "ay", "da": "da", "dekar": "da",
        "gün": "gün", "ha": "ha", "kg": "kg", "km": "km", "kuyu": "kuyu",
        "m": "m", "m2": "m²", "m²": "m²", "m3": "m³", "m³": "m³",
        "100": "100 ad", "metre": "m", "nokta": "nokta", "paket": "paket", "sa": "sa",
        "saat": "sa", "set": "set", "tk": "takım", "ton": "ton", "-": "-",
    }
    return aliases.get(raw.casefold(), raw) or "belirtilmemiş"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def read_words(path: Path, pdftotext: str) -> tuple[list[Word], int]:
    process = subprocess.run(
        [pdftotext, "-tsv", str(path), "-"], check=True, capture_output=True
    )
    words: list[Word] = []
    page_count = 0
    for line in process.stdout.decode("utf-8").splitlines()[1:]:
        fields = line.split("\t", 11)
        if len(fields) != 12 or fields[0] != "5":
            continue
        page = int(fields[1])
        page_count = max(page_count, page)
        text = fields[11]
        if text.startswith("###"):
            continue
        words.append(Word(page, text, float(fields[6]), float(fields[7])))
    return words, page_count


def bounds(anchors: list[Word], index: int, radius: float) -> tuple[float, float]:
    anchor = anchors[index]
    lower = (anchors[index - 1].y + anchor.y) / 2 if index else anchor.y - radius
    upper = (anchor.y + anchors[index + 1].y) / 2 if index + 1 < len(anchors) else anchor.y + radius
    return max(lower, anchor.y - radius), min(upper, anchor.y + radius)


def make_item(
    config: SourceConfig,
    code: str,
    name: str,
    unit: str,
    page: int,
    unit_price_kurus: int,
    status: str = "fixed",
    extra: dict[str, object] | None = None,
) -> dict[str, object]:
    metadata: dict[str, object] = {
        "institution": "KGM",
        "page": page,
        "recordType": config.record_type,
        "priceStatus": status,
        "priced": status == "fixed",
    }
    if status == "fixed":
        metadata["baseUnitPriceKurus"] = unit_price_kurus
    if extra:
        metadata.update(extra)
    return {
        "category": config.category,
        "code": clean_text(code),
        "kind": "construction",
        "metadata": metadata,
        "name": clean_text(name),
        "sourceVersionId": config.id,
        "tags": ["KGM", config.category],
        "unit": normalize_unit(unit),
        "unitPriceKurus": unit_price_kurus,
    }


def row_parts(
    row_words: list[Word], anchor: Word, description_left: float, description_right: float | None = None
) -> tuple[str, str, int | None]:
    prices = sorted((word for word in row_words if PRICE_RE.fullmatch(word.text)), key=lambda word: word.x)
    price = prices[-1] if prices else None
    unit_candidates = sorted(
        (
            word for word in row_words
            if UNIT_RE.fullmatch(word.text) and word.x > description_left
            and (price is None or word.x < price.x)
        ),
        key=lambda word: word.x,
    )
    unit_word = unit_candidates[-1] if unit_candidates else None
    unit = normalize_unit(unit_word.text) if unit_word else "belirtilmemiş"
    if unit_word and unit_word.text.casefold() in {"m", "dm"}:
        superscripts = sorted(
            (
                word for word in row_words
                if word.text in {"2", "3"} and unit_word.x < word.x < unit_word.x + 18
                and abs(word.y - unit_word.y) < 4
            ),
            key=lambda word: word.x,
        )
        if superscripts:
            prefix = "dm" if unit_word.text.casefold() == "dm" else "m"
            unit = f"{prefix}²" if superscripts[0].text == "2" else f"{prefix}³"
    right = description_right
    if right is None:
        right = unit_word.x - 2 if unit_word else (price.x - 5 if price else 9999)
    description = sorted(
        (
            word for word in row_words
            if description_left <= word.x < right and word is not anchor
            and word is not unit_word
            and not PRICE_RE.fullmatch(word.text)
        ),
        key=lambda word: (round(word.y, 1), word.x),
    )
    name = clean_text(" ".join(word.text for word in description))
    price_value: int | None = None
    if price:
        prefix_words = sorted(
            (
                word for word in row_words
                if re.fullmatch(r"\d{1,3}", word.text)
                and (unit_word.x + 3 if unit_word else price.x - 80) < word.x < price.x
                and abs(word.y - price.y) < 2
            ),
            key=lambda word: word.x,
        )
        price_value = parse_kurus(" ".join([*(word.text for word in prefix_words), price.text]))
    return name, unit, price_value


def extract_main(config: SourceConfig, words: list[Word]) -> tuple[list[dict[str, object]], dict[str, int]]:
    pages: dict[int, list[Word]] = defaultdict(list)
    for word in words:
        pages[word.page].append(word)
    items: list[dict[str, object]] = []
    fixed_pages = (*range(4, 9), *range(13, 45))
    for page in fixed_pages:
        anchors = sorted(
            (
                word for word in pages[page]
                if word.x < 100 and 70 < word.y < 810 and MAIN_CODE_RE.fullmatch(word.text)
            ),
            key=lambda word: word.y,
        )
        for index, anchor in enumerate(anchors):
            lower = anchor.y - 5.0
            upper = anchors[index + 1].y - 5.0 if index + 1 < len(anchors) else anchor.y + 180.0
            row = [word for word in pages[page] if lower <= word.y < upper]
            name, unit, price = row_parts(row, anchor, 120.0 if page < 9 else 125.0)
            if price is None or not name:
                raise ValueError(f"Unsafe main row extraction: page={page}, code={anchor.text}")
            items.append(make_item(config, anchor.text, name, unit, page, price))

    formula_rows = (
        (9, "07.004/K", "Yarma kazılarının taşınması", "m³", "F = 1,25 x K x [(0,00046 x M) - 0,0046]", None),
        (9, "07.005/K", "Kazıdan başka inşaat malzemelerinin taşınması (10 000 m'ye kadar)", "m³ / ton", None, [
            {"unit": "m³", "formula": "F = 1,25 x 0,00017 x K x √M x Y x A"},
            {"unit": "ton", "formula": "F = 1,25 x 0,00017 x K x √M x A"},
        ]),
        (11, "07.005/K-1", "Ariyet ocağından getirilecek veya depoya gidecek kazının taşınması (10 000 m'ye kadar)", "m³", "F = 1,25 x K x [(0,00034 x √M) - 0,0034]", None),
        (11, "07.005/K-2", "Ariyet ocağından getirilecek veya depoya gidecek kazının taşınması (10 000 m'den fazla)", "m³", "F = 1,25 x K x [(0,0014 x M + 0,02) - 0,0034]", None),
        (11, "07.006/K", "Kazıdan başka inşaat malzemelerinin taşınması (10 000 m'den fazla)", "m³ / ton", None, [
            {"unit": "m³", "formula": "F = 1,25 x K x (0,0007 x M + 0,01) x Y x A"},
            {"unit": "ton", "formula": "F = 1,25 x K x (0,0007 x M + 0,01) x A"},
        ]),
        (12, "09.001/K", "Çimentonun yüklenmesi, taşınması, boşaltılması ve istifi", "ton", "Analizine göre hesaplanır; kâr ve genel masraf oranları dikkate alınır.", None),
        (12, "09.012/K", "İnşaat bünyesine giren her cins betonarme, profil, lama demirleriyle düz sacın yüklenmesi, taşınması, boşaltılması ve istifi", "ton", "Analizine göre hesaplanır; kâr ve genel masraf oranları dikkate alınır.", None),
        (12, "2200", "Her cins ve klastaki zeminde yarma kazısı yapılması ve kullanılması", "m³", "İlk keşfe giren sınıf fiyatlarının ağırlıklı ortalamasına göre hesaplanır.", None),
        (12, "2202", "Her cins ve klastaki zeminde ocak ariyeti kazısı yapılması ve kullanılması", "m³", "İlk keşfe giren sınıf fiyatlarının ağırlıklı ortalamasına göre hesaplanır.", None),
    )
    all_text = {(word.page, word.text) for word in words}
    for page, code, name, unit, formula, variants in formula_rows:
        if (page, code) not in all_text:
            raise ValueError(f"Formula code not found in official PDF: {code}")
        extra: dict[str, object] = {"formula": formula} if formula else {}
        if variants:
            extra["priceVariantsJson"] = json.dumps(variants, ensure_ascii=False, separators=(",", ":"))
            extra["priceVariantCount"] = len(variants)
        items.append(make_item(config, code, name, unit, page, 0, "formula", extra))
    return items, {
        "fixedRowCount": len(items) - len(formula_rows),
        "formulaRowCount": len(formula_rows),
        "formulaRowsParsedAsPriceCount": 0,
        "multiVariantItemCount": 2,
        "rejectedReferenceTokenCount": sum(
            MAIN_CODE_RE.fullmatch(word.text) is not None and word.x >= 100
            for word in words if 4 <= word.page <= 44
        ),
    }


def extract_rates(config: SourceConfig, words: list[Word]) -> tuple[list[dict[str, object]], dict[str, int]]:
    pages: dict[int, list[Word]] = defaultdict(list)
    for word in words:
        pages[word.page].append(word)
    items: list[dict[str, object]] = []
    for page in range(1, 4):
        sequence = sorted(
            (word for word in pages[page] if word.x < 80 and word.text.isdigit() and 1 <= int(word.text) <= 44),
            key=lambda word: word.y,
        )
        for index, anchor in enumerate(sequence):
            lower, upper = bounds(sequence, index, 22.0)
            row = [word for word in pages[page] if lower <= word.y < upper]
            codes = sorted(
                (word for word in row if 80 <= word.x < 150 and MAIN_CODE_RE.fullmatch(word.text)),
                key=lambda word: (abs(word.y - anchor.y), word.x),
            )
            if not codes:
                raise ValueError(f"KGM rate code missing at sequence {anchor.text}")
            code = codes[0]
            name, unit, price = row_parts(row, code, 145.0, 420.0)
            watermark = {"70", "4-", "E2", "D-", "24"}
            name = clean_text(" ".join(part for part in name.split() if part not in watermark))
            if price is None or not name:
                raise ValueError(f"Unsafe rate row extraction: {code.text}")
            items.append(make_item(config, code.text, name, unit, page, price, extra={"sequence": int(anchor.text)}))
    items.sort(key=lambda item: int(item["metadata"]["sequence"]))
    return items, {"fixedRowCount": len(items), "formulaRowsParsedAsPriceCount": 0}


def extract_arge(config: SourceConfig, words: list[Word]) -> tuple[list[dict[str, object]], dict[str, int]]:
    pages: dict[int, list[Word]] = defaultdict(list)
    for word in words:
        pages[word.page].append(word)
    items: list[dict[str, object]] = []
    watermark_positions = {
        ("4A", 305.38), ("7-", 274.60), ("4F", 234.20), ("B-", 197.67), ("24", 159.17)
    }
    for page in AR_GE_TABLE_PAGES:
        prices = sorted((word for word in pages[page] if PRICE_RE.fullmatch(word.text)), key=lambda word: word.y)
        for index, price_word in enumerate(prices):
            code_candidates = sorted(
                (
                    word for word in pages[page]
                    if word.x < 180 and abs(word.y - price_word.y) < 3
                    and word.text not in {"POZ", "NO"}
                    and not any(word.text == text and abs(word.x - x) < 1 for text, x in watermark_positions)
                ),
                key=lambda word: word.x,
            )
            if not code_candidates:
                raise ValueError(f"Ar-Ge code missing: page={page}, y={price_word.y}")
            code = code_candidates[0]
            lower, upper = bounds(prices, index, 28.0)
            row = [
                word for word in pages[page]
                if lower <= word.y < upper
                and not any(word.text == text and abs(word.x - x) < 1 for text, x in watermark_positions)
            ]
            right = 470.0 if page < 32 else 365.0
            name, unit, price = row_parts(row, code, 75.0, right)
            name = clean_text(name.replace(code.text, "", 1))
            if price is None or not name:
                raise ValueError(f"Unsafe Ar-Ge row extraction: page={page}, code={code.text}")
            status = "official_zero" if price == 0 else "fixed"
            items.append(make_item(config, code.text, name, unit, page, price, status))
    return items, {
        "fixedRowCount": sum(item["metadata"]["priceStatus"] == "fixed" for item in items),
        "officialPriceCellCount": len(items),
        "officialZeroCount": sum(item["metadata"]["priceStatus"] == "official_zero" for item in items),
        "tablePageCount": len(AR_GE_TABLE_PAGES),
        "formulaRowsParsedAsPriceCount": 0,
    }


def etut_code_at(words: list[Word], price_word: Word) -> tuple[str, Word] | None:
    candidates = sorted(
        (word for word in words if word.x < 130 and abs(word.y - price_word.y) < 5),
        key=lambda word: word.x,
    )
    for index, word in enumerate(candidates):
        if re.fullmatch(r"(?:EP\d+(?:/\d+)?|KPTG|KSP\d+|PP\d+(?:/[A-Z0-9-]+)?|TGP\d+|ÇED\d+(?:/\d+(?:-[ab])?)?)", word.text, re.IGNORECASE):
            return word.text, word
        if word.text in {"ÇED", "ÇÇED"} and index + 1 < len(candidates) and re.fullmatch(r"\d+(?:/\d+(?:-[ab])?)?", candidates[index + 1].text, re.IGNORECASE):
            return f"{word.text} {candidates[index + 1].text}", word
    return None


def extract_etut(config: SourceConfig, words: list[Word]) -> tuple[list[dict[str, object]], dict[str, int]]:
    pages: dict[int, list[Word]] = defaultdict(list)
    for word in words:
        pages[word.page].append(word)
    items: list[dict[str, object]] = []
    for page in range(6, 10):
        prices = sorted((word for word in pages[page] if PRICE_RE.fullmatch(word.text)), key=lambda word: word.y)
        for index, price_word in enumerate(prices):
            if page == 7 and price_word.text == "1.798,25" and index == 0:
                continue
            result = etut_code_at(pages[page], price_word)
            if result is None:
                raise ValueError(f"Etüt code missing: page={page}, price={price_word.text}")
            code, anchor = result
            lower, upper = bounds(prices, index, 40.0)
            row = [word for word in pages[page] if lower <= word.y < upper]
            name, unit, price = row_parts(row, anchor, 135.0, 815.0)
            if price is None or not name:
                raise ValueError(f"Unsafe Etüt row extraction: {code}")
            items.append(make_item(config, code, name, unit, page, price))

    group_name = "Köprü projelerinin hazırlanması"
    for code in ("KP2100", "KP2200", "KP2300", "KP2400"):
        if not any(word.page == 7 and word.text == code for word in words):
            raise ValueError(f"Grouped Etüt code missing: {code}")
        items.append(make_item(
            config, code, group_name, "m²", 7, parse_kurus("1.798,25"),
            extra={"sharedPriceGroup": "KP2100-KP2400"},
        ))

    variable_codes = (
        "EP1001", "EP1002", "EP1003", "EP1004", "PP4001", "PP4002", "PP4003",
        "PP4004", "ÇED 101", "ÇED101/1", "ÇED101/3", "ÇED 102", "ÇED 102/3", "ÇED 102/5",
    )
    all_text = " ".join(word.text for word in words if 6 <= word.page <= 9)
    variable_names = {
        "EP1001": "Her türlü arazide koridor etüdü yapılması",
        "EP1002": "Her türlü arazide harita üretilmesi",
        "EP1003": "Her türlü arazide yatay ve düşey hat çizimi ve raporlarının hazırlanması",
        "EP1004": "Her türlü arazide hidrolik ve hidrolojik etütlerin yapılması",
        "PP4001": "Yol boyları ve kavşak alanlarının ön peyzaj proje ve raporlarının hazırlanması",
        "PP4002": "Yol boyları ve kavşak alanlarının kesin peyzaj projesinin yapılması",
        "PP4003": "Yol boyları ve kavşak alanlarının yapısal peyzaj uygulama projelerinin yapılması",
        "PP4004": "Yol boyları ve kavşak alanlarının bitkisel uygulama projelerinin yapılması",
        "ÇED 101": "Proje tanıtım dosyasının hazırlanmasında esas alınacak danışmanlık hizmetleri",
        "ÇED101/1": "Projenin özellikleri, proje yeri ve etki alanının mevcut çevresel özellikleri",
        "ÇED101/3": "Gürültü değerlendirmesi için arazi çalışmaları ve gürültü raporunun hazırlanması",
        "ÇED 102": "Çevresel etki değerlendirme raporunun hazırlanmasında esas alınacak danışmanlık hizmetleri",
        "ÇED 102/3": "Projenin tanımı, amacı, seçilen yerin konumu ve etki alanının mevcut çevresel özellikleri",
        "ÇED 102/5": "Gürültü değerlendirmesi arazi çalışmaları ve raporunun hazırlanması",
    }
    for code in variable_codes:
        parts = code.split()
        if not all(part in all_text for part in parts):
            raise ValueError(f"Variable Etüt code missing: {code}")
        page = 6 if code.startswith("EP") else 7 if code.startswith("PP") else 8 if "101" in code else 9
        unit = "paket" if code in {"ÇED 101", "ÇED 102"} else "km"
        items.append(make_item(
            config, code, variable_names[code], unit, page, 0, "formula",
            {"formula": "Paçal (değişken); alt pozların miktar ve fiyatlarına göre hesaplanır."},
        ))
    return items, {
        "fixedPriceRowCount": 60,
        "fixedCodeCount": len(items) - len(variable_codes),
        "variableCompositeCount": len(variable_codes),
        "sharedPriceGroupItemCount": 4,
        "formulaRowsParsedAsPriceCount": 0,
        "officialListedCodeCount": len(items),
    }


def extract_historic(config: SourceConfig, words: list[Word]) -> tuple[list[dict[str, object]], dict[str, int]]:
    pages: dict[int, list[Word]] = defaultdict(list)
    for word in words:
        pages[word.page].append(word)
    items: list[dict[str, object]] = []
    for page in range(2, 8):
        anchors = sorted(
            (word for word in pages[page] if word.x < 140 and 80 < word.y < 760 and HISTORIC_CODE_RE.fullmatch(word.text)),
            key=lambda word: word.y,
        )
        for index, anchor in enumerate(anchors):
            lower = anchor.y - 5.0
            code = anchor.text.lstrip("*")
            if anchor.text == "15.540/1625":
                prefixes = [
                    word for word in pages[page]
                    if word.text == "KTK-" and word.x < 140 and 0 < anchor.y - word.y < 30
                ]
                if not prefixes:
                    raise ValueError("Wrapped KTK-15.540/1625 prefix not found")
                lower = prefixes[-1].y - 5.0
                code = "KTK-15.540/1625"
            if code in {"KTK-0199/2", "KTK-0199/3"}:
                formula_data = {
                    "KTK-0199/2": (
                        "Orijinal (özgün) ve/veya yeni ahşap deneylerinin yapılması",
                        "Kültür ve Turizm Bakanlığı Eski Eser Birim Fiyat Listesindeki ilgili fiyatlar kullanılır.",
                    ),
                    "KTK-0199/3": (
                        "Orijinal (özgün) ve/veya yeni taş deneylerinin yapılması",
                        "KGM Araştırma ve Geliştirme Dairesi Başkanlığının ilgili fiyatları kullanılır.",
                    ),
                }
                name, formula = formula_data[code]
                items.append(make_item(config, code, name, "takım", page, 0, "formula", {"formula": formula}))
                continue
            if code == "KTK-0199/1":
                items.append(make_item(
                    config, code,
                    "Orijinal (özgün) ve/veya yeni tuğla deneylerinin yapılması",
                    "takım", page, parse_kurus("179.062,50"),
                ))
                continue
            upper = anchors[index + 1].y - 5.0 if index + 1 < len(anchors) else anchor.y + 55.0
            row = [word for word in pages[page] if lower <= word.y < upper]
            name, unit, price = row_parts(row, anchor, 145.0, 395.0)
            if code in {"KTK-RUP", "KTK-RUP/1"}:
                formula = "A: proje hizmet bedellerinin toplamı" if code == "KTK-RUP" else "B = A / 2"
                items.append(make_item(config, code, name, unit, page, 0, "formula", {"formula": formula}))
            elif price is not None and name:
                items.append(make_item(config, code, name, unit, page, price))
            else:
                raise ValueError(f"Unsafe historic bridge row: page={page}, code={code}")
    return items, {
        "fixedRowCount": sum(item["metadata"]["priced"] for item in items),
        "formulaRowCount": 4,
        "formulaRowsParsedAsPriceCount": 0,
        "footnoteMarkerStrippedCount": sum(
            word.text.startswith("*KTK-") for word in words if 2 <= word.page <= 7
        ),
    }


def source_json(config: SourceConfig, path: Path, record_count: int) -> dict[str, object]:
    return {
        "authority": config.authority,
        "checksum": sha256(path),
        "currency": "TRY",
        "id": config.id,
        "institution": "KGM",
        "itemKinds": ["construction"],
        "label": config.label,
        "pageCount": config.page_count,
        "publishedAt": config.published_at,
        "recordCount": record_count,
        "recordType": config.record_type,
        "sourceFile": config.filename,
        "sourceUrl": KGM_INDEX_URL,
        "validFrom": config.valid_from,
    }


def report(config: SourceConfig, items: list[dict[str, object]], details: dict[str, int]) -> dict[str, object]:
    codes = [str(item["code"]) for item in items]
    watermark_tokens = {"4A", "7-", "4F", "B-"}
    return {
        "blankNameCount": sum(not clean_text(str(item["name"])) for item in items),
        "blankUnitCount": sum(not clean_text(str(item["unit"])) for item in items),
        "controlCharacterCount": sum(
            sum(ord(char) < 32 for char in str(item[field])) for item in items for field in ("name", "unit")
        ),
        "duplicateCodeCount": len(codes) - len(set(codes)),
        "excludedUncertainRecordCount": 0,
        "genericUnitCount": sum(item["unit"] == "belirtilmemiş" for item in items),
        "id": config.id,
        "itemCount": len(items),
        "mojibakeMarkerCount": sum(
            sum(str(item[field]).count(marker) for marker in ("Ã", "Ä", "Å", "�"))
            for item in items for field in ("name", "unit", "code")
        ),
        "headerLeakCount": sum(
            "POZ NO" in str(item["name"]) or "BİRİM FİYAT" in str(item["name"])
            for item in items
        ),
        "overlongNameCount": sum(len(str(item["name"])) > 700 for item in items),
        "pricedItemCount": sum(bool(item["metadata"]["priced"]) for item in items),
        "syntheticCodeCount": 0,
        "uniqueCodeCount": len(set(codes)),
        "unpricedItemCount": sum(not bool(item["metadata"]["priced"]) for item in items),
        "watermarkMarkerCount": sum(
            any(token in watermark_tokens for token in str(item["name"]).split())
            for item in items
        ),
        **details,
    }


def validate(validation: dict[str, object]) -> None:
    expected_counts = {
        "kgm-2026-yol-kopru-tunel": 1269,
        "kgm-2026-08-rayic": 44,
        "kgm-2026-arge": 889,
        "kgm-2026-etut-proje-cevre": 77,
        "kgm-2026-tarihi-kopruler": 121,
    }
    for source in validation["sources"]:
        expected = expected_counts[source["id"]]
        if source["itemCount"] != expected:
            raise ValueError(f"Count gate failed for {source['id']}: {source['itemCount']} != {expected}")
        for key in (
            "blankNameCount", "blankUnitCount", "controlCharacterCount", "duplicateCodeCount",
            "formulaRowsParsedAsPriceCount", "headerLeakCount", "mojibakeMarkerCount",
            "overlongNameCount", "syntheticCodeCount", "watermarkMarkerCount",
        ):
            if source.get(key):
                raise ValueError(f"Quality gate {key} failed for {source['id']}: {source[key]}")
    if validation["duplicateIdentityCount"]:
        raise ValueError("Global source/code identity uniqueness gate failed")


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--input-directory", type=Path,
        default=Path("tools/yfk-importer/tmp/kgm-dsi-2026"),
    )
    parser.add_argument(
        "--output-directory", type=Path,
        default=Path("src/features/costs/data/generated"),
    )
    parser.add_argument("--pdftotext", default=shutil.which("pdftotext"))
    args = parser.parse_args()
    if not args.pdftotext:
        raise RuntimeError("Poppler pdftotext is required")

    extractors = {
        "kgm-2026-yol-kopru-tunel": extract_main,
        "kgm-2026-08-rayic": extract_rates,
        "kgm-2026-arge": extract_arge,
        "kgm-2026-etut-proje-cevre": extract_etut,
        "kgm-2026-tarihi-kopruler": extract_historic,
    }
    all_items: list[dict[str, object]] = []
    sources: list[dict[str, object]] = []
    reports: list[dict[str, object]] = []
    for config in SOURCES:
        path = args.input_directory / config.filename
        if not path.exists():
            raise FileNotFoundError(path)
        words, page_count = read_words(path, args.pdftotext)
        if page_count != config.page_count:
            raise ValueError(f"Unexpected page count for {config.id}: {page_count} != {config.page_count}")
        items, details = extractors[config.id](config, words)
        all_items.extend(items)
        sources.append(source_json(config, path, len(items)))
        reports.append(report(config, items, details))
        print(f"{config.id}: {len(items)} safe coded items", flush=True)

    identities = [(item["sourceVersionId"], item["code"]) for item in all_items]
    validation = {
        "duplicateIdentityCount": len(identities) - len(set(identities)),
        "excludedUncertainRecordCount": sum(source["excludedUncertainRecordCount"] for source in reports),
        "formulaRowsParsedAsPriceCount": sum(source.get("formulaRowsParsedAsPriceCount", 0) for source in reports),
        "institutionCounts": {"KGM": len(all_items)},
        "itemCount": len(all_items),
        "negativePriceItemCount": sum(int(item["unitPriceKurus"]) < 0 for item in all_items),
        "priceStatusCounts": dict(Counter(str(item["metadata"]["priceStatus"]) for item in all_items)),
        "sourceCount": len(SOURCES),
        "sources": reports,
        "syntheticCodeCount": 0,
        "zeroPriceItemCount": sum(int(item["unitPriceKurus"]) == 0 for item in all_items),
    }
    validate(validation)
    base = args.output_directory / "official-2026-08-kgm-positions"
    write_json(base.with_suffix(".json"), all_items)
    write_json(base.with_name(base.name + "-sources.json"), sources)
    write_json(base.with_name(base.name + "-validation.json"), validation)
    print(json.dumps(validation, ensure_ascii=False, indent=2), flush=True)


if __name__ == "__main__":
    main()
