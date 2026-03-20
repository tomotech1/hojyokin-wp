/**
 * randomize-dates-v2.mjs
 * 全投稿の投稿日を「過去1年以内」のランダム日時に設定
 * - 未来日付なし（WordPressがscheduledにするのを防ぐ）
 * - post_date / post_date_gmt を更新
 * - subsidies + posts 両方対象
 */
import fetch from 'node-fetch';

const BASE = 'http://localhost:10010';
const AUTH = 'Basic ' + Buffer.from('admin:3gj2 mOm5 wImw 1w3r ZJD6 Sy9U').toString('base64');

const NOW          = new Date();
const ONE_YEAR_AGO = new Date(NOW.getTime() - 365 * 24 * 60 * 60 * 1000);
// 「今日の23:59:59まで」ではなく昨日まで（futureにならないよう1日バッファ）
const YESTERDAY    = new Date(NOW.getTime() - 24 * 60 * 60 * 1000);

function randomDate() {
  const ms = ONE_YEAR_AGO.getTime() + Math.random() * (YESTERDAY.getTime() - ONE_YEAR_AGO.getTime());
  return new Date(ms).toISOString().slice(0, 19); // "2025-06-15T10:23:45"
}

async function getAllPosts(type) {
  const all = [];
  let page = 1;
  while (true) {
    const r = await fetch(
      `${BASE}/wp-json/wp/v2/${type}?per_page=100&page=${page}&status=publish,future&_fields=id`,
      { headers: { Authorization: AUTH } }
    );
    if (!r.ok) break;
    const data = await r.json();
    if (!Array.isArray(data) || data.length === 0) break;
    all.push(...data.map(p => p.id));
    const total = parseInt(r.headers.get('X-WP-TotalPages') || '1');
    if (page >= total) break;
    page++;
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
      // HTMLが返ってきた場合はリトライ
      if (retry < 3) {
        await new Promise(r => setTimeout(r, 2000 * (retry + 1)));
        return updateDate(type, id, retry + 1);
      }
      return false;
    }
  } catch (e) {
    if (retry < 3) {
      await new Promise(r => setTimeout(r, 2000 * (retry + 1)));
      return updateDate(type, id, retry + 1);
    }
    return false;
  }
}

let total = 0, ok = 0, err = 0;

for (const type of ['subsidies', 'posts']) {
  const ids = await getAllPosts(type);
  console.log(`[${type}] ${ids.length}件 処理開始`);

  for (let i = 0; i < ids.length; i++) {
    const success = await updateDate(type, ids[i]);
    if (success) ok++;
    else { console.error(`ERR [${ids[i]}]`); err++; }
    if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${ids.length}件処理済み...`);
    // 50件ごとに長めの休止（WordPress負荷軽減）
    const delay = (i + 1) % 50 === 0 ? 3000 : 80;
    await new Promise(r => setTimeout(r, delay));
  }
  total += ids.length;
  console.log(`[${type}] 完了`);
}

console.log(`\n=== 完了 ===`);
console.log(`対象: ${total}件 / 成功: ${ok}件 / エラー: ${err}件`);
