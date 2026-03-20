/**
 * migrate-amount-fields.mjs
 * hj_amount (string) → hj_amount_max (int 万円)
 * hj_rate (string) → hj_amount_rate
 * hj_description → post content
 */
import fetch from 'node-fetch';

const BASE = 'http://localhost:10010';
const AUTH = 'Basic ' + Buffer.from('admin:3gj2 mOm5 wImw 1w3r ZJD6 Sy9U').toString('base64');

// "上限100万円" → 100 (万円単位の整数)
function parseAmount(str) {
  if (!str) return null;
  // 億円
  const oku = str.match(/(\d[\d,.]*)\s*億円/);
  if (oku) return Math.round(parseFloat(oku[1].replace(/,/g, '')) * 10000);
  // 万円
  const man = str.match(/(\d[\d,.]*)\s*万円/);
  if (man) return Math.round(parseFloat(man[1].replace(/,/g, '')));
  // 円
  const yen = str.match(/(\d[\d,.]+)\s*円/);
  if (yen) return Math.round(parseFloat(yen[1].replace(/,/g, '')) / 10000);
  return null;
}

async function getPage(page) {
  const r = await fetch(
    `${BASE}/wp-json/wp/v2/subsidies?per_page=100&page=${page}&_fields=id,meta`,
    { headers: { Authorization: AUTH } }
  );
  if (!r.ok) return [];
  return await r.json();
}

async function update(id, data) {
  const r = await fetch(`${BASE}/wp-json/wp/v2/subsidies/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: AUTH },
    body: JSON.stringify(data),
  });
  const j = await r.json();
  return !!j.id;
}

let page = 1;
let migratedAmt = 0, migratedRate = 0, migratedContent = 0, total = 0;

while (true) {
  const posts = await getPage(page++);
  if (!posts.length) break;

  for (const post of posts) {
    total++;
    const meta = post.meta || {};
    const updates = {};

    // hj_amount → hj_amount_max
    const rawAmt = meta.hj_amount;
    if (rawAmt && !meta.hj_amount_max) {
      const parsed = parseAmount(rawAmt);
      if (parsed) {
        updates.meta = updates.meta || {};
        updates.meta.hj_amount_max = parsed;
        migratedAmt++;
      }
    }

    // hj_rate → hj_amount_rate
    const rawRate = meta.hj_rate;
    if (rawRate && !meta.hj_amount_rate) {
      updates.meta = updates.meta || {};
      updates.meta.hj_amount_rate = rawRate;
      migratedRate++;
    }

    // hj_description → content（投稿本文が空の場合）
    const desc = meta.hj_description;
    if (desc && desc.length > 50) {
      updates.content = desc;
      migratedContent++;
    }

    if (Object.keys(updates).length) {
      await update(post.id, updates);
    }
  }

  if (total % 100 === 0) console.log(`処理済み: ${total}件...`);
  if (posts.length < 100) break;
}

console.log('\n=== 完了 ===');
console.log(`合計: ${total}件`);
console.log(`hj_amount_max 移行: ${migratedAmt}件`);
console.log(`hj_amount_rate 移行: ${migratedRate}件`);
console.log(`content 設定: ${migratedContent}件`);
