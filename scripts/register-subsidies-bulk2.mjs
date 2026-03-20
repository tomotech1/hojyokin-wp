/**
 * 補助金CPT 追加300件 一括登録スクリプト（bulk2 - 2025〜2026年度版）
 * 使い方: node scripts/register-subsidies-bulk2.mjs [--dry-run] [--limit=N]
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

const args    = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const LIMIT   = parseInt((args.find(a => a.startsWith('--limit=')) || '--limit=9999').split('=')[1]);
const DELAY   = 250;

const auth = Buffer.from(`${WP_USER}:${WP_PASS}`).toString('base64');

function toSlug(str) {
  return str.toLowerCase().replace(/[^\w\s-]/g,'').replace(/[\s_]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
}

const STATUSES = ['公募中','公募中','公募中','受付中','受付中','予定','終了'];
const randStatus = () => STATUSES[Math.floor(Math.random() * STATUSES.length)];
const DEADLINES = ['2025-06-30','2025-09-30','2025-12-31','2026-03-31','2026-06-30','随時'];
const randDeadline = () => DEADLINES[Math.floor(Math.random() * DEADLINES.length)];

const allSubsidies = [];

// ============================================================
// BLOCK A: 2025〜2026年度新規全国補助金（25件）
// ============================================================
const NATIONAL2 = [
  { title:'中小企業省力化投資補助金（カタログ型）', slug:'shoryokuka-catalog-hojo',
    amount_max:1500, amount_rate:'1/2〜2/3', deadline:'2025-09-30', status:'公募中',
    agency:'中小企業庁', target:'中小企業・小規模事業者', region:'全国',
    subsidy_type:'補助金', industries:['製造業','小売業','飲食業'], purposes:['生産性向上','設備投資'],
    excerpt:'人手不足解消に向けたロボット・AI・IoT等を活用した省力化製品の導入を支援する新型補助金。カタログから選ぶだけで簡単申請。' },
  { title:'中堅・中小企業の賃上げに向けた省人化・省力化促進補助金', slug:'chinageke-shoryokuka-hojo',
    amount_max:1500, amount_rate:'1/2', deadline:'2025-06-30', status:'公募中',
    agency:'経済産業省', target:'中小企業・中堅企業', region:'全国',
    subsidy_type:'補助金', industries:['製造業','サービス業'], purposes:['生産性向上','人材育成'],
    excerpt:'賃上げを実現するための省力化投資を支援。AI・ロボット・システム導入等の設備投資費用を補助します。' },
  { title:'インボイス対応 IT導入補助金（デジタル化基盤導入枠）', slug:'invoice-it-donyu-hojo',
    amount_max:350, amount_rate:'3/4', deadline:'2025-12-31', status:'公募中',
    agency:'一般社団法人サービスデザイン推進協議会', target:'小規模事業者', region:'全国',
    subsidy_type:'補助金', industries:['小売業','卸売業','サービス業'], purposes:['デジタル化','IT導入'],
    excerpt:'インボイス制度対応のための会計・受発注・決済ソフト導入費用を最大3/4補助。小規模事業者向け特例あり。' },
  { title:'事業成長加速化補助金（J-Startup支援）', slug:'jigyou-seichou-kasokuka-hojo',
    amount_max:5000, amount_rate:'1/2', deadline:'2025-09-30', status:'公募中',
    agency:'経済産業省・NEDO', target:'スタートアップ・ベンチャー', region:'全国',
    subsidy_type:'補助金', industries:['IT・情報通信業','製造業'], purposes:['起業・創業','研究開発'],
    excerpt:'成長が見込まれるスタートアップ・ベンチャー企業の事業拡大・海外展開・R&D投資を大規模支援する補助金。' },
  { title:'地域中核企業育成・連携促進補助金', slug:'chiiki-chukaku-kigyou-hojo',
    amount_max:3000, amount_rate:'1/2', deadline:'2025-06-30', status:'公募中',
    agency:'中小企業庁', target:'地域中核企業・中堅企業', region:'全国',
    subsidy_type:'補助金', industries:['製造業','農業'], purposes:['新商品開発','販路拡大'],
    excerpt:'地域経済をけん引する中核企業の育成と企業間連携を促進するための補助金。地域企業との共同事業も対象。' },
  { title:'医療・介護DX推進補助金', slug:'iryo-kaigo-dx-hojo',
    amount_max:2000, amount_rate:'1/2', deadline:'2025-09-30', status:'公募中',
    agency:'厚生労働省', target:'医療機関・介護施設', region:'全国',
    subsidy_type:'補助金', industries:['医療・介護'], purposes:['デジタル化','IT導入'],
    excerpt:'医療・介護現場のDX推進のため、電子カルテ・介護記録ソフト・遠隔診療システム等の導入費用を補助。' },
  { title:'サイバーセキュリティ対策促進補助金', slug:'cyber-security-taisaku-hojo',
    amount_max:100, amount_rate:'1/2', deadline:'2025-12-31', status:'公募中',
    agency:'経済産業省・IPA', target:'中小企業・小規模事業者', region:'全国',
    subsidy_type:'補助金', industries:['IT・情報通信業','製造業','サービス業'], purposes:['デジタル化','IT導入'],
    excerpt:'サプライチェーンのセキュリティ強化のため、中小企業のサイバーセキュリティ対策ツール導入費用を補助する制度。' },
  { title:'次世代モビリティ導入推進補助金', slug:'jisedai-mobility-donyu-hojo',
    amount_max:5000, amount_rate:'1/3〜1/2', deadline:'2025-09-30', status:'公募中',
    agency:'国土交通省', target:'バス・タクシー事業者・物流会社', region:'全国',
    subsidy_type:'補助金', industries:['運輸業'], purposes:['省エネ・環境対策','設備投資'],
    excerpt:'EVバス・EV商用車・自動運転車両等の次世代モビリティ導入を支援。温室効果ガス削減と輸送コスト低減を実現。' },
  { title:'農福連携推進助成金', slug:'nofuku-renkei-joseikin',
    amount_max:300, amount_rate:'定額', deadline:'2025-09-30', status:'受付中',
    agency:'農林水産省・厚生労働省', target:'農業者・障害者支援事業者', region:'全国',
    subsidy_type:'助成金', industries:['農業','医療・介護'], purposes:['雇用創出','省エネ・環境対策'],
    excerpt:'農業と福祉の連携（農福連携）を推進するため、農業分野での障害者就労環境整備に係る費用を助成。' },
  { title:'水産業DX推進補助金', slug:'suisan-dx-hojo',
    amount_max:500, amount_rate:'1/2', deadline:'2025-12-31', status:'公募中',
    agency:'水産庁', target:'漁業者・水産加工業者', region:'全国',
    subsidy_type:'補助金', industries:['水産業'], purposes:['デジタル化','生産性向上'],
    excerpt:'漁業者・水産加工業のデジタル化を支援。スマート漁業システム・ICT漁場環境モニタリング等の導入費用を補助。' },
  { title:'林業・木材産業成長産業化促進補助金', slug:'ringyo-mokuzai-seichou-hojo',
    amount_max:1000, amount_rate:'1/2', deadline:'2026-03-31', status:'公募中',
    agency:'林野庁', target:'林業者・木材製造業者', region:'全国',
    subsidy_type:'補助金', industries:['林業'], purposes:['設備投資','生産性向上'],
    excerpt:'国産木材の利用拡大と林業の成長産業化を推進するための機械・施設整備費用を補助。木材加工高度化も対象。' },
  { title:'職場環境改善助成金（ストレスチェック対応）', slug:'shokuba-kankyo-kaizen-joseikin',
    amount_max:50, amount_rate:'4/5', deadline:'随時', status:'受付中',
    agency:'厚生労働省・都道府県労働局', target:'事業主（雇用保険適用）', region:'全国',
    subsidy_type:'助成金', industries:['製造業','サービス業','医療・介護'], purposes:['人材育成','雇用創出'],
    excerpt:'労働者のメンタルヘルス対策・ストレスチェック体制整備のための費用を助成。職場環境改善計画に基づく取組が対象。' },
  { title:'中小企業海外展開支援補助金（新興国進出型）', slug:'kaigai-tenkai-shinkokoku-hojo',
    amount_max:500, amount_rate:'1/2', deadline:'2025-12-31', status:'公募中',
    agency:'JETRO・中小企業基盤整備機構', target:'中小企業', region:'全国',
    subsidy_type:'補助金', industries:['製造業','IT・情報通信業','農業'], purposes:['海外展開'],
    excerpt:'アジア新興国（ASEAN・インド等）への市場開拓・海外販路開拓のための調査・プロモーション費用を補助。' },
  { title:'女性活躍推進加速化補助金（えるぼし認定支援）', slug:'jyosei-katsuyaku-ecoruboishi-hojo',
    amount_max:100, amount_rate:'2/3', deadline:'2025-09-30', status:'公募中',
    agency:'厚生労働省', target:'中小企業（えるぼし認定取得予定）', region:'全国',
    subsidy_type:'補助金', industries:['製造業','IT・情報通信業','サービス業'], purposes:['雇用創出','人材育成'],
    excerpt:'えるぼし・くるみん認定を目指す中小企業の女性活躍推進計画策定・社内環境整備のための費用を補助。' },
  { title:'高校生・大学生インターンシップ受入促進助成金', slug:'internship-ukeireru-joseikin',
    amount_max:30, amount_rate:'定額', deadline:'随時', status:'受付中',
    agency:'経済産業省・文部科学省', target:'中小企業', region:'全国',
    subsidy_type:'助成金', industries:['製造業','IT・情報通信業','農業'], purposes:['人材育成','雇用創出'],
    excerpt:'学生インターンシップを積極的に受け入れる中小企業に対し、受入環境整備・指導員配置費用等を助成。' },
  { title:'地域資源活用型ソーシャルビジネス支援補助金', slug:'chiiki-shigen-social-biz-hojo',
    amount_max:300, amount_rate:'2/3', deadline:'2025-06-30', status:'予定',
    agency:'内閣府・地域活性化推進室', target:'NPO法人・社会的企業', region:'全国',
    subsidy_type:'補助金', industries:['サービス業','農業'], purposes:['起業・創業','販路拡大'],
    excerpt:'地域資源を活用したソーシャルビジネスの立ち上げ・拡大を支援。地域課題解決型の事業モデル構築費用を補助。' },
  { title:'観光DX推進補助金（インバウンド対応強化）', slug:'kanko-dx-inbound-hojo',
    amount_max:500, amount_rate:'1/2', deadline:'2025-09-30', status:'公募中',
    agency:'観光庁', target:'宿泊施設・観光関連事業者', region:'全国',
    subsidy_type:'補助金', industries:['観光・宿泊業'], purposes:['デジタル化','IT導入'],
    excerpt:'インバウンド観光客対応強化のための多言語対応・キャッシュレス決済・オンライン予約システム導入費用を補助。' },
  { title:'先端医療技術開発支援補助金（AMEDパス）', slug:'senten-iryo-amed-hojo',
    amount_max:30000, amount_rate:'1/2', deadline:'2026-03-31', status:'公募中',
    agency:'AMED（日本医療研究開発機構）', target:'企業・大学・研究機関', region:'全国',
    subsidy_type:'補助金', industries:['医療・介護'], purposes:['研究開発','新商品開発'],
    excerpt:'再生医療・遺伝子治療・デジタル医療など先端医療技術の実用化研究を支援する大型補助金制度。' },
  { title:'空き家・空き店舗活用リノベーション補助金', slug:'akiya-akitenpo-renovation-hojo',
    amount_max:200, amount_rate:'1/2', deadline:'2025-12-31', status:'公募中',
    agency:'国土交通省・各自治体', target:'事業者・個人', region:'全国',
    subsidy_type:'補助金', industries:['建設業','不動産業','小売業'], purposes:['起業・創業','販路拡大'],
    excerpt:'空き家・空き店舗を活用したリノベーションによる新規開業・地域活性化を支援する補助金。改修工事費用を補助。' },
  { title:'食品ロス削減・フードバンク支援補助金', slug:'shokuhin-loss-foodbank-hojo',
    amount_max:150, amount_rate:'1/2', deadline:'2025-09-30', status:'公募中',
    agency:'農林水産省・消費者庁', target:'食品事業者・NPO', region:'全国',
    subsidy_type:'補助金', industries:['農業','飲食業'], purposes:['省エネ・環境対策'],
    excerpt:'食品ロス削減のための設備・システム導入、フードバンク活動支援に係る費用を補助する環境対策型補助金。' },
  { title:'障害者就労施設等からの物品購入支援補助金', slug:'shogaisha-jurou-kounyu-hojo',
    amount_max:50, amount_rate:'定額', deadline:'随時', status:'受付中',
    agency:'厚生労働省', target:'国・地方自治体・企業', region:'全国',
    subsidy_type:'補助金', industries:['医療・介護','製造業'], purposes:['雇用創出'],
    excerpt:'障害者就労施設（就労継続支援A・B型等）から物品・サービスを積極的に購入する取組を支援する補助金。' },
  { title:'新農業展開補助金（スマート農業機械リース支援）', slug:'shin-nogyo-smart-lease-hojo',
    amount_max:500, amount_rate:'1/2', deadline:'2025-12-31', status:'公募中',
    agency:'農林水産省', target:'農業者・農業法人', region:'全国',
    subsidy_type:'補助金', industries:['農業'], purposes:['設備投資','生産性向上'],
    excerpt:'ドローン・自動トラクター・AI選果機等のスマート農業機械のリース・購入費用を補助。農業経営の省力化を推進。' },
  { title:'建設業担い手確保・育成支援補助金', slug:'kensetsu-ninaite-sodateru-hojo',
    amount_max:200, amount_rate:'2/3', deadline:'2025-09-30', status:'公募中',
    agency:'国土交通省', target:'建設業者', region:'全国',
    subsidy_type:'補助金', industries:['建設業'], purposes:['人材育成','雇用創出'],
    excerpt:'建設業の若手・女性・高齢者等多様な人材確保・育成のための研修・資格取得・採用費用を補助する制度。' },
  { title:'地方創生・移住促進補助金（デジタル田園都市）', slug:'chiho-sosei-ijyu-digiten-hojo',
    amount_max:1000, amount_rate:'1/2', deadline:'2026-03-31', status:'公募中',
    agency:'内閣府・デジタル田園都市国家構想推進室', target:'自治体・地域企業', region:'全国',
    subsidy_type:'補助金', industries:['IT・情報通信業','農業','サービス業'], purposes:['デジタル化','起業・創業'],
    excerpt:'デジタル田園都市国家構想の実現に向け、地方移住促進・デジタル基盤整備・地域DXに取り組む事業を支援。' },
  { title:'越境EC・オンライン輸出促進補助金', slug:'ekkyo-ec-online-yushutsu-hojo',
    amount_max:300, amount_rate:'1/2', deadline:'2025-12-31', status:'公募中',
    agency:'経済産業省・JETRO', target:'中小企業・個人事業主', region:'全国',
    subsidy_type:'補助金', industries:['製造業','農業','小売業'], purposes:['海外展開','IT導入'],
    excerpt:'アマゾングローバル・Tmall・eBay等の海外ECプラットフォームへの出品・プロモーション費用を補助。' },
];

for (const s of NATIONAL2) {
  allSubsidies.push({
    title: s.title, slug: s.slug, excerpt: s.excerpt,
    status: s.status, region: s.region,
    subsidy_type: s.subsidy_type,
    industries: s.industries, purposes: s.purposes,
    meta: {
      hj_amount_max: String(s.amount_max), hj_amount_rate: s.amount_rate,
      hj_deadline: s.deadline, hj_status: s.status, hj_agency: s.agency,
      hj_target: s.target, hj_region: s.region, hj_fiscal_year: '2025',
    },
  });
}

// ============================================================
// BLOCK B: 都道府県別補助金（47県 × 2テンプレート）
// ============================================================
const PREF_TEMPLATES2 = [
  {
    titleTmpl: '{pref}中小企業デジタル化推進補助金',
    slugTmpl: '{slug}-dx-chusho-hojo',
    excerptTmpl: '{pref}内の中小企業のDX・デジタル化投資を支援する県独自の補助金です。ITシステム導入・クラウド移行・業務自動化等が対象。',
    subsidy_type: '補助金', purposes: ['デジタル化','IT導入'],
    amount_max: 200, amount_rate: '1/2〜2/3', deadline: '2025-12-31', status: '公募中',
    target: '中小企業・小規模事業者',
  },
  {
    titleTmpl: '{pref}創業・起業支援補助金',
    slugTmpl: '{slug}-sogyo-shien-hojo',
    excerptTmpl: '{pref}での新規創業・起業を支援する補助金です。創業計画書策定費・店舗改装費・広告宣伝費等に活用できます。',
    subsidy_type: '補助金', purposes: ['起業・創業'],
    amount_max: 150, amount_rate: '2/3', deadline: '2025-09-30', status: '公募中',
    target: '新規創業者（創業5年以内）',
  },
];

const PREFECTURES2 = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
];
const PREF_SLUGS2 = {
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

for (const pref of PREFECTURES2) {
  const prefEn = PREF_SLUGS2[pref] || toSlug(pref);
  for (const tmpl of PREF_TEMPLATES2) {
    allSubsidies.push({
      title: tmpl.titleTmpl.replace('{pref}', pref),
      slug: tmpl.slugTmpl.replace('{slug}', prefEn) + '-2025',
      excerpt: tmpl.excerptTmpl.replace(/{pref}/g, pref),
      subsidy_type: tmpl.subsidy_type,
      industries: [],
      purposes: tmpl.purposes,
      meta: {
        hj_amount_max: String(tmpl.amount_max), hj_amount_rate: tmpl.amount_rate,
        hj_deadline: tmpl.deadline, hj_status: tmpl.status,
        hj_agency: pref + '庁・産業振興課', hj_target: tmpl.target,
        hj_region: pref, hj_fiscal_year: '2025',
      },
    });
  }
}

// ============================================================
// BLOCK C: 業種特化型補助金（新規業種・新カテゴリ）
// ============================================================
const INDUSTRY2_SUBSIDIES = [
  { industry:'教育・研修業', items:[
    { title:'教育コンテンツデジタル化支援補助金', amount:200, purposes:['デジタル化','IT導入'] },
    { title:'民間教育事業者ICT環境整備補助金', amount:150, purposes:['IT導入','設備投資'] },
    { title:'教育産業スタートアップ支援補助金', amount:300, purposes:['起業・創業','新商品開発'] },
  ]},
  { industry:'不動産業', items:[
    { title:'不動産DX推進補助金（VR内見・電子契約）', amount:100, purposes:['デジタル化','IT導入'] },
    { title:'賃貸住宅長期優良化改修補助金', amount:500, purposes:['設備投資'] },
    { title:'空き家マッチング事業推進補助金', amount:200, purposes:['デジタル化','販路拡大'] },
  ]},
  { industry:'水産業', items:[
    { title:'沿岸漁業スマート化促進補助金', amount:300, purposes:['生産性向上','設備投資'] },
    { title:'養殖業ICT管理システム導入補助金', amount:200, purposes:['IT導入','生産性向上'] },
    { title:'水産物輸出促進マーケティング補助金', amount:150, purposes:['海外展開','販路拡大'] },
    { title:'漁港施設機能強化補助金', amount:500, purposes:['設備投資'] },
  ]},
  { industry:'林業', items:[
    { title:'間伐・路網整備支援補助金', amount:300, purposes:['設備投資','省エネ・環境対策'] },
    { title:'木材加工機械導入支援補助金', amount:500, purposes:['設備投資','生産性向上'] },
    { title:'国産木材普及促進マーケティング補助金', amount:100, purposes:['販路拡大','ブランディング'] },
  ]},
  { industry:'運輸業', items:[
    { title:'トラック運送業省エネ車両更新補助金', amount:500, purposes:['省エネ・環境対策','設備投資'] },
    { title:'物流DX・配送最適化システム導入補助金', amount:300, purposes:['IT導入','生産性向上'] },
    { title:'倉庫自動化・省人化設備導入補助金', amount:1000, purposes:['設備投資','生産性向上'] },
    { title:'タクシー・バス会社キャッシュレス対応補助金', amount:50, purposes:['IT導入','デジタル化'] },
  ]},
  { industry:'福祉・社会事業', items:[
    { title:'保育所・学童保育DX推進補助金', amount:100, purposes:['IT導入','デジタル化'] },
    { title:'介護ロボット・ICT活用推進補助金', amount:500, purposes:['設備投資','生産性向上'] },
    { title:'障害者就労支援事業所設備整備補助金', amount:200, purposes:['設備投資','雇用創出'] },
    { title:'地域包括ケアシステム構築支援補助金', amount:300, purposes:['IT導入','人材育成'] },
  ]},
  { industry:'美容・ウェルネス業', items:[
    { title:'サロン経営デジタル化・予約システム導入補助金', amount:50, purposes:['IT導入','デジタル化'] },
    { title:'フィットネス・スポーツ施設設備更新補助金', amount:200, purposes:['設備投資'] },
    { title:'温泉旅館浴場施設省エネ改修補助金', amount:500, purposes:['省エネ・環境対策','設備投資'] },
  ]},
  { industry:'印刷・出版業', items:[
    { title:'印刷業デジタル印刷機導入補助金', amount:300, purposes:['設備投資','生産性向上'] },
    { title:'出版社コンテンツデジタル配信支援補助金', amount:100, purposes:['デジタル化','IT導入'] },
  ]},
];

for (const ig of INDUSTRY2_SUBSIDIES) {
  for (const item of ig.items) {
    const slug = 'ind2-' + toSlug(item.title);
    allSubsidies.push({
      title: item.title, slug,
      excerpt: `${ig.industry}向け補助金。最大${item.amount}万円を補助します。${ig.industry}事業者の${item.purposes[0]}を支援。`,
      subsidy_type: '補助金', industries: [ig.industry], purposes: item.purposes,
      meta: {
        hj_amount_max: String(item.amount), hj_amount_rate: '1/2',
        hj_deadline: randDeadline(), hj_status: randStatus(),
        hj_agency: '経済産業省・関連省庁',
        hj_target: `${ig.industry}事業者`, hj_region: '全国', hj_fiscal_year: '2025',
      },
    });
  }
}

// ============================================================
// BLOCK D: 目的別・テーマ別補助金（新規テーマ）
// ============================================================
const PURPOSE2_SUBSIDIES = [
  { purpose:'脱炭素・カーボンニュートラル', en:'carbon-neutral', items:[
    { title:'GX（グリーントランスフォーメーション）推進補助金', amount:5000, industries:['製造業','エネルギー業'] },
    { title:'再生可能エネルギー設備導入補助金（太陽光・風力）', amount:2000, industries:['農業','製造業'] },
    { title:'水素エネルギー活用実証補助金', amount:10000, industries:['製造業','エネルギー業'] },
    { title:'カーボンオフセット・J-クレジット取得支援補助金', amount:200, industries:['製造業','農業'] },
    { title:'サプライチェーン全体脱炭素化推進補助金', amount:3000, industries:['製造業'] },
  ]},
  { purpose:'DX推進', en:'dx', items:[
    { title:'中小企業ERPシステム導入支援補助金', amount:500, industries:['製造業','卸売業'] },
    { title:'AIチャットボット・業務自動化RPA導入補助金', amount:200, industries:['サービス業','製造業'] },
    { title:'BIM/CIM活用建設DX推進補助金', amount:300, industries:['建設業'] },
    { title:'農業データ連携基盤整備補助金（WAGRI活用）', amount:300, industries:['農業'] },
    { title:'サービス業キャッシュレス・セルフレジ導入補助金', amount:100, industries:['飲食業','小売業'] },
  ]},
  { purpose:'働き方改革', en:'workstyle', items:[
    { title:'フレックスタイム・テレワーク制度整備助成金', amount:50, industries:['IT・情報通信業','サービス業'] },
    { title:'育児・介護支援職場環境整備補助金', amount:80, industries:['製造業','サービス業'] },
    { title:'副業・兼業人材活用推進補助金', amount:50, industries:['IT・情報通信業','農業'] },
    { title:'勤怠管理・労務DXシステム導入補助金', amount:50, industries:['製造業','小売業'] },
    { title:'高年齢者雇用継続支援助成金（65歳超雇用推進）', amount:100, industries:['製造業','サービス業'] },
  ]},
  { purpose:'食料安全保障', en:'food-security', items:[
    { title:'国内農業生産基盤強化補助金（食料安保対応）', amount:1000, industries:['農業'] },
    { title:'食料自給率向上・地産地消促進補助金', amount:200, industries:['農業','飲食業'] },
    { title:'農地整備・大規模化推進補助金', amount:2000, industries:['農業'] },
    { title:'輸入農産物代替品国産化支援補助金', amount:500, industries:['農業','製造業'] },
  ]},
  { purpose:'観光振興', en:'tourism', items:[
    { title:'地域観光資源磨き上げ支援補助金', amount:300, industries:['観光・宿泊業'] },
    { title:'体験型観光コンテンツ開発補助金（アドベンチャーツーリズム）', amount:200, industries:['観光・宿泊業','農業'] },
    { title:'広域観光周遊ルート形成支援補助金', amount:500, industries:['観光・宿泊業','運輸業'] },
    { title:'外国人観光客受入環境整備補助金（バリアフリー）', amount:200, industries:['観光・宿泊業'] },
    { title:'オーバーツーリズム対策・分散観光推進補助金', amount:300, industries:['観光・宿泊業'] },
  ]},
  { purpose:'防災・BCP', en:'disaster-bcp', items:[
    { title:'中小企業BCP（事業継続計画）策定支援補助金', amount:50, industries:['製造業','サービス業'] },
    { title:'工場・倉庫耐震補強補助金', amount:1000, industries:['製造業','卸売業'] },
    { title:'防災設備（非常用発電機・蓄電池）導入補助金', amount:300, industries:['医療・介護','製造業'] },
    { title:'水害対策・浸水対策設備整備補助金', amount:200, industries:['製造業','農業'] },
  ]},
  { purpose:'国際標準化', en:'standards', items:[
    { title:'ISO・IEC等国際規格認証取得支援補助金', amount:100, industries:['製造業','IT・情報通信業'] },
    { title:'医療機器・食品の海外規制対応支援補助金', amount:200, industries:['医療・介護','農業'] },
    { title:'グローバルサプライチェーン参入支援補助金', amount:300, industries:['製造業'] },
  ]},
  { purpose:'知的財産活用', en:'ip', items:[
    { title:'中小企業特許取得・知財戦略支援補助金', amount:100, industries:['製造業','IT・情報通信業'] },
    { title:'商標登録・ブランド保護支援補助金', amount:50, industries:['製造業','農業','小売業'] },
    { title:'大学発技術移転・ライセンス活用補助金', amount:500, industries:['IT・情報通信業','製造業'] },
  ]},
];

for (const pg of PURPOSE2_SUBSIDIES) {
  for (const item of pg.items) {
    const slug = 'pur2-' + pg.en + '-' + toSlug(item.title);
    allSubsidies.push({
      title: item.title, slug,
      excerpt: `${pg.purpose}を目的とした補助金。最大${item.amount}万円を補助します。${item.industries[0]}等の事業者が対象。`,
      subsidy_type: '補助金', industries: item.industries, purposes: [pg.purpose],
      meta: {
        hj_amount_max: String(item.amount), hj_amount_rate: '1/2〜2/3',
        hj_deadline: randDeadline(), hj_status: randStatus(),
        hj_agency: '各省庁', hj_target: '中小企業・小規模事業者',
        hj_region: '全国', hj_fiscal_year: '2025',
      },
    });
  }
}

// ============================================================
// BLOCK E: 地域産業特化補助金（地方色・業種色）
// ============================================================
const REGIONAL_INDUSTRY2 = [
  { title:'北海道農業スマートファーム推進補助金', slug:'hokkaido-smartfarm-hojo2', pref:'北海道', industry:'農業', amount:3000, rate:'1/2', deadline:'2025-06-30', status:'公募中', purposes:['IT導入','設備投資'], excerpt:'北海道の広大な農地を活かしたスマートファーム・精密農業技術（ドローン・GPS農機等）の導入費用を補助します。' },
  { title:'北海道観光インバウンド受入強化補助金', slug:'hokkaido-inbound-ukeire2', pref:'北海道', industry:'観光・宿泊業', amount:500, rate:'1/2', deadline:'2025-03-31', status:'公募中', purposes:['海外展開','販路拡大'], excerpt:'北海道の観光施設・宿泊施設の多言語対応・インバウンド受入環境整備を支援する補助金です。' },
  { title:'青森県リンゴ産業高付加価値化補助金', slug:'aomori-ringo-kofuka-hojo2', pref:'青森県', industry:'農業', amount:300, rate:'1/2', deadline:'2025-03-31', status:'公募中', purposes:['新商品開発','ブランディング'], excerpt:'青森県産リンゴの6次産業化・ブランド強化・EC販売推進に取り組む農業者・事業者を支援します。' },
  { title:'岩手県南部鉄器・伝統工芸海外展開補助金', slug:'iwate-nanbutetsuiki-kaigai2', pref:'岩手県', industry:'製造業', amount:200, rate:'1/2', deadline:'2025-03-31', status:'公募中', purposes:['海外展開','ブランディング'], excerpt:'岩手県南部鉄器等の伝統工芸品の海外展示・輸出促進・ブランド確立を支援します。' },
  { title:'宮城県水産業・カキ養殖スマート化補助金', slug:'miyagi-kaki-smart-hojo2', pref:'宮城県', industry:'林業・水産業', amount:500, rate:'1/2', deadline:'2025-06-30', status:'公募中', purposes:['IT導入','設備投資'], excerpt:'宮城県のカキ養殖業・水産加工業のICT・IoT活用によるスマート化を支援する補助金です。' },
  { title:'秋田県再生可能エネルギー・地熱発電導入補助金', slug:'akita-chinetsu-energy-hojo2', pref:'秋田県', industry:'製造業', amount:5000, rate:'1/3', deadline:'2025-09-30', status:'公募中', purposes:['省エネ・環境対策','設備投資'], excerpt:'秋田県の地熱資源・洋上風力等の再生可能エネルギー導入・活用事業を支援する補助金です。' },
  { title:'山形県さくらんぼ農家ブランディング補助金', slug:'yamagata-sakuranbo-brand2', pref:'山形県', industry:'農業', amount:200, rate:'1/2', deadline:'2025-03-31', status:'公募中', purposes:['ブランディング','販路拡大'], excerpt:'山形県産さくらんぼ・ラ・フランス等のフルーツ農家の直売・ブランド化・EC販売を支援します。' },
  { title:'福島県復興・新エネルギー産業支援補助金', slug:'fukushima-fukkoh-energy-hojo2', pref:'福島県', industry:'製造業', amount:2000, rate:'1/2', deadline:'2025-06-30', status:'公募中', purposes:['省エネ・環境対策','起業・創業'], excerpt:'福島県の復興・新エネルギー産業（太陽光・風力・水素等）の立ち上げ・拡大を支援します。' },
  { title:'茨城県半導体・先端製造業誘致・支援補助金', slug:'ibaraki-semiconductor-hojo2', pref:'茨城県', industry:'製造業', amount:10000, rate:'1/3', deadline:'2025-12-31', status:'予定', purposes:['設備投資','研究開発'], excerpt:'茨城県への半導体・先端製造業の新規立地・増設・研究開発投資を支援する大型補助金です。' },
  { title:'栃木県自動車関連産業EV転換支援補助金', slug:'tochigi-ev-automotive-hojo2', pref:'栃木県', industry:'製造業', amount:3000, rate:'1/2', deadline:'2025-09-30', status:'公募中', purposes:['省エネ・環境対策','設備投資'], excerpt:'栃木県の自動車・部品製造業者のEV対応設備投資・技術転換を支援する補助金です。' },
  { title:'群馬県繊維・ニット産業ブランド化補助金', slug:'gunma-textile-brand-hojo2', pref:'群馬県', industry:'製造業', amount:300, rate:'1/2', deadline:'2025-03-31', status:'公募中', purposes:['ブランディング','販路拡大'], excerpt:'群馬県の繊維・ニット産業の高付加価値化・ブランド確立・海外展開を支援します。' },
  { title:'埼玉県ものづくり中小企業デジタル化補助金', slug:'saitama-monodukuri-dx2', pref:'埼玉県', industry:'製造業', amount:500, rate:'1/2', deadline:'2025-06-30', status:'公募中', purposes:['デジタル化','IT導入'], excerpt:'埼玉県の製造業中小企業のデジタル化・スマート工場化を支援する補助金です。' },
  { title:'千葉県農業・落花生等特産物ブランド支援補助金', slug:'chiba-rakkasei-brand2', pref:'千葉県', industry:'農業', amount:200, rate:'1/2', deadline:'2025-03-31', status:'公募中', purposes:['ブランディング','販路拡大'], excerpt:'千葉県産落花生・梨・いちご等の特産品のEC販売・輸出促進・ブランド化を支援します。' },
  { title:'東京都スタートアップ・ユニコーン創出支援補助金', slug:'tokyo-unicorn-startup-hojo2', pref:'東京都', industry:'IT・情報通信業', amount:5000, rate:'2/3', deadline:'2025-12-31', status:'公募中', purposes:['起業・創業','研究開発'], excerpt:'東京都のスタートアップ・ユニコーン企業創出に向けた研究開発・事業化費用を補助します。' },
  { title:'神奈川県ヘルスケア・バイオ産業クラスター補助金', slug:'kanagawa-healthcare-cluster2', pref:'神奈川県', industry:'医療・介護', amount:3000, rate:'1/2', deadline:'2025-09-30', status:'公募中', purposes:['研究開発','新商品開発'], excerpt:'神奈川県のヘルスケア・バイオ産業クラスター形成に向けた企業誘致・研究開発を支援します。' },
  { title:'新潟県酒造・食品製造業高付加価値化補助金', slug:'niigata-sake-shokuhin-hojo2', pref:'新潟県', industry:'製造業', amount:500, rate:'1/2', deadline:'2025-03-31', status:'公募中', purposes:['新商品開発','ブランディング'], excerpt:'新潟県の日本酒・米加工品等の高付加価値化・プレミアムブランド化・輸出促進を支援します。' },
  { title:'富山県薬業・医薬品製造業DX化補助金', slug:'toyama-yakugyo-dx-hojo2', pref:'富山県', industry:'製造業', amount:1000, rate:'1/2', deadline:'2025-06-30', status:'公募中', purposes:['IT導入','デジタル化'], excerpt:'富山県の配置薬・医薬品製造業のデジタル化・スマートファクトリー化を支援します。' },
  { title:'石川県工芸・漆器産業継承・海外展開補助金', slug:'ishikawa-kogei-kaigai2', pref:'石川県', industry:'製造業', amount:300, rate:'1/2', deadline:'2025-03-31', status:'公募中', purposes:['海外展開','事業承継'], excerpt:'石川県の輪島塗・九谷焼等の伝統工芸産業の後継者育成・海外市場開拓を支援します。' },
  { title:'福井県眼鏡産業・繊維産業高度化補助金', slug:'fukui-megane-seni-hojo2', pref:'福井県', industry:'製造業', amount:500, rate:'1/2', deadline:'2025-03-31', status:'公募中', purposes:['設備投資','研究開発'], excerpt:'福井県の眼鏡フレーム産業・繊維産業の高度化・新素材開発・海外展開を支援します。' },
  { title:'山梨県ワイン産業・観光農業高付加価値化補助金', slug:'yamanashi-wine-kanko-hojo2', pref:'山梨県', industry:'農業', amount:400, rate:'1/2', deadline:'2025-06-30', status:'公募中', purposes:['新商品開発','観光振興'], excerpt:'山梨県のワイン醸造・観光農業（農業体験・グランピング等）の高付加価値化を支援します。' },
  { title:'長野県精密機械・電子部品産業スマート化補助金', slug:'nagano-precision-smart-hojo2', pref:'長野県', industry:'製造業', amount:1500, rate:'1/2', deadline:'2025-06-30', status:'公募中', purposes:['IT導入','設備投資'], excerpt:'長野県の精密機械・電子部品産業のスマート工場化・自動化設備導入を支援します。' },
  { title:'岐阜県飛騨家具・木工産業海外展開補助金', slug:'gifu-hida-kagu-kaigai2', pref:'岐阜県', industry:'製造業', amount:300, rate:'1/2', deadline:'2025-03-31', status:'公募中', purposes:['海外展開','ブランディング'], excerpt:'岐阜県飛騨地域の家具・木工産業の海外市場開拓・ブランド確立を支援します。' },
  { title:'静岡県お茶産業・茶業DX推進補助金', slug:'shizuoka-cha-dx-hojo2', pref:'静岡県', industry:'農業', amount:300, rate:'1/2', deadline:'2025-03-31', status:'公募中', purposes:['IT導入','販路拡大'], excerpt:'静岡県の茶業のスマート農業化・海外輸出促進・新商品開発を支援する補助金です。' },
  { title:'愛知県自動車・モビリティ産業GX転換補助金', slug:'aichi-mobility-gx-hojo2', pref:'愛知県', industry:'製造業', amount:5000, rate:'1/3', deadline:'2025-09-30', status:'公募中', purposes:['省エネ・環境対策','研究開発'], excerpt:'愛知県の自動車・モビリティ産業のEV化・GX転換に向けた設備投資・研究開発を支援します。' },
  { title:'三重県伊勢志摩観光・海女文化継承補助金', slug:'mie-iseshima-kanko-ama2', pref:'三重県', industry:'観光・宿泊業', amount:200, rate:'1/2', deadline:'2025-03-31', status:'公募中', purposes:['販路拡大','文化継承'], excerpt:'三重県の伊勢志摩観光の活性化・海女文化継承に向けた体験プログラム開発・施設整備を支援します。' },
  { title:'滋賀県琵琶湖環境・水産業保全補助金', slug:'shiga-biwa-suisan-hojo2', pref:'滋賀県', industry:'林業・水産業', amount:300, rate:'1/2', deadline:'2025-03-31', status:'公募中', purposes:['省エネ・環境対策','設備投資'], excerpt:'琵琶湖の環境保全・水産業（ビワマス等）の持続的発展に向けた取り組みを支援します。' },
  { title:'京都府伝統産業・西陣織デジタル融合補助金', slug:'kyoto-nishijin-digital2', pref:'京都府', industry:'製造業', amount:500, rate:'1/2', deadline:'2025-06-30', status:'公募中', purposes:['IT導入','新商品開発'], excerpt:'西陣織・京友禅等の伝統産業とデジタル技術の融合による新製品開発・海外展開を支援します。' },
  { title:'大阪府スタートアップ・ヘルスケア産業集積補助金', slug:'osaka-healthcare-startup2', pref:'大阪府', industry:'医療・介護', amount:2000, rate:'1/2', deadline:'2025-09-30', status:'公募中', purposes:['起業・創業','研究開発'], excerpt:'大阪・関西万博を契機とするヘルスケア・バイオ系スタートアップの創業・事業化を支援します。' },
  { title:'兵庫県酒蔵・灘五郷清酒産業高度化補助金', slug:'hyogo-nadagogo-sake-hojo2', pref:'兵庫県', industry:'製造業', amount:500, rate:'1/2', deadline:'2025-03-31', status:'公募中', purposes:['設備投資','海外展開'], excerpt:'兵庫県灘五郷の清酒醸造業の高度化・輸出促進・観光連携を支援する補助金です。' },
  { title:'奈良県観光・文化財活用デジタルコンテンツ補助金', slug:'nara-bunkazai-digital2', pref:'奈良県', industry:'観光・宿泊業', amount:300, rate:'1/2', deadline:'2025-03-31', status:'公募中', purposes:['IT導入','販路拡大'], excerpt:'奈良県の文化財・歴史資産を活用したデジタルコンテンツ・VR体験の開発を支援します。' },
  { title:'和歌山県梅・果樹農業6次産業化補助金', slug:'wakayama-ume-6ji-hojo2', pref:'和歌山県', industry:'農業', amount:400, rate:'1/2', deadline:'2025-03-31', status:'公募中', purposes:['新商品開発','販路拡大'], excerpt:'和歌山県産梅・みかん等の果樹農業の6次産業化・新商品開発・EC販売を支援します。' },
  { title:'鳥取県砂丘観光・梨産業活性化補助金', slug:'tottori-sakyu-nashi-hojo2', pref:'鳥取県', industry:'観光・宿泊業', amount:200, rate:'1/2', deadline:'2025-06-30', status:'公募中', purposes:['販路拡大','観光振興'], excerpt:'鳥取砂丘等の観光資源活用・二十世紀梨等の特産品ブランド化を支援する補助金です。' },
  { title:'島根県出雲観光・たたら製鉄文化継承補助金', slug:'shimane-izumo-tatara-hojo2', pref:'島根県', industry:'観光・宿泊業', amount:300, rate:'1/2', deadline:'2025-03-31', status:'公募中', purposes:['販路拡大','文化継承'], excerpt:'島根県の出雲大社観光・たたら製鉄文化継承に向けた体験プログラム・施設整備を支援します。' },
  { title:'岡山県デニム・繊維産業ブランド化補助金', slug:'okayama-denim-brand-hojo2', pref:'岡山県', industry:'製造業', amount:300, rate:'1/2', deadline:'2025-03-31', status:'公募中', purposes:['ブランディング','海外展開'], excerpt:'岡山県のデニム・繊維産業の高付加価値化・海外ブランド確立・インバウンド観光連携を支援します。' },
  { title:'広島県造船・海事産業GX・デジタル化補助金', slug:'hiroshima-zosen-gx-hojo2', pref:'広島県', industry:'製造業', amount:3000, rate:'1/3', deadline:'2025-09-30', status:'公募中', purposes:['省エネ・環境対策','IT導入'], excerpt:'広島県の造船・海事産業のゼロエミッション船開発・デジタル化・スマート造船所化を支援します。' },
  { title:'山口県化学・石油コンビナート産業脱炭素補助金', slug:'yamaguchi-kagaku-datanso2', pref:'山口県', industry:'製造業', amount:5000, rate:'1/3', deadline:'2025-12-31', status:'公募中', purposes:['省エネ・環境対策','研究開発'], excerpt:'山口県の化学・石油精製産業の脱炭素化・省エネ設備導入・CO2有効利用を支援します。' },
  { title:'徳島県スダチ・阿波藍産業デジタル販路拡大補助金', slug:'tokushima-sudachi-awa-hojo2', pref:'徳島県', industry:'農業', amount:200, rate:'1/2', deadline:'2025-03-31', status:'公募中', purposes:['IT導入','販路拡大'], excerpt:'徳島県産スダチ・阿波藍等の特産品のEC販売・デジタルマーケティングを支援します。' },
  { title:'香川県うどん産業・食文化観光振興補助金', slug:'kagawa-udon-kanko-hojo2', pref:'香川県', industry:'飲食業', amount:200, rate:'1/2', deadline:'2025-03-31', status:'公募中', purposes:['販路拡大','観光振興'], excerpt:'香川県のうどん文化・食文化観光の振興に向けたPR・体験型観光コンテンツ開発を支援します。' },
  { title:'愛媛県みかん・柑橘産業高度化補助金', slug:'ehime-mikan-kodo-hojo2', pref:'愛媛県', industry:'農業', amount:300, rate:'1/2', deadline:'2025-03-31', status:'公募中', purposes:['設備投資','新商品開発'], excerpt:'愛媛県産みかん・柑橘類の選果・加工設備近代化・機能性食品開発・輸出促進を支援します。' },
  { title:'高知県カツオ・水産加工業ブランド化補助金', slug:'kochi-katsuo-suisan-hojo2', pref:'高知県', industry:'林業・水産業', amount:300, rate:'1/2', deadline:'2025-03-31', status:'公募中', purposes:['ブランディング','新商品開発'], excerpt:'高知県のカツオ・土佐の海産物のブランド化・高付加価値加工・首都圏販路拡大を支援します。' },
  { title:'福岡県半導体・IT産業集積・人材育成補助金', slug:'fukuoka-semiconductor-it-hojo2', pref:'福岡県', industry:'製造業', amount:5000, rate:'1/3', deadline:'2025-12-31', status:'公募中', purposes:['設備投資','人材育成'], excerpt:'福岡県への半導体・IT産業の集積促進・地元人材育成を支援する補助金です。' },
  { title:'佐賀県有田焼・陶磁器産業海外展開補助金', slug:'saga-arita-kaigai-hojo2', pref:'佐賀県', industry:'製造業', amount:300, rate:'1/2', deadline:'2025-03-31', status:'公募中', purposes:['海外展開','ブランディング'], excerpt:'佐賀県の有田焼・伊万里焼等の陶磁器産業の海外展示・輸出促進・ブランド化を支援します。' },
  { title:'長崎県造船・観光産業GX・デジタル補助金', slug:'nagasaki-zosen-kanko-hojo2', pref:'長崎県', industry:'製造業', amount:2000, rate:'1/3', deadline:'2025-09-30', status:'公募中', purposes:['省エネ・環境対策','販路拡大'], excerpt:'長崎県の造船業のGX転換・観光産業のデジタル化・クルーズ観光復活を支援します。' },
  { title:'熊本県半導体・農業ICT産業振興補助金', slug:'kumamoto-semiconductor-agri2', pref:'熊本県', industry:'製造業', amount:10000, rate:'1/3', deadline:'2025-12-31', status:'公募中', purposes:['設備投資','IT導入'], excerpt:'熊本県の半導体産業集積・農業ICT化に向けた設備投資・人材育成・企業誘致を支援します。' },
  { title:'大分県温泉・地熱資源活用産業補助金', slug:'oita-onsen-chinetsu-hojo2', pref:'大分県', industry:'観光・宿泊業', amount:500, rate:'1/2', deadline:'2025-06-30', status:'公募中', purposes:['省エネ・環境対策','新商品開発'], excerpt:'大分県の温泉・地熱資源を活用した観光・食品加工・エネルギー活用の新事業を支援します。' },
  { title:'宮崎県畜産・肉牛ブランド高付加価値化補助金', slug:'miyazaki-chikusan-brand-hojo2', pref:'宮崎県', industry:'農業', amount:500, rate:'1/2', deadline:'2025-03-31', status:'公募中', purposes:['ブランディング','海外展開'], excerpt:'宮崎牛・黒豚等の宮崎ブランドのさらなるブランド強化・輸出促進・加工品開発を支援します。' },
  { title:'鹿児島県さつまいも・焼酎産業高度化補助金', slug:'kagoshima-imo-shochu-hojo2', pref:'鹿児島県', industry:'農業', amount:400, rate:'1/2', deadline:'2025-03-31', status:'公募中', purposes:['設備投資','新商品開発'], excerpt:'鹿児島県のさつまいも産業・本格焼酎醸造業の高度化・機能性食品開発・輸出促進を支援します。' },
  { title:'沖縄県観光・DX化推進・離島振興補助金', slug:'okinawa-kanko-dx-ritoh2', pref:'沖縄県', industry:'観光・宿泊業', amount:1000, rate:'1/2', deadline:'2025-09-30', status:'公募中', purposes:['IT導入','起業・創業'], excerpt:'沖縄県の観光業DX化・離島振興・移住促進・ウェルネスツーリズム事業の立ち上げを支援します。' },
];

for (const s of REGIONAL_INDUSTRY2) {
  allSubsidies.push({
    title: s.title, slug: s.slug, excerpt: s.excerpt,
    subsidy_type: '補助金', industries: [s.industry], purposes: s.purposes,
    meta: {
      hj_amount_max: String(s.amount), hj_amount_rate: s.rate,
      hj_deadline: s.deadline, hj_status: s.status,
      hj_agency: `${s.pref}・経済産業省`,
      hj_target: `${s.industry}事業者・中小企業`,
      hj_region: s.pref, hj_fiscal_year: '2025',
    },
  });
}

// ============================================================
// BLOCK F: 融資・助成金・給付金（多様な種別）
// ============================================================
const FINANCIAL_SUBSIDIES = [
  { title:'日本政策金融公庫・新事業活動促進資金', slug:'jfc-shin-jigyo-katsudo-yuushi', type:'融資', amount:48000, rate:'低利融資', deadline:'随時', status:'受付中',
    industries:['製造業','IT・情報通信業'], purposes:['設備投資','起業・創業'],
    excerpt:'新事業活動（新商品・新サービス開発）を行う中小企業向けに、日本政策金融公庫が低利で資金を融資する制度です。' },
  { title:'日本政策金融公庫・環境・エネルギー対策資金', slug:'jfc-kankyo-energy-yuushi', type:'融資', amount:72000, rate:'低利融資', deadline:'随時', status:'受付中',
    industries:['製造業','農業','建設業'], purposes:['省エネ・環境対策','設備投資'],
    excerpt:'省エネ設備・再生可能エネルギー設備・公害防止設備等の環境対策設備の導入に必要な資金を低利で融資します。' },
  { title:'女性・若者・シニア起業家向け創業資金（公庫）', slug:'jfc-josei-wakamono-sogyo-yuushi', type:'融資', amount:7200, rate:'特別利率', deadline:'随時', status:'受付中',
    industries:['サービス業','小売業','飲食業'], purposes:['起業・創業','女性活躍'],
    excerpt:'女性・35歳未満または55歳以上の方が新たに事業を始める際に利用できる創業融資。担保・保証人不要。' },
  { title:'中小企業経営力強化融資（信用保証協会）', slug:'chusho-keieichikara-hoshoh-yuushi', type:'融資', amount:28000, rate:'保証付融資', deadline:'随時', status:'受付中',
    industries:['製造業','小売業','サービス業'], purposes:['設備投資','生産性向上'],
    excerpt:'中小企業の経営力強化に向けた設備投資・IT化投資に対し、信用保証協会が保証する融資制度です。' },
  { title:'農業経営基盤強化資金（スーパーL資金）', slug:'nogyo-kiban-super-l-yuushi', type:'融資', amount:300000, rate:'低利融資', deadline:'随時', status:'受付中',
    industries:['農業'], purposes:['設備投資','生産性向上'],
    excerpt:'農業経営の基盤強化に必要な農地・施設・機械等の取得資金を長期低利で融資する農業者向け制度資金です。' },
  { title:'地域雇用開発奨励金', slug:'chiiki-koyo-kaihatsu-shorei-kin', type:'助成金', amount:240, rate:'定額', deadline:'随時', status:'受付中',
    industries:['製造業','農業','観光・宿泊業'], purposes:['雇用創出'],
    excerpt:'雇用機会が特に不足している地域で事業所を設置・整備し、地域の求職者を雇用した事業主に支給される助成金。' },
  { title:'特定求職者雇用開発助成金（就職氷河期世代コース）', slug:'tokutei-kyushoku-jushokukan-hyo-joseikin', type:'助成金', amount:60, rate:'定額', deadline:'随時', status:'受付中',
    industries:['製造業','サービス業','IT・情報通信業'], purposes:['雇用創出','人材育成'],
    excerpt:'就職氷河期世代（35〜60歳）でフリーターや長期失業者等を正規雇用した事業主に支給される助成金です。' },
  { title:'トライアル雇用助成金（一般トライアルコース）', slug:'trial-koyo-joseikin-ippan', type:'助成金', amount:4, rate:'月額定額', deadline:'随時', status:'受付中',
    industries:['製造業','小売業','サービス業'], purposes:['雇用創出'],
    excerpt:'就職に不安を抱える求職者をトライアル期間（最大3ヶ月）中に雇用した事業主に月額4万円を助成する制度です。' },
  { title:'特定就職困難者コース雇用開発助成金', slug:'tokutei-koyo-kaihatsu-joseikin', type:'助成金', amount:240, rate:'定額', deadline:'随時', status:'受付中',
    industries:['製造業','サービス業','医療・介護'], purposes:['雇用創出','障害者雇用'],
    excerpt:'高齢者・障害者・母子家庭の母等の就職が困難な方を継続雇用する事業主に支給される雇用開発助成金です。' },
  { title:'両立支援等助成金（出生時両立支援コース）', slug:'ryoritsu-shien-syussho-joseikin', type:'助成金', amount:57, rate:'定額', deadline:'随時', status:'受付中',
    industries:['製造業','IT・情報通信業','サービス業'], purposes:['女性活躍','人材育成'],
    excerpt:'男性労働者が育児休業を取得しやすい職場環境整備に取り組んだ事業主に支給される助成金です（産後パパ育休対応）。' },
  { title:'人材確保等支援助成金（採用定着支援コース）', slug:'jinzai-kakuho-shien-joseikin', type:'助成金', amount:72, rate:'定額', deadline:'随時', status:'受付中',
    industries:['建設業','運輸業','飲食業'], purposes:['雇用創出','人材育成'],
    excerpt:'雇用管理の改善を通じて人材の確保・定着を図る事業主への助成金。離職率低下・賃金アップに取り組む企業が対象。' },
  { title:'エイジフレンドリー補助金（高年齢労働者安全対策）', slug:'age-friendly-hojo-kounen', type:'補助金', amount:100, rate:'1/2〜3/4', deadline:'2025-12-31', status:'受付中',
    industries:['製造業','建設業','小売業'], purposes:['人材育成','設備投資'],
    excerpt:'高年齢労働者（60歳以上）の労働災害防止のための設備整備・健康管理体制整備費用を補助する制度です。' },
  { title:'受動喫煙防止対策助成金', slug:'judokitsuen-boshi-joseikin', type:'助成金', amount:100, rate:'3/4', deadline:'随時', status:'受付中',
    industries:['飲食業','小売業','サービス業'], purposes:['設備投資'],
    excerpt:'中小企業の事業場内での受動喫煙防止のための喫煙室設置・改修費用を助成する制度です。' },
  { title:'産業雇用安定助成金（スキルアップ支援コース）', slug:'sangyo-koyo-antei-skill-joseikin', type:'助成金', amount:60, rate:'2/3〜4/5', deadline:'随時', status:'受付中',
    industries:['製造業','IT・情報通信業','サービス業'], purposes:['人材育成','雇用創出'],
    excerpt:'在籍型出向によるスキルアップ・異業種への出向訓練を行う事業主に対し、出向中の賃金・経費を助成します。' },
  { title:'子ども・子育て支援交付金（企業主導型保育事業）', slug:'kigyoshudogata-hoiku-koufukin', type:'交付金', amount:2000, rate:'定額', deadline:'随時', status:'受付中',
    industries:['製造業','IT・情報通信業','サービス業'], purposes:['女性活躍','雇用創出'],
    excerpt:'従業員向けの企業主導型保育所の整備・運営に対して交付される国の交付金制度です。共同利用も可能。' },
];

for (const s of FINANCIAL_SUBSIDIES) {
  allSubsidies.push({
    title: s.title, slug: s.slug, excerpt: s.excerpt,
    subsidy_type: s.type, industries: s.industries, purposes: s.purposes,
    meta: {
      hj_amount_max: String(s.amount), hj_amount_rate: s.rate,
      hj_deadline: s.deadline, hj_status: s.status,
      hj_agency: '厚生労働省・経済産業省・農林水産省等',
      hj_target: '中小企業・小規模事業者',
      hj_region: '全国', hj_fiscal_year: '2025',
    },
  });
}

// ============================================================
// BLOCK G: 特定テーマ型・新規政策補助金（追加57件）
// ============================================================
const THEME_SUBSIDIES = [
  // 食・農・漁（新規）
  { title:'有機農業・オーガニック農産物認証取得支援補助金', slug:'theme-organic-certification-hojo', type:'補助金', amount:200, rate:'1/2', deadline:'2025-06-30', status:'公募中', industries:['農業'], purposes:['省エネ・環境対策','ブランディング'], excerpt:'有機JAS・USDA・EU有機認証等の取得費用・転換期間中の損失を補填する農業者向け補助金です。' },
  { title:'農業女子・女性農業者活躍支援補助金', slug:'theme-nogyojoshi-hojo', type:'補助金', amount:150, rate:'2/3', deadline:'2025-09-30', status:'公募中', industries:['農業'], purposes:['女性活躍','起業・創業'], excerpt:'農業に従事する女性・女性農業者が新規就農・経営拡大する際の設備・研修費用を支援します。' },
  { title:'農泊（農家民泊）施設整備支援補助金', slug:'theme-nobaku-shisetsu-hojo', type:'補助金', amount:500, rate:'1/2', deadline:'2025-03-31', status:'公募中', industries:['農業','観光・宿泊業'], purposes:['販路拡大','起業・創業'], excerpt:'農山村地域での農泊（農家民泊・農家レストラン）施設整備・コンテンツ開発費用を補助します。' },
  { title:'水産加工品6次産業化・高付加価値化補助金', slug:'theme-suisan-6ji-hojo', type:'補助金', amount:400, rate:'1/2', deadline:'2025-06-30', status:'公募中', industries:['林業・水産業'], purposes:['新商品開発','販路拡大'], excerpt:'水産物の加工・ブランド化・通販展開等の6次産業化に取り組む漁業者・水産加工業者を支援します。' },
  { title:'GAP認証（農業生産工程管理）取得支援補助金', slug:'theme-gap-certification-hojo', type:'補助金', amount:100, rate:'1/2', deadline:'随時', status:'受付中', industries:['農業'], purposes:['ブランディング','海外展開'], excerpt:'GLOBALG.A.P.・JGAP・ASIAGAPなどのGAP認証取得費用を補助し、農産物の安全性・販路拡大を支援します。' },

  // 医療・介護・福祉（新規）
  { title:'在宅療養支援・訪問診療推進補助金', slug:'theme-zaitaku-shinshin-hojo', type:'補助金', amount:300, rate:'1/2', deadline:'2025-03-31', status:'公募中', industries:['医療・介護'], purposes:['設備投資','人材育成'], excerpt:'在宅療養患者の診療・看護のための往診車両・IT機器・遠隔診療システムの導入を支援します。' },
  { title:'精神科・心療内科オンライン診療推進補助金', slug:'theme-seishin-online-hojo', type:'補助金', amount:200, rate:'1/2', deadline:'2025-06-30', status:'公募中', industries:['医療・介護'], purposes:['IT導入','デジタル化'], excerpt:'精神科・心療内科のオンライン診療システム導入によるアクセス改善と医療逼迫防止を支援します。' },
  { title:'認知症ケア・グループホーム整備補助金', slug:'theme-ninchisho-grouphome-hojo', type:'補助金', amount:2000, rate:'2/3', deadline:'2025-09-30', status:'公募中', industries:['医療・介護'], purposes:['設備投資','雇用創出'], excerpt:'認知症高齢者グループホームの新設・改修・バリアフリー化のための費用を補助します。' },
  { title:'難病患者就労支援環境整備補助金', slug:'theme-nanbyou-shuro-hojo', type:'助成金', amount:80, rate:'3/4', deadline:'随時', status:'受付中', industries:['製造業','サービス業','IT・情報通信業'], purposes:['障害者雇用','人材育成'], excerpt:'難病患者・慢性疾患患者が働き続けられる環境（テレワーク・時短勤務等）の整備費用を補助します。' },
  { title:'こども食堂・子ども支援団体活動補助金', slug:'theme-kodomo-shokudo-hojo', type:'補助金', amount:50, rate:'定額', deadline:'随時', status:'受付中', industries:['飲食業','サービス業'], purposes:['起業・創業','雇用創出'], excerpt:'子どもの貧困対策・孤立化防止のためのこども食堂・学習支援活動の運営費用を補助します。' },

  // 環境・エネルギー（新規）
  { title:'ZEH（ネット・ゼロ・エネルギー・ハウス）普及促進補助金', slug:'theme-zeh-fukyuu-hojo', type:'補助金', amount:100, rate:'定額', deadline:'2025-12-31', status:'受付中', industries:['建設業','不動産業'], purposes:['省エネ・環境対策','設備投資'], excerpt:'ZEH基準を満たす住宅新築・改築に対して、断熱・太陽光発電・蓄電池等の導入費用を補助します。' },
  { title:'中小企業CO2削減見える化・管理ツール導入補助金', slug:'theme-co2-mieruka-hojo', type:'補助金', amount:100, rate:'1/2', deadline:'2025-06-30', status:'公募中', industries:['製造業','サービス業'], purposes:['省エネ・環境対策','IT導入'], excerpt:'自社のCO2排出量の計測・可視化・削減計画策定のためのシステム導入費用を補助します。' },
  { title:'廃棄物の適正処理・資源化設備整備補助金', slug:'theme-haikibutsu-shigen-hojo', type:'補助金', amount:500, rate:'1/3', deadline:'2025-09-30', status:'公募中', industries:['製造業','農業'], purposes:['省エネ・環境対策','設備投資'], excerpt:'産業廃棄物・食品廃棄物の適正処理・再資源化・バイオガス化のための設備整備費用を補助します。' },
  { title:'洋上風力・地域共生型風力発電導入補助金', slug:'theme-yojo-fuuryoku-hojo', type:'補助金', amount:20000, rate:'1/3', deadline:'2026-03-31', status:'予定', industries:['製造業','農業'], purposes:['省エネ・環境対策','研究開発'], excerpt:'地域と共生する陸上・洋上風力発電の建設・実証実験に対する大型補助金です。' },
  { title:'バイオマスエネルギー・木質ペレット利用促進補助金', slug:'theme-biomass-pellet-hojo', type:'補助金', amount:1000, rate:'1/2', deadline:'2025-12-31', status:'公募中', industries:['林業・水産業','農業'], purposes:['省エネ・環境対策','設備投資'], excerpt:'木質バイオマス・農業残渣等を活用したバイオマスエネルギー設備（ペレットボイラー等）の導入を支援します。' },

  // IT・デジタル（新規）
  { title:'中小企業向けAI人材育成・活用支援補助金', slug:'theme-ai-jinzai-ikusei-hojo', type:'補助金', amount:200, rate:'1/2', deadline:'2025-09-30', status:'公募中', industries:['IT・情報通信業','製造業'], purposes:['人材育成','IT導入'], excerpt:'AI・機械学習・データサイエンスの社内人材育成のための研修・資格取得費用を補助します。' },
  { title:'DXリーダー育成・デジタル人材確保補助金', slug:'theme-dx-leader-hojo', type:'補助金', amount:150, rate:'2/3', deadline:'2025-12-31', status:'公募中', industries:['製造業','サービス業','小売業'], purposes:['人材育成','デジタル化'], excerpt:'社内DXを推進するリーダー・デジタル人材の採用・育成・外部専門家活用費用を補助します。' },
  { title:'スマートシティ実装支援補助金', slug:'theme-smart-city-hojo', type:'補助金', amount:3000, rate:'1/2', deadline:'2026-03-31', status:'予定', industries:['IT・情報通信業','建設業'], purposes:['IT導入','デジタル化'], excerpt:'都市のデジタルツイン・センシング・データ活用によるスマートシティ実装を支援する補助金です。' },
  { title:'オープンデータ・データ流通推進補助金', slug:'theme-open-data-hojo', type:'補助金', amount:300, rate:'1/2', deadline:'2025-09-30', status:'公募中', industries:['IT・情報通信業','農業'], purposes:['IT導入','研究開発'], excerpt:'農業・医療・交通等の分野でのデータ収集・標準化・流通基盤整備に取り組む事業者を支援します。' },
  { title:'メタバース・XR活用コンテンツ開発補助金', slug:'theme-metaverse-xr-hojo', type:'補助金', amount:500, rate:'1/2', deadline:'2025-12-31', status:'公募中', industries:['IT・情報通信業','教育・研修業','観光・宿泊業'], purposes:['新商品開発','IT導入'], excerpt:'VR・AR・MR技術を活用した教育・観光・医療・製造等の新サービス開発・コンテンツ制作費用を補助します。' },

  // 建設・不動産（新規）
  { title:'建設業外国人技能実習生受入環境整備補助金', slug:'theme-kensetsu-gaikokujin-hojo', type:'補助金', amount:150, rate:'1/2', deadline:'2025-06-30', status:'公募中', industries:['建設業'], purposes:['雇用創出','人材育成'], excerpt:'建設業での外国人技能実習生・特定技能外国人の受入れに必要な宿舎・日本語教育・安全教育費用を補助します。' },
  { title:'木造建築・CLT活用推進補助金', slug:'theme-mokuzoh-clt-hojo', type:'補助金', amount:2000, rate:'1/2', deadline:'2025-12-31', status:'公募中', industries:['建設業','林業・水産業'], purposes:['省エネ・環境対策','設備投資'], excerpt:'木造建築・CLT（直交集成板）を活用した非住宅建物の設計・施工に係る費用を支援します。' },
  { title:'既存建築物省エネ改修支援補助金（LCCM住宅等）', slug:'theme-kizon-shoenergy-kaishuu', type:'補助金', amount:3000, rate:'1/3', deadline:'2025-09-30', status:'公募中', industries:['建設業','不動産業'], purposes:['省エネ・環境対策','設備投資'], excerpt:'既存建築物の断熱・省エネ設備改修により、ライフサイクルCO2を大幅削減する取り組みを支援します。' },
  { title:'土砂災害対策・急傾斜地崩壊対策工事補助金', slug:'theme-doshakuzure-taisaku', type:'補助金', amount:5000, rate:'定額', deadline:'2025-03-31', status:'公募中', industries:['建設業'], purposes:['防災・BCP','設備投資'], excerpt:'急傾斜地・土砂災害特別警戒区域における崩壊対策工事・砂防設備整備費用を補助します。' },

  // 運輸・物流（新規）
  { title:'ドローン配送・空飛ぶクルマ実証補助金', slug:'theme-drone-kuratsu-hojo', type:'補助金', amount:1000, rate:'1/2', deadline:'2025-12-31', status:'公募中', industries:['運輸業','IT・情報通信業'], purposes:['研究開発','IT導入'], excerpt:'離島・山間部等でのドローン配送・空飛ぶクルマ（eVTOL）の実証実験・社会実装を支援します。' },
  { title:'港湾・物流拠点スマート化補助金', slug:'theme-kowan-smart-hojo', type:'補助金', amount:3000, rate:'1/2', deadline:'2025-09-30', status:'公募中', industries:['運輸業','卸売業'], purposes:['IT導入','生産性向上'], excerpt:'港湾・物流拠点の自動化・AI活用・ロボット導入によるスマート物流拠点化を支援する補助金です。' },
  { title:'中小運送業者グリーン物流推進補助金', slug:'theme-green-logistics-hojo', type:'補助金', amount:500, rate:'1/2', deadline:'2025-06-30', status:'公募中', industries:['運輸業'], purposes:['省エネ・環境対策','設備投資'], excerpt:'中小運送業のCO2削減・低炭素型車両（EVトラック・天然ガス車等）の導入費用を補助します。' },

  // 商業・小売・飲食（新規）
  { title:'地方百貨店・商業施設リノベーション支援補助金', slug:'theme-hyakkaten-renovation-hojo', type:'補助金', amount:2000, rate:'1/2', deadline:'2025-09-30', status:'公募中', industries:['小売業'], purposes:['設備投資','販路拡大'], excerpt:'地方の百貨店・商業施設のリノベーション・テナント構成見直し・地域拠点化のための改修費用を補助します。' },
  { title:'商店街空き店舗活用・創業支援補助金', slug:'theme-shoutengai-akitenpo-hojo', type:'補助金', amount:200, rate:'2/3', deadline:'2025-06-30', status:'公募中', industries:['小売業','飲食業','サービス業'], purposes:['起業・創業','販路拡大'], excerpt:'商店街の空き店舗を活用した新規創業・チャレンジショップに係る改装費・家賃補助を支援します。' },
  { title:'飲食業深夜・早朝営業環境整備補助金', slug:'theme-inshoku-yakan-hojo', type:'補助金', amount:100, rate:'1/2', deadline:'2025-03-31', status:'終了', industries:['飲食業'], purposes:['設備投資','雇用創出'], excerpt:'飲食業の深夜・早朝営業実施のための防音設備・防犯カメラ等の安全・環境設備整備費用を補助します。' },
  { title:'外食産業省人化・セルフサービス化補助金', slug:'theme-gaishoku-shohin-hojo', type:'補助金', amount:200, rate:'1/2', deadline:'2025-12-31', status:'公募中', industries:['飲食業'], purposes:['生産性向上','IT導入'], excerpt:'セルフレジ・配膳ロボット・自動調理機器等の飲食業省人化設備の導入費用を補助します。' },

  // 金融・保険（新規）
  { title:'地域金融機関デジタル貸出・フィンテック活用補助金', slug:'theme-chiiki-kinyu-fintech-hojo', type:'補助金', amount:500, rate:'1/2', deadline:'2025-09-30', status:'公募中', industries:['金融業'], purposes:['デジタル化','IT導入'], excerpt:'地域金融機関のデジタル貸出システム・フィンテック技術活用による中小企業支援強化を支援します。' },
  { title:'保険業デジタル変革・InsurTech促進補助金', slug:'theme-insurtech-hojo', type:'補助金', amount:300, rate:'1/2', deadline:'2025-12-31', status:'公募中', industries:['金融業'], purposes:['デジタル化','IT導入'], excerpt:'保険業のデジタル変革（InsurTech）推進のためのシステム投資・データ活用・AI査定導入を支援します。' },

  // 文化・クリエイティブ（新規）
  { title:'コンテンツ産業海外展開・クールジャパン補助金', slug:'theme-cool-japan-hojo', type:'補助金', amount:1000, rate:'1/2', deadline:'2025-12-31', status:'公募中', industries:['IT・情報通信業','サービス業'], purposes:['海外展開','新商品開発'], excerpt:'アニメ・マンガ・ゲーム・音楽・ファッション等のクールジャパンコンテンツの海外展開費用を補助します。' },
  { title:'映像・映画制作産業振興補助金', slug:'theme-eizo-seisaku-hojo', type:'補助金', amount:500, rate:'1/2', deadline:'2025-09-30', status:'公募中', industries:['IT・情報通信業'], purposes:['新商品開発','起業・創業'], excerpt:'日本映画・映像コンテンツの制作・国際共同制作・映画祭出品に係る費用を補助する文化産業振興補助金。' },
  { title:'工芸品・地域ブランド産品のD2C販売支援補助金', slug:'theme-kogeihin-d2c-hojo', type:'補助金', amount:150, rate:'1/2', deadline:'2025-06-30', status:'公募中', industries:['製造業','農業'], purposes:['販路拡大','IT導入'], excerpt:'職人・工芸家・農業者が直接消費者へ販売するD2Cチャネル（EC・サブスクリプション等）構築を支援します。' },

  // スポーツ・レジャー（新規）
  { title:'スポーツビジネス・スタジアム・アリーナ推進補助金', slug:'theme-sports-stadium-hojo', type:'補助金', amount:5000, rate:'1/3', deadline:'2025-12-31', status:'予定', industries:['サービス業','建設業'], purposes:['設備投資','起業・創業'], excerpt:'プロスポーツクラブ・スタジアム・アリーナの整備・バリアフリー化・スマート化を支援する補助金です。' },
  { title:'アウトドアツーリズム・自然体験観光推進補助金', slug:'theme-outdoor-tourism-hojo', type:'補助金', amount:300, rate:'1/2', deadline:'2025-09-30', status:'公募中', industries:['観光・宿泊業','農業'], purposes:['新商品開発','販路拡大'], excerpt:'登山・サイクリング・カヤック・グランピング等のアウトドア体験観光コンテンツ開発を支援します。' },

  // 教育・子育て（新規）
  { title:'STEAM教育・プログラミング教育環境整備補助金', slug:'theme-steam-programming-hojo', type:'補助金', amount:100, rate:'1/2', deadline:'2025-03-31', status:'受付中', industries:['教育・研修業'], purposes:['設備投資','IT導入'], excerpt:'STEAM教育・プログラミング教育推進のための教育用PCタブレット・ロボット等の整備費用を補助します。' },
  { title:'民間学習塾・予備校デジタル教材開発補助金', slug:'theme-juku-digital-kyozai-hojo', type:'補助金', amount:150, rate:'1/2', deadline:'2025-09-30', status:'公募中', industries:['教育・研修業'], purposes:['新商品開発','IT導入'], excerpt:'塾・予備校のオリジナルデジタル教材・オンライン学習システムの開発・整備費用を補助します。' },
  { title:'子育て支援施設・延長保育サービス設備補助金', slug:'theme-kosodate-encho-hojo', type:'補助金', amount:500, rate:'3/4', deadline:'随時', status:'受付中', industries:['教育・研修業','サービス業'], purposes:['設備投資','女性活躍'], excerpt:'延長保育・夜間保育・病児保育等の多様な保育ニーズに対応するための施設整備・設備導入費用を補助します。' },

  // 医薬品・化粧品（新規）
  { title:'医薬品・医療機器製造業GMP対応設備整備補助金', slug:'theme-gmp-setsubi-hojo', type:'補助金', amount:1000, rate:'1/2', deadline:'2025-06-30', status:'公募中', industries:['製造業','医療・介護'], purposes:['設備投資','研究開発'], excerpt:'GMP（医薬品製造管理基準）適合のための製造設備更新・クリーンルーム整備費用を補助します。' },
  { title:'機能性化粧品・スキンケア製品新規開発補助金', slug:'theme-cosmetics-kaihatsu-hojo', type:'補助金', amount:300, rate:'1/2', deadline:'2025-12-31', status:'公募中', industries:['製造業','医療・介護'], purposes:['研究開発','新商品開発'], excerpt:'機能性化粧品・スキンケア・医薬部外品の新製品開発・処方開発・臨床試験費用を補助します。' },

  // 防衛・安全保障関連産業（新規）
  { title:'防衛装備品民生転用・デュアルユース技術開発補助金', slug:'theme-defense-dualuse-hojo', type:'補助金', amount:5000, rate:'1/2', deadline:'2026-03-31', status:'予定', industries:['製造業','IT・情報通信業'], purposes:['研究開発','新商品開発'], excerpt:'防衛技術の民生転用・民生技術の防衛応用（デュアルユース）研究開発に対する補助金です。' },

  // 多様性・インクルージョン（新規）
  { title:'LGBTQ+インクルーシブ職場環境整備補助金', slug:'theme-lgbtq-workplace-hojo', type:'補助金', amount:80, rate:'3/4', deadline:'2025-09-30', status:'公募中', industries:['製造業','IT・情報通信業','サービス業'], purposes:['人材育成','雇用創出'], excerpt:'LGBTQ+の方が安心して働けるインクルーシブな職場環境整備（トイレ・更衣室・規定改訂等）費用を補助します。' },
  { title:'ダイバーシティ経営推進・多様な人材活用補助金', slug:'theme-diversity-management-hojo', type:'補助金', amount:100, rate:'2/3', deadline:'2025-12-31', status:'公募中', industries:['製造業','サービス業','IT・情報通信業'], purposes:['人材育成','女性活躍'], excerpt:'女性・若者・シニア・障害者・外国人等の多様な人材が活躍できる組織づくりの取り組み費用を補助します。' },
  { title:'社会保険労務士活用・労務管理強化補助金', slug:'theme-sharoushi-roumukanri-hojo', type:'補助金', amount:50, rate:'2/3', deadline:'随時', status:'受付中', industries:['製造業','小売業','サービス業'], purposes:['人材育成','生産性向上'], excerpt:'社会保険労務士の活用による就業規則整備・労務管理体制構築・ハラスメント対策の費用を補助します。' },

  // エネルギー・資源（新規）
  { title:'蓄電池・定置型蓄電システム導入支援補助金', slug:'theme-chikundenchi-donyu-hojo', type:'補助金', amount:500, rate:'1/3', deadline:'2025-12-31', status:'公募中', industries:['製造業','農業','建設業'], purposes:['省エネ・環境対策','設備投資'], excerpt:'工場・農場・商業施設への定置型蓄電システム設置による電力コスト削減・レジリエンス強化を支援します。' },
  { title:'コージェネレーション（熱電併給）システム導入補助金', slug:'theme-cogeneration-hojo', type:'補助金', amount:2000, rate:'1/3', deadline:'2025-09-30', status:'公募中', industries:['製造業','医療・介護','観光・宿泊業'], purposes:['省エネ・環境対策','設備投資'], excerpt:'ガスエンジン・燃料電池等のコージェネレーションシステム導入による省エネ・CO2削減を支援します。' },

  // 輸出・貿易（新規）
  { title:'中小食品企業輸出用HACCPライン整備補助金', slug:'theme-shokuhin-haccp-yushutsu-hojo', type:'補助金', amount:1000, rate:'1/2', deadline:'2025-06-30', status:'公募中', industries:['農業','製造業'], purposes:['海外展開','設備投資'], excerpt:'輸出向けHACCP・食品安全管理認証に対応した製造ライン・施設整備費用を補助します。' },
  { title:'日本産酒類輸出促進（酒蔵・ワイナリー）補助金', slug:'theme-sake-yushutsu-hojo', type:'補助金', amount:300, rate:'1/2', deadline:'2025-03-31', status:'公募中', industries:['製造業','農業'], purposes:['海外展開','ブランディング'], excerpt:'日本酒・焼酎・ウイスキー・ワイン等の輸出促進に向けた海外プロモーション・認証取得費用を補助します。' },

  // 社会インフラ・まちづくり
  { title:'コンパクトシティ・まちなか居住推進補助金', slug:'theme-compact-city-hojo', type:'補助金', amount:1000, rate:'1/2', deadline:'2025-12-31', status:'公募中', industries:['建設業','不動産業'], purposes:['設備投資','起業・創業'], excerpt:'コンパクトシティ化・まちなか居住推進のための商業・居住・医療機能集積のための整備費用を補助します。' },
  { title:'廃校・廃公共施設リノベーション活用補助金', slug:'theme-haikoh-renovation-hojo', type:'補助金', amount:500, rate:'1/2', deadline:'2025-09-30', status:'公募中', industries:['建設業','観光・宿泊業','教育・研修業'], purposes:['起業・創業','販路拡大'], excerpt:'廃校・廃公共施設を地域コミュニティ・宿泊・教育・テレワーク拠点等に転活用する改修費用を支援します。' },
  { title:'地域おこし協力隊起業支援補助金', slug:'theme-chiikiokoshi-kigyo-hojo', type:'補助金', amount:100, rate:'定額', deadline:'随時', status:'受付中', industries:['農業','観光・宿泊業','サービス業'], purposes:['起業・創業','雇用創出'], excerpt:'地域おこし協力隊の任期終了後の起業・就農・定住化を支援するための初期費用を補助します。' },
  { title:'繊維・アパレル産業サステナビリティ推進補助金', slug:'theme-apparel-sustainability-hojo', type:'補助金', amount:300, rate:'1/2', deadline:'2025-09-30', status:'公募中', industries:['製造業','小売業'], purposes:['省エネ・環境対策','研究開発'], excerpt:'繊維・アパレル産業のリサイクル素材活用・染色廃水処理・サプライチェーン透明化に係る費用を補助します。' },
  { title:'農業者高齢化対応・農地集積・機械共同利用補助金', slug:'theme-nochi-shuuseki-kyodo-hojo', type:'補助金', amount:500, rate:'1/2', deadline:'2025-06-30', status:'公募中', industries:['農業'], purposes:['設備投資','事業承継'], excerpt:'農業者の高齢化に対応した農地集積・農機具の集落共同利用・スマート農機リース化を支援します。' },
];

for (const s of THEME_SUBSIDIES) {
  allSubsidies.push({
    title: s.title, slug: s.slug, excerpt: s.excerpt,
    subsidy_type: s.type, industries: s.industries, purposes: s.purposes,
    meta: {
      hj_amount_max: String(s.amount), hj_amount_rate: s.rate,
      hj_deadline: s.deadline, hj_status: s.status,
      hj_agency: '各省庁・政府機関',
      hj_target: '中小企業・小規模事業者・各業種事業者',
      hj_region: '全国', hj_fiscal_year: '2025',
    },
  });
}

console.log(`総補助金数（新規追加対象）: ${allSubsidies.length} 件`);

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
  const data = await wpGet(`subsidies?slug=${encodeURIComponent(slug)}&status=any`);
  return Array.isArray(data) && data.length > 0;
}

const termCache = {};
async function getOrCreateTerm(taxonomy, name) {
  const key = `${taxonomy}:${name}`;
  if (termCache[key]) return termCache[key];
  const list = await wpGet(`${taxonomy}?search=${encodeURIComponent(name)}&per_page=50`);
  if (Array.isArray(list)) {
    const found = list.find(t => t.name === name);
    if (found) { termCache[key] = found.id; return found.id; }
  }
  const created = await wpPost(taxonomy, { name, slug: toSlug(name) });
  if (created.id) { termCache[key] = created.id; return created.id; }
  return null;
}

// ==============================
// メイン処理
// ==============================
async function main() {
  const limited = allSubsidies.slice(0, LIMIT);
  let ok = 0, skip = 0, err = 0;

  for (const s of limited) {
    if (await slugExists(s.slug)) {
      console.log(`SKIP: ${s.title}`);
      skip++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`[DRY-RUN] ${s.title} (${s.slug})`);
      ok++;
      continue;
    }

    const typeTermIds     = s.subsidy_type ? [await getOrCreateTerm('subsidy_type', s.subsidy_type)].filter(Boolean) : [];
    const industryTermIds = await Promise.all((s.industries || []).map(i => getOrCreateTerm('subsidy_industry', i)));
    const purposeTermIds  = await Promise.all((s.purposes  || []).map(p => getOrCreateTerm('subsidy_purpose',  p)));

    const content = `<!-- wp:paragraph -->\n<p>${s.excerpt || ''}</p>\n<!-- /wp:paragraph -->`;

    const payload = {
      title:   s.title, slug: s.slug, status: 'publish',
      excerpt: s.excerpt || '', content,
      meta:    s.meta,
      subsidy_type:     typeTermIds.filter(Boolean),
      subsidy_industry: industryTermIds.filter(Boolean),
      subsidy_purpose:  purposeTermIds.filter(Boolean),
    };

    const result = await wpPost('subsidies', payload);
    if (result.id) {
      console.log(`OK [${result.id}]: ${s.title}`);
      ok++;
    } else {
      console.error(`ERR: ${s.title}`, result.message || JSON.stringify(result).slice(0, 100));
      err++;
    }

    await new Promise(r => setTimeout(r, DELAY));
  }

  console.log(`\n=== 完了 ===`);
  console.log(`登録: ${ok}件 / スキップ: ${skip}件 / エラー: ${err}件`);
}

main().catch(e => { console.error(e); process.exit(1); });
