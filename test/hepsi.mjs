/* Tek kapı: her değişiklik bu geçitten geçmeden "bitti" sayılmaz.
   node test/hepsi.mjs */
import { spawnSync } from 'node:child_process';

const takimlar = [
  ['Sözdizimi', 'node', ['--check', 'game.js']],
  ['Sözdizimi', 'node', ['--check', 'lobby.js']],
  ['Sözdizimi', 'node', ['--check', 'ses.js']],
  ['Duman',     'node', ['test/duman.mjs']],
  ['Birim',     'node', ['test/birim.mjs']],
  ['Sözleşme',  'node', ['test/sozlesme.mjs']]
];

let hata = 0;
const ozet = [];
for (const [ad, komut, argv] of takimlar) {
  const r = spawnSync(komut, argv, {encoding: 'utf8'});
  const gecti = r.status === 0;
  if (!gecti) { hata++; process.stdout.write(r.stdout || ''); process.stdout.write(r.stderr || ''); }
  const sayilar = (r.stdout || '').match(/(\d+) geçti, (\d+) kaldı/);
  ozet.push((gecti ? '  ✓ ' : '  ✗ ') + ad.padEnd(10) +
            (sayilar ? sayilar[1] + ' test' : (argv[1] || argv[0])));
}

console.log('\nGEÇİT — tüm denetimler');
ozet.forEach(s => console.log(s));
console.log(hata ? '\n  ✗ ' + hata + ' takım kaldı — değişiklik BİTMİŞ sayılmaz\n'
                 : '\n  ✓ Tüm takımlar geçti\n');
process.exitCode = hata ? 1 : 0;
