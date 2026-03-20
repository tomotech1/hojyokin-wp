/**
 * 補助金ナビ - Gemini AI記事生成 + WP REST API投稿スクリプト
 *
 * 使い方:
 *   node scripts/generate-ai-articles.mjs               # 全件
 *   node scripts/generate-ai-articles.mjs --limit=5     # 5件のみ
 *   node scripts/generate-ai-articles.mjs --type=subsidy
 *   node scripts/generate-ai-articles.mjs --type=industry
 *   node scripts/generate-ai-articles.mjs --type=pref
 *   node scripts/generate-ai-articles.mjs --dry-run     # API確認のみ（WP投稿なし）
 *
 * @requires .env ファイル（GEMINI_API_KEY, WP_URL, WP_USER, WP_APP_PASS）
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = join(__dir, '..');

// ======================================================================
// 設定読み込み（.env）
// ======================================================================
function loadEnv() {
  const envPath = join(ROOT, '.env');
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  const env = {};
  for (const line of lines) {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

const ENV          = loadEnv();
const GEMINI_KEY   = ENV.GEMINI_API_KEY;
const WP_URL       = ENV.WP_URL;
const WP_USER      = ENV.WP_USER;
const WP_APP_PASS  = ENV.WP_APP_PASS;
const WP_AUTH      = Buffer.from(`${WP_USER}:${WP_APP_PASS}`).toString('base64');
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL   = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;

// 引数解析
const args    = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const LIMIT   = (() => { const a = args.find(a => a.startsWith('--limit=')); return a ? parseInt(a.split('=')[1]) : 0; })();
const TYPE    = (() => { const a = args.find(a => a.startsWith('--type=')); return a ? a.split('=')[1] : 'all'; })();

// ======================================================================
// SEED DATA
// ======================================================================

const SUBSIDIES = [
  { name: 'ものづくり補助金',         max: '1,250万円', rate: '1/2〜2/3', agency: '経済産業省',  target: '中小企業・小規模事業者', slug: 'monozukuri' },
  { name: 'IT導入補助金',             max: '450万円',   rate: '1/2〜3/4', agency: '経済産業省',  target: '中小企業・小規模事業者', slug: 'it-donyu' },
  { name: '小規模事業者持続化補助金', max: '200万円',   rate: '2/3',      agency: '中小企業庁',  target: '小規模事業者',           slug: 'jizokuka' },
  { name: '事業再構築補助金',         max: '7,000万円', rate: '1/2〜3/4', agency: '経済産業省',  target: '中小企業・中堅企業',     slug: 'jigyosaiko' },
  { name: 'キャリアアップ助成金',     max: '80万円/人', rate: '—',        agency: '厚生労働省',  target: '雇用保険適用事業主',     slug: 'career-up' },
  { name: '人材開発支援助成金',       max: '研修費75%', rate: '最大75%',  agency: '厚生労働省',  target: '雇用保険適用事業主',     slug: 'jinzai-kaihatsu' },
  { name: '業務改善助成金',           max: '600万円',   rate: '最大9/10', agency: '厚生労働省',  target: '中小企業・小規模事業者', slug: 'gyomu-kaizen' },
  { name: '省エネ補助金',             max: '15億円',    rate: '1/3〜1/2', agency: '経済産業省',  target: '工場・事業場',           slug: 'shoene' },
  { name: '事業継続力強化計画補助金', max: '100万円',   rate: '1/2',      agency: '各都道府県',  target: '中小企業',               slug: 'bcp' },
  { name: '創業補助金',               max: '200万円',   rate: '2/3',      agency: '各都道府県',  target: '創業予定者',             slug: 'sogyo' },
];

const INDUSTRIES = [
  '製造業', 'IT・Web業', '飲食業', '小売業', '建設業',
  '農業・農林水産業', '医療・介護業', '美容・理容業', '運送・物流業',
  '宿泊業', '教育・学習支援業', '不動産業', '広告・デザイン業', '物販・EC業',
];

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
];

// ======================================================================
// Gemini API呼び出し
// ======================================================================
async function callGemini(prompt) {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API エラー: ${res.status} ${err}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

// ======================================================================
// WP REST API - 投稿確認（スラッグ重複チェック）
// ======================================================================
async function wpSlugExists(slug) {
  const res = await fetch(`${WP_URL}/wp-json/wp/v2/posts?slug=${slug}&status=publish,draft`, {
    headers: { 'Authorization': `Basic ${WP_AUTH}` },
  });
  const data = await res.json();
  return Array.isArray(data) && data.length > 0;
}

// ======================================================================
// WP REST API - カテゴリー取得または作成
// ======================================================================
async function getOrCreateCategory(name) {
  const searchRes = await fetch(`${WP_URL}/wp-json/wp/v2/categories?search=${encodeURIComponent(name)}&per_page=5`, {
    headers: { 'Authorization': `Basic ${WP_AUTH}` },
  });
  const cats = await searchRes.json();
  const found = cats.find(c => c.name === name);
  if (found) return found.id;

  const createRes = await fetch(`${WP_URL}/wp-json/wp/v2/categories`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${WP_AUTH}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });
  const cat = await createRes.json();
  return cat.id;
}

// ======================================================================
// WP REST API - 記事投稿
// ======================================================================
async function postToWP({ title, slug, content, excerpt, catId, keyword }) {
  const body = {
    title,
    slug,
    content,
    excerpt,
    status: 'publish',
    categories: catId ? [catId] : [],
    meta: {
      _seopress_titles_title: `${title} | 補助金ナビ`,
      _seopress_titles_desc:  excerpt,
      _seopress_analysis_target_kw: keyword,
    },
  };

  const res = await fetch(`${WP_URL}/wp-json/wp/v2/posts`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${WP_AUTH}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WP投稿エラー: ${res.status} ${err}`);
  }
  return await res.json();
}

// ======================================================================
// プロンプト生成
// ======================================================================

function buildSubsidyPrompt(s) {
  return `
あなたは補助金・助成金の専門家ライターです。以下の補助金について、SEO最適化された詳細な解説記事を日本語で書いてください。

【補助金名】${s.name}
【上限額】${s.max}
【補助率】${s.rate}
【実施機関】${s.agency}
【対象者】${s.target}

以下の形式でWordPressショートコードを使って記事本文（1200〜1800文字）を書いてください：

[hj_summary text="3〜4文の要約。補助金名・上限額・補助率・対象者・特徴を含める"]

<h2>${s.name}の特徴と活用メリット</h2>
（${s.name}の独自の特徴、他の補助金との違い、活用するメリットを200文字程度で説明）

[hj_point]
箇条書きで5つのポイント（補助額・補助率・対象・期間・申請方法の特徴）
[/hj_point]

<h2>対象となる事業者・経費の詳細</h2>
（対象事業者の要件、補助対象となる経費の具体例を説明）

<h2>申請のポイントと注意事項</h2>

<h3>採択されやすい申請書の書き方</h3>
（具体的なアドバイスを3〜4点）

<h3>よくある失敗と対策</h3>
（よくある失敗パターンと対処法）

[hj_infobox type="warning" title="申請前の重要確認事項"]
（重要な注意事項を箇条書きで）
[/hj_infobox]

<h2>まとめ・活用シーン別おすすめポイント</h2>
（どんな企業・状況に特におすすめか、具体的なシーン別に説明）

[hj_cta url="/subsidies/" text="${s.name}の詳細情報を見る →" color="green"]

記事の最後に以下の形式でメタ情報を出力してください（本文とは別に）：
---META---
DESCRIPTION: （120文字以内のメタディスクリプション）
`.trim();
}

function buildIndustryPrompt(industry) {
  return `
あなたは補助金・助成金の専門家ライターです。${industry}事業者向けの補助金活用ガイド記事を日本語で書いてください。

【対象業種】${industry}
【記事タイプ】業種別補助金活用ガイド（深掘り版）

以下の形式でWordPressショートコードを使って記事本文（1400〜2000文字）を書いてください：

[hj_summary text="3〜4文の要約。${industry}が使える主要補助金名・金額・特徴を含める"]

<h2>${industry}が補助金を活用すべき理由</h2>
（${industry}特有の経営課題と補助金で解決できる点を説明）

<h2>${industry}に特におすすめの補助金TOP3</h2>

<h3>第1位：（補助金名）</h3>
（なぜ${industry}に向いているか、活用シーン、補助額・補助率）

<h3>第2位：（補助金名）</h3>
（なぜ${industry}に向いているか、活用シーン、補助額・補助率）

<h3>第3位：（補助金名）</h3>
（なぜ${industry}に向いているか、活用シーン、補助額・補助率）

[hj_point]
${industry}が補助金を選ぶ際のチェックポイント5選
[/hj_point]

<h2>${industry}の補助金活用事例（イメージ）</h2>
（具体的な活用シナリオを1〜2例、数値を使って説明）

<h2>申請で気をつけること・よくある失敗</h2>

[hj_infobox type="info" title="${industry}の補助金申請 相談窓口"]
（${industry}が相談すべき窓口を具体的に）
[/hj_infobox]

<h2>まとめ</h2>

[hj_cta url="/subsidies/" text="${industry}向け補助金を一覧で見る →" color="green"]

---META---
DESCRIPTION: （120文字以内のメタディスクリプション）
`.trim();
}

function buildPrefPrompt(pref) {
  return `
あなたは補助金・助成金の専門家ライターです。${pref}の中小企業・小規模事業者向け補助金ガイド記事を日本語で書いてください。

【都道府県】${pref}
【記事タイプ】都道府県別補助金活用ガイド（深掘り版）

以下の形式でWordPressショートコードを使って記事本文（1400〜2000文字）を書いてください：

[hj_summary text="3〜4文の要約。${pref}で使える主要補助金・地域特性・相談窓口を含める"]

<h2>${pref}の産業・経済の特徴と補助金活用のポイント</h2>
（${pref}の主要産業・経済規模・地域特性を踏まえた補助金活用のポイントを説明）

<h2>${pref}の事業者が優先すべき国の補助金</h2>

<h3>ものづくり補助金</h3>
（${pref}の産業特性を踏まえた活用シーンを具体的に）

<h3>IT導入補助金</h3>
（${pref}の事業者に特に有効なITツールや活用事例イメージを）

<h3>小規模事業者持続化補助金</h3>
（${pref}の商工会・商工会議所のサポート体制と活用方法）

[hj_point]
${pref}の事業者が補助金を申請する際の重要ポイント5選
[/hj_point]

<h2>${pref}独自の支援制度について</h2>
（${pref}が独自に設けている可能性のある補助制度・助成金の種類を説明。製造業・農業・観光・創業など${pref}の特性に合わせた支援制度を想定して記述）

<h2>${pref}での補助金申請相談窓口</h2>
（${pref}の商工会連合会・よろず支援拠点・産業振興センター等の相談窓口を具体的に）

[hj_infobox type="success" title="${pref}で補助金を申請する最初のステップ"]
（初めて補助金を申請する${pref}の事業者向けの具体的なアクションプランを箇条書きで）
[/hj_infobox]

<h2>まとめ</h2>

[hj_cta url="/subsidies/" text="全国の補助金データベースを検索する →" color="green"]

---META---
DESCRIPTION: （120文字以内のメタディスクリプション）
`.trim();
}

// ======================================================================
// メタ情報をコンテンツから分離
// ======================================================================
function parseContent(raw) {
  const parts = raw.split('---META---');
  const content = parts[0].trim();
  const metaRaw = parts[1] ?? '';
  const descMatch = metaRaw.match(/DESCRIPTION:\s*(.+)/);
  const description = descMatch ? descMatch[1].trim() : '';
  return { content, description };
}

// ======================================================================
// スラッグ生成
// ======================================================================
function toSlug(str) {
  return str
    .replace(/[・]/g, '-')
    .replace(/[　\s]+/g, '-')
    .replace(/[^a-zA-Z0-9\-ぁ-ん一-龯ァ-ン]/g, '')
    .toLowerCase()
    .slice(0, 60);
}

// ======================================================================
// メイン処理
// ======================================================================
async function main() {
  console.log('=== 補助金ナビ AI記事生成スクリプト ===');
  console.log(`TYPE: ${TYPE} / LIMIT: ${LIMIT || '無制限'} / DRY_RUN: ${DRY_RUN}`);
  console.log('');

  // カテゴリーキャッシュ
  const catCache = {};
  async function getCatId(name) {
    if (!catCache[name]) catCache[name] = await getOrCreateCategory(name);
    return catCache[name];
  }

  let tasks = [];

  // --- 補助金「採択事例・よくある質問」系（Gemini生成）---
  if (['all', 'subsidy'].includes(TYPE)) {
    for (const s of SUBSIDIES) {
      tasks.push({
        type: 'subsidy',
        slug: `ai-${s.slug}-guide`,
        title: `${s.name}の採択事例・よくある質問・活用ポイント完全ガイド【${new Date().getFullYear()}年度】`,
        keyword: `${s.name} 採択 活用`,
        category: 'AI補助金解説',
        prompt: buildSubsidyPrompt(s),
      });
    }
  }

  // --- 業種別（Gemini深掘り版）---
  if (['all', 'industry'].includes(TYPE)) {
    for (const ind of INDUSTRIES) {
      tasks.push({
        type: 'industry',
        slug: `ai-gyoshu-${toSlug(ind)}`,
        title: `${ind}の補助金活用完全ガイド【${new Date().getFullYear()}年度版】採択のコツ・おすすめ制度`,
        keyword: `${ind} 補助金 活用`,
        category: 'AI業種別補助金',
        prompt: buildIndustryPrompt(ind),
      });
    }
  }

  // --- 都道府県別（Gemini深掘り版）---
  if (['all', 'pref'].includes(TYPE)) {
    for (const pref of PREFECTURES) {
      tasks.push({
        type: 'pref',
        slug: `ai-pref-${toSlug(pref)}`,
        title: `${pref}の補助金・助成金完全ガイド【${new Date().getFullYear()}年度】地域特性・相談窓口・活用事例`,
        keyword: `${pref} 補助金 中小企業`,
        category: 'AI都道府県別補助金',
        prompt: buildPrefPrompt(pref),
      });
    }
  }

  if (LIMIT > 0) tasks = tasks.slice(0, LIMIT);

  console.log(`生成予定: ${tasks.length} 件\n`);

  let created = 0, skipped = 0, failed = 0;

  for (const task of tasks) {
    // スラッグ重複チェック
    if (await wpSlugExists(task.slug)) {
      console.log(`⏭  スキップ（既存）: ${task.title}`);
      skipped++;
      continue;
    }

    try {
      // Gemini API呼び出し
      console.log(`🤖 Gemini生成中: ${task.title}`);
      const raw = await callGemini(task.prompt);
      const { content, description } = parseContent(raw);

      if (DRY_RUN) {
        console.log(`✅ [DRY RUN] 生成完了: ${task.title}`);
        console.log(`   文字数: ${content.length}`);
        console.log(`   DESC: ${description}`);
        created++;
        continue;
      }

      // WP投稿
      const catId = await getCatId(task.category);
      const post  = await postToWP({
        title:   task.title,
        slug:    task.slug,
        content,
        excerpt: description,
        catId,
        keyword: task.keyword,
      });

      console.log(`✅ 投稿完了: [ID:${post.id}] ${task.title}`);
      console.log(`   URL: ${post.link}`);
      created++;

      // レート制限対策（Gemini API: 15 RPM free tier）
      await new Promise(r => setTimeout(r, 4500));

    } catch (err) {
      console.error(`❌ 失敗: ${task.title}`);
      console.error(`   ${err.message}`);
      failed++;
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log('\n================================');
  console.log(`作成: ${created} 件`);
  console.log(`スキップ（既存）: ${skipped} 件`);
  console.log(`失敗: ${failed} 件`);
  console.log('================================');
}

main().catch(console.error);
