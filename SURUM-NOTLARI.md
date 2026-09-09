# Sürüm notları

## v0.2 — Oynanış, doğruluk ve his (geliştirme dalı)

Bu sürümün tek cümlelik özeti: **oyun artık kaybedilebiliyor, sömürülemiyor
ve kendini doğru anlatıyor.**

### Kural çekirdeği
- **Taarruz alt sınırı** eklendi (hedefin etkin savunmasının %20'si, en az 2
  asker). Önceki sürümde 1 asker göndermek garnizonu 1 düşürüyordu; bu,
  saldırı–tahkimat bilmecesini bedelsiz baypas etmenin yoluydu. Aşındırma
  artık orantılı.
- **Ordu bakımı** eklendi (her 8 asker için 1 altın/tur). Hazine yetmezse
  asker firar eder. "Bekle ve biriktir" stratejisi artık bedelli.
- **Geçit zaferi tutmaya bağlandı:** 4 geçidi 8 tur elde tutmak gerekiyor;
  bir geçit düşerse sayaç sıfırlanıyor.
- **Baskın yeniden yazıldı:** ikmali düşük iç bölgeler de hedef olabiliyor,
  gücü oyuncunun ordusu ve toprağıyla ölçekleniyor, düşen bölge artık
  baskını yapan cepheye geçiyor.
- **Başkent tek vuruşta düşmüyor:** önce kuşatma ve açık uyarı, sonra düşüş.
- **Ateşkes** gerçek saldırgana bağlandı; ödenen bedelin karşılığı geliyor.

### Oynanış yüzeyleri
- HUD'un beş göstergesi tıklanabilir: ekonomi dökümü, ordu ve tavan, ikmal,
  geçitler, sefer kroniği.
- **Baskın geri sayımı** şeridi: baskın artık sürpriz değil.
- **Beş harita katmanı** (sahiplik, ikmal, rota, geçit, tehdit) ve 1–5
  kısayolları.
- **Diplomasi sekmesi** gerçek ekran oldu (eskiden "sistem yok" diyordu,
  oysa ateşkes çalışıyordu).
- Bölge panelinde "bu bölge baskını atlatır mı" hükmü, bölgeye özel bina
  hesabı ve **bina yıkma** (%40 iade).
- Saldırı panelinde **keşif düğmesi** ve **kuşatma önerisi**.
- **Seçim şeridi:** panel kapansa da bölge künyesi ekranda kalıyor.
- Pahalı ve geri alınamaz eylemler için **onay diyaloğu**; nükleerde kendi
  kaybın önceden yazılı.
- **Duraklatma** (P) ve modal açıkken otomatik durma.

### Doğruluk
- Bütün arayüz metinleri motor sabitlerinden **türetiliyor**. Yardım ekranı
  baştan yazıldı; füze ön şartı, ticaret geliri ve zafer koşulu artık doğru.
- Ordu panelindeki "Altın/tur" hatası düzeltildi (kasadaki toplamı
  gösteriyordu).
- Skorbord düşman başkumandanlığının gerçek il sayısını gösteriyor.

### His ve anlatı
- **ses.js**: dosyasız, prosedürel WebAudio motoru. Üç bus, throttle,
  ducking, arka planda sessizlik, kalıcı ayar.
- Seviyeli bildirim mimarisi: kritik olaylar toast kuyruğunda kaybolmuyor.
- **Üç komutan** (Demirkapı, Kervanbaşı, Yel) — doktrinleri botların
  davranış ağırlıklarına bağlı, metinde kalan bir süs değil.
- Sefer brifingi, sefer kroniği ve **gerekçeli** sonuç ekranı.

### Rakip
- Botlar komutan doktrinine göre yayılıyor; Demirkapı geçide, Kervanbaşı
  ticaret hattına yöneliyor.
- **Bot–bot çatışması:** belirgin güçlü cephe zayıf komşusunun ilini
  alabiliyor. Harita, oyuncu hamle yapmasa da değişiyor.

### Teknik
- **Tohumlanabilir rastgelelik** ve **kayıt/devam** sistemi (şema v1,
  60 KB altında, bozuk kayıt sessizce temizlenir).
- Arazi katmanı önbelleğe alındı; fetih animasyonu artımlı çiziyor; skorbord
  yalnızca içerik imzası değişince DOM'a yazıyor.
- Klavyeyle harita gezinme, panel odak yönetimi, `user-scalable=no`
  kaldırıldı, okunabilirlik ve dokunma hedefi eşikleri uygulandı.
- Tarayıcısız doğrulama: 12 duman + 28 birim + 9 sözleşme testi,
  `node test/hepsi.mjs` tek geçidi.

### Bilinen sınır
Bu sürüm tarayıcıda uçtan uca **oynanarak** doğrulanmamıştır; otomatik
denetimler kod, sözleşme ve kural düzeyindedir. Görsel yerleşim, dokunma
hissi ve ses tonu ilk oyun testinde ayarlanacaktır.

## v0.1
İlk prototip: harita üretimi, fetih, binalar, botlar, saldırı tipleri,
nükleer, ikmal ve rota sistemi.
