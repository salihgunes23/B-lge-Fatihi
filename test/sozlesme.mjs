/* ================= DOM SÖZLEŞME TESTİ =================
   Tarayıcı olmadan yakalanabilecek en tehlikeli hata sınıfı: JavaScript'in
   var olmayan bir elemana ya da CSS'in tanımlamadığı bir sınıfa dayanması.
   Bu test, üç dosyanın birbirine verdiği sözü denetler:
     game.js/lobby.js  →  index.html   (id sözleşmesi)
     JS'in ürettiği HTML →  styles.css  (sınıf sözleşmesi)
   Şartname §20. */
import fs from 'node:fs';
import { kosu, dogru } from './ortak.mjs';

const {t, bitir} = kosu();
console.log('\nSÖZLEŞME TESTİ — HTML / CSS / JS tutarlılığı');

const html = fs.readFileSync('index.html', 'utf8');
const css  = fs.readFileSync('styles.css', 'utf8');
const js   = fs.readFileSync('game.js', 'utf8') + '\n' + fs.readFileSync('lobby.js', 'utf8');

const htmlIdler = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
const jsUretilenIdler = new Set([...js.matchAll(/id=['"]([a-z0-9-]+)['"]/gi)].map(m => m[1]));

t('getElementById ile aranan her id ya HTML\'de ya JS\'in ürettiği içerikte var', () => {
  const aranan = [...js.matchAll(/getElementById\(["']([^"']+)["']\)/g)].map(m => m[1]);
  const eksik = [...new Set(aranan)].filter(id => !htmlIdler.has(id) && !jsUretilenIdler.has(id));
  dogru(eksik.length === 0, 'HTML\'de karşılığı olmayan id: ' + eksik.join(', '));
});

t('querySelector ile aranan id\'ler de tanımlı', () => {
  const aranan = [...js.matchAll(/querySelector\(["']#([a-z0-9-]+)/gi)].map(m => m[1]);
  const eksik = [...new Set(aranan)].filter(id => !htmlIdler.has(id) && !jsUretilenIdler.has(id));
  dogru(eksik.length === 0, 'tanımsız id: ' + eksik.join(', '));
});

t('HTML\'deki her sınıfın CSS karşılığı var', () => {
  const cssSiniflar = new Set([...css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map(m => m[1]));
  const htmlSiniflar = new Set(
    [...html.matchAll(/\bclass="([^"]+)"/g)].flatMap(m => m[1].split(/\s+/)).filter(Boolean));
  const eksik = [...htmlSiniflar].filter(c => !cssSiniflar.has(c));
  dogru(eksik.length === 0, 'CSS\'te tanımsız sınıf: ' + eksik.join(', '));
});

t('JS\'in ürettiği panel sınıflarının CSS karşılığı var', () => {
  const cssSiniflar = new Set([...css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map(m => m[1]));
  const jsSiniflar = new Set(
    [...js.matchAll(/class=['"]([a-z][\w\s-]*)['"]/gi)]
      .flatMap(m => m[1].split(/\s+/)).filter(Boolean));
  /* Şablonla üretilen sınıflar (class='kronik-satir sv"+seviye+"') literal
     olarak yarım yakalanır; bunları dinamik sayıp eliyoruz. */
  const dinamik = c => js.includes(c + '"+') || js.includes(c + "'+");
  const eksik = [...jsSiniflar].filter(c => !cssSiniflar.has(c) && !dinamik(c));
  dogru(eksik.length === 0, 'CSS\'te tanımsız sınıf (JS): ' + eksik.join(', '));
});

t('Her script dosyası index.html\'de yüklü', () => {
  ['ses.js', 'game.js', 'harita-tr.js', 'lobby.js'].forEach(f => {
    dogru(html.includes('src="' + f + '"'), f + ' yüklenmiyor');
  });
});

t('Yüklenme sırası doğru: ses ve motor, lobiden önce', () => {
  const sira = ['ses.js', 'game.js', 'lobby.js'].map(f => html.indexOf('src="' + f + '"'));
  dogru(sira[0] < sira[1] && sira[1] < sira[2], 'script sırası yanlış: ' + sira.join(' < '));
});

t('T-19 arayüz metinlerinde çıplak denge sayısı kalmadı', () => {
  /* Yardım ekranı ve panel metinleri sabitlerden türetiliyor olmalı.
     Elle yazılmış "40 altın", "×1.8" gibi kalıpları arıyoruz. */
  const supheli = [];
  const satirlar = js.split('\n');
  satirlar.forEach((satir, i) => {
    if (!/["']/.test(satir)) return;
    if (/^\s*(\/\/|\/\*|\*)/.test(satir)) return;          // yorumlar hariç
    const metinler = [...satir.matchAll(/["']([^"']{6,})["']/g)].map(m => m[1]);
    metinler.forEach(m => {
      if (/×\d[.,]\d/.test(m)) supheli.push((i + 1) + ': ' + m.slice(0, 60));
      if (/\b\d{2,3}\s*(altın|🪙)/.test(m)) supheli.push((i + 1) + ': ' + m.slice(0, 60));
    });
  });
  dogru(supheli.length === 0, 'elle yazılmış denge sayısı:\n      ' + supheli.join('\n      '));
});

t('Kritik oynanış elemanları HTML\'de mevcut', () => {
  ['map', 'hud', 'bant', 'pause-btn', 'pause-flag', 'katman-secici', 'secim-serit',
   'raid-fill', 'sheet', 'modal-overlay', 'build-tray', 'bottombar', 'ctx-menu',
   'hud-gold', 'hud-army', 'hud-supply', 'hud-gate', 'hud-turn', 'menu-ses',
   'play-campaign', 'play-continue'].forEach(id => {
    dogru(htmlIdler.has(id), 'eksik eleman: #' + id);
  });
});

t('Erişilebilirlik: yakınlaştırma engellenmiyor', () => {
  dogru(!/user-scalable\s*=\s*no/.test(html), 'user-scalable=no hâlâ var (WCAG 1.4.4)');
});

bitir();
