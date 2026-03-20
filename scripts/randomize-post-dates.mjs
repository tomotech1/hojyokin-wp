/**
 * randomize-post-dates.mjs
 * 全投稿の published_date を「今日から±1年以内」のランダム日時に変更
 */
import fetch from 'node-fetch';

const BASE = 'http://localhost:10010';
const AUTH = 'Basic ' + Buffer.from('admin:3gj2 mOm5 wImw 1w3r ZJD6 Sy9U').toString('base64');

function randomDate() {
  const now = Date.now();
  const oneYear = 365 * 24 * 60 * 60 * 1000;
  const delta = Math.floor(Math.random() * oneYear * 2) - oneYear; // -1年 〜 +1年
  const d = new Date(now + delta);
  // WP REST API形式: 2025-03-20T14:30:00
  return d.toISOString().replace('Z', '').slice(0, 19);
}

async function getAll() {
  let page = 1;
  const all = [];
  while (true) {
    const r = await fetch(`${BASE}/wp-json/wp/v2/subsidies?per_page=100&page=${page}&_fields=id`, {
      headers: { Authorization: AUTH }
    });
    if (!r.ok) break;
    const items = await r.json();
    if (!items.length) break;
    all.push(...items.map(i => i.id));
    if (items.length < 100) break;
    page++;
  }
  return all;
}

async function updateDate(id, date) {
  const r = await fetch(`${BASE}/wp-json/wp/v2/subsidies/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: AUTH },
    body: JSON.stringify({ date, date_gmt: date }),
  });
  const j = await r.json();
  return j.id ? true : false;
}

console.log('投稿日ランダム化開始...');
const ids = await getAll();
console.log(`対象: ${ids.length}件`);

let ok = 0, err = 0;
for (const id of ids) {
  const date = randomDate();
  const success = await updateDate(id, date);
  if (success) ok++;
  else { err++; console.error(`ERR id=${id}`); }
  // 過負荷防止
  if (ok % 50 === 0) process.stdout.write(`${ok}件完了...\n`);
}

console.log(`\n=== 完了 ===`);
console.log(`更新: ${ok}件 / エラー: ${err}件`);
