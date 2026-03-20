/**
 * 補助金ナビ pSEO記事 テンプレート一括生成スクリプト（WP REST API版）
 * 使い方: node scripts/create-pseo-articles.mjs [--type=TYPE] [--limit=N] [--dry-run]
 * TYPE: all | basic | apply | industry | pref | purpose | compare
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = {};
readFileSync(join(__dirname, '../.env'), 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim();
});

const WP_URL  = env.WP_URL  || 'http://localhost:10010';
const WP_USER = env.WP_USER || 'admin';
const WP_PASS = env.WP_APP_PASS || '';
const auth    = Buffer.from(`${WP_USER}:${WP_PASS}`).toString('base64');

const args    = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const LIMIT   = parseInt((args.find(a => a.startsWith('--limit=')) || '--limit=9999').split('=')[1]);
const TYPE    = (args.find(a => a.startsWith('--type=')) || '--type=all').split('=')[1];
const DELAY   = 600;

function toSlug(str) {
  return str.toLowerCase().replace(/[^\w\s-]/g,'').replace(/[\s_]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
}

// ==============================
// カテゴリ定義
// ==============================
const CATS = {
  '補助金解説':  null,
  '申請ガイド':  null,
  '補助金比較':  null,
  '補助金まとめ':null,
  '業種別補助金':null,
  '都道府県別補助金':null,
  '目的別補助金':null,
  '助成金ガイド':null,
  '給付金情報':  null,
  '融資・ローン':null,
  '税制優遇':    null,
};

// ==============================
// 都道府県
// ==============================
const PREFS = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
];
const PREF_SLUGS = {
  '北海道':'hokkaido','青森県':'aomori','岩手県':'iwate','宮城県':'miyagi','秋田県':'akita',
  '山形県':'yamagata','福島県':'fukushima','茨城県':'ibaraki','栃木県':'tochigi','群馬県':'gunma',
  '埼玉県':'saitama','千葉県':'chiba','東京都':'tokyo','神奈川県':'kanagawa','新潟県':'niigata',
  '富山県':'toyama','石川県':'ishikawa','福井県':'fukui','山梨県':'yamanashi','長野県':'nagano',
  '岐阜県':'gifu','静岡県':'shizuoka','愛知県':'aichi','三重県':'mie','滋賀県':'shiga',
  '京都府':'kyoto','大阪府':'osaka','兵庫県':'hyogo','奈良県':'nara','和歌山県':'wakayama',
  '鳥取県':'tottori','島根県':'shimane','岡山県':'okayama','広島県':'hiroshima','山口県':'yamaguchi',
  '徳島県':'tokushima','香川県':'kagawa','愛媛県':'ehime','高知県':'kochi','福岡県':'fukuoka',
  '佐賀県':'saga','長崎県':'nagasaki','熊本県':'kumamoto','大分県':'oita','宮崎県':'miyazaki',
  '鹿児島県':'kagoshima','沖縄県':'okinawa',
};

const PREF_REGIONS = {
  '北海道':'北海道','青森県':'東北','岩手県':'東北','宮城県':'東北','秋田県':'東北','山形県':'東北','福島県':'東北',
  '茨城県':'関東','栃木県':'関東','群馬県':'関東','埼玉県':'関東','千葉県':'関東','東京都':'関東','神奈川県':'関東',
  '新潟県':'中部','富山県':'中部','石川県':'中部','福井県':'中部','山梨県':'中部','長野県':'中部',
  '岐阜県':'中部','静岡県':'中部','愛知県':'中部','三重県':'中部',
  '滋賀県':'近畿','京都府':'近畿','大阪府':'近畿','兵庫県':'近畿','奈良県':'近畿','和歌山県':'近畿',
  '鳥取県':'中国','島根県':'中国','岡山県':'中国','広島県':'中国','山口県':'中国',
  '徳島県':'四国','香川県':'四国','愛媛県':'四国','高知県':'四国',
  '福岡県':'九州','佐賀県':'九州','長崎県':'九州','熊本県':'九州','大分県':'九州','宮崎県':'九州','鹿児島県':'九州','沖縄県':'九州',
};

// ==============================
// 業種
// ==============================
const INDUSTRIES = [
  { name:'製造業', en:'manufacturing', hint:'ものづくり・工場・自動化' },
  { name:'IT・情報通信業', en:'it', hint:'DX・AI・SaaS・Web' },
  { name:'小売業', en:'retail', hint:'EC・実店舗・商店街' },
  { name:'飲食業', en:'restaurant', hint:'飲食店・カフェ・テイクアウト' },
  { name:'建設業', en:'construction', hint:'建築・土木・リフォーム' },
  { name:'農業', en:'agriculture', hint:'農業・農産品・6次産業化' },
  { name:'医療・介護', en:'medical', hint:'病院・クリニック・介護施設' },
  { name:'観光・宿泊業', en:'tourism', hint:'ホテル・旅館・観光地' },
  { name:'運輸業', en:'transport', hint:'運送・物流・ドライバー' },
  { name:'教育・研修業', en:'education', hint:'学習塾・研修機関・eラーニング' },
  { name:'サービス業', en:'service', hint:'美容・クリーニング・整体' },
  { name:'不動産業', en:'realestate', hint:'賃貸・売買・管理' },
  { name:'金融業', en:'finance', hint:'信金・信組・ファクタリング' },
  { name:'卸売業', en:'wholesale', hint:'問屋・卸・EDI' },
  { name:'林業・水産業', en:'forestry', hint:'漁業・林業・木材' },
];

// ==============================
// 目的
// ==============================
const PURPOSES = [
  { name:'設備投資', en:'investment', hint:'機械・設備・工場' },
  { name:'IT導入', en:'it-intro', hint:'システム・ソフトウェア・DX' },
  { name:'販路拡大', en:'sales', hint:'EC・展示会・広告' },
  { name:'研究開発', en:'rd', hint:'R&D・試験・特許' },
  { name:'人材育成', en:'hr', hint:'研修・資格・OJT' },
  { name:'省エネ・環境対策', en:'eco', hint:'太陽光・省エネ設備・GX' },
  { name:'事業承継', en:'succession', hint:'M&A・後継者・第三者承継' },
  { name:'起業・創業', en:'startup', hint:'開業・スタートアップ・新規事業' },
  { name:'海外展開', en:'global', hint:'輸出・海外拠点・越境EC' },
  { name:'雇用創出', en:'employment', hint:'採用・正社員化・UIJターン' },
  { name:'デジタル化', en:'digital', hint:'ペーパーレス・クラウド・RPA' },
  { name:'ブランディング', en:'brand', hint:'PR・ロゴ・ウェブサイト' },
  { name:'新商品開発', en:'product', hint:'試作品・新製品・農商工連携' },
  { name:'生産性向上', en:'productivity', hint:'省力化・自動化・業務改善' },
];

// ==============================
// 主要補助金リスト（記事テーマ用）
// ==============================
const TOP_SUBSIDIES = [
  { name:'ものづくり補助金', slug:'monodukuri', max:'1,250万円', rate:'1/2〜2/3', type:'補助金' },
  { name:'IT導入補助金', slug:'it-donyu', max:'350万円', rate:'1/2〜3/4', type:'補助金' },
  { name:'小規模事業者持続化補助金', slug:'jizokuka', max:'200万円', rate:'2/3', type:'補助金' },
  { name:'省エネ補助金', slug:'shoenergy', max:'1億5,000万円', rate:'1/3〜1/2', type:'補助金' },
  { name:'事業再構築補助金', slug:'saikouchi', max:'7,000万円', rate:'1/2〜2/3', type:'補助金' },
  { name:'キャリアアップ助成金', slug:'career-up', max:'57万円', rate:'定額', type:'助成金' },
  { name:'人材開発支援助成金', slug:'jinzai-kaihatsu', max:'45万円', rate:'45〜60%', type:'助成金' },
  { name:'業務改善助成金', slug:'gyomu-kaizen', max:'600万円', rate:'4/5', type:'助成金' },
  { name:'雇用調整助成金', slug:'koyo-chosei', max:'100万円', rate:'4/5〜10/10', type:'助成金' },
  { name:'事業承継補助金', slug:'shokei-hojo', max:'600万円', rate:'2/3', type:'補助金' },
];

// ==============================
// 記事テンプレート関数
// ==============================

function articleBasic(subsidy) {
  const { name, max, rate, type } = subsidy;
  return {
    title: `${name}とは？わかりやすく解説【${new Date().getFullYear()}年版】`,
    slug: `${subsidy.slug}-to-wa`,
    category: '補助金解説',
    desc: `${name}の概要・対象者・補助額（最大${max}）・申請方法をわかりやすく解説。${type}の基礎知識から活用法まで初心者にも安心。`,
    content: `<!-- wp:shortcode -->[hj_summary title="${name}とは"]${name}は、中小企業・小規模事業者の事業活動を支援するための${type}制度です。補助率${rate}、最大${max}の支援を受けることができます。[/hj_summary]<!-- /wp:shortcode -->

<!-- wp:heading -->
<h2>${name}の基本情報</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>${name}は、日本の中小企業・小規模事業者を対象とした代表的な${type}制度です。生産性向上や新たな事業展開を支援することを目的としており、毎年多くの事業者が活用しています。</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->[hj_point title="${name}のポイント"]• 補助率: ${rate}
• 補助上限額: ${max}
• 対象: 中小企業・小規模事業者
• 申請: 公募期間中に応募[/hj_point]<!-- /wp:shortcode -->

<!-- wp:heading -->
<h2>対象となる事業者</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>${name}は主に以下の事業者が申請できます。</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul>
<li>中小企業（資本金・従業員数の基準を満たす法人）</li>
<li>小規模事業者（従業員20名以下、商業・サービス業は5名以下）</li>
<li>個人事業主・フリーランス（要件を満たす場合）</li>
</ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2>補助対象となる経費</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>${name}の対象経費は、事業の種類によって異なりますが、一般的に以下が含まれます。</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul>
<li>機械装置・システム構築費</li>
<li>外注費・専門家経費</li>
<li>広告宣伝・販売促進費</li>
<li>研修・人材育成費用</li>
</ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2>申請の流れ</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>${name}の申請は、公募期間中に所定の申請書類を提出することで行います。採択後に事業を実施し、完了報告を行うことで補助金が交付されます。</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->[hj_infobox title="申請前の準備" type="info"]申請には事業計画書の作成が必要です。採択率を上げるために、事業の革新性・市場性・実現可能性を具体的に記載しましょう。専門家（中小企業診断士等）への相談も有効です。[/hj_infobox]<!-- /wp:shortcode -->

<!-- wp:shortcode -->[hj_cta title="${name}の申請を検討中の方へ" text="補助金ナビでは${name}に関する最新情報をお届けしています。まずは補助金一覧から対象となる制度を探してみましょう。" link="/subsidies/" button="補助金一覧を見る"][/hj_cta]<!-- /wp:shortcode -->`,
  };
}

function articleApply(subsidy) {
  const { name, max, rate } = subsidy;
  return {
    title: `${name}の申請方法・手順を徹底解説【採択率アップのコツ付き】`,
    slug: `${subsidy.slug}-shinsei-houhou`,
    category: '申請ガイド',
    desc: `${name}の申請方法を手順ごとにわかりやすく解説。必要書類・審査ポイント・採択率を上げるコツも紹介。最大${max}・補助率${rate}。`,
    content: `<!-- wp:shortcode -->[hj_summary title="${name}申請完全ガイド"]${name}の申請から採択・交付まで、全ステップをわかりやすく解説します。[/hj_summary]<!-- /wp:shortcode -->

<!-- wp:heading -->
<h2>申請から採択・交付までの流れ</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>${name}の申請には、以下のステップが必要です。事前準備を十分に行うことが採択率アップの鍵です。</p>
<!-- /wp:paragraph -->

<!-- wp:list {"ordered":true} -->
<ol>
<li><strong>公募要領の確認</strong>：最新の公募要領をダウンロードし、対象要件・スケジュールを確認</li>
<li><strong>事業計画書の作成</strong>：審査員に伝わる事業計画書を作成（最重要）</li>
<li><strong>必要書類の準備</strong>：決算書・法人登記簿・確定申告書等を収集</li>
<li><strong>電子申請（Jグランツ等）</strong>：専用システムから申請書類を提出</li>
<li><strong>審査・採択結果の通知</strong>：通常申請から2〜3ヶ月で結果通知</li>
<li><strong>交付申請・事業実施</strong>：採択後に交付申請を行い補助事業を実施</li>
<li><strong>実績報告・補助金交付</strong>：事業完了後に報告書を提出し補助金を受領</li>
</ol>
<!-- /wp:list -->

<!-- wp:heading -->
<h2>必要書類一覧</h2>
<!-- /wp:heading -->

<!-- wp:shortcode -->[hj_infobox title="一般的な必要書類" type="check"]• 事業計画書（様式指定あり）
• 決算書（直近2期分）
• 履歴事項全部証明書（法人）または住民票（個人）
• 確定申告書（小規模事業者等）
• 見積書（補助対象設備等）
• 従業員数を示す書類[/hj_infobox]<!-- /wp:shortcode -->

<!-- wp:heading -->
<h2>採択率を上げるポイント</h2>
<!-- /wp:heading -->

<!-- wp:shortcode -->[hj_point title="採択されやすい事業計画書の書き方"]• 革新性：新しい取り組みであることを明確に説明する
• 具体性：数値目標（売上〇〇%増・コスト〇〇%削減等）を記載
• 実現可能性：実施体制・スケジュールを詳細に示す
• 地域・社会への貢献：雇用創出・地域経済への影響を記載[/hj_point]<!-- /wp:shortcode -->

<!-- wp:heading -->
<h2>よくある質問</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><strong>Q. 採択後いつ補助金を受け取れますか？</strong><br>
A. 補助事業完了後の実績報告審査を経て、通常3〜6ヶ月で振込されます。</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><strong>Q. 不採択になった場合は？</strong><br>
A. 次回公募への再申請が可能です。不採択理由を分析して改善することが重要です。</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->[hj_cta title="${name}の申請サポートを探しませんか？" text="中小企業診断士・行政書士等の専門家に相談することで採択率が大幅にアップします。" link="/subsidies/" button="補助金一覧を見る"][/hj_cta]<!-- /wp:shortcode -->`,
  };
}

function articleIndustry(ind) {
  const { name, hint } = ind;
  return {
    title: `${name}向け補助金・助成金まとめ【${new Date().getFullYear()}年最新】`,
    slug: `${ind.en}-hojo-joseikin`,
    category: '業種別補助金',
    desc: `${name}（${hint}）が使える補助金・助成金を厳選。ものづくり補助金・IT導入補助金・省エネ補助金など業種に特化した支援制度を解説。`,
    content: `<!-- wp:shortcode -->[hj_summary title="${name}が使える補助金まとめ"]${name}向けの補助金・助成金・給付金を業種の特徴（${hint}）に合わせて詳しく解説します。[/hj_summary]<!-- /wp:shortcode -->

<!-- wp:heading -->
<h2>${name}が活用できる主な補助金一覧</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>${name}事業者が申請できる補助金・助成金には、国の制度から都道府県・市区町村の独自制度まで多岐にわたります。以下に主要な補助金をまとめました。</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->[hj_point title="${name}向けおすすめ補助金TOP3"]1. ものづくり・商業・サービス生産性向上促進補助金（最大1,250万円）
2. IT導入補助金（最大350万円）
3. 小規模事業者持続化補助金（最大200万円）[/hj_point]<!-- /wp:shortcode -->

<!-- wp:heading -->
<h2>${name}特有の課題と補助金の活用法</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>${name}では${hint}に関連する投資・改善活動に補助金を活用できます。設備投資・IT化・人材育成など、経営課題に合わせた補助金選びが重要です。</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>補助金申請のポイント（${name}向け）</h2>
<!-- /wp:heading -->

<!-- wp:list -->
<ul>
<li>業界団体への加入で情報収集を効率化</li>
<li>商工会議所・商工会のサポートを積極的に活用</li>
<li>補助金の「締切」を見逃さないようにメールマガジン等で情報収集</li>
<li>複数の補助金を組み合わせて最大限活用する</li>
</ul>
<!-- /wp:list -->

<!-- wp:shortcode -->[hj_related_subsidies industry="${name}"][/hj_related_subsidies]<!-- /wp:shortcode -->

<!-- wp:shortcode -->[hj_cta title="${name}向け補助金を探す" text="補助金ナビでは${name}が使える補助金を一覧で確認できます。" link="/subsidies/" button="補助金を検索する"][/hj_cta]<!-- /wp:shortcode -->`,
  };
}

function articlePref(pref) {
  const prefEn = PREF_SLUGS[pref] || toSlug(pref);
  const region = PREF_REGIONS[pref] || '全国';
  return {
    title: `${pref}の補助金・助成金まとめ【${new Date().getFullYear()}年最新版】`,
    slug: `${prefEn}-hojo-joseikin`,
    category: '都道府県別補助金',
    desc: `${pref}で使える補助金・助成金を最新情報でまとめ。国・県・市区町村の補助金を一覧で比較。${region}地方の中小企業・小規模事業者向け。`,
    content: `<!-- wp:shortcode -->[hj_summary title="${pref}の補助金・助成金完全ガイド"]${pref}で申請できる補助金・助成金・給付金を、国の制度から${pref}独自の支援制度まで詳しく解説します。[/hj_summary]<!-- /wp:shortcode -->

<!-- wp:heading -->
<h2>${pref}で使える主な補助金</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>${pref}の中小企業・小規模事業者が活用できる補助金は、国（経済産業省・厚生労働省等）の制度と${pref}独自の支援制度があります。</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->[hj_point title="${pref}でよく活用される補助金TOP5"]1. ものづくり補助金（全国・最大1,250万円）
2. IT導入補助金（全国・最大350万円）
3. 小規模事業者持続化補助金（全国・最大200万円）
4. ${pref}中小企業設備投資補助金（県独自・最大500万円）
5. ${pref}小規模事業者販路開拓補助金（県独自・最大100万円）[/hj_point]<!-- /wp:shortcode -->

<!-- wp:heading -->
<h2>${pref}独自の支援制度</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>${pref}では、国の補助金に加えて、${pref}独自の補助金・助成金制度があります。県の商工労働部・産業振興部等が実施する制度を積極的に活用しましょう。</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->[hj_infobox title="${pref}の補助金情報収集先" type="info"]• ${pref}中小企業支援センター
• ${pref}商工会議所連合会
• ${pref}商工会連合会
• 各市区町村の産業振興担当窓口[/hj_infobox]<!-- /wp:shortcode -->

<!-- wp:heading -->
<h2>${region}地方の中小企業支援の特徴</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>${region}地方では、地域の産業特性を活かした独自の補助金制度が充実しています。農業・観光・製造業など地域の基幹産業を支援する制度も多数あります。</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->[hj_cta title="${pref}の補助金を詳しく見る" text="${pref}で申請できる補助金・助成金の一覧はこちらから確認できます。" link="/subsidies/?region=${pref}" button="${pref}の補助金一覧"][/hj_cta]<!-- /wp:shortcode -->`,
  };
}

function articlePurpose(purpose) {
  const { name, hint } = purpose;
  return {
    title: `${name}のための補助金・助成金まとめ【最大活用ガイド】`,
    slug: `${purpose.en}-hojo`,
    category: '目的別補助金',
    desc: `${name}（${hint}）に使える補助金・助成金を徹底解説。補助率・上限額・申請方法・採択のコツまで、${name}目的の資金調達を完全サポート。`,
    content: `<!-- wp:shortcode -->[hj_summary title="${name}に使える補助金ガイド"]${name}の目的で申請できる補助金・助成金をわかりやすくまとめました。（${hint}等が対象）[/hj_summary]<!-- /wp:shortcode -->

<!-- wp:heading -->
<h2>${name}で使える主な補助金・助成金</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>${name}を目的とした投資・経費に対して活用できる補助金・助成金は複数あります。事業規模や業種に応じて最適な制度を選びましょう。</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->[hj_point title="${name}向けおすすめ補助金"]• ものづくり補助金：${name}関連の設備投資に最適（最大1,250万円）
• IT導入補助金：IT・デジタル化による${name}に（最大350万円）
• 小規模事業者持続化補助金：小規模な${name}投資に（最大200万円）[/hj_point]<!-- /wp:shortcode -->

<!-- wp:heading -->
<h2>${name}に補助金を活用するメリット</h2>
<!-- /wp:heading -->

<!-- wp:list -->
<ul>
<li>投資コストを補助金で削減（補助率1/2〜2/3が一般的）</li>
<li>資金調達の負担を軽減しキャッシュフローを改善</li>
<li>補助金申請を通じて事業計画が明確になる</li>
<li>採択されることで事業の信頼性・認知度が向上</li>
</ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2>${name}補助金の選び方</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>${name}を目的とした補助金を選ぶ際は、以下の点を確認しましょう。</p>
<!-- /wp:paragraph -->

<!-- wp:list {"ordered":true} -->
<ol>
<li>自社が対象事業者要件を満たしているか</li>
<li>補助対象経費に${name}関連コストが含まれるか</li>
<li>公募スケジュールと自社の投資計画が合致するか</li>
<li>補助率・上限額が投資規模に見合っているか</li>
</ol>
<!-- /wp:list -->

<!-- wp:shortcode -->[hj_cta title="${name}向け補助金を今すぐ検索" text="補助金ナビの検索機能で${name}目的の補助金を簡単に見つけられます。" link="/subsidies/" button="補助金を探す"][/hj_cta]<!-- /wp:shortcode -->`,
  };
}

function articleCompare(pair) {
  const [a, b] = pair;
  return {
    title: `${a.name}と${b.name}の違い・比較【どちらを選ぶべき？】`,
    slug: `${a.slug}-vs-${b.slug}`,
    category: '補助金比較',
    desc: `${a.name}（最大${a.max}）と${b.name}（最大${b.max}）の違いを徹底比較。補助率・対象者・申請タイミングを解説。あなたにはどちらが向いている？`,
    content: `<!-- wp:shortcode -->[hj_summary title="${a.name}vs${b.name}比較ガイド"]2つの補助金の違いを、補助率・上限額・対象者・申請のしやすさで比較します。[/hj_summary]<!-- /wp:shortcode -->

<!-- wp:heading -->
<h2>基本情報の比較</h2>
<!-- /wp:heading -->

<!-- wp:shortcode -->[hj_pros_cons title="${a.name}のメリット・デメリット" pros="補助上限${a.max}と大型支援が可能|採択されれば高額投資が低コストで実現|事業計画書作成で経営の方向性が明確化" cons="採択率は20〜40%程度と競争が激しい|申請書類の準備が多く手間がかかる|補助金交付まで6ヶ月〜1年かかる場合も"][/hj_pros_cons]<!-- /wp:shortcode -->

<!-- wp:shortcode -->[hj_pros_cons title="${b.name}のメリット・デメリット" pros="補助上限${b.max}・申請が比較的シンプル|補助率${b.rate}と高い支援率|幅広い事業者が申請できる" cons="支援上限額が限られるケースも|公募期間が年に数回しかない|採択後の実績報告義務がある"][/hj_pros_cons]<!-- /wp:shortcode -->

<!-- wp:heading -->
<h2>どちらを選ぶべき？</h2>
<!-- /wp:heading -->

<!-- wp:shortcode -->[hj_infobox title="${a.name}が向いている事業者" type="success"]大規模な設備投資・革新的な事業展開を計画している中小企業。事業計画書の作成に自信があるか、専門家サポートを受けられる事業者。[/hj_infobox]<!-- /wp:shortcode -->

<!-- wp:shortcode -->[hj_infobox title="${b.name}が向いている事業者" type="info"]比較的小規模な投資や、販路開拓・IT化を検討している小規模事業者。はじめて補助金申請にチャレンジする事業者にもおすすめです。[/hj_infobox]<!-- /wp:shortcode -->

<!-- wp:shortcode -->[hj_cta title="どちらの補助金も詳しく知りたい方へ" text="補助金ナビでは両補助金の最新情報・申請サポート情報を掲載しています。" link="/subsidies/" button="補助金一覧を見る"][/hj_cta]<!-- /wp:shortcode -->`,
  };
}

function articleJoseikin(joseikin) {
  return {
    title: `${joseikin.name}とは？申請方法・対象者・金額を解説`,
    slug: `${joseikin.en}-joseikin-guide`,
    category: '助成金ガイド',
    desc: `${joseikin.name}の申請方法・対象者・支給額を詳しく解説。${joseikin.hint}に取り組む事業主向けの助成金情報。随時申請可能。`,
    content: `<!-- wp:shortcode -->[hj_summary title="${joseikin.name}ガイド"]${joseikin.name}は、${joseikin.hint}に取り組む事業主に支給される助成金です。補助金と違い随時申請できます。[/hj_summary]<!-- /wp:shortcode -->

<!-- wp:heading -->
<h2>${joseikin.name}の概要</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>助成金は補助金と異なり、要件を満たす全ての事業者が申請でき、原則として不採択がありません。${joseikin.name}は厚生労働省が管轄する雇用関連の助成金の一つです。</p>
<!-- /wp:paragraph -->

<!-- wp:shortcode -->[hj_point title="${joseikin.name}のポイント"]• 申請: 随時受付（補助金のような公募期間なし）
• 申請先: ハローワーク・各都道府県労働局
• 要件を満たせば原則支給される
• ${joseikin.hint}[/hj_point]<!-- /wp:shortcode -->

<!-- wp:heading -->
<h2>申請の流れ</h2>
<!-- /wp:heading -->

<!-- wp:list {"ordered":true} -->
<ol>
<li>計画届の作成・提出（事前届け出が必要な場合）</li>
<li>要件に該当する取り組みの実施</li>
<li>支給申請書類の提出</li>
<li>審査・支給決定</li>
<li>助成金の振込</li>
</ol>
<!-- /wp:list -->

<!-- wp:shortcode -->[hj_infobox title="助成金と補助金の違い" type="info"]補助金は競争審査あり・年数回の公募。助成金は要件を満たせば随時申請可能で原則全件支給。どちらも資金調達に有効ですが、性質が異なります。[/hj_infobox]<!-- /wp:shortcode -->

<!-- wp:shortcode -->[hj_cta title="助成金・補助金をまとめて探す" text="補助金ナビでは助成金・補助金・給付金を一括検索できます。" link="/subsidies/" button="補助金・助成金を検索"][/hj_cta]<!-- /wp:shortcode -->`,
  };
}

// 助成金テーマ
const JOSEIKIN_TOPICS = [
  { name:'育児休業助成金', en:'ikukyu', hint:'育児休業・職場復帰支援' },
  { name:'介護離職防止助成金', en:'kaigo-rikon', hint:'介護・仕事両立支援' },
  { name:'障害者雇用助成金', en:'shougaisha-koyou', hint:'障害者雇用・職場定着' },
  { name:'高齢者雇用助成金', en:'kounenrei-koyou', hint:'60歳以上・継続雇用' },
  { name:'外国人雇用助成金', en:'gaikokujin-koyou', hint:'外国人労働者・特定技能' },
  { name:'テレワーク導入助成金', en:'telework', hint:'在宅勤務・リモートワーク' },
  { name:'女性活躍推進助成金', en:'josei-katsuryaku', hint:'女性管理職・育児支援' },
  { name:'正社員化助成金', en:'seishain-ka', hint:'非正規→正規転換' },
  { name:'人材育成・研修助成金', en:'kenshu', hint:'OFF-JT・OJT・資格取得' },
  { name:'省エネ設備導入助成金', en:'shoenergy-joseikin', hint:'エアコン・照明・ボイラー' },
];

// ==============================
// 記事データ生成
// ==============================
const articles = [];

if (TYPE === 'all' || TYPE === 'basic') {
  for (const s of TOP_SUBSIDIES) {
    articles.push({ ...articleBasic(s), kw: `${s.name} とは` });
  }
}

if (TYPE === 'all' || TYPE === 'apply') {
  for (const s of TOP_SUBSIDIES) {
    articles.push({ ...articleApply(s), kw: `${s.name} 申請方法` });
  }
}

if (TYPE === 'all' || TYPE === 'industry') {
  for (const ind of INDUSTRIES) {
    articles.push({ ...articleIndustry(ind), kw: `${ind.name} 補助金` });
  }
}

if (TYPE === 'all' || TYPE === 'pref') {
  for (const pref of PREFS) {
    articles.push({ ...articlePref(pref), kw: `${pref} 補助金` });
  }
}

if (TYPE === 'all' || TYPE === 'purpose') {
  for (const p of PURPOSES) {
    articles.push({ ...articlePurpose(p), kw: `${p.name} 補助金` });
  }
}

if (TYPE === 'all' || TYPE === 'compare') {
  const pairs = [
    [TOP_SUBSIDIES[0], TOP_SUBSIDIES[1]],
    [TOP_SUBSIDIES[0], TOP_SUBSIDIES[2]],
    [TOP_SUBSIDIES[1], TOP_SUBSIDIES[2]],
    [TOP_SUBSIDIES[3], TOP_SUBSIDIES[4]],
    [TOP_SUBSIDIES[5], TOP_SUBSIDIES[6]],
    [TOP_SUBSIDIES[7], TOP_SUBSIDIES[8]],
  ];
  for (const pair of pairs) {
    articles.push({ ...articleCompare(pair), kw: `${pair[0].name} ${pair[1].name} 比較` });
  }
}

if (TYPE === 'all' || TYPE === 'joseikin') {
  for (const j of JOSEIKIN_TOPICS) {
    articles.push({ ...articleJoseikin(j), kw: `${j.name} 申請方法` });
  }
}

console.log(`生成対象: ${articles.length} 件 (type=${TYPE})`);

// ==============================
// REST API ヘルパー
// ==============================
async function wpGet(path) {
  const res = await fetch(`${WP_URL}/wp-json/wp/v2/${path}`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return {}; }
}

async function wpPost(path, body) {
  const res = await fetch(`${WP_URL}/wp-json/wp/v2/${path}`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { _error: text.slice(0, 100) }; }
}

async function slugExists(slug) {
  const data = await wpGet(`posts?slug=${encodeURIComponent(slug)}&status=any`);
  return Array.isArray(data) && data.length > 0;
}

const catCache = {};
async function getOrCreateCat(name) {
  if (catCache[name]) return catCache[name];
  const list = await wpGet(`categories?search=${encodeURIComponent(name)}&per_page=20`);
  if (Array.isArray(list)) {
    const found = list.find(c => c.name === name);
    if (found) { catCache[name] = found.id; return found.id; }
  }
  const created = await wpPost('categories', { name, slug: toSlug(name) });
  if (created.id) { catCache[name] = created.id; return created.id; }
  return null;
}

// ==============================
// メイン
// ==============================
async function main() {
  const limited = articles.slice(0, LIMIT);
  let ok = 0, skip = 0, err = 0;

  for (const article of limited) {
    if (await slugExists(article.slug)) {
      console.log(`SKIP: ${article.title}`);
      skip++; continue;
    }

    if (DRY_RUN) {
      console.log(`[DRY-RUN] [${article.category}] ${article.title}`);
      ok++; continue;
    }

    const catId = await getOrCreateCat(article.category);

    const payload = {
      title:      article.title,
      slug:       article.slug,
      status:     'publish',
      excerpt:    article.desc,
      content:    article.content,
      categories: catId ? [catId] : [],
      meta: {
        _seopress_titles_title: article.title,
        _seopress_titles_desc:  article.desc,
        _seopress_analysis_target_kw: article.kw || '',
      },
    };

    const result = await wpPost('posts', payload);
    if (result.id) {
      console.log(`OK [${result.id}] [${article.category}] ${article.title}`);
      ok++;
    } else {
      console.error(`ERR: ${article.title}`, result.message || JSON.stringify(result).slice(0,100));
      err++;
    }

    await new Promise(r => setTimeout(r, DELAY));
  }

  console.log(`\n=== 完了 ===`);
  console.log(`登録: ${ok}件 / スキップ: ${skip}件 / エラー: ${err}件`);
  console.log(`対象: ${limited.length}件`);
}

main().catch(e => { console.error(e); process.exit(1); });
