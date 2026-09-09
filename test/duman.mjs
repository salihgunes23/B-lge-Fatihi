/* Duman testi: oyun başsız yükleniyor mu, dünya doğru üretiliyor mu,
   uzun süre koşunca durum tutarlı kalıyor mu? (şartname §20) */
import { oyunuYukle, kosu, esit, dogru } from './ortak.mjs';

const {t, bitir} = kosu();
console.log('\nDUMAN TESTİ');

let w;
t('game.js hatasız yükleniyor', () => { w = oyunuYukle(); dogru(!!w.__bfTest, 'test dikişi yok'); });

const T = () => w.__bfTest;

t('81 il üretiliyor ve hepsinin adı var', () => {
  const r = T().regions;
  esit(r.length, 81, 'bölge sayısı');
  const isimsiz = r.filter(x => /^Bölge \d+$/.test(x.name));
  esit(isimsiz.length, 0, 'isimsiz bölge sayısı');
});

t('başkent oyuncuda, hedef düşmanda', () => {
  const r = T().regions;
  esit(r[0].owner, 'player'); esit(r[0].type, 'capital');
  esit(r[1].owner, 'enemy');  esit(r[1].type, 'enemyCapital');
});

t('her bölgenin pikseli ve komşusu var', () => {
  const bos = T().regions.filter(r => !r.pixels.length);
  esit(bos.length, 0, 'piksesiz bölge');
  const yalniz = T().regions.filter(r => r.neighbors.size === 0);
  esit(yalniz.length, 0, 'komşusuz bölge');
});

t('altı geçit haritaya oturuyor', () => {
  const g = T().GECITLER.filter(x => x.regionId >= 0);
  esit(g.length, 6, 'yerleşen geçit');
});

t('üç bot cephesi kuruluyor', () => { dogru(T().bots.length === 3, 'bot sayısı: ' + T().bots.length); });

t('dört mod okunabiliyor', () => { esit(w.__bfModes().length, 4); });

t('lobi verisi tutarlı', () => {
  const d = w.__bfLobbyData();
  dogru(d && d.land.length > 500, 'kara pikseli az');
  esit(d.ilSayisi, 81);
  esit(d.gecitler.length, 6);
});

t('200 tur koşuyor, durum bozulmuyor', () => {
  const s = T().state;
  s.started = true;
  for (let i = 0; i < 200; i++) {
    T().tick();
    if (i % 3 === 0) T().botTickAll();
    if (i % 12 === 0) T().tryRaid();
    if (Number.isNaN(s.gold) || Number.isNaN(s.army)) throw new Error(i + '. turda NaN');
    if (s.gold < 0) throw new Error(i + '. turda negatif altın: ' + s.gold);
    if (s.army < 0) throw new Error(i + '. turda negatif ordu: ' + s.army);
    if (s.army > s.maxArmy) throw new Error(i + '. turda tavan aşıldı: ' + s.army + '/' + s.maxArmy);
    if (s.gameOver) break;
  }
  esit(s.turn > 0, true, 'tur ilerledi');
});

t('bölge sahipliği geçerli değerlerde kalıyor', () => {
  const gecerli = new Set(['player', 'enemy', 'neutral', 'capturing']);
  const kotu = T().regions.filter(r => !gecerli.has(r.owner));
  esit(kotu.length, 0, 'geçersiz sahiplik');
});

t('ikmal 0–100 aralığında', () => {
  T().hesaplaIkmal();
  const kotu = T().regions.filter(r => r.owner === 'player' && (r.ikmal < 0 || r.ikmal > 100));
  esit(kotu.length, 0, 'aralık dışı ikmal');
});

t('rota durumu üç sınıftan biri', () => {
  const rd = T().rotaDurumu();
  dogru(rd.guvenli + rd.riskli + rd.kesildi === rd.toplam, 'rota sınıfları toplamı');
});

bitir();
