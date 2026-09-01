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

Tüm güncel inşaat, mekanik ve elektrik rayiç/birim fiyat listelerini almak için:

```powershell
python tools/yfk-importer/import_all_positions.py
```

Mekanik ve elektrik pozlarında resmî birim fiyat ile montaj bedeli ayrı ayrı
saklanır; keşfe eklenen fiyat bunların montajlı toplamıdır.

İLBANK ile KVGM/VGM Ağustos 2026 pozlarını üretmek için:

```powershell
python tools/yfk-importer/import_other_institutions.py
```

Kodlu kayıtlar doğrudan kataloğa alınır. İLBANK'ın kodsuz harita ve imar tarife
matrisleri sahte poz numarası üretilmeden doğrulama raporunda ayrı sayılır.
