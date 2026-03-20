/**
 * randomize-dates-fessel.mjs
 * fessel.jp の全投稿日付を過去1年以内にランダム化
 */
import fetch from 'node-fetch';

const BASE = 'https://fessel.jp';
const AUTH = 'Basic ' + Buffer.from('admin:ikdn 38wI E5BV m6Bg XIJ6 OCsm').toString('base64');

const NOW          = new Date();
const ONE_YEAR_AGO = new Date(NOW.getTime() - 365 * 24 * 60 * 60 * 1000);
const YESTERDAY    = new Date(NOW.getTime() - 24 * 60 * 60 * 1000);

function randomDate() {
  const ms = ONE_YEAR_AGO.getTime() + Math.random() * (YESTERDAY.getTime() - ONE_YEAR_AGO.getTime());
  return new Date(ms).toISOString().slice(0, 19);
}

async function getAllIds(type) {
  const all = [];
  let page = 1;
  while (true) {
    const r = await fetch(
      `${BASE}/wp-json/wp/v2/${type}?per_page=100&page=${page}&_fields=id`,
      { headers: { Authorization: AUTH } }
    );
    if (!r.ok) { console.error(`fetch error: ${r.status}`); break; }
    const data = await r.json();
    if (!Array.isArray(data) || data.length === 0) break;
    all.push(...data.map(p => p.id));
    const total = parseInt(r.headers.get('X-WP-TotalPages') || '1');
    console.log(`  page ${page}/${total} (${all.length}件取得済み)`);
    if (page >= total) break;
    page++;
    await new Promise(r => setTimeout(r, 200));
  }
  return all;
}

async function updateDate(type, id, retry = 0) {
  const d = randomDate();
  try {
    const r = await fetch(`${BASE}/wp-json/wp/v2/${type}/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: AUTH },
      body: JSON.stringify({ status: 'publish', date: d, date_gmt: d }),
    });
    const text = await r.text();
    try {
      const j = JSON.parse(text);
      return !!j.id;
    } catch {
      if (retry < 3) {
        await new Promise(r => setTimeout(r, 3000 * (retry + 1)));
        return updateDate(type, id, retry + 1);
      }
      return false;
    }
  } catch (e) {
    if (retry < 3) {
      await new Promise(r => setTimeout(r, 3000 * (retry + 1)));
      return updateDate(type, id, retry + 1);
    }
    return false;
  }
}

let total = 0, ok = 0, err = 0;

for (const type of ['subsidies', 'posts']) {
  console.log(`\n[${type}] ID取得中...`);
  const ids = await getAllIds(type);
  console.log(`[${type}] ${ids.length}件 処理開始`);

  for (let i = 0; i < ids.length; i++) {
    const success = await updateDate(type, ids[i]);
    if (success) ok++;
    else { console.error(`ERR [${ids[i]}]`); err++; }
    if ((i + 1) % 50 === 0) {
      console.log(`  ${i + 1}/${ids.length}件処理済み...`);
      await new Promise(r => setTimeout(r, 3000));
    } else {
      await new Promise(r => setTimeout(r, 100));
    }
  }
  total += ids.length;
  console.log(`[${type}] 完了`);
}

console.log(`\n=== 完了 ===`);
console.log(`対象: ${total}件 / 成功: ${ok}件 / エラー: ${err}件`);
