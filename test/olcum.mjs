/* ================= ÖLÇÜM KOŞUSU =================
   Denge ve performans hakkında konuşmak için sayı üretir. Test değildir:
   geçmez/kalmaz, ölçer. node test/olcum.mjs */
import fs from 'node:fs';
import { oyunuYukle } from './ortak.mjs';

const sr = (n, b=1) => String(n).padStart(b);
const bar = (v, max, w=22) => '█'.repeat(Math.max(0, Math.round(v/max*w))).padEnd(w, '·');

console.log('\n════ KOD ÖLÇÜLERİ ════');
let toplamSatir = 0, toplamBayt = 0;
for (const f of ['index.html','styles.css','game.js','ses.js','lobby.js','harita-tr.js']) {
  const s = fs.readFileSync(f, 'utf8');
  const satir = s.split('\n').length;
  toplamSatir += satir; toplamBayt += Buffer.byteLength(s);
  console.log(`  ${f.padEnd(14)} ${sr(satir,5)} satır  ${sr((Buffer.byteLength(s)/1024).toFixed(1),6)} KB`);
}
console.log(`  ${'TOPLAM'.padEnd(14)} ${sr(toplamSatir,5)} satır  ${sr((toplamBayt/1024).toFixed(1),6)} KB`);

console.log('\n════ PERFORMANS (başsız; çizim çağrıları taklit) ════');
{
  const w = oyunuYukle(); const T = w.__bfTest;
  T.state.started = true;
  let t0 = performance.now();
  for (let i = 0; i < 500; i++) T.tick();
  const tickMs = (performance.now() - t0) / 500;

  t0 = performance.now();
  for (let i = 0; i < 100; i++) T.botTickAll();
  const botMs = (performance.now() - t0) / 100;

  t0 = performance.now();
  for (let i = 0; i < 100; i++) T.drawMap();
  const cizMs = (performance.now() - t0) / 100;

  t0 = performance.now();
  for (let i = 0; i < 50; i++) { T.invalidateRoutes(); T.rotaDurumu(); }
  const rotaMs = (performance.now() - t0) / 50;

  const yaz = (ad, ms, butce) => {
    const durum = ms <= butce ? '✓' : '✗';
    console.log(`  ${durum} ${ad.padEnd(22)} ${ms.toFixed(3).padStart(7)} ms   bütçe ${butce} ms`);
  };
  yaz('tur (üretim+ikmal)', tickMs, 2);
  yaz('bot turu', botMs, 2);
  yaz('harita çizim döngüsü', cizMs, 4);
  yaz('rota + ikmal yeniden', rotaMs, 2);
}

console.log('\n════ DENGE: PASİF OYUNCU ════');
console.log('  (hiç hamle yapmayan oyuncu — v0.1\'de kaybetmesi imkânsızdı)');
{
  const sonuc = [];
  for (let k = 0; k < 5; k++) {
    const w = oyunuYukle(); const T = w.__bfTest;
    T.tohumAyarla(1000 + k); T.dunyaSifirla(); T.generateWorld();
    T.state.started = true;
    let tur = 0;
    for (; tur < 400 && !T.state.gameOver; tur++) {
      T.tick();
      if (tur % 3 === 0) T.botTickAll();
      if (tur % 12 === 0) { T.tryRaid(); w.__zamanIlerlet(); }
    }
    const il = T.regions.filter(r => r.owner === 'player').length;
    sonuc.push({tur, bitti: T.state.gameOver, il, altin: T.state.gold, ordu: T.state.army});
  }
  sonuc.forEach((s, i) =>
    console.log(`  tohum ${1000+i}: ${s.bitti ? 'yenildi' : 'ayakta'} · ${sr(s.tur,3)} tur · ` +
                `${sr(s.il,2)} il · ${sr(s.altin,4)} altın · ${sr(s.ordu,3)} asker`));
  const yenilen = sonuc.filter(s => s.bitti).length;
  console.log(`  → pasif oyuncu ${yenilen}/5 koşuda yenildi ` +
              (yenilen >= 3 ? '(beklenen: oyun artık kaybedilebilir)' : '(⚠ baskı zayıf olabilir)'));
}

console.log('\n════ DENGE: ÜRETİM EĞRİSİ (baskınsız, saf ekonomi) ════');
{
  const w = oyunuYukle(); const T = w.__bfTest;
  T.tohumAyarla(2024); T.dunyaSifirla(); T.generateWorld();
  T.state.started = true;
  const kayit = [];
  for (let i = 1; i <= 120; i++) {
    T.tick();
    if (i % 3 === 0) T.botTickAll();
    if (i % 20 === 0) kayit.push({tur: i, altin: T.state.gold, ordu: T.state.army,
                                  net: T.state.sonGelir, bakim: T.state.sonBakim,
                                  il: T.regions.filter(r => r.owner === 'player').length});
  }
  console.log('   tur   altın  ordu  net/tur  bakım  il');
  kayit.forEach(k => console.log(
    `  ${sr(k.tur,4)}  ${sr(k.altin,6)}  ${sr(k.ordu,4)}  ${sr(k.net,7)}  ${sr(k.bakim,5)}  ${sr(k.il,2)}`));
}

console.log('\n════ DENGE: OYNAYAN OYUNCU (otomatik strateji) ════');
console.log('  (ucuz genişle → fabrika kur → en ucuz cepheden saldır → sınırı garnizonla)');
{
  /* Basit ama makul bir oyuncu: şartname §26.5'teki eğrinin ölçüsü. */
  globalThis.otoOyuncuGlobal = function otoOyuncu(T) {
    const benim = () => T.regions.filter(r => r.owner === 'player');
    const komsuAdaylar = () => {
      const set = new Map();
      benim().forEach(r => r.neighbors.forEach(n => {
        const x = T.regions[n];
        if (x.owner !== 'player' && x.type !== 'obstacle') set.set(x.id, x);
      }));
      return [...set.values()];
    };
    const adaylar = komsuAdaylar();

    // 1) Ucuz toprak: bedeli karşılanabilen en ucuz boş/kaynak il
    const ucuz = adaylar.filter(r => r.owner === 'neutral' && r.cost <= T.state.gold)
                        .sort((a, b) => a.cost - b.cost)[0];
    if (ucuz) { T.bolgeAl(ucuz, false); return 'genişleme'; }

    // 2) Ekonomi: fabrika, sonra kent
    const bosIl = benim().find(r => !r.building && r.type !== 'capital');
    if (bosIl) {
      const fabrikaVar = benim().some(r => r.building === 'fabrika');
      if (!fabrikaVar && T.state.gold >= T.BUILDINGS.fabrika.cost) {
        T.tryBuild(bosIl, 'fabrika'); return 'fabrika';
      }
      if (fabrikaVar && T.state.gold >= T.BUILDINGS.kent.cost) {
        T.tryBuild(bosIl, 'kent'); return 'kent';
      }
    }

    // 3) Taarruz: en ucuza düşen düşman ili ve tipi
    let enIyi = null;
    adaylar.filter(r => r.owner === 'enemy').forEach(r => {
      Object.keys(T.ATTACKS).forEach(k => {
        if (!T.attackAvailability(k).ok) return;
        const v = T.defenseAgainst(r, k).value;
        if (!enIyi || v < enIyi.v) enIyi = {r, k, v};
      });
    });
    if (enIyi && T.state.army >= enIyi.v * 1.15) {
      const s = T.taarruzEt(enIyi.r, enIyi.k, Math.ceil(enIyi.v * 1.15), false);
      return s.fetih ? 'fetih' : 'saldırı';
    }

    // 4) Savunma: en açık sınır iline ordunun %25'i
    const acik = benim().filter(r => r.type !== 'capital' &&
      [...r.neighbors].some(n => T.regions[n].owner === 'enemy') &&
      !(r.garrison > 0)).sort((a, b) => (a.ikmal || 0) - (b.ikmal || 0))[0];
    if (acik && T.state.army > 20) { T.tryReinforce(acik, Math.floor(T.state.army * 0.25)); return 'takviye'; }
    return 'bekle';
  };

  const kosular = [];
  for (let k = 0; k < 5; k++) {
    const w = oyunuYukle(); const T = w.__bfTest;
    T.tohumAyarla(3000 + k); T.dunyaSifirla(); T.generateWorld();
    T.state.started = true;
    const isaret = {};
    let tur = 0, ilkFabrika = null;
    for (; tur < 400 && !T.state.gameOver; tur++) {
      T.tick();
      const is = otoOyuncuGlobal(T);
      isaret[is] = (isaret[is] || 0) + 1;
      if (is === 'fabrika' && ilkFabrika === null) ilkFabrika = tur;
      if (tur % 3 === 0) T.botTickAll();
      if (tur % 12 === 0) { T.tryRaid(); w.__zamanIlerlet(); }
      w.__zamanIlerlet();
    }
    const il = T.regions.filter(r => r.owner === 'player').length;
    const gecit = T.gecitDurumu();
    kosular.push({tur, il, gecit: gecit.tut, altin: T.state.gold, ordu: T.state.army,
                  fabrika: ilkFabrika, bitti: T.state.gameOver, fetih: T.state.fetih});
  }
  console.log('  tohum   sonuç    tur   il  geçit  fetih  ilk fabrika');
  kosular.forEach((k, i) => console.log(
    `  ${3000+i}   ${(k.bitti ? 'bitti' : 'sürüyor').padEnd(8)}${sr(k.tur,4)}  ${sr(k.il,3)}   ${sr(k.gecit,3)}   ${sr(k.fetih,4)}   ${k.fabrika === null ? '  —' : sr(k.fabrika,3)}`));
  const ort = a => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);
  console.log(`  → ortalama: ${ort(kosular.map(k => k.il))} il · ${ort(kosular.map(k => k.gecit))} geçit · ` +
              `${ort(kosular.map(k => k.fetih))} fetih · ilk fabrika ${ort(kosular.filter(k=>k.fabrika!==null).map(k => k.fabrika))}. tur`);
}

console.log('\n════ DENGE: STRATEJİ KARŞILAŞTIRMASI ════');
console.log('  Oyunun tezi: "toprağı değil, geçişi tut". Tez doğruysa geçide');
console.log('  yürüyen oyuncu, haritayı süpürenden daha hızlı kazanmalı.');
{
  /* Geçitçi: hedefi yalnızca geçitler. Yol üstündeki illeri alır, geçidi
     garnizonlar, gereksiz fetih yapmaz. */
  function gecitci(T) {
    const benim = () => T.regions.filter(r => r.owner === 'player');
    const kom = () => {
      const m = new Map();
      benim().forEach(r => r.neighbors.forEach(n => {
        const x = T.regions[n];
        if (x.owner !== 'player' && x.type !== 'obstacle') m.set(x.id, x);
      }));
      return [...m.values()];
    };
    const adaylar = kom();
    const gecitIl = new Set(T.GECITLER.filter(g => g.regionId >= 0).map(g => g.regionId));

    // 1) Komşuda geçit varsa her şeyden önce onu al
    const gec = adaylar.find(r => gecitIl.has(r.id));
    if (gec) {
      if (gec.owner === 'neutral' && T.state.gold >= (gec.cost || 0)) { T.bolgeAl(gec, false); return; }
      if (gec.owner === 'enemy') {
        let en = null;
        Object.keys(T.ATTACKS).forEach(k => {
          if (!T.attackAvailability(k).ok) return;
          const v = T.defenseAgainst(gec, k).value;
          if (!en || v < en.v) en = {k, v};
        });
        if (en && T.state.army >= en.v * 1.15) { T.taarruzEt(gec, en.k, Math.ceil(en.v * 1.15), false); return; }
      }
    }

    // 2) Elindeki geçitleri garnizonla (zafer sayacı korunmalı)
    const zayifGecit = benim().filter(r => gecitIl.has(r.id) && !T.baskinDayanimi(r).yeter)
                              .sort((a, b) => (a.garrison || 0) - (b.garrison || 0))[0];
    if (zayifGecit && T.state.army > 25) {
      T.tryReinforce(zayifGecit, Math.floor(T.state.army * 0.35)); return;
    }

    // 3) Ekonomi
    const bos = benim().find(r => !r.building && r.type !== 'capital');
    if (bos) {
      if (!benim().some(r => r.building === 'fabrika') && T.state.gold >= T.BUILDINGS.fabrika.cost) {
        T.tryBuild(bos, 'fabrika'); return;
      }
      if (T.state.gold >= T.BUILDINGS.kent.cost) { T.tryBuild(bos, 'kent'); return; }
    }

    // 4) Geçide doğru ilerle: geçide en yakın komşu ili al
    const hedefGecitler = T.GECITLER.filter(g => g.regionId >= 0 &&
      T.regions[g.regionId].owner !== 'player').map(g => T.regions[g.regionId]);
    if (hedefGecitler.length) {
      const mesafe = r => Math.min(...hedefGecitler.map(g =>
        Math.hypot(g.anchor.x - r.anchor.x, g.anchor.y - r.anchor.y)));
      const yol = adaylar.filter(r => r.owner === 'neutral' && r.cost <= T.state.gold)
                         .sort((a, b) => mesafe(a) - mesafe(b))[0];
      if (yol) { T.bolgeAl(yol, false); return; }
      const dusman = adaylar.filter(r => r.owner === 'enemy').sort((a, b) => mesafe(a) - mesafe(b))[0];
      if (dusman) {
        let en = null;
        Object.keys(T.ATTACKS).forEach(k => {
          if (!T.attackAvailability(k).ok) return;
          const v = T.defenseAgainst(dusman, k).value;
          if (!en || v < en.v) en = {k, v};
        });
        if (en && T.state.army >= en.v * 1.2) { T.taarruzEt(dusman, en.k, Math.ceil(en.v * 1.2), false); }
      }
    }
  }

  function kosu(strateji, tohum) {
    const w = oyunuYukle(); const T = w.__bfTest;
    T.tohumAyarla(tohum); T.dunyaSifirla(); T.generateWorld();
    T.state.started = true;
    let tur = 0;
    for (; tur < 500 && !T.state.gameOver; tur++) {
      T.tick();
      strateji(T);
      if (tur % 3 === 0) T.botTickAll();
      if (tur % 12 === 0) { T.tryRaid(); w.__zamanIlerlet(); }
      w.__zamanIlerlet();
    }
    return {tur, il: T.regions.filter(r => r.owner === 'player').length,
            gecit: T.gecitDurumu().tut, bitti: T.state.gameOver, fetih: T.state.fetih};
  }

  const tohumlar = [4001, 4002, 4003, 4004, 4005, 4006];
  const yay = tohumlar.map(t => kosu(otoOyuncuGlobal, t));
  const gec = tohumlar.map(t => kosu(gecitci, t));
  const ozetle = (ad, k) => {
    const biten = k.filter(x => x.bitti);
    const ort = a => a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(0) : '—';
    console.log(`  ${ad.padEnd(18)} ${biten.length}/${k.length} bitti · ort ${ort(biten.map(x => x.tur))} tur · ` +
                `ort ${ort(k.map(x => x.il))} il · ort ${ort(k.map(x => x.fetih))} fetih`);
  };
  ozetle('Yayılmacı', yay);
  ozetle('Geçitçi', gec);
  const bitenY = yay.filter(x => x.bitti), bitenG = gec.filter(x => x.bitti);
  const ortY = bitenY.length ? bitenY.reduce((a, b) => a + b.tur, 0) / bitenY.length : Infinity;
  const ortG = bitenG.length ? bitenG.reduce((a, b) => a + b.tur, 0) / bitenG.length : Infinity;
  console.log('  → ' + (ortG < ortY
    ? 'geçitçi daha hızlı kazanıyor — tez tutuyor ✓'
    : 'yayılmacı daha hızlı kazanıyor — tez henüz mekaniğe yansımıyor ⚠'));
}

console.log('\n════ DENGE: SALDIRI MALİYETİ MATRİSİ ════');
{
  const w = oyunuYukle(); const T = w.__bfTest;
  const hedef = T.regions.find(r => r.owner === 'enemy' && r.id !== 1);
  hedef.defense = 20; hedef.garrison = 0;
  const senaryolar = [['tahkimatsız', []], ['duvar', ['duvar']],
                      ['tüfek', ['tufek']], ['hava savunması', ['hava']],
                      ['duvar+tüfek', ['duvar','tufek']]];
  console.log('   savunma 20 · gereken asker');
  console.log('   senaryo          piyade  topçu   akın   en ucuz');
  senaryolar.forEach(([ad, yapilar]) => {
    hedef.defenses = yapilar.slice();
    const d = Object.keys(T.ATTACKS).map(k => [k, T.defenseAgainst(hedef, k).value]);
    const enUcuz = d.reduce((a, b) => b[1] < a[1] ? b : a);
    console.log(`   ${ad.padEnd(16)}${d.map(x => sr(x[1],6)).join(' ')}   ${T.ATTACKS[enUcuz[0]].name}`);
  });
}

console.log('\n════ DENGE: BASKIN GÜCÜ ÖLÇEĞİ ════');
{
  const w = oyunuYukle(); const T = w.__bfTest;
  console.log('   ordu   baskın gücü   (baskın sayısı 10 sabit)');
  [10, 30, 60, 100, 160].forEach(ordu => {
    T.state.army = ordu; T.state.raidCount = 10;
    const g = T.baskinGucu();
    console.log(`  ${sr(ordu,5)}   ${sr(g,6)}       ${bar(g, 60)}`);
  });
}

console.log('\n════ KAYIT VE İÇERİK ════');
{
  const w = oyunuYukle(); const T = w.__bfTest;
  T.state.started = true;
  const paket = JSON.stringify(T.kayitPaketle());
  console.log(`  kayıt boyutu        ${(paket.length/1024).toFixed(1)} KB   (hedef < 60 KB)`);
  console.log(`  bölge               ${T.regions.length}`);
  console.log(`  geçit               ${T.GECITLER.filter(g => g.regionId >= 0).length}`);
  console.log(`  bina tipi           ${Object.keys(T.BUILDINGS).length}`);
  console.log(`  saldırı tipi        ${Object.keys(T.ATTACKS).length}`);
  console.log(`  nükleer başlık      ${Object.keys(T.NUKES).length}`);
  console.log(`  komutan             ${new Set(T.bots.map(b => T.komutan(b).ad)).size}`);
}
console.log('');
