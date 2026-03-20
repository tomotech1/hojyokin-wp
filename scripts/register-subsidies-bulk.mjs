/**
 * 補助金CPT 300件 一括登録スクリプト（REST API版）
 * 使い方: node scripts/register-subsidies-bulk.mjs [--limit=N] [--dry-run]
 * node_modules は vtuber-wp のものを流用
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '../.env');

// .env 読み込み
const env = {};
readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim();
});

const WP_URL  = env.WP_URL  || 'http://localhost:10010';
const WP_USER = env.WP_USER || 'admin';
const WP_PASS = env.WP_APP_PASS || '';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const LIMIT   = parseInt((args.find(a => a.startsWith('--limit=')) || '--limit=9999').split('=')[1]);
const DELAY   = 300; // ms between requests

const auth = Buffer.from(`${WP_USER}:${WP_PASS}`).toString('base64');

// ==============================
// 都道府県マップ
// ==============================
const PREFECTURES = [
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

function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ==============================
// 補助金データ定義
// ==============================

// BLOCK 1: 全国主要補助金
const NATIONAL = [
  { title:'ものづくり・商業・サービス生産性向上促進補助金（ものづくり補助金）', slug:'monodukuri-hojo',
    amount_max:1250, amount_rate:'1/2（小規模事業者2/3）', deadline:'2025-03-31', status:'公募中',
    agency:'全国中小企業団体中央会', target:'中小企業・小規模事業者', region:'全国',
    subsidy_type:'補助金', industries:['製造業','IT・情報通信業','小売業'], purposes:['設備投資','生産性向上','研究開発'],
    excerpt:'中小企業・小規模事業者が取り組む革新的サービス開発・試作品開発・生産プロセスの改善を支援する補助金です。' },
  { title:'IT導入補助金（デジタル化基盤導入類型）', slug:'it-donyu-hojo',
    amount_max:350, amount_rate:'1/2〜3/4', deadline:'2025-03-31', status:'公募中',
    agency:'一般社団法人サービスデザイン推進協議会', target:'中小企業・小規模事業者', region:'全国',
    subsidy_type:'補助金', industries:['IT・情報通信業','小売業','サービス業'], purposes:['IT導入','デジタル化','生産性向上'],
    excerpt:'ITツール導入を支援する補助金。会計ソフト・ECサイト・受発注ソフトなどのデジタル化投資に活用できます。' },
  { title:'小規模事業者持続化補助金', slug:'jizokuka-hojo',
    amount_max:200, amount_rate:'2/3', deadline:'2025-05-30', status:'公募中',
    agency:'日本商工会議所・全国商工会連合会', target:'小規模事業者', region:'全国',
    subsidy_type:'補助金', industries:['小売業','飲食業','サービス業'], purposes:['販路拡大','ブランディング'],
    excerpt:'小規模事業者の販路開拓・業務効率化を支援。チラシ作成・ウェブサイト制作・展示会出展など幅広い経費が対象です。' },
  { title:'事業再構築補助金', slug:'jigyou-saikouchi-hojo',
    amount_max:7000, amount_rate:'1/2〜2/3', deadline:'2024-12-31', status:'終了',
    agency:'中小企業庁', target:'中小企業・中堅企業', region:'全国',
    subsidy_type:'補助金', industries:['製造業','サービス業','飲食業'], purposes:['設備投資','新商品開発','研究開発'],
    excerpt:'コロナ禍からの回復を目指す事業再構築を支援する大型補助金。新分野展開・業態転換・事業転換などが対象です。' },
  { title:'省エネルギー設備導入補助金（省エネ補助金）', slug:'shoenergy-hojo',
    amount_max:15000, amount_rate:'1/3〜1/2', deadline:'2025-06-30', status:'公募中',
    agency:'一般社団法人環境共創イニシアチブ', target:'法人・個人事業主', region:'全国',
    subsidy_type:'補助金', industries:['製造業','建設業','飲食業'], purposes:['省エネ・環境対策','設備投資'],
    excerpt:'省エネ設備の導入費用を補助。エアコン・照明・ボイラー等の高効率設備への切り替えで光熱費削減と補助金取得が可能です。' },
  { title:'雇用調整助成金（特例措置）', slug:'koyo-chosei-joseikin',
    amount_max:100, amount_rate:'4/5〜10/10', deadline:'2025-03-31', status:'受付中',
    agency:'厚生労働省・ハローワーク', target:'雇用保険適用事業主', region:'全国',
    subsidy_type:'助成金', industries:['製造業','飲食業','観光・宿泊業'], purposes:['雇用創出'],
    excerpt:'景気変動などで事業活動の縮小を余儀なくされた事業主が、雇用の維持を図るための助成金です。' },
  { title:'キャリアアップ助成金（正社員化コース）', slug:'career-up-joseikin-seishain',
    amount_max:57, amount_rate:'定額', deadline:'随時', status:'受付中',
    agency:'厚生労働省・都道府県労働局', target:'雇用保険適用事業主', region:'全国',
    subsidy_type:'助成金', industries:['製造業','小売業','サービス業'], purposes:['雇用創出','人材育成'],
    excerpt:'パート・アルバイト等の非正規雇用労働者を正規雇用に転換した事業主に支給される助成金です。' },
  { title:'人材開発支援助成金（人材育成支援コース）', slug:'jinzai-kaihatsu-joseikin',
    amount_max:45, amount_rate:'45〜60%', deadline:'随時', status:'受付中',
    agency:'厚生労働省・都道府県労働局', target:'雇用保険適用事業主', region:'全国',
    subsidy_type:'助成金', industries:['製造業','IT・情報通信業','サービス業'], purposes:['人材育成'],
    excerpt:'従業員のスキルアップ・資格取得を支援する研修費用を助成。OFF-JT訓練・OJT訓練ともに対象となります。' },
  { title:'業務改善助成金', slug:'gyomu-kaizen-joseikin',
    amount_max:600, amount_rate:'4/5', deadline:'2024-12-27', status:'公募中',
    agency:'厚生労働省', target:'中小企業・小規模事業者', region:'全国',
    subsidy_type:'助成金', industries:['製造業','小売業','飲食業'], purposes:['生産性向上','設備投資'],
    excerpt:'最低賃金を引き上げた事業主が生産性向上のための設備投資を行う場合に費用を助成する制度です。' },
  { title:'事業承継・引継ぎ補助金', slug:'jigyou-shokei-hojo',
    amount_max:600, amount_rate:'2/3', deadline:'2025-04-30', status:'公募中',
    agency:'中小企業庁', target:'中小企業・小規模事業者', region:'全国',
    subsidy_type:'補助金', industries:['製造業','小売業','サービス業'], purposes:['事業承継'],
    excerpt:'事業承継・M&Aを支援する補助金。廃業・引継ぎに伴う費用（仲介手数料・士業報酬等）を補助します。' },
  { title:'グリーンイノベーション基金事業（NEDO）', slug:'green-innovation-kikin',
    amount_max:200000, amount_rate:'1/2〜2/3', deadline:'2030-03-31', status:'公募中',
    agency:'NEDO（新エネルギー・産業技術総合開発機構）', target:'企業・研究機関', region:'全国',
    subsidy_type:'補助金', industries:['製造業','IT・情報通信業'], purposes:['省エネ・環境対策','研究開発'],
    excerpt:'2兆円規模のグリーンイノベーション基金による大型研究開発支援。洋上風力・水素・次世代自動車等が対象です。' },
  { title:'農業次世代人材投資資金（就農直接支払交付金）', slug:'nogyo-jisedai-jinzai',
    amount_max:150, amount_rate:'定額', deadline:'随時', status:'受付中',
    agency:'農林水産省', target:'新規就農者（50歳未満）', region:'全国',
    subsidy_type:'交付金', industries:['農業'], purposes:['起業・創業','雇用創出'],
    excerpt:'新規就農者の経営確立を支援する交付金。農業経営が安定するまでの最大5年間、年間最大150万円が交付されます。' },
  { title:'観光庁インバウンド消費拡大事業補助金', slug:'kanko-inbound-hojo',
    amount_max:500, amount_rate:'1/2〜2/3', deadline:'2025-08-31', status:'公募中',
    agency:'観光庁', target:'観光関連事業者', region:'全国',
    subsidy_type:'補助金', industries:['観光・宿泊業'], purposes:['販路拡大','海外展開'],
    excerpt:'インバウンド消費を拡大するための観光コンテンツ開発・多言語対応・キャッシュレス化等を支援します。' },
  { title:'働き方改革推進支援助成金（職場意識改善コース）', slug:'hatarakikata-kaikaku-joseikin',
    amount_max:100, amount_rate:'3/4', deadline:'2024-12-16', status:'受付中',
    agency:'厚生労働省', target:'中小企業事業主', region:'全国',
    subsidy_type:'助成金', industries:['製造業','小売業','サービス業'], purposes:['人材育成','生産性向上'],
    excerpt:'長時間労働の削減・年次有給休暇の取得促進などの働き方改革に取り組む事業主を助成します。' },
  { title:'先端設備等導入計画に基づく固定資産税特例', slug:'sentan-setsubi-kotei-shisan-tokurei',
    amount_max:0, amount_rate:'固定資産税1/2〜0', deadline:'2026-03-31', status:'受付中',
    agency:'市区町村', target:'中小企業', region:'全国',
    subsidy_type:'税制優遇', industries:['製造業','IT・情報通信業'], purposes:['設備投資','生産性向上'],
    excerpt:'先端設備等導入計画の認定を受けた中小企業は、設備の固定資産税が最大3年間ゼロ〜1/2に軽減されます。' },
  { title:'中小企業デジタル化推進補助金', slug:'chusho-digital-hojo',
    amount_max:150, amount_rate:'1/2', deadline:'2025-02-28', status:'公募中',
    agency:'中小企業庁', target:'中小企業', region:'全国',
    subsidy_type:'補助金', industries:['製造業','小売業','サービス業'], purposes:['デジタル化','IT導入'],
    excerpt:'中小企業のデジタル化を支援する補助金。業務管理システム・電子帳票・テレワーク環境整備等が対象です。' },
  { title:'水産業競争力強化設備投資等支援事業', slug:'suisan-kyosoryoku-hojo',
    amount_max:500, amount_rate:'1/2', deadline:'2025-03-31', status:'公募中',
    agency:'農林水産省・水産庁', target:'漁業者・水産加工業者', region:'全国',
    subsidy_type:'補助金', industries:['林業・水産業'], purposes:['設備投資','生産性向上'],
    excerpt:'水産業の競争力強化のための漁船・養殖施設・加工設備等の整備を支援する補助金です。' },
  { title:'福祉・介護人材確保対策補助金', slug:'fukushi-kaigo-jinzai-hojo',
    amount_max:200, amount_rate:'3/4', deadline:'2025-02-28', status:'公募中',
    agency:'厚生労働省', target:'社会福祉法人・介護事業者', region:'全国',
    subsidy_type:'補助金', industries:['医療・介護'], purposes:['人材育成','雇用創出'],
    excerpt:'介護・福祉分野の人材確保・定着・育成を目的とした補助金です。処遇改善・教育訓練費用等が対象です。' },
  { title:'建設業省エネ・環境配慮型建設機械導入支援補助金', slug:'kensetsu-shoenergy-kikai-hojo',
    amount_max:500, amount_rate:'1/2', deadline:'2025-03-31', status:'公募中',
    agency:'国土交通省', target:'建設業者', region:'全国',
    subsidy_type:'補助金', industries:['建設業'], purposes:['省エネ・環境対策','設備投資'],
    excerpt:'建設現場における省エネ・環境配慮型の建設機械（電動・ハイブリッド等）の導入費用を支援します。' },
  { title:'農山漁村振興交付金（農泊推進対策）', slug:'noson-shinko-nobaku-hojo',
    amount_max:500, amount_rate:'定額', deadline:'2025-01-31', status:'公募中',
    agency:'農林水産省', target:'農泊推進協議会等', region:'全国',
    subsidy_type:'交付金', industries:['農業','観光・宿泊業'], purposes:['販路拡大','海外展開'],
    excerpt:'農山漁村における農泊（農家民泊）の推進・整備を支援。施設改修・コンテンツ開発・多言語化等が対象です。' },
  { title:'食品産業戦略的基盤整備事業補助金', slug:'shokuhin-kiban-seibi-hojo',
    amount_max:1500, amount_rate:'1/2', deadline:'2025-04-30', status:'公募中',
    agency:'農林水産省', target:'食品製造・加工事業者', region:'全国',
    subsidy_type:'補助金', industries:['農業','製造業'], purposes:['設備投資','生産性向上'],
    excerpt:'食品の製造・加工施設の整備・HACCP対応・衛生管理強化などを支援する補助金です。' },
  { title:'再生可能エネルギー導入促進補助金（中小企業向け）', slug:'saisei-energy-chusho-hojo',
    amount_max:1500, amount_rate:'1/3', deadline:'2025-07-31', status:'公募中',
    agency:'環境省', target:'中小企業・自治体', region:'全国',
    subsidy_type:'補助金', industries:['製造業','農業'], purposes:['省エネ・環境対策','設備投資'],
    excerpt:'太陽光発電・風力発電・バイオマス等の再生可能エネルギー設備導入を支援する環境省の補助金です。' },
  { title:'外国人材受入れ支援補助金', slug:'gaikokujin-ukeire-hojo',
    amount_max:100, amount_rate:'1/2', deadline:'2025-03-31', status:'公募中',
    agency:'出入国在留管理庁', target:'中小企業・小規模事業者', region:'全国',
    subsidy_type:'補助金', industries:['製造業','農業','建設業'], purposes:['雇用創出','人材育成'],
    excerpt:'特定技能外国人の受入れに必要な支援計画の作成・日本語教育・住居確保等の費用を補助します。' },
  { title:'中小企業等事業再構築促進補助金（令和6年度版）', slug:'saikouchi-r6',
    amount_max:3000, amount_rate:'1/2〜2/3', deadline:'2025-06-30', status:'公募中',
    agency:'中小企業庁', target:'中小企業・中堅企業', region:'全国',
    subsidy_type:'補助金', industries:['製造業','サービス業'], purposes:['設備投資','新商品開発'],
    excerpt:'令和6年度版の事業再構築補助金。新分野への展開や業態転換を支援します。' },
  { title:'J-Startup支援（NEDO Start-up支援プログラム）', slug:'nedo-startup-shien',
    amount_max:5000, amount_rate:'2/3〜3/4', deadline:'2025-05-31', status:'公募中',
    agency:'国立研究開発法人新エネルギー・産業技術総合開発機構（NEDO）', target:'スタートアップ・中小企業', region:'全国',
    subsidy_type:'補助金', industries:['IT・情報通信業','製造業'], purposes:['研究開発','起業・創業'],
    excerpt:'スタートアップが取り組む革新的な技術開発を支援。実証実験・POC・製品化に向けた研究開発費を補助します。' },
];

// BLOCK 2: 都道府県別（47×2）
const PREF_TEMPLATES = [
  { titleTmpl:'{pref}中小企業設備投資補助金', slugTmpl:'{slug}-chusho-setsubi-hojo',
    amount_max:500, amount_rate:'1/2', deadline:'2025-03-31', status:'公募中',
    target:'中小企業', subsidy_type:'補助金', purposes:['設備投資','生産性向上'],
    excerptTmpl:'{pref}内の中小企業が生産性向上のための設備投資を行う際に費用を補助します。' },
  { titleTmpl:'{pref}小規模事業者販路開拓補助金', slugTmpl:'{slug}-shoukibo-hanro-hojo',
    amount_max:100, amount_rate:'2/3', deadline:'2025-05-31', status:'公募中',
    target:'小規模事業者', subsidy_type:'補助金', purposes:['販路拡大','ブランディング'],
    excerptTmpl:'{pref}の小規模事業者が行う販路開拓・PRのための費用を補助します。' },
];

// BLOCK 3: 業種別（15×4）
const INDUSTRY_SUBSIDIES = [
  { industry:'製造業', en:'manufacturing', items:[
    { title:'製造業スマート工場化支援補助金', amount:2000, purposes:['IT導入','デジタル化'] },
    { title:'製造業カーボンニュートラル設備導入補助金', amount:3000, purposes:['省エネ・環境対策'] },
    { title:'製造業新製品開発支援補助金', amount:1500, purposes:['研究開発','新商品開発'] },
    { title:'製造業人材育成・技能継承支援助成金', amount:100, purposes:['人材育成'] },
  ]},
  { industry:'IT・情報通信業', en:'it', items:[
    { title:'IT企業海外展開支援補助金', amount:500, purposes:['海外展開'] },
    { title:'ITスタートアップ実証実験補助金', amount:1000, purposes:['研究開発','起業・創業'] },
    { title:'SaaS・クラウドサービス開発支援補助金', amount:800, purposes:['新商品開発','IT導入'] },
    { title:'IT人材確保・育成支援助成金', amount:200, purposes:['人材育成'] },
  ]},
  { industry:'小売業', en:'retail', items:[
    { title:'小売業EC化・デジタル化支援補助金', amount:300, purposes:['IT導入','デジタル化'] },
    { title:'小売業キャッシュレス決済導入補助金', amount:100, purposes:['IT導入'] },
    { title:'地域商店街活性化補助金', amount:500, purposes:['販路拡大'] },
    { title:'小売業インバウンド対応強化補助金', amount:200, purposes:['海外展開'] },
  ]},
  { industry:'飲食業', en:'restaurant', items:[
    { title:'飲食店HACCP対応設備導入補助金', amount:200, purposes:['設備投資'] },
    { title:'飲食店テイクアウト・デリバリー事業化補助金', amount:150, purposes:['販路拡大'] },
    { title:'飲食店省エネ厨房設備補助金', amount:300, purposes:['省エネ・環境対策'] },
    { title:'飲食業外国語メニュー・多言語化支援補助金', amount:50, purposes:['海外展開'] },
  ]},
  { industry:'建設業', en:'construction', items:[
    { title:'建設業BIM/CIM導入支援補助金', amount:500, purposes:['IT導入','デジタル化'] },
    { title:'建設業担い手確保・育成支援補助金', amount:200, purposes:['人材育成','雇用創出'] },
    { title:'建設現場ICT活用促進補助金', amount:300, purposes:['IT導入','生産性向上'] },
    { title:'建設業事業承継支援補助金', amount:300, purposes:['事業承継'] },
  ]},
  { industry:'農業', en:'agriculture', items:[
    { title:'スマート農業技術開発・実証事業補助金', amount:3000, purposes:['IT導入','研究開発'] },
    { title:'農業経営規模拡大支援補助金', amount:1000, purposes:['設備投資'] },
    { title:'農産物6次産業化推進補助金', amount:500, purposes:['新商品開発','販路拡大'] },
    { title:'有機農業推進支援事業補助金', amount:200, purposes:['省エネ・環境対策'] },
  ]},
  { industry:'医療・介護', en:'medical', items:[
    { title:'医療機関DX推進補助金（電子カルテ等）', amount:1000, purposes:['IT導入','デジタル化'] },
    { title:'介護施設ICT化支援補助金', amount:260, purposes:['IT導入'] },
    { title:'地域医療確保支援補助金', amount:500, purposes:['設備投資'] },
    { title:'介護人材確保・定着支援助成金', amount:200, purposes:['人材育成','雇用創出'] },
  ]},
  { industry:'観光・宿泊業', en:'tourism', items:[
    { title:'観光地域づくり法人（DMO）形成支援補助金', amount:2000, purposes:['販路拡大'] },
    { title:'宿泊施設バリアフリー化改修補助金', amount:1000, purposes:['設備投資'] },
    { title:'観光コンテンツ開発支援補助金', amount:500, purposes:['新商品開発'] },
    { title:'宿泊業省エネ設備導入補助金', amount:300, purposes:['省エネ・環境対策'] },
  ]},
  { industry:'運輸業', en:'transport', items:[
    { title:'運輸業EV・FCVトラック導入補助金', amount:2000, purposes:['省エネ・環境対策','設備投資'] },
    { title:'物流DX推進支援補助金', amount:500, purposes:['IT導入','デジタル化'] },
    { title:'運輸業ドライバー不足対策補助金', amount:300, purposes:['人材育成','雇用創出'] },
    { title:'運輸業安全対策設備整備補助金', amount:400, purposes:['設備投資'] },
  ]},
  { industry:'教育・研修業', en:'education', items:[
    { title:'民間教育機関デジタル化支援補助金', amount:200, purposes:['IT導入','デジタル化'] },
    { title:'eラーニング開発・普及支援補助金', amount:300, purposes:['新商品開発','IT導入'] },
    { title:'職業訓練校設備整備支援補助金', amount:500, purposes:['設備投資'] },
    { title:'学習塾等教育機器導入補助金', amount:100, purposes:['設備投資','IT導入'] },
  ]},
  { industry:'サービス業', en:'service', items:[
    { title:'サービス業生産性革命推進補助金', amount:500, purposes:['IT導入','生産性向上'] },
    { title:'サービス業海外展開支援補助金', amount:300, purposes:['海外展開'] },
    { title:'サービス業人材育成促進助成金', amount:150, purposes:['人材育成'] },
    { title:'サービス業バリアフリー化支援補助金', amount:200, purposes:['設備投資'] },
  ]},
  { industry:'不動産業', en:'realestate', items:[
    { title:'不動産業DX化推進補助金', amount:200, purposes:['IT導入','デジタル化'] },
    { title:'空き家・空き店舗活用リノベーション補助金', amount:300, purposes:['設備投資'] },
    { title:'賃貸住宅省エネ改修支援補助金', amount:500, purposes:['省エネ・環境対策'] },
    { title:'不動産仲介業電子契約化支援補助金', amount:100, purposes:['IT導入','デジタル化'] },
  ]},
  { industry:'卸売業', en:'wholesale', items:[
    { title:'卸売業EDI・物流効率化補助金', amount:500, purposes:['IT導入','生産性向上'] },
    { title:'卸売業海外市場開拓支援補助金', amount:300, purposes:['海外展開'] },
    { title:'卸売業倉庫自動化・省人化設備補助金', amount:1000, purposes:['設備投資','IT導入'] },
    { title:'卸売業グリーン物流推進補助金', amount:400, purposes:['省エネ・環境対策'] },
  ]},
  { industry:'林業・水産業', en:'forestry', items:[
    { title:'林業成長産業化地域創出モデル事業補助金', amount:1000, purposes:['設備投資','研究開発'] },
    { title:'水産業スマート化推進補助金', amount:500, purposes:['IT導入','デジタル化'] },
    { title:'水産物ブランド化・高付加価値化支援補助金', amount:200, purposes:['ブランディング','販路拡大'] },
    { title:'林業・木材産業機械装備支援補助金', amount:1500, purposes:['設備投資'] },
  ]},
  { industry:'金融業', en:'finance', items:[
    { title:'地域金融機関デジタル化推進補助金', amount:500, purposes:['IT導入','デジタル化'] },
    { title:'信用金庫・信用組合地域貢献活動補助金', amount:200, purposes:['販路拡大'] },
    { title:'金融機関サイバーセキュリティ強化補助金', amount:300, purposes:['IT導入'] },
    { title:'地域金融機関事業承継支援業務強化補助金', amount:150, purposes:['事業承継'] },
  ]},
];

// BLOCK 4: 目的別（15×4）
const PURPOSE_SUBSIDIES = [
  { purpose:'設備投資', en:'investment', items:[
    { title:'中小企業省力化投資補助金（カタログ型）', amount:1500, industries:['製造業','小売業'] },
    { title:'革新的設備投資等支援補助金', amount:3000, industries:['製造業'] },
    { title:'生産効率向上設備導入補助金', amount:1000, industries:['製造業','建設業'] },
    { title:'デジタル機器・ロボット導入補助金', amount:2000, industries:['製造業','IT・情報通信業'] },
  ]},
  { purpose:'IT導入', en:'it-introduction', items:[
    { title:'クラウド活用・DX推進補助金', amount:300, industries:['IT・情報通信業','小売業'] },
    { title:'AI活用支援補助金', amount:500, industries:['IT・情報通信業','製造業'] },
    { title:'RPA・業務自動化推進補助金', amount:200, industries:['サービス業','金融業'] },
    { title:'サイバーセキュリティ対策支援補助金', amount:100, industries:['IT・情報通信業'] },
  ]},
  { purpose:'販路拡大', en:'sales-expansion', items:[
    { title:'新市場開拓・販路開拓補助金', amount:300, industries:['小売業','サービス業'] },
    { title:'オンラインショップ開設・EC強化補助金', amount:200, industries:['小売業','製造業'] },
    { title:'ブランディング・PRコンテンツ制作補助金', amount:150, industries:['サービス業'] },
    { title:'BtoB新規顧客開拓支援補助金', amount:100, industries:['製造業','卸売業'] },
  ]},
  { purpose:'研究開発', en:'rd', items:[
    { title:'中小企業技術革新制度（SBIR）補助金', amount:10000, industries:['IT・情報通信業','製造業'] },
    { title:'戦略的基盤技術高度化支援事業（サポイン）', amount:9750, industries:['製造業'] },
    { title:'産学官連携研究開発推進補助金', amount:5000, industries:['製造業','IT・情報通信業'] },
    { title:'ベンチャー企業等新事業創出支援補助金', amount:2000, industries:['IT・情報通信業'] },
  ]},
  { purpose:'人材育成', en:'hr-training', items:[
    { title:'テクノロジー人材育成補助金', amount:100, industries:['IT・情報通信業','製造業'] },
    { title:'デジタルスキル習得支援助成金', amount:50, industries:['サービス業'] },
    { title:'高度外国人材活用支援補助金', amount:150, industries:['IT・情報通信業'] },
    { title:'中小企業リスキリング支援補助金', amount:80, industries:['製造業','サービス業'] },
  ]},
  { purpose:'省エネ・環境対策', en:'eco', items:[
    { title:'ZEB（ネット・ゼロ・エネルギー・ビル）補助金', amount:5000, industries:['建設業','不動産業'] },
    { title:'EV充電インフラ整備補助金', amount:300, industries:['運輸業','観光・宿泊業'] },
    { title:'廃棄物削減・リサイクル推進補助金', amount:500, industries:['製造業','農業'] },
    { title:'脱炭素移行支援補助金（GX）', amount:10000, industries:['製造業'] },
  ]},
  { purpose:'事業承継', en:'succession', items:[
    { title:'第三者承継支援補助金', amount:300, industries:['製造業','小売業'] },
    { title:'M&A費用支援補助金（仲介手数料等）', amount:200, industries:['製造業','サービス業'] },
    { title:'後継者育成支援助成金', amount:100, industries:['製造業','農業'] },
    { title:'経営者高齢化対応廃業・清算費用補助金', amount:150, industries:['小売業','サービス業'] },
  ]},
  { purpose:'起業・創業', en:'startup', items:[
    { title:'スタートアップ創出促進補助金', amount:200, industries:['IT・情報通信業'] },
    { title:'女性・若者・シニア起業家支援補助金', amount:150, industries:['サービス業','小売業'] },
    { title:'社会起業家（ソーシャルビジネス）支援補助金', amount:300, industries:['教育・研修業','サービス業'] },
    { title:'フランチャイズ開業支援補助金', amount:200, industries:['飲食業','小売業'] },
  ]},
  { purpose:'海外展開', en:'global', items:[
    { title:'JETRO輸出有望案件発掘・育成事業補助金', amount:300, industries:['製造業','農業'] },
    { title:'中小企業等海外展開支援補助金（JAPANブランド）', amount:500, industries:['製造業','小売業'] },
    { title:'越境EC・デジタルマーケティング支援補助金', amount:200, industries:['小売業','IT・情報通信業'] },
    { title:'海外規格・認証取得支援補助金', amount:150, industries:['製造業'] },
  ]},
  { purpose:'雇用創出', en:'employment', items:[
    { title:'地域雇用開発助成金', amount:200, industries:['製造業','農業'] },
    { title:'障害者雇用推進助成金', amount:240, industries:['製造業','サービス業'] },
    { title:'UIJターン就職支援補助金', amount:100, industries:['製造業','農業'] },
    { title:'在宅勤務・テレワーク環境整備補助金', amount:150, industries:['IT・情報通信業','サービス業'] },
  ]},
  { purpose:'デジタル化', en:'digitalization', items:[
    { title:'電子インボイス対応支援補助金', amount:50, industries:['小売業','卸売業'] },
    { title:'電子帳簿保存法対応支援補助金', amount:30, industries:['製造業','小売業'] },
    { title:'ペーパーレス化推進補助金', amount:80, industries:['製造業','サービス業'] },
    { title:'IoT・センサー活用推進補助金', amount:500, industries:['製造業','農業'] },
  ]},
  { purpose:'ブランディング', en:'branding', items:[
    { title:'地域ブランド・産地PR支援補助金', amount:200, industries:['農業','製造業'] },
    { title:'中小企業ロゴ・VI策定支援補助金', amount:50, industries:['サービス業'] },
    { title:'展示会・見本市出展支援補助金', amount:100, industries:['製造業','小売業'] },
    { title:'ウェブサイト構築・SEO支援補助金', amount:100, industries:['サービス業','小売業'] },
  ]},
  { purpose:'新商品開発', en:'product-dev', items:[
    { title:'農商工連携新商品開発支援補助金', amount:500, industries:['農業','製造業'] },
    { title:'ヘルスケア・医療機器新製品開発補助金', amount:2000, industries:['医療・介護'] },
    { title:'食品新商品・機能性食品開発支援補助金', amount:300, industries:['農業','製造業'] },
    { title:'クリエイティブ産業新サービス開発補助金', amount:200, industries:['IT・情報通信業'] },
  ]},
  { purpose:'生産性向上', en:'productivity', items:[
    { title:'中小企業省力化投資補助金（専門家活用型）', amount:750, industries:['製造業','サービス業'] },
    { title:'サービス業業務改善・自動化補助金', amount:300, industries:['サービス業'] },
    { title:'物流業2024年問題対応支援補助金', amount:500, industries:['運輸業'] },
    { title:'建設業生産性向上・ICT活用支援補助金', amount:300, industries:['建設業'] },
  ]},
  { purpose:'感染症対策', en:'infection-control', items:[
    { title:'飲食業感染症対策設備導入補助金', amount:100, industries:['飲食業'] },
    { title:'医療機関感染症対策強化補助金', amount:500, industries:['医療・介護'] },
    { title:'宿泊施設感染症対策整備補助金', amount:200, industries:['観光・宿泊業'] },
    { title:'感染症対応BCP策定支援補助金', amount:50, industries:['製造業','サービス業'] },
  ]},
];

// ==============================
// 全補助金データを組み立て
// ==============================
const allSubsidies = [];

// BLOCK1
for (const s of NATIONAL) {
  allSubsidies.push({
    title: s.title, slug: s.slug,
    excerpt: s.excerpt,
    status: s.status, region: s.region,
    subsidy_type: s.subsidy_type,
    industries: s.industries, purposes: s.purposes,
    meta: {
      hj_amount_max: String(s.amount_max),
      hj_amount_rate: s.amount_rate,
      hj_deadline: s.deadline,
      hj_status: s.status,
      hj_agency: s.agency,
      hj_target: s.target,
      hj_region: s.region,
      hj_fiscal_year: '2024',
    },
  });
}

// BLOCK2
for (const pref of PREFECTURES) {
  const prefEn = PREF_SLUGS[pref] || toSlug(pref);
  for (const tmpl of PREF_TEMPLATES) {
    allSubsidies.push({
      title: tmpl.titleTmpl.replace('{pref}', pref),
      slug: tmpl.slugTmpl.replace('{slug}', prefEn),
      excerpt: tmpl.excerptTmpl.replace('{pref}', pref),
      subsidy_type: tmpl.subsidy_type,
      industries: [],
      purposes: tmpl.purposes,
      meta: {
        hj_amount_max: String(tmpl.amount_max),
        hj_amount_rate: tmpl.amount_rate,
        hj_deadline: tmpl.deadline,
        hj_status: tmpl.status,
        hj_agency: pref,
        hj_target: tmpl.target,
        hj_region: pref,
        hj_fiscal_year: '2024',
      },
    });
  }
}

// BLOCK3
for (const ig of INDUSTRY_SUBSIDIES) {
  for (const item of ig.items) {
    const slug = ig.en + '-' + toSlug(item.title);
    allSubsidies.push({
      title: item.title, slug,
      excerpt: `${ig.industry}向けの補助金です。最大${item.amount}万円を補助します。`,
      subsidy_type: '補助金',
      industries: [ig.industry],
      purposes: item.purposes,
      meta: {
        hj_amount_max: String(item.amount),
        hj_amount_rate: '1/2',
        hj_deadline: '2025-03-31',
        hj_status: '公募中',
        hj_agency: '経済産業省・関連省庁',
        hj_target: `${ig.industry}事業者`,
        hj_region: '全国',
        hj_fiscal_year: '2024',
      },
    });
  }
}

// BLOCK4
for (const pg of PURPOSE_SUBSIDIES) {
  for (const item of pg.items) {
    const slug = pg.en + '-' + toSlug(item.title);
    allSubsidies.push({
      title: item.title, slug,
      excerpt: `${pg.purpose}を目的とした補助金。最大${item.amount}万円を補助します。`,
      subsidy_type: '補助金',
      industries: item.industries,
      purposes: [pg.purpose],
      meta: {
        hj_amount_max: String(item.amount),
        hj_amount_rate: '1/2〜2/3',
        hj_deadline: '2025-03-31',
        hj_status: '公募中',
        hj_agency: '各省庁',
        hj_target: '中小企業・小規模事業者',
        hj_region: '全国',
        hj_fiscal_year: '2024',
      },
    });
  }
}

console.log(`総補助金数: ${allSubsidies.length} 件`);

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

// スラッグ重複チェック
async function slugExists(slug) {
  const data = await wpGet(`subsidies?slug=${encodeURIComponent(slug)}&status=any`);
  return Array.isArray(data) && data.length > 0;
}

// タクソノミーterm取得または作成
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
      console.log(`[DRY-RUN] POST: ${s.title} (${s.slug})`);
      ok++;
      continue;
    }

    // タクソノミーterms解決
    const typeTermIds     = s.subsidy_type ? [await getOrCreateTerm('subsidy_type', s.subsidy_type)].filter(Boolean) : [];
    const industryTermIds = await Promise.all((s.industries || []).map(i => getOrCreateTerm('subsidy_industry', i)));
    const purposeTermIds  = await Promise.all((s.purposes  || []).map(p => getOrCreateTerm('subsidy_purpose',  p)));

    const content = `<!-- wp:paragraph -->\n<p>${s.excerpt || ''}</p>\n<!-- /wp:paragraph -->`;

    const payload = {
      title:   s.title,
      slug:    s.slug,
      status:  'publish',
      excerpt: s.excerpt || '',
      content,
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
  console.log(`合計補助金数: ${limited.length}件処理`);
}

main().catch(e => { console.error(e); process.exit(1); });
