# Bölge Fatihi

Türkiye haritası üzerinde oynanan, gerçek zamanlı akan tek oyunculu bir fetih
ve **ikmal** oyunu. Tarayıcıda çalışır: kütüphane yok, derleme adımı yok,
sunucu yok.

> **Tez:** toprağı değil, geçişi kontrol et.
> Kazanmanın yolu en çok ili almak değil, ordunun ve ticaretin geçmek zorunda
> olduğu altı gerçek Anadolu geçidini ve onlara giden ikmal hattını tutmaktır.

## Çalıştırma

`index.html` dosyasını tarayıcıda aç. Bu kadar.

Geliştirirken **Live Server** (VS Code eklentisi) kullanmak kaydettikçe
yenilenmeyi sağlar. Mobil görünüm için tarayıcının cihaz simülasyonunu aç
(F12 → Ctrl/Cmd+Shift+M).

## Dosyalar

| Dosya | Sorumluluk |
|---|---|
| `index.html` | Sayfa iskeleti: lobi, HUD, paneller, katman seçici |
| `styles.css` | Tüm görsel stiller ve tasarım jetonları |
| `game.js` | Oyun motoru: dünya üretimi, savaş, ekonomi, ikmal, rota, botlar, arayüz |
| `ses.js` | Prosedürel WebAudio ses motoru (dosyasız sentez) |
| `lobby.js` | Açılış ekranı, mod seçimi, atlas çizimi — kurallara dokunmaz |
| `harita-tr.js` | Üretilmiş veri: sadeleştirilmiş il sınırları (elle düzenlenmez) |
| `test/` | Tarayıcısız doğrulama takımları |

## Doğrulama

Her değişiklik tek bir geçitten geçer:

```bash
node test/hepsi.mjs
```

| Takım | Ne denetler |
|---|---|
| Sözdizimi | `game.js`, `lobby.js`, `ses.js` |
| Duman (12) | Başsız yükleme, dünya üretimi, 200 tur kararlılık, durum sınırları |
| Birim (28) | Kural katmanı: kuşatma, arazi, ikmal, saldırı matrisi, taarruz eşiği, baskın ölçeği, ateşkes, geçit sayacı, bakım, kayıt, tohum |
| Sözleşme (9) | HTML/CSS/JS tutarlılığı: her `getElementById` hedefi, her üretilen sınıf, script sırası, arayüzde elle yazılmış denge sayısı olmaması, erişilebilirlik kırmızı çizgileri |

Testler bağımlılıksızdır; Node'un `vm` modülü üzerinde asgari bir DOM taklidi
kurup motoru gerçekten çalıştırırlar.

### Denge ölçümü

```bash
node test/olcum.mjs
```

Geçmez/kalmaz — **ölçer**: kod büyüklüğü, tur/bot/çizim maliyetleri, pasif
oyuncunun kaç turda yenildiği, üretim eğrisi, saldırı maliyeti matrisi,
baskın gücü ölçeği, kayıt boyutu ve en önemlisi **strateji karşılaştırması**:

> Oyunun tezi "toprağı değil, geçişi tut". Ölçüm bunu doğrular: geçide
> yürüyen oyuncu ortalama **58 turda 20 il** ile kazanırken, haritayı süpüren
> oyuncu **126 turda 58 il** harcıyor.

Denge sabitleri değiştirildiğinde bu koşu tekrar edilir; sayılar tezden
sapıyorsa değişiklik geri alınır.

## Oynanış özeti

- **Tur** 2 saniye. Üç saat işler: üretim, baskın, botlar.
- **Zafer** moda bağlıdır. Geçit modunda 6 geçidin 4'ünü **8 tur boyunca**
  tutmak; diğer modlarda düşman başkentini almak.
- **Yenilgi** başkentin garnizonsuz ve tahkimatsızken baskın yemesidir.
- **Saldırı** üç tiptir (piyade / topçu / hava akını) ve her tahkimata karşı
  farklı davranır. Yanlış tip aynı hedefi kat kat pahalıya getirir.
- **İkmal** başkentten uzaklaştıkça düşer; beslenmeyen bölge hem az üretir
  hem oradan yapılan saldırı pahalılaşır hem de baskın hedefi olur.
- **Bakım** her 8 asker için 1 altın/tur. Hazine yetmezse asker firar eder.

Ayrıntılı kurallar oyun içindeki **Nasıl Oynanır** ekranındadır ve o ekran
tamamen motorun sabitlerinden üretilir — belge ile kural ayrışamaz.

## Kontroller

| Eylem | Fare | Dokunma | Klavye |
|---|---|---|---|
| Bölge seç | Sol tık | Dokun | Ok tuşları, Enter |
| Eylem menüsü | Sağ tık | Basılı tut | — |
| Kaydır / yakınlaştır | Sürükle / tekerlek | Tek/iki parmak | — |
| Katman değiştir | Katman düğmesi | Katman düğmesi | 1–5 |
| Duraklat | HUD düğmesi | HUD düğmesi | P |
| Yardım | i düğmesi | i düğmesi | F1 |
| Kapat | Dış tık | Dış dokunma | Esc |

## Mimari notlar

- `game.js` tek bir IIFE içindedir; global alanı yalnızca `window.__bf*`
  köprüleriyle kullanır (lobi ve testler bu köprülerden okur).
- Savaş matematiğinin tek kaynağı `defenseAgainst()`'tir: önizleme, saldırı
  çözümü ve bot kararları aynı fonksiyondan geçer, bu yüzden gösterilen
  sonuç ile olan sonuç ayrışamaz.
- Arayüz metinleri `binaAciklama()`, `saldiriKunye()` gibi üreticilerden
  çıkar; elle yazılmış denge sayısı sözleşme testiyle yasaklanmıştır.
- Harita her seferde bir **tohumdan** üretilir; kayıt yalnızca tohumu ve
  değişen alanları saklar (60 KB altında).

## Yol haritası

Sıradaki iş kalemleri ve tamamlanan fazlar üretim şartnamesindedir.
Kısaca sırada olanlar: mimari katmanlara ayırma, çok oyunculu, dünya haritası.
