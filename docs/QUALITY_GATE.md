# DMH Proje Ofisi — Kalite Kapısı

Amaç: AI kullanımını artırmadan hatayı mümkün olduğunca otomatik yakalamak.

## Her önemli değişiklikte zorunlu

1. `bun run lint`
2. `bun run format:check`
3. `bunx tsc --noEmit`
4. `bun run test -- --runInBand`
5. `bunx expo-doctor@latest`
6. Kritik kullanıcı akışlarında Maestro E2E testi

## GitHub otomasyonu

- CI: lint, format, TypeScript, Jest ve Expo Doctor.
- CodeQL: JavaScript/TypeScript güvenlik analizi.
- Dependabot: haftalık bağımlılık güncellemeleri.

## AI kullanımını azaltma kuralları

- Testin bulabileceği hata için ikinci bir AI ajanı çağırma.
- Her küçük değişiklikte geniş repo incelemesi yapma.
- Önce otomatik kontrolleri çalıştır; yalnız başarısız kısım üzerinde ajan kullan.
- Aynı sorunu tekrar çözmemek için kararları AGENTS.md ve docs altında kaydet.

## E2E

Maestro akışları `.maestro/` altında tutulur.
Öncelikli akışlar:

- uygulama açılışı
- proje listesi
- proje detayı
- yeni proje oluşturma
- ödeme ekleme
- toplam borcun güncellenmesi

Maestro bilgisayarda kurulu değilse bu akışlar repoda kalır; TestFlight öncesi devreye alınır.
