# DMH AI / Plugin Stratejisi

Amaç: Plus kullanımını ve dış servis maliyetini düşük tutarak güvenilir geliştirme.

## Kullanılacak bağlı araçlar

- GitHub: kaynak kodu, branch, commit ve inceleme.
- Supabase: yalnızca v1 yerel sürüm doğrulandıktan sonra veri senkronizasyonu gerektiğinde.
- Vercel: yalnızca web/PWA yayını gerektiğinde.

## Referans repolar

### garrytan/gstack

MIT lisanslı. Tam kurulum yerine hafif metodoloji uygulanır:

- önce mevcut kodu ara,
- mevcut bağımlılığı/platform özelliğini yeniden kullan,
- kök nedeni düzelt,
- küçük işte ağır ajan zinciri kullanma,
- büyük işte plan -> uygula -> test -> review.

Tam gstack, maliyet/ajan çağrısı nedeniyle ancak açık ihtiyaç oluşursa değerlendirilecek.

### openai/skills

Deprecated. Kullanılmayacak.

### openai/plugins

Güncel OpenAI plugin örnekleri. Özellikle resmi Expo plugin'i referans alınacak.

### OpenAI Plugins / Expo

Expo ve React Native için resmi plugin örneği; Expo Router, mobil UI, debug, upgrade ve EAS iş akışlarında referans.
Projeye kopyalanmış bağımlılık olarak eklenmez; ihtiyaç duyulan yaklaşım uygulanır.

## Maliyet kuralları

- Bir işi tek ajan/tek model çözebiliyorsa paralel ajan yok.
- Küçük UI ve CRUD işleri için çok aşamalı review zinciri yok.
- Yeni npm paketi ancak mevcut çözüm yoksa.
- İlk sürüm yerel/demo veriyle çalışır.
- Supabase/Auth ancak gerçek senkronizasyon ihtiyacında.
- Ücretli AI API entegrasyonu v1 kapsamı dışında.
- Railway, Lovable, Base44, Replit, Manus vb. aynı işi tekrar ettiği için v1'de kullanılmaz.

## Hedef

Önce iPhone'da hızlı çalışan DMH Proje Ofisi. Teknoloji gösterisi değil, günlük kullanılan iş aracı.
