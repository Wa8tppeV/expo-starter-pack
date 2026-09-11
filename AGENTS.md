# DMH Proje Ofisi — AI Çalışma Kuralları

Bu branch DMH İnşaat için iPhone öncelikli proje-ofisi uygulamasıdır.

## Öncelikler
1. Kullanıcı maliyeti ve AI kullanımını düşük tut.
2. Önce repodaki mevcut çözümü yeniden kullan; sonra platform özelliği; en son yeni bağımlılık.
3. Gereksiz paket, servis, ajan, model veya mimari katman ekleme.
4. Küçük değişikliklerde ağır planlama/çoklu ajan kullanma.
5. Büyük değişikliklerde önce dar kapsamlı plan, sonra uygula, test et ve tek amaçlı commit oluştur.
6. Ana branch'e doğrudan yazma; dmh-proje-ofisi-v1 üzerinde çalış.
7. Kullanıcı deneyiminde iPhone ve tek elle kullanım önceliklidir.
8. Arayüz Türkçe, sade, hızlı ve şantiye/ofis ortamında okunaklı olmalıdır.

## v1 Modülleri
- Ana Sayfa
- Projeler
- Proje Detayı
- Projeciler
- Ödemeler

## Proje Disiplinleri
- Mimari
- Statik
- Mekanik
- Elektrik
- Harita
- Zemin Etüdü

Her disiplinde: sorumlu kişi, anlaşma bedeli, ödenen, kalan, durum, son tarih ve not.

## Durumlar
Başlamadı, Çalışılıyor, Revizyonda, Onay Bekliyor, Tamamlandı.

## Teknik yaklaşım
Mevcut Expo + React Native + Expo Router + TypeScript + NativeWind + Zustand yapısını koru.
Backend gerekmeden önce demo/yerel veriyle çalışan ürün çıkar.
Backend gerektiğinde mevcut bağlı Supabase'i tercih et.
Dağıtım gerektiğinde mevcut bağlı Vercel'i yalnızca web/PWA ihtiyacı varsa kullan.
