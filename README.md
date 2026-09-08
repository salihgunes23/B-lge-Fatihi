# Bölge Fatihi — Prototip

Mobil dikey formatlı, pixel-art dünya haritalı bir fetih/strateji oyunu prototipi. Saf HTML/CSS/JS ile yazıldı, hiçbir kütüphane veya derleme adımı gerekmiyor.

## Dosyalar

- `index.html` — sayfa iskeleti
- `styles.css` — tüm görsel stiller
- `game.js` — oyun mantığı (harita üretimi, fetih, binalar, botlar, saldırı sistemi vb.)

## Çalıştırma

En kolay yol: `index.html` dosyasına çift tıklayıp tarayıcıda açmak. Bu kadar — sunucuya gerek yok.

### VS Code'da çalışmak için

1. Bu klasörü VS Code ile aç (`File > Open Folder`).
2. En rahat geliştirme deneyimi için **Live Server** eklentisini kur (Ritwick Dey), `index.html` üzerine sağ tıklayıp **"Open with Live Server"** de. Bu sayede dosyayı her kaydettiğinde tarayıcı otomatik yenilenir.
3. Mobil dikey görünümü test etmek için tarayıcının geliştirici araçlarında (F12) cihaz simülasyon modunu (Ctrl+Shift+M / Cmd+Shift+M) açman önerilir.

## Notlar

- `game.js` bir IIFE (`(function(){ ... })();`) içinde yazıldı, global scope'u kirletmez.
- Harita her sayfa yenilemesinde yeniden (rastgele) üretilir; sabit bir haritada test etmek istersen `Math.random` çağrılarını geçici olarak sabit bir seed'li RNG ile değiştirebilirsin.
- Kod tek bir büyük dosya yerine bölündü ama hâlâ tek bir "prototip" — modüler import/export sistemi yok; büyütmek istersen `game.js`'i mantıksal parçalara (world-gen, render, ui, ai) ayırman önerilir.
