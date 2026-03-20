/**
 * fix-future-posts.mjs
 * 未来日付で scheduled になった投稿を publish に戻し、
 * 日付も過去（最大1年前〜今日）に修正する
 */
import fetch from 'node-fetch';

const BASE = 'http://localhost:10010';
const AUTH = 'Basic ' + Buffer.from('admin:3gj2 mOm5 wImw 1w3r ZJD6 Sy9U').toString('base64');

const NOW   = new Date();
const ONE_YEAR_AGO = new Date(NOW);
ONE_YEAR_AGO.setFullYear(ONE_YEAR_AGO.getFullYear() - 1);

// 過去1年以内のランダム日時を返す
function randomPastDate(id) {
  const range = NOW.getTime() - ONE_YEAR_AGO.getTime();
  // IDベースで決定論的なランダム値（再実行しても同じ結果）
  const seed = (id * 2654435761) >>> 0;
  const offset = (seed % range);
  const d = new Date(ONE_YEAR_AGO.getTime() + offset);
  return d.toISOString().replace('Z', ''); // "2025-06-15T10:23:45"
}

async function getScheduled(postType) {
  const all = [];
  let page = 1;
  while (true) {
    const r = await fetch(
      `${BASE}/wp-json/wp/v2/${postType}?status=future&per_page=100&page=${page}&_fields=id,status,date`,
      { headers: { Authorization: AUTH } }
    );
    if (!r.ok) break;
    const data = await r.json();
    if (!Array.isArray(data) || data.length === 0) break;
    all.push(...data);
    const total = parseInt(r.headers.get('X-WP-TotalPages') || '1');
    if (page >= total) break;
    page++;
  }
  return all;
}

async function fixPost(postType, id) {
  const newDate = randomPastDate(id);
  const r = await fetch(`${BASE}/wp-json/wp/v2/${postType}/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: AUTH },
    body: JSON.stringify({
      status: 'publish',
      date: newDate,
      date_gmt: newDate,
    }),
  });
  const j = await r.json();
  return !!j.id;
}

for (const type of ['subsidies', 'posts']) {
  const scheduled = await getScheduled(type);
  console.log(`[${type}] scheduled件数: ${scheduled.length}`);

  let ok = 0, err = 0;
  for (const p of scheduled) {
    const success = await fixPost(type, p.id);
    if (success) ok++;
    else { console.error(`ERR [${p.id}]`); err++; }
    await new Promise(r => setTimeout(r, 20));
  }
  console.log(`[${type}] 修正完了: ${ok}件 / エラー: ${err}件`);
}

console.log('\n=== 完了 ===');
