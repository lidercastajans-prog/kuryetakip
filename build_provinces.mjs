import fs from 'fs';
import { NEIGHBORHOODS } from './src/lib/neighborhoods.js';

const BASE = 'https://raw.githubusercontent.com/metinyildirimnet/turkiye-adresler-json/main';

const titleTr = (s) =>
  s.toLocaleLowerCase('tr').split(/\s+/).filter(Boolean)
    .map(w => w.charAt(0).toLocaleUpperCase('tr') + w.slice(1)).join(' ');

const sehirler = await (await fetch(`${BASE}/sehirler.json`)).json();   // [{sehir_id, sehir_adi}]
const ilceler = await (await fetch(`${BASE}/ilceler.json`)).json();     // [{ilce_id, ilce_adi, sehir_id}]

const provById = {};
sehirler.forEach(s => { provById[s.sehir_id] = titleTr(s.sehir_adi); });

const districts = {};
Object.values(provById).forEach(p => { districts[p] = new Set(); });
ilceler.forEach(i => {
  const p = provById[i.sehir_id];
  if (p) districts[p].add(titleTr(i.ilce_adi));
});

// İstanbul districts MUST match the keys of neighborhoods.js so the mahalle
// lookup keeps working (e.g. "Eyüpsultan", not raw NVI "Eyüp").
const IST = 'İstanbul';
const out = {};
const provinces = [IST, ...Object.keys(provById).map(id => provById[id])
  .filter(p => p !== IST).sort((a, b) => a.localeCompare(b, 'tr'))];

provinces.forEach(p => {
  if (p === IST) {
    out[p] = Object.keys(NEIGHBORHOODS).sort((a, b) => a.localeCompare(b, 'tr'));
  } else {
    out[p] = [...districts[p]].sort((a, b) => a.localeCompare(b, 'tr'));
  }
});

const body =
`// Türkiye il -> ilçe listesi (kaynak: NVİ adres kayıt sistemi).
// build_provinces.mjs ile üretildi; elle düzenlemeyin. İstanbul listede ilk sırada.
export const PROVINCES = ${JSON.stringify(provinces)};
export const DISTRICTS = ${JSON.stringify(out)};

export function districtsOf(province) {
  return DISTRICTS[province] || [];
}
`;
fs.writeFileSync('src/lib/provinces.js', body, 'utf8');
console.log('provinces:', provinces.length, '| İstanbul districts:', out[IST].length,
  '| total districts:', Object.values(out).reduce((s, a) => s + a.length, 0),
  '| bytes:', Buffer.byteLength(body));
