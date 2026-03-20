/**
 * ブログ記事のコンテンツを充実させるスクリプト
 * 使い方: node scripts/enrich-blog-posts.mjs [--dry-run] [--limit=N]
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '../.env');
const env = {};
readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim();
});

const WP_URL  = env.WP_URL  || 'http://localhost:10010';
const WP_USER = env.WP_USER || 'admin';
const WP_PASS = env.WP_APP_PASS || '';
const auth = Buffer.from(`${WP_USER}:${WP_PASS}`).toString('base64');

const args    = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const LIMIT   = parseInt((args.find(a => a.startsWith('--limit=')) || '--limit=9999').split('=')[1]);
const DELAY   = 400;

async function wpGet(endpoint) {
  const r = await fetch(`${WP_URL}/wp-json/wp/v2/${endpoint}`, {
    headers: { Authorization: `Basic ${auth}` }
  });
  return r.json();
}

async function wpPut(endpoint, data) {
  const r = await fetch(`${WP_URL}/wp-json/wp/v2/${endpoint}`, {
    method: 'PUT',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return r.json();
}

// タイトルから記事の種類を判別してリッチコンテンツを生成
function generateRichContent(title, excerpt) {
  const t = title || '';
  const e = excerpt || '';

  // 汎用的な情報をタイトルから抽出
  const isJosei = t.includes('助成金');
  const isHojo = t.includes('補助金');
  const isFushi = t.includes('融資');
  const isKyufu = t.includes('給付金') || t.includes('交付金');
  const typeName = isJosei ? '助成金' : isFushi ? '融資' : isKyufu ? '給付金・交付金' : '補助金';

  // タイトルからキーワードを抽出
  const keywords = t.replace(/とは？.*|の申請.*|で解説.*|補助金|助成金|融資|給付金/g, '').trim();

  return `<!-- wp:html -->
<div class="article-lead">
  <p>${e || keywords + 'に関する' + typeName + 'の概要・申請方法・対象者を詳しく解説します。'}</p>
</div>
<!-- /wp:html -->

<!-- wp:heading {"level":2} -->
<h2>${t.replace(/とは？.*/, '')}とは？</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>${keywords}${typeName}は、${isJosei ? '厚生労働省や都道府県が管轄し、要件を満たした事業者に対して原則として全件支給される' : isHojo ? '国・都道府県・市区町村が実施する公募型の資金支援制度で、採択審査を経て交付される' : isFushi ? '日本政策金融公庫や民間金融機関を通じて低利で融資を受けられる' : '国や地方公共団体が特定の目的のために支給する'}資金支援制度です。中小企業・小規模事業者の経営改善や設備投資、人材育成などを後押しするために設けられています。</p>
<!-- /wp:paragraph -->

<!-- wp:html -->
<div class="info-box info-box--blue mb-6">
  <p class="font-bold mb-2">📌 ${typeName}と補助金の主な違い</p>
  <ul class="text-sm space-y-1 pl-4 list-disc">
    <li>補助金：競争審査あり・年数回の公募・不採択の可能性あり</li>
    <li>助成金：要件を満たせば随時申請可能・原則全件支給</li>
    <li>融資：返済義務あり・低利率・日本公庫等が窓口</li>
    <li>給付金・交付金：特定目的への支援・申請条件が明確</li>
  </ul>
</div>
<!-- /wp:html -->

<!-- wp:heading {"level":2} -->
<h2>対象者・申請要件</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>${keywords}${typeName}の主な対象者は以下のとおりです。ただし制度によって細かい要件が異なるため、必ず公式情報を確認してください。</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul>
  <li>中小企業・小規模事業者（製造業・建設業・サービス業など業種により上限従業員数が異なる）</li>
  <li>個人事業主・フリーランス（一部制度では対象外の場合あり）</li>
  <li>社会福祉法人・NPO法人（特定の助成金で対象）</li>
  <li>農業者・農業法人（農林水産省管轄の制度）</li>
</ul>
<!-- /wp:list -->

<!-- wp:heading {"level":2} -->
<h2>支給額・補助率の目安</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>${keywords}に関連する${typeName}の支給額・補助率は制度によって大きく異なります。一般的な目安を以下に示します。</p>
<!-- /wp:paragraph -->

<!-- wp:html -->
<div class="overflow-x-auto mb-6">
<table class="info-table w-full text-sm">
  <thead>
    <tr>
      <th class="bg-hj-primary text-white px-4 py-2 text-left">項目</th>
      <th class="bg-hj-primary text-white px-4 py-2 text-left">内容</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="border px-4 py-2 font-medium">支給上限額</td><td class="border px-4 py-2">数万円〜数千万円（制度による）</td></tr>
    <tr><td class="border px-4 py-2 font-medium">補助率</td><td class="border px-4 py-2">1/2〜2/3（中小企業は優遇あり）</td></tr>
    <tr><td class="border px-4 py-2 font-medium">申請期間</td><td class="border px-4 py-2">${isJosei ? '随時（年間を通じて申請可能）' : '年1〜3回の公募（要件確認が必要）'}</td></tr>
    <tr><td class="border px-4 py-2 font-medium">審査期間</td><td class="border px-4 py-2">申請後2週間〜3ヶ月程度</td></tr>
  </tbody>
</table>
</div>
<!-- /wp:html -->

<!-- wp:heading {"level":2} -->
<h2>申請の流れ・ステップ</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>${keywords}${typeName}の申請は以下の手順で行います。事前準備が採択率に大きく影響するため、余裕を持ったスケジュールを立てましょう。</p>
<!-- /wp:paragraph -->

<!-- wp:html -->
<ol style="list-style:none;padding:0;margin:0 0 1.5rem;">
  ${[
    ['公募要領・申請ガイドの確認','実施機関の公式サイトから最新の公募要領をダウンロードし、対象要件・申請期限・必要書類を確認します。'],
    ['事業計画書・申請書類の作成','事業の目的・取組内容・期待される効果・資金計画を具体的に記載します。数値目標を入れると評価が高まります。'],
    ['申請書類の提出（電子申請 or 郵送）','多くの制度でjGrants（Jグランツ）などの電子申請システムを使います。アカウント取得に時間がかかるため早めに準備を。'],
    ['審査・採択（交付決定）通知','審査期間は制度により異なります。採択後に交付決定通知が届いてから事業を開始します（前払い不可の場合が多い）。'],
    ['事業実施・実績報告・精算','事業完了後に実績報告書・領収書・証拠写真等を提出します。書類不備があると支給が遅れる場合があります。'],
  ].map(([title,desc],i)=>`
  <li style="display:flex;gap:1rem;align-items:flex-start;padding:1rem;background:#fff;border:1px solid #D1E7D9;border-radius:12px;margin-bottom:0.75rem;">
    <span style="flex-shrink:0;width:32px;height:32px;border-radius:50%;background:#1A6B3C;color:#fff;font-weight:900;display:flex;align-items:center;justify-content:center;font-size:14px;">${i+1}</span>
    <div>
      <p style="font-weight:700;margin:0 0 4px;">${title}</p>
      <p style="font-size:13px;color:#6B7280;margin:0;">${desc}</p>
    </div>
  </li>`).join('')}
</ol>
<!-- /wp:html -->

<!-- wp:heading {"level":2} -->
<h2>採択率を上げる5つのポイント</h2>
<!-- /wp:heading -->

<!-- wp:list -->
<ul>
  <li><strong>数値目標を明記する</strong>：「売上20%増」「CO₂排出量30%削減」など具体的な成果目標を設定する</li>
  <li><strong>政策との整合性を意識する</strong>：DX・カーボンニュートラル・賃上げなど国の重点施策との関連を示す</li>
  <li><strong>過去の実績を活用する</strong>：自社の取組実績・受賞歴・認定取得があれば積極的に記載する</li>
  <li><strong>専門家（認定支援機関）を活用する</strong>：中小企業診断士・税理士・商工会議所のサポートを受ける</li>
  <li><strong>締切直前を避ける</strong>：締切間際は申請者が集中しシステム障害リスクも上がるため、早めの提出が吉</li>
</ul>
<!-- /wp:list -->

<!-- wp:heading {"level":2} -->
<h2>よくある質問（FAQ）</h2>
<!-- /wp:heading -->

<!-- wp:html -->
<div class="faq-list" style="margin-bottom:1.5rem;">
  ${[
    ['申請後いつ頃お金が振り込まれますか？','制度によって異なりますが、採択から実績報告・精算まで含めると最短で3〜6ヶ月、長い場合は1年以上かかることがあります。資金繰りの計画をしっかり立てておきましょう。'],
    ['複数の補助金・助成金を同時に申請できますか？','原則として複数の制度を同時に申請・受給することは可能ですが、同一経費に対して複数の補助金を受け取ることは禁止されています。申請前に要件を確認してください。'],
    ['不採択になった場合、再申請できますか？','多くの補助金は次回の公募で再申請が可能です。不採択の場合は審査コメントを参考に事業計画を改善し、再チャレンジすることをおすすめします。'],
    ['創業前でも申請できますか？','一部の創業支援補助金では創業予定者も対象になります。ただし多くの制度では「現在事業を営んでいる」ことが要件のため、制度ごとに確認が必要です。'],
  ].map(([q,a])=>`
  <details style="border:1px solid #D1E7D9;border-radius:12px;overflow:hidden;margin-bottom:0.5rem;">
    <summary style="padding:1rem 1.25rem;font-weight:700;cursor:pointer;background:#fff;list-style:none;">Q. ${q}</summary>
    <div style="padding:1rem 1.25rem;background:#f9fafb;font-size:14px;color:#6B7280;">${a}</div>
  </details>`).join('')}
</div>
<!-- /wp:html -->

<!-- wp:html -->
<div class="cta-box" style="background:linear-gradient(135deg,#1A6B3C,#155830);color:#fff;border-radius:16px;padding:1.5rem;margin:2rem 0;text-align:center;">
  <p style="font-size:18px;font-weight:900;margin-bottom:0.5rem;">🔍 あなたの事業に合う${typeName}を探す</p>
  <p style="font-size:14px;opacity:0.9;margin-bottom:1rem;">補助金nowでは487件以上の${typeName}・補助金情報を一括検索できます。業種・地域・金額で絞り込んで最適な制度を見つけましょう。</p>
  <a href="/subsidies/" style="display:inline-block;background:#fff;color:#1A6B3C;font-weight:800;padding:0.6rem 1.8rem;border-radius:99px;text-decoration:none;">補助金・助成金を探す →</a>
</div>
<!-- /wp:html -->`;
}

async function fetchAllPosts() {
  let all = [];
  for (let p = 1; p <= 10; p++) {
    const data = await wpGet(`posts?per_page=100&page=${p}&_fields=id,title,excerpt,content,status`);
    if (!Array.isArray(data) || !data.length) break;
    all.push(...data);
  }
  return all;
}

async function main() {
  console.log('ブログ記事を取得中...');
  const posts = await fetchAllPosts();
  console.log(`取得: ${posts.length}件`);

  const limited = posts.slice(0, LIMIT);
  let ok = 0, skip = 0, err = 0;

  for (const post of limited) {
    const title = post.title?.rendered || '';
    const excerpt = post.excerpt?.rendered?.replace(/<[^>]*>/g, '').trim() || '';
    const currentLen = (post.content?.rendered || '').replace(/<[^>]*>/g, '').length;

    // すでに充実している記事はスキップ（2000文字以上）
    if (currentLen >= 1500) {
      console.log(`SKIP (${currentLen}文字): ${title.slice(0, 40)}`);
      skip++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`[DRY-RUN] ${title.slice(0, 50)} (現在${currentLen}文字)`);
      ok++;
      continue;
    }

    const newContent = generateRichContent(title, excerpt);
    const result = await wpPut(`posts/${post.id}`, { content: newContent });

    if (result.id) {
      console.log(`OK [${result.id}]: ${title.slice(0, 50)}`);
      ok++;
    } else {
      console.error(`ERR: ${title.slice(0, 40)}`, JSON.stringify(result).slice(0, 80));
      err++;
    }

    await new Promise(r => setTimeout(r, DELAY));
  }

  console.log(`\n=== 完了 ===`);
  console.log(`更新: ${ok}件 / スキップ: ${skip}件 / エラー: ${err}件`);
}

main().catch(e => { console.error(e); process.exit(1); });
