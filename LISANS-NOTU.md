# Lisans durumu — karar bekliyor

Depoda henüz bir `LICENSE` dosyası yok. Bu bilinçli bir boşluk değil, **açık
bir eksik**: lisans seçimi hak sahibinin kararıdır, kod yazan tarafın değil.

## Karar verilmesi gerekenler

1. **Projenin kendi lisansı.** Yaygın seçenekler:
   - **MIT** — en izin verici; herkes kullanır, değiştirir, satabilir.
   - **Apache-2.0** — MIT benzeri, ek olarak patent koruması getirir.
   - **AGPL-3.0** — türev çalışmaların da açık kalmasını zorunlu kılar.
   - **Lisanssız (tüm hakları saklı)** — kimse yasal olarak kullanamaz.
     Depo herkese açıksa bu, "kodu görebilirsin ama kullanamazsın" demektir.

2. **Üçüncü taraf veri uyumu.** `harita-tr.js`, dosyanın başındaki nota göre
   açık kaynak bir GeoJSON'dan üretilmiştir:

   > Kaynak: github.com/cihadturhan/tr-geojson (tr-cities-utf8.json)

   Bu verinin lisansı **doğrulanmamıştır**. Yayına çıkmadan önce:
   - kaynak deponun `LICENSE` dosyası okunmalı,
   - lisans atıf istiyorsa atıf `VERI-KAYNAKLARI.md` dosyasına yazılmalı,
   - lisans türev çalışmaya kısıtlama getiriyorsa proje lisansı buna
     uygun seçilmeli.

## Tavsiye

Oyun ücretsiz ve açık kalacaksa **MIT** hem en basit hem en yaygın seçenek.
Karar verildiğinde `LICENSE` dosyası eklenmeli ve bu not silinmelidir.
