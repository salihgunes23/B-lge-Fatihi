# Veri kaynakları

Projede kullanılan, dışarıdan gelen bütün veriler burada kayıtlıdır.

## İl sınırları — `harita-tr.js`

- **Kaynak:** github.com/cihadturhan/tr-geojson (`tr-cities-utf8.json`)
- **İşlem:** Douglas–Peucker sadeleştirmesi (eps = 0.012), koordinatlar üç
  basamağa yuvarlandı, komşu illerin aynı rengi almaması için açgözlü graf
  boyamayla altı renkli indeks önceden hesaplandı.
- **Kullanım yeri:** yalnızca lobi ekranındaki atlas çizimi.
- **Lisans durumu:** ⚠️ doğrulanmadı — bkz. `LISANS-NOTU.md`.
- **Not:** dosya üretilmiştir, elle düzenlenmez. Yeniden üretmek gerekirse
  yukarıdaki adımlar tekrarlanır.

## İl merkezleri ve geçit koordinatları — `game.js`

- **Kaynak:** kamuya açık coğrafi bilgi (il merkezi enlem/boylam değerleri,
  boğaz ve dağ geçidi konumları).
- **Kullanım yeri:** oyun haritasının Voronoi üretimi ve geçit eşlemesi.
- **Not:** oyun haritası resmi il sınırlarını değil, il merkezlerinden
  türetilen yaklaşık sınırları kullanır. Bu bilinçli bir tercihtir.

## Yazı tipleri

- **Inter** — Google Fonts üzerinden yükleniyor (SIL Open Font License).
- Sistemde SF Pro varsa yığında önce o gelir, indirme yapılmaz.

## Ses

- Ses **dosyası yoktur**. Bütün sesler `ses.js` içinde WebAudio ile anlık
  sentezlenir; dışarıdan hiçbir ses varlığı alınmamıştır.
