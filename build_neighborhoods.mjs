import fs from 'fs';

const BASE = 'https://raw.githubusercontent.com/metinyildirimnet/turkiye-adresler-json/main';
const FILES = ['mahalleler-1.json', 'mahalleler-2.json', 'mahalleler-3.json', 'mahalleler-4.json'];
const ISTANBUL = '34';

// District labels exactly as used in OrdersScreen ISTANBUL_DISTRICTS.
const APP_DISTRICTS = [
  'Adalar','Arnavutköy','Ataşehir','Avcılar','Bağcılar','Bahçelievler','Bakırköy','Başakşehir',
  'Bayrampaşa','Beşiktaş','Beykoz','Beylikdüzü','Beyoğlu','Büyükçekmece','Çatalca','Çekmeköy',
  'Esenler','Esenyurt','Eyüpsultan','Fatih','Gaziosmanpaşa','Güngören','Kadıköy','Kağıthane',
  'Kartal','Küçükçekmece','Maltepe','Pendik','Sancaktepe','Sarıyer','Silivri','Sultanbeyli',
  'Sultangazi','Şile','Şişli','Tuzla','Ümraniye','Üsküdar','Zeytinburnu',
];
// NVI ilçe adı -> app label (only where the names differ).
const ALIAS = { 'EYÜP': 'Eyüpsultan' };

const upTr = (s) => s.toLocaleUpperCase('tr');
const titleTr = (s) =>
  s.toLocaleLowerCase('tr').split(/\s+/).filter(Boolean)
    .map(w => w.charAt(0).toLocaleUpperCase('tr') + w.slice(1)).join(' ');
const cleanName = (raw) => titleTr(raw.replace(/\s+(MAHALLESİ|MAH\.?)$/u, '').trim());

const byUpper = {};
APP_DISTRICTS.forEach(d => { byUpper[upTr(d)] = d; });
const resolve = (ilceAdi) => byUpper[upTr(ilceAdi)] || ALIAS[upTr(ilceAdi)] || null;

const map = {};
APP_DISTRICTS.forEach(d => { map[d] = new Set(); });

for (const f of FILES) {
  process.stdout.write('fetching ' + f + ' ... ');
  const rows = await (await fetch(`${BASE}/${f}`)).json();
  let n = 0;
  for (const r of rows) {
    if (r.sehir_id !== ISTANBUL) continue;
    const label = resolve(r.ilce_adi);
    if (!label) continue;
    const name = cleanName(r.mahalle_adi);
    if (!name) continue;
    map[label].add(name);
    n++;
  }
  console.log(n + ' İstanbul mahalle');
}

const out = {};
let total = 0;
for (const d of APP_DISTRICTS) {
  const list = [...map[d]].sort((a, b) => a.localeCompare(b, 'tr'));
  out[d] = list;
  total += list.length;
  if (list.length === 0) console.log('  !! NO mahalle for', d);
}
console.log('TOTAL mahalle:', total);

const body =
`// İstanbul ilçe -> mahalle listesi (kaynak: NVİ adres kayıt sistemi).
// build_neighborhoods.mjs ile üretildi; elle düzenlemeyin.
export const NEIGHBORHOODS = ${JSON.stringify(out, null, 0)};

export function neighborhoodsOf(district) {
  return NEIGHBORHOODS[district] || [];
}
`;
fs.writeFileSync('src/lib/neighborhoods.js', body, 'utf8');
console.log('WROTE src/lib/neighborhoods.js (' + Buffer.byteLength(body) + ' bytes)');
