# YFK rayiç veri hattı

Bu araç, Yüksek Fen Kurulu'nun Ağustos 2026 inşaat rayiç PDF'sini indirir, tablo
yapısını ayrıştırır ve mobil uygulamanın kullandığı doğrulanabilir JSON kataloğunu
üretir.

```powershell
python -m pip install -r tools/yfk-importer/requirements.txt
python tools/yfk-importer/import_yfk.py --ocr
```

OCR seçeneği, PDF'nin bozuk Türkçe metin katmanını Tesseract ile onarır. Tesseract
`tur` dil paketi ve Poppler `pdftoppm` komutu sistemde bulunmalıdır. Çıktı yanında
kaynak sürümü, SHA-256 özeti, kayıt sayıları ve metin kalite raporu da oluşturulur.
