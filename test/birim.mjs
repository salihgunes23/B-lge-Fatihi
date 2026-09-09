/* Kural katmanı birim testleri — şartname §20.
   Her test kendi dünyasını yükler; testler birbirini kirletmez. */
import { oyunuYukle, kosu, esit, dogru, yakin } from './ortak.mjs';

const {t, bitir} = kosu();
console.log('\nBİRİM TESTLERİ — kural katmanı');

const yeni = () => oyunuYukle().__bfTest;

/* Belirli sayıda geçilebilir komşusu olan bir bölge bul. */
function bolgeBul(T, enAzKomsu){
  return T.regions.find(r =>
    r.id > 1 && r.pixels.length &&
    [...r.neighbors].filter(n => T.regions[n].type !== 'obstacle').length >= enAzKomsu);
}
function komsulariAyarla(T, r, oyuncuSayisi){
  const gecilir = [...r.neighbors].filter(n => T.regions[n].type !== 'obstacle');
  gecilir.forEach((n, i) => { T.regions[n].owner = i < oyuncuSayisi ? 'player' : 'neutral'; });
  return gecilir;
}

/* ---------- T-16 / T-17 · taarruz alt sınırı ---------- */
t('T-16 taarruz eşiği savunmanın %20\'si, taban 2', () => {
  const T = yeni();
  esit(T.taarruzEsigi(100), 20);
  esit(T.taarruzEsigi(50), 10);
  esit(T.taarruzEsigi(3), 2, 'küçük hedefte taban');
  esit(T.taarruzEsigi(1), 2, 'en küçük hedefte taban');
});

t('T-17 eşik, tek askerle aşındırmayı imkânsız kılıyor', () => {
  const T = yeni();
  const hedef = T.regions.find(r => r.owner === 'enemy' && r.defense > 20);
  dogru(!!hedef, 'güçlü düşman bölgesi yok');
  const d = T.defenseAgainst(hedef, 'piyade');
  dogru(T.taarruzEsigi(d.value) >= 4, 'eşik çok düşük: ' + T.taarruzEsigi(d.value));
});

/* ---------- T-02…T-06 · kuşatma ---------- */
t('T-02..T-06 kuşatma çarpanları 1 / 0,82 / 0,68 / 0,58', () => {
  const T = yeni();
  const r = bolgeBul(T, 4);
  dogru(!!r, '4 komşulu bölge bulunamadı');
  const beklenen = [1, 1, 0.82, 0.68, 0.58];
  for (let k = 0; k <= 4; k++){
    komsulariAyarla(T, r, k);
    esit(T.cepheAnalizi(r, 'player').kusatma, beklenen[k], k + ' cepheden');
  }
});

/* ---------- T-07…T-09 · arazi ---------- */
t('T-07..T-09 dağ komşusu savunmayı %10 artırır, tavan %30', () => {
  const T = yeni();
  const r = bolgeBul(T, 4);
  const komsular = [...r.neighbors];
  const yedek = komsular.map(n => T.regions[n].type);
  komsular.forEach(n => { T.regions[n].type = 'empty'; T.regions[n].owner = 'neutral'; });
  esit(T.cepheAnalizi(r, 'player').arazi, 1, 'dağsız');
  T.regions[komsular[0]].type = 'obstacle';
  T.regions[komsular[1]].type = 'obstacle';
  yakin(T.cepheAnalizi(r, 'player').arazi, 1.2, 0.0001, 'iki dağ');
  komsular.forEach(n => { T.regions[n].type = 'obstacle'; });
  yakin(T.cepheAnalizi(r, 'player').arazi, 1.3, 0.0001, 'tavan');
  komsular.forEach((n, i) => { T.regions[n].type = yedek[i]; });
});

/* ---------- T-13…T-15 · saldırı × tahkimat ---------- */
t('T-13 piyade duvara ×1,8 ve tüfeğe ×1,5 takılır', () => {
  const T = yeni();
  const r = T.regions.find(x => x.owner === 'enemy' && x.id !== 1);
  r.defenses = ['duvar']; r.defense = 20;
  komsulariAyarla(T, r, 1);
  const d = T.defenseAgainst(r, 'piyade');
  yakin(d.mult, 1.8, 0.0001, 'duvar çarpanı');
  r.defenses = ['duvar', 'tufek'];
  yakin(T.defenseAgainst(r, 'piyade').mult, 1.8 * 1.5, 0.0001, 'duvar+tüfek');
});

t('T-14 topçu duvarı aşar, hava akını duvarı ve tüfeği aşar', () => {
  const T = yeni();
  const r = T.regions.find(x => x.owner === 'enemy' && x.id !== 1);
  r.defenses = ['duvar', 'tufek']; r.defense = 20;
  const bomba = T.defenseAgainst(r, 'bombardiman');
  dogru(bomba.bypassed.includes('duvar'), 'topçu duvarı aşmadı');
  const akin = T.defenseAgainst(r, 'akin');
  dogru(akin.bypassed.includes('duvar') && akin.bypassed.includes('tufek'), 'akın aşmadı');
});

t('T-15 hava savunması hava akınını ×2,4 ezer', () => {
  const T = yeni();
  const r = T.regions.find(x => x.owner === 'enemy' && x.id !== 1);
  r.defenses = ['hava']; r.defense = 20;
  yakin(T.defenseAgainst(r, 'akin').mult, 2.4, 0.0001);
  esit(T.defenseAgainst(r, 'piyade').mult, 1, 'piyadeye çarpan uygulanmamalı');
});

/* ---------- T-10…T-12 · ikmal ---------- */
t('T-10..T-12 ikmal çarpanı %100→1,00 · %15→1,43', () => {
  const T = yeni();
  const r = T.regions.find(x => x.owner === 'enemy' && x.id !== 1);
  r.defenses = []; r.defense = 20;
  const komsu = T.regions[[...r.neighbors][0]];
  komsu.owner = 'player'; komsu.ikmal = 100;
  yakin(T.defenseAgainst(r, 'piyade').ikmalCarpani, 1, 0.0001, 'tam ikmal');
  komsu.ikmal = 15;
  yakin(T.defenseAgainst(r, 'piyade').ikmalCarpani, 1.425, 0.0001, 'taban ikmal');
});

/* ---------- T-18 · ganimet ve garnizon devri ---------- */
t('T-18 ganimet formülü saldırı tipine göre değişiyor', () => {
  const T = yeni();
  esit(T.ATTACKS.piyade.lootMult, 1);
  esit(T.ATTACKS.bombardiman.lootMult, 0.45);
  esit(T.ATTACKS.akin.garrisonMult, 0.6);
});

/* ---------- T-24 · baskın gücü ölçekleniyor ---------- */
t('T-24 baskın gücü ordu ve toprakla ölçekleniyor', () => {
  const T = yeni();
  T.state.army = 0; T.state.raidCount = 0;
  const kucuk = T.baskinGucu();
  T.state.army = 100;
  const buyuk = T.baskinGucu();
  dogru(buyuk > kucuk + 15, 'ordu büyüyünce baskın da büyümeli: ' + kucuk + ' → ' + buyuk);
});

/* ---------- T-25 · ateşkes gerçek saldırganı engelliyor ---------- */
t('T-25 ateşkesli bot saldırgan listesinden çıkıyor', () => {
  const T = yeni();
  const hedef = T.regions.find(r =>
    [...r.neighbors].some(n => T.regions[n].owner === 'enemy' && T.regions[n].botId != null));
  dogru(!!hedef, 'düşmana komşu bölge yok');
  hedef.owner = 'player';
  const oncesi = T.saldirabilecekBotlar(hedef);
  dogru(oncesi.length > 0, 'saldırgan bulunamadı');
  oncesi.forEach(b => { b.ateskes = T.state.turn + 10; });
  esit(T.saldirabilecekBotlar(hedef).length, 0, 'ateşkese rağmen saldırgan kaldı');
});

/* ---------- T-23 · geçit zafer sayacı ---------- */
t('T-23 geçit sayacı hedefte başlar, kayıpta sıfırlanır', () => {
  const T = yeni();
  const gecitler = T.GECITLER.filter(g => g.regionId >= 0);
  gecitler.slice(0, 4).forEach(g => { T.regions[g.regionId].owner = 'player'; });
  T.state.gecitSayaci = null;
  T.gecitZaferKontrol();
  esit(T.state.gecitSayaci, T.sabitler.GECIT_TUTMA, 'sayaç başlamadı');
  T.gecitZaferKontrol();
  esit(T.state.gecitSayaci, T.sabitler.GECIT_TUTMA - 1, 'sayaç azalmadı');
  T.regions[gecitler[0].regionId].owner = 'enemy';
  T.gecitZaferKontrol();
  esit(T.state.gecitSayaci, null, 'geçit kaybında sıfırlanmadı');
});

t('T-23b sayaç dolunca zafer geliyor', () => {
  const T = yeni();
  T.GECITLER.filter(g => g.regionId >= 0).slice(0, 4)
    .forEach(g => { T.regions[g.regionId].owner = 'player'; });
  T.state.gecitSayaci = null;
  for (let i = 0; i < T.sabitler.GECIT_TUTMA + 2; i++) T.gecitZaferKontrol();
  esit(T.state.gameOver, true, 'zafer tetiklenmedi');
});

/* ---------- Bakım gideri ---------- */
t('Bakım gideri orduyla ölçekleniyor ve altından düşüyor', () => {
  const T = yeni();
  T.state.army = 80; T.state.gold = 500; T.state.started = true;
  const oncesi = T.state.gold;
  T.tick();
  esit(T.state.sonBakim, Math.ceil(80 / T.sabitler.BAKIM_BOLEN), 'bakım tutarı');
  esit(T.state.gold, oncesi + T.state.sonUretim - T.state.sonBakim, 'net gelir uygulanmadı');
});

t('Hazine boşken bakım karşılanamazsa asker firar ediyor', () => {
  const T = yeni();
  T.state.army = 200; T.state.gold = 0; T.state.started = true;
  T.regions.forEach(r => { if (r.owner === 'player' && r.type !== 'capital') r.owner = 'neutral'; });
  const oncesi = T.state.army;
  for (let i = 0; i < 3; i++) T.tick();
  dogru(T.state.army < oncesi, 'firar olmadı: ' + oncesi + ' → ' + T.state.army);
});

/* ---------- Baskın hedefi ---------- */
t('İkmali düşük iç bölge de baskın hedefi olabiliyor', () => {
  const T = yeni();
  const ic = T.regions.find(r => r.id > 1 && !r.gecit && r.type !== 'obstacle');
  ic.owner = 'player'; ic.ikmal = 10;
  [...ic.neighbors].forEach(n => { T.regions[n].owner = 'neutral'; T.regions[n].type = 'empty'; });
  const h = T.baskinHedefleri();
  dogru(h.zayif.some(r => r.id === ic.id), 'zayıf iç bölge havuza girmedi');
});

/* ---------- Rota sınıflandırması ---------- */
t('T-20..T-22 rota sınıfları toplamı tutarlı', () => {
  const T = yeni();
  T.invalidateRoutes();
  const rd = T.rotaDurumu();
  esit(rd.guvenli + rd.riskli + rd.kesildi, rd.toplam);
  dogru(rd.gelir >= 0, 'gelir negatif');
});

/* ---------- Olay kroniği ---------- */
t('Kritik bildirimler kroniğe yazılıyor, mikro bildirimler yazılmıyor', () => {
  const T = yeni();
  const once = T.olaylar().length;
  T.bildir(2, 'sıradan bilgi');
  esit(T.olaylar().length, once, 'seviye 2 kroniğe girmemeli');
  T.bildir(3, 'kritik olay');
  esit(T.olaylar().length, once + 1, 'seviye 3 kroniğe girmeli');
});

bitir();
