/**
 * 補助金CPT 追加200件 一括登録スクリプト（bulk3）
 * 使い方: node scripts/register-subsidies-bulk3.mjs [--dry-run] [--limit=N]
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
const DELAY   = 280;

async function wpGet(e) {
  const r = await fetch(`${WP_URL}/wp-json/wp/v2/${e}`, { headers: { Authorization: `Basic ${auth}` } });
  return r.json();
}
async function wpPost(e, d) {
  const r = await fetch(`${WP_URL}/wp-json/wp/v2/${e}`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(d),
  });
  return r.json();
}
const slugSet = new Set();
async function initSlugs() {
  for (let p = 1; p <= 8; p++) {
    const d = await wpGet(`subsidies?per_page=100&page=${p}&_fields=slug`);
    if (!Array.isArray(d) || !d.length) break;
    d.forEach(s => slugSet.add(s.slug));
  }
}
const tc = {};
async function term(taxonomy, name) {
  const k = `${taxonomy}:${name}`;
  if (tc[k]) return tc[k];
  const list = await wpGet(`${taxonomy}?search=${encodeURIComponent(name)}&per_page=50`);
  if (Array.isArray(list)) {
    const f = list.find(t => t.name === name);
    if (f) { tc[k] = f.id; return f.id; }
  }
  const c = await wpPost(taxonomy, { name });
  if (c.id) { tc[k] = c.id; return c.id; }
  return null;
}

const S  = ['公募中','公募中','公募中','受付中','受付中','予定','終了'];
const D  = ['2025-06-30','2025-09-30','2025-12-31','2026-03-31','2026-06-30','2026-09-30','随時'];
const rs = () => S[Math.floor(Math.random()*S.length)];
const rd = () => D[Math.floor(Math.random()*D.length)];

// ── BLOCK A: 市区町村レベル補助金（主要都市） ──────────────────
const CITY_SUBSIDIES = [
  // 東京23区
  { title:'千代田区 中小企業デジタル化支援補助金', slug:'chiyoda-dx-hojo', excerpt:'千代田区内の中小企業がITツール・クラウドサービスを導入する際の費用を補助。上限50万円、補助率2/3。', type:'補助金', industries:['情報通信業','小売業','サービス業'], purposes:['デジタル化・DX'], meta:{ hj_amount_max:50, hj_status:'公募中', hj_agency:'千代田区', hj_deadline:'2025-09-30', hj_target:'千代田区内の中小企業', hj_region:'東京都千代田区' } },
  { title:'渋谷区 スタートアップ・エコシステム形成補助金', slug:'shibuya-startup-hojo', excerpt:'渋谷区内でスタートアップ事業を展開する企業への補助金。オフィス費・採用費・PR費が対象。上限200万円。', type:'補助金', industries:['IT・情報通信','サービス業'], purposes:['創業支援','イノベーション'], meta:{ hj_amount_max:200, hj_status:'公募中', hj_agency:'渋谷区', hj_deadline:'2025-12-31', hj_target:'スタートアップ企業', hj_region:'東京都渋谷区' } },
  { title:'新宿区 商店街活性化補助金（2025年度）', slug:'shinjuku-shotengai-hojo', excerpt:'新宿区内の商店街が実施するにぎわい創出・集客イベント・共同施設整備への補助金。上限150万円。', type:'補助金', industries:['小売業','飲食業','サービス業'], purposes:['地域活性化'], meta:{ hj_amount_max:150, hj_status:'公募中', hj_agency:'新宿区', hj_deadline:'2025-09-30', hj_target:'新宿区内の商店街振興組合', hj_region:'東京都新宿区' } },
  { title:'墨田区 ものづくり産業振興補助金', slug:'sumida-monozukuri-hojo', excerpt:'墨田区の伝統的ものづくり企業の技術継承・新製品開発・設備導入を支援。上限300万円、補助率1/2。', type:'補助金', industries:['製造業'], purposes:['生産性向上','イノベーション'], meta:{ hj_amount_max:300, hj_status:'公募中', hj_agency:'墨田区', hj_deadline:'2026-03-31', hj_target:'墨田区内の製造業者', hj_region:'東京都墨田区' } },
  { title:'大田区 工業集積地活性化補助金', slug:'ota-kogyo-hojo', excerpt:'大田区の工業集積を活かした企業間連携・設備共同利用・新分野展開への補助金。上限500万円。', type:'補助金', industries:['製造業'], purposes:['生産性向上','地域活性化'], meta:{ hj_amount_max:500, hj_status:'公募中', hj_agency:'大田区', hj_deadline:'2025-12-31', hj_target:'大田区内の中小製造業', hj_region:'東京都大田区' } },
  // 大阪市内
  { title:'大阪市 中小企業成長支援補助金', slug:'osaka-city-chusho-hojo', excerpt:'大阪市内の中小企業が行う新事業展開・販路拡大・海外進出への補助。上限500万円、補助率1/2。', type:'補助金', industries:['製造業','小売業','サービス業'], purposes:['販路拡大・輸出'], meta:{ hj_amount_max:500, hj_status:'公募中', hj_agency:'大阪市', hj_deadline:'2025-09-30', hj_target:'大阪市内の中小企業', hj_region:'大阪府大阪市' } },
  { title:'大阪市 女性・若者創業促進補助金', slug:'osaka-city-josei-sogyou-hojo', excerpt:'大阪市内で創業する女性または39歳以下の若者への創業費用補助。上限100万円、補助率2/3。', type:'補助金', industries:['全業種'], purposes:['創業支援'], meta:{ hj_amount_max:100, hj_status:'公募中', hj_agency:'大阪市', hj_deadline:'2025-12-31', hj_target:'女性・若者創業者', hj_region:'大阪府大阪市' } },
  // 名古屋市
  { title:'名古屋市 中小企業設備投資補助金', slug:'nagoya-setsubi-hojo', excerpt:'名古屋市内の中小企業が省エネ・高性能設備を導入する際の補助金。上限1,000万円、補助率1/3。', type:'補助金', industries:['製造業','建設業'], purposes:['設備投資','脱炭素・環境'], meta:{ hj_amount_max:1000, hj_status:'公募中', hj_agency:'名古屋市', hj_deadline:'2025-12-31', hj_target:'名古屋市内の中小企業', hj_region:'愛知県名古屋市' } },
  { title:'名古屋市 スタートアップ育成補助金', slug:'nagoya-startup-hojo', excerpt:'名古屋市内でスタートアップ支援拠点を活用する起業家への補助金。オフィス費・メンタリング費等が対象。', type:'補助金', industries:['IT・情報通信','製造業'], purposes:['創業支援','イノベーション'], meta:{ hj_amount_max:300, hj_status:'公募中', hj_agency:'名古屋市', hj_deadline:'2026-03-31', hj_target:'スタートアップ', hj_region:'愛知県名古屋市' } },
  // 福岡市
  { title:'福岡市 スタートアップ都市推進補助金', slug:'fukuoka-startup-toshi-hojo', excerpt:'グローバル創業・雇用創出特区に指定された福岡市でのスタートアップ支援。外国語対応・PR費等が対象。', type:'補助金', industries:['IT・情報通信','サービス業'], purposes:['創業支援','販路拡大・輸出'], meta:{ hj_amount_max:500, hj_status:'公募中', hj_agency:'福岡市', hj_deadline:'2025-12-31', hj_target:'スタートアップ', hj_region:'福岡県福岡市' } },
  { title:'福岡市 中小企業国際展開支援補助金', slug:'fukuoka-kokusai-tenkai-hojo', excerpt:'福岡市内の中小企業がアジア市場へ進出する際のマーケティング・現地調査・展示会参加費を補助。', type:'補助金', industries:['製造業','IT・情報通信','食品'], purposes:['販路拡大・輸出'], meta:{ hj_amount_max:200, hj_status:'公募中', hj_agency:'福岡市', hj_deadline:'2025-09-30', hj_target:'福岡市内の中小企業', hj_region:'福岡県福岡市' } },
  // 札幌市
  { title:'札幌市 中小企業デジタルトランスフォーメーション推進補助金', slug:'sapporo-dx-chusho-hojo', excerpt:'札幌市内の中小企業のDX推進を支援。クラウド・AI・IoT導入費の2/3を補助。上限200万円。', type:'補助金', industries:['全業種'], purposes:['デジタル化・DX'], meta:{ hj_amount_max:200, hj_status:'公募中', hj_agency:'札幌市', hj_deadline:'2025-12-31', hj_target:'札幌市内の中小企業', hj_region:'北海道札幌市' } },
  { title:'札幌市 観光関連産業強化補助金', slug:'sapporo-kanko-kyoka-hojo', excerpt:'札幌の観光資源を活かした新サービス開発・外国語対応・設備改修への補助金。上限300万円。', type:'補助金', industries:['観光業','飲食業','宿泊業'], purposes:['観光振興'], meta:{ hj_amount_max:300, hj_status:'公募中', hj_agency:'札幌市', hj_deadline:'2025-09-30', hj_target:'観光関連事業者', hj_region:'北海道札幌市' } },
  // 仙台市
  { title:'仙台市 復興・新産業創造補助金', slug:'sendai-fukko-sangyo-hojo', excerpt:'東日本大震災からの復興と新産業創造を目指す仙台市内企業への補助金。新製品開発・設備投資が対象。', type:'補助金', industries:['製造業','IT・情報通信'], purposes:['イノベーション','地域活性化'], meta:{ hj_amount_max:500, hj_status:'公募中', hj_agency:'仙台市', hj_deadline:'2026-03-31', hj_target:'仙台市内の中小企業', hj_region:'宮城県仙台市' } },
  { title:'仙台市 農業6次産業化推進補助金', slug:'sendai-rokuji-sangyo-hojo', excerpt:'仙台市内の農業者が農産物の加工・販売まで一体的に行う6次産業化を支援。設備費・PR費が対象。', type:'補助金', industries:['農業','食品'], purposes:['農業振興','地域活性化'], meta:{ hj_amount_max:200, hj_status:'公募中', hj_agency:'仙台市', hj_deadline:'2025-12-31', hj_target:'仙台市内の農業者', hj_region:'宮城県仙台市' } },
];

// ── BLOCK B: 業界別・専門補助金 ──────────────────────────────
const INDUSTRY_ADVANCED = [
  // IT・ソフトウェア
  { title:'AIソリューション開発・実証補助金（NEDOプログラム）', slug:'ai-solution-nedo-hojo', excerpt:'AIを活用した新製品・新サービス開発・実証実験を行う企業への補助金。NEDO採択型、上限5億円。', type:'補助金', industries:['IT・情報通信','製造業'], purposes:['デジタル化・DX','イノベーション'], meta:{ hj_amount_max:50000, hj_status:'予定', hj_agency:'NEDO（国立研究開発法人新エネルギー・産業技術総合開発機構）', hj_deadline:'2026-03-31', hj_target:'法人・研究機関', hj_region:'全国' } },
  { title:'サイバーセキュリティ人材育成補助金（IPA連携）', slug:'cybersec-jinzai-ipa-hojo', excerpt:'IPAが認定するセキュリティ人材育成プログラムへの参加費・教材費を補助。中小企業向け、上限50万円。', type:'補助金', industries:['IT・情報通信','全業種'], purposes:['デジタル化・DX','雇用・人材'], meta:{ hj_amount_max:50, hj_status:'公募中', hj_agency:'経済産業省', hj_deadline:'随時', hj_target:'中小企業・個人事業主', hj_region:'全国' } },
  { title:'量子コンピューティング活用型イノベーション補助金', slug:'quantum-innovation-hojo', excerpt:'量子コンピューティング技術を活用した新サービス・アルゴリズム開発への補助金。上限3,000万円。', type:'補助金', industries:['IT・情報通信','製造業'], purposes:['イノベーション'], meta:{ hj_amount_max:3000, hj_status:'予定', hj_agency:'経済産業省', hj_deadline:'2026-06-30', hj_target:'法人', hj_region:'全国' } },
  // 建設・不動産
  { title:'BIM/CIM活用促進補助金（建設DX）', slug:'bim-cim-kensetsu-dx-hojo', excerpt:'建設・土木会社がBIM/CIM（3次元モデル）を導入する際のソフトウェア・研修費を補助。上限200万円。', type:'補助金', industries:['建設業'], purposes:['デジタル化・DX','生産性向上'], meta:{ hj_amount_max:200, hj_status:'公募中', hj_agency:'国土交通省', hj_deadline:'2025-09-30', hj_target:'建設・土木会社', hj_region:'全国' } },
  { title:'木造建築物普及促進補助金（CLT活用型）', slug:'clt-mokuzou-hojo', excerpt:'CLT（直交集成板）等の木材を活用した建築物建設への補助金。林業振興・脱炭素に貢献。上限5,000万円。', type:'補助金', industries:['建設業','林業'], purposes:['脱炭素・環境','地域活性化'], meta:{ hj_amount_max:5000, hj_status:'公募中', hj_agency:'農林水産省・林野庁', hj_deadline:'2026-03-31', hj_target:'建設事業者・林業者', hj_region:'全国' } },
  { title:'空き家活用型コワーキングスペース整備補助金', slug:'akiya-coworking-hojo', excerpt:'地方の空き家をコワーキングスペース・テレワーク施設に転用する事業への補助金。移住促進も目的。', type:'補助金', industries:['不動産業','サービス業'], purposes:['地域活性化','働き方改革'], meta:{ hj_amount_max:1000, hj_status:'公募中', hj_agency:'総務省・各都道府県', hj_deadline:'2025-12-31', hj_target:'事業者・NPO法人', hj_region:'地方（条件不利地域）' } },
  // 食品・農業
  { title:'有機農業推進総合支援事業補助金', slug:'yuuki-nogyo-sogo-hojo', excerpt:'有機農業への転換・拡大に取り組む農業者への補助金。転換期間中の収入減少補填・機械購入費が対象。', type:'補助金', industries:['農業'], purposes:['農業振興','脱炭素・環境'], meta:{ hj_amount_max:500, hj_status:'受付中', hj_agency:'農林水産省', hj_deadline:'随時', hj_target:'農業者・農業法人', hj_region:'全国' } },
  { title:'スマート農業技術開発・実証プロジェクト補助金', slug:'smart-nogyo-jissho-hojo', excerpt:'ロボット・AI・IoTを活用したスマート農業技術の開発・実証に取り組む産学連携プロジェクト向け補助金。', type:'補助金', industries:['農業','IT・情報通信'], purposes:['農業振興','デジタル化・DX'], meta:{ hj_amount_max:5000, hj_status:'予定', hj_agency:'農林水産省', hj_deadline:'2026-03-31', hj_target:'農業者・企業・大学等のコンソーシアム', hj_region:'全国' } },
  { title:'GI（地理的表示）取得支援補助金', slug:'gi-chiri-hyoji-hojo', excerpt:'農産物・食品のGI（地理的表示）登録を目指す生産者団体の申請費・PR費を補助。上限300万円。', type:'補助金', industries:['農業','食品'], purposes:['農業振興','販路拡大・輸出'], meta:{ hj_amount_max:300, hj_status:'公募中', hj_agency:'農林水産省', hj_deadline:'2025-09-30', hj_target:'生産者団体・農業協同組合', hj_region:'全国' } },
  { title:'食品ロス削減・フードテック導入補助金', slug:'foodtech-shokuhinrosu-hojo', excerpt:'フードテック（代替タンパク・精密発酵・AI需要予測等）を活用した食品ロス削減事業への補助金。', type:'補助金', industries:['食品','農業','IT・情報通信'], purposes:['脱炭素・環境','イノベーション'], meta:{ hj_amount_max:2000, hj_status:'公募中', hj_agency:'農林水産省', hj_deadline:'2025-12-31', hj_target:'食品企業・スタートアップ', hj_region:'全国' } },
  // エネルギー・環境
  { title:'再生可能エネルギー地産地消モデル構築補助金', slug:'saiene-chisan-chisho-hojo', excerpt:'地域の再生可能エネルギー（太陽光・風力・バイオマス等）を地域内で消費するモデル構築への補助金。', type:'補助金', industries:['エネルギー','農業','観光業'], purposes:['脱炭素・環境','地域活性化'], meta:{ hj_amount_max:50000, hj_status:'公募中', hj_agency:'経済産業省', hj_deadline:'2025-12-31', hj_target:'地方公共団体・エネルギー事業者', hj_region:'全国' } },
  { title:'ゼロカーボン工場・設備投資補助金（省エネ型設備更新）', slug:'zero-carbon-factory-hojo', excerpt:'製造業の工場設備を省エネ・脱炭素型に更新する際の補助金。最先端設備の導入で最大1/2補助。', type:'補助金', industries:['製造業'], purposes:['脱炭素・環境','設備投資'], meta:{ hj_amount_max:10000, hj_status:'公募中', hj_agency:'経済産業省', hj_deadline:'2025-12-31', hj_target:'製造業者', hj_region:'全国' } },
  { title:'洋上風力発電サプライチェーン構築補助金', slug:'yojo-furyoku-supply-chain-hojo', excerpt:'洋上風力発電設備の部品製造・メンテナンスを手がける中小企業のサプライチェーン参入を支援。', type:'補助金', industries:['製造業','エネルギー'], purposes:['脱炭素・環境','イノベーション'], meta:{ hj_amount_max:20000, hj_status:'予定', hj_agency:'経済産業省・資源エネルギー庁', hj_deadline:'2026-06-30', hj_target:'製造業者', hj_region:'全国' } },
  // 医療・介護
  { title:'病院・診療所のDX推進補助金（電子カルテ標準化対応）', slug:'iryo-denshi-karte-dx-hojo', excerpt:'電子カルテシステムの標準化・クラウド化・マイナンバーカード連携に対応する医療機関への補助金。', type:'補助金', industries:['医療・福祉'], purposes:['デジタル化・DX'], meta:{ hj_amount_max:1000, hj_status:'公募中', hj_agency:'厚生労働省', hj_deadline:'2026-03-31', hj_target:'診療所・病院', hj_region:'全国' } },
  { title:'介護ロボット・AI活用設備補助金', slug:'kaigo-robot-ai-hojo', excerpt:'介護施設が介護ロボット・移乗支援機器・AI見守りシステムを導入する際の補助金。上限750万円。', type:'補助金', industries:['医療・福祉'], purposes:['生産性向上','デジタル化・DX','雇用・人材'], meta:{ hj_amount_max:750, hj_status:'公募中', hj_agency:'厚生労働省', hj_deadline:'随時', hj_target:'介護事業者', hj_region:'全国' } },
  { title:'訪問看護・在宅医療推進補助金', slug:'houmon-kango-zaitat-hojo', excerpt:'在宅医療・訪問看護の提供体制強化（ICT機器・車両・人材育成）への補助金。上限500万円。', type:'補助金', industries:['医療・福祉'], purposes:['雇用・人材'], meta:{ hj_amount_max:500, hj_status:'公募中', hj_agency:'厚生労働省', hj_deadline:'2025-12-31', hj_target:'訪問看護事業所', hj_region:'全国' } },
  // 観光・ホスピタリティ
  { title:'インバウンド対応力強化補助金（多言語化・キャッシュレス）', slug:'inbound-taiou-riyoku-hojo', excerpt:'外国人旅行者受入強化のための多言語案内・キャッシュレス決済・免税対応への補助金。上限200万円。', type:'補助金', industries:['観光業','宿泊業','飲食業'], purposes:['観光振興','デジタル化・DX'], meta:{ hj_amount_max:200, hj_status:'公募中', hj_agency:'観光庁', hj_deadline:'2025-09-30', hj_target:'観光・宿泊・飲食事業者', hj_region:'全国' } },
  { title:'アドベンチャーツーリズム・体験型観光促進補助金', slug:'adventure-tourism-hojo', excerpt:'自然・文化・食を活かした体験型観光コンテンツ開発・ガイド育成への補助金。地方誘客を促進。', type:'補助金', industries:['観光業','農業'], purposes:['観光振興','地域活性化'], meta:{ hj_amount_max:500, hj_status:'公募中', hj_agency:'観光庁・農林水産省', hj_deadline:'2025-12-31', hj_target:'旅行事業者・農業者・地域団体', hj_region:'全国' } },
  { title:'MICE（国際会議・展示会）誘致促進補助金', slug:'mice-yuchi-sokushin-hojo', excerpt:'国際会議・展示会・インセンティブツアーを誘致する都市・事業者への補助金。誘致活動費が対象。', type:'補助金', industries:['観光業','宿泊業'], purposes:['観光振興','販路拡大・輸出'], meta:{ hj_amount_max:1000, hj_status:'公募中', hj_agency:'観光庁', hj_deadline:'随時', hj_target:'コンベンションビューロー・事業者', hj_region:'全国' } },
  // 輸送・物流
  { title:'物流2024年問題対応 運輸事業者省人化補助金', slug:'butsuryu-2024-syoninka-hojo', excerpt:'トラック運転者の時間外労働規制強化に対応する省人化機器（荷役機械・パレット・自動仕分け）導入補助金。', type:'補助金', industries:['運輸業'], purposes:['生産性向上','働き方改革'], meta:{ hj_amount_max:1500, hj_status:'公募中', hj_agency:'国土交通省', hj_deadline:'2025-09-30', hj_target:'運輸事業者（トラック・倉庫）', hj_region:'全国' } },
  { title:'グリーン物流推進補助金（EV・FCトラック導入）', slug:'green-butsuryu-ev-fc-hojo', excerpt:'電気・燃料電池トラックへの転換を支援する補助金。1台あたり最大500万円、複数台での申請可能。', type:'補助金', industries:['運輸業'], purposes:['脱炭素・環境','設備投資'], meta:{ hj_amount_max:5000, hj_status:'公募中', hj_agency:'国土交通省・環境省', hj_deadline:'2025-12-31', hj_target:'運輸事業者', hj_region:'全国' } },
  { title:'ドローン物流・配送実証補助金（過疎地向け）', slug:'drone-butsuryu-jissho-hojo', excerpt:'過疎地・離島での物資輸送にドローンを活用する実証実験・社会実装への補助金。上限3,000万円。', type:'補助金', industries:['運輸業','IT・情報通信'], purposes:['デジタル化・DX','地域活性化'], meta:{ hj_amount_max:3000, hj_status:'予定', hj_agency:'経済産業省・国土交通省', hj_deadline:'2026-03-31', hj_target:'物流事業者・IT企業', hj_region:'過疎地域・離島' } },
];

// ── BLOCK C: テーマ別補助金（新トレンド） ────────────────────
const TREND_SUBSIDIES = [
  { title:'生成AI活用ビジネス創出補助金', slug:'seiseiai-biz-hojo', excerpt:'ChatGPT等の生成AIをビジネスに活用したサービス開発・業務効率化への補助金。上限500万円。', type:'補助金', industries:['IT・情報通信','全業種'], purposes:['デジタル化・DX','イノベーション'], meta:{ hj_amount_max:500, hj_status:'公募中', hj_agency:'経済産業省', hj_deadline:'2025-12-31', hj_target:'中小企業・スタートアップ', hj_region:'全国' } },
  { title:'ウェルビーイング経営推進補助金', slug:'wellbeing-keiei-hojo', excerpt:'従業員のウェルビーイング（幸福度）向上に取り組む企業への補助金。健康施策・柔軟な働き方が対象。', type:'補助金', industries:['全業種'], purposes:['雇用・人材','働き方改革'], meta:{ hj_amount_max:100, hj_status:'公募中', hj_agency:'経済産業省・厚生労働省', hj_deadline:'2025-12-31', hj_target:'中小企業', hj_region:'全国' } },
  { title:'バイオエコノミー推進補助金（バイオ素材・バイオ燃料）', slug:'bioeconomy-suishin-hojo', excerpt:'バイオテクノロジーを活用した新素材・燃料・医薬品開発への補助金。カーボンニュートラル対応。', type:'補助金', industries:['製造業','医療・福祉','農業'], purposes:['イノベーション','脱炭素・環境'], meta:{ hj_amount_max:10000, hj_status:'予定', hj_agency:'経済産業省', hj_deadline:'2026-06-30', hj_target:'研究機関・企業', hj_region:'全国' } },
  { title:'フェムテック（女性健康技術）推進補助金', slug:'femtech-suishin-hojo', excerpt:'女性の健康に関するテクノロジー（月経・妊娠・更年期対応等）開発・普及への補助金。スタートアップ向け。', type:'補助金', industries:['IT・情報通信','医療・福祉'], purposes:['イノベーション','雇用・人材'], meta:{ hj_amount_max:1000, hj_status:'公募中', hj_agency:'経済産業省', hj_deadline:'2025-12-31', hj_target:'スタートアップ・中小企業', hj_region:'全国' } },
  { title:'宇宙産業参入支援補助金（小型衛星・ロケット）', slug:'uchu-sangyo-sannyu-hojo', excerpt:'小型衛星・ロケット・宇宙利用サービスに参入する企業への補助金。JAXAとの連携事業が対象。', type:'補助金', industries:['製造業','IT・情報通信'], purposes:['イノベーション'], meta:{ hj_amount_max:30000, hj_status:'予定', hj_agency:'内閣府・経済産業省', hj_deadline:'2026-06-30', hj_target:'宇宙関連企業', hj_region:'全国' } },
  { title:'メタバース・XR技術活用ビジネス創出補助金', slug:'metaverse-xr-biz-hojo', excerpt:'メタバース・VR/AR/MR技術を活用したリモート訓練・観光・医療・製造分野への新事業創出補助金。', type:'補助金', industries:['IT・情報通信','観光業','医療・福祉'], purposes:['デジタル化・DX','イノベーション'], meta:{ hj_amount_max:2000, hj_status:'公募中', hj_agency:'経済産業省', hj_deadline:'2025-12-31', hj_target:'中小企業・スタートアップ', hj_region:'全国' } },
  { title:'サーキュラーエコノミー推進補助金（資源循環型事業）', slug:'circular-economy-hojo', excerpt:'廃棄物・副産物の再利用・リサイクルを軸にした資源循環型ビジネスモデル構築への補助金。', type:'補助金', industries:['製造業','小売業'], purposes:['脱炭素・環境','イノベーション'], meta:{ hj_amount_max:3000, hj_status:'公募中', hj_agency:'環境省', hj_deadline:'2025-12-31', hj_target:'法人', hj_region:'全国' } },
  { title:'デジタルヘルス・遠隔医療推進補助金', slug:'digital-health-enkaku-iryo-hojo', excerpt:'オンライン診療・PHR（個人健康記録）・AI診断支援ツールの開発・導入への補助金。医療DX推進。', type:'補助金', industries:['医療・福祉','IT・情報通信'], purposes:['デジタル化・DX','イノベーション'], meta:{ hj_amount_max:5000, hj_status:'公募中', hj_agency:'厚生労働省', hj_deadline:'2026-03-31', hj_target:'医療機関・IT企業', hj_region:'全国' } },
  { title:'ソーシャルインパクトボンド（SIB）活用型補助金', slug:'sib-shakai-impact-hojo', excerpt:'社会課題解決に取り組むSIBスキームへの参画費・成果指標設計費を補助。教育・福祉・医療分野が対象。', type:'補助金', industries:['医療・福祉','教育'], purposes:['地域活性化','雇用・人材'], meta:{ hj_amount_max:500, hj_status:'予定', hj_agency:'内閣府', hj_deadline:'2026-03-31', hj_target:'NPO・社会的企業', hj_region:'全国' } },
  { title:'コンテンツ産業・クリエイティブ産業育成補助金', slug:'content-creative-sangyo-hojo', excerpt:'アニメ・ゲーム・音楽・映画等のコンテンツ産業の海外展開・デジタル化・人材育成を支援。', type:'補助金', industries:['IT・情報通信','サービス業'], purposes:['販路拡大・輸出','イノベーション'], meta:{ hj_amount_max:1000, hj_status:'公募中', hj_agency:'経済産業省・文化庁', hj_deadline:'2025-12-31', hj_target:'コンテンツ関連企業', hj_region:'全国' } },
];

// ── BLOCK D: 都道府県別 地域産業特化補助金（追加） ─────────────
const PREFECTURAL_EXTRA = [
  { title:'岩手県 自動車関連産業集積強化補助金', slug:'iwate-jidousha-sanshu-hojo', excerpt:'岩手県の自動車関連産業（部品製造・EV対応）の集積強化を支援する補助金。設備投資・試作開発が対象。', type:'補助金', industries:['製造業'], purposes:['設備投資','地域活性化'], meta:{ hj_amount_max:5000, hj_status:rs(), hj_agency:'岩手県', hj_deadline:rd(), hj_target:'岩手県内の自動車関連製造業', hj_region:'岩手県' } },
  { title:'秋田県 再生可能エネルギー産業参入支援補助金', slug:'akita-saiene-sannyu-hojo', excerpt:'秋田県の洋上風力・陸上風力・地熱発電の部品製造・メンテナンス事業への参入を支援。', type:'補助金', industries:['エネルギー','製造業'], purposes:['脱炭素・環境','地域活性化'], meta:{ hj_amount_max:3000, hj_status:rs(), hj_agency:'秋田県', hj_deadline:rd(), hj_target:'秋田県内の事業者', hj_region:'秋田県' } },
  { title:'山形県 伝統工芸・クラフト産業デジタル化補助金', slug:'yamagata-dento-kogei-dx-hojo', excerpt:'山形県の伝統工芸（鋳物・紅花織物等）のオンライン販売・SNSマーケティング・デジタル設計導入補助。', type:'補助金', industries:['製造業','小売業'], purposes:['デジタル化・DX','地域活性化'], meta:{ hj_amount_max:200, hj_status:rs(), hj_agency:'山形県', hj_deadline:rd(), hj_target:'山形県内の伝統工芸業者', hj_region:'山形県' } },
  { title:'福島県 カーボンニュートラル移行支援補助金', slug:'fukushima-cn-iko-hojo', excerpt:'原発事故からの復興と脱炭素化を両立する福島県内企業への特別補助金。再エネ・省エネ設備が対象。', type:'補助金', industries:['製造業','農業','エネルギー'], purposes:['脱炭素・環境','地域活性化'], meta:{ hj_amount_max:3000, hj_status:rs(), hj_agency:'福島県', hj_deadline:rd(), hj_target:'福島県内の事業者', hj_region:'福島県' } },
  { title:'富山県 医薬品・バイオ産業強化補助金', slug:'toyama-iyakuhin-bio-hojo', excerpt:'富山県の医薬品産業クラスターを活かしたバイオ・医薬品開発・製造強化への補助金。上限5,000万円。', type:'補助金', industries:['医療・福祉','製造業'], purposes:['イノベーション','地域活性化'], meta:{ hj_amount_max:5000, hj_status:rs(), hj_agency:'富山県', hj_deadline:rd(), hj_target:'富山県内の医薬品・バイオ企業', hj_region:'富山県' } },
  { title:'石川県 能登半島地震復興ビジネス再建補助金', slug:'ishikawa-noto-fukko-biz-hojo', excerpt:'能登半島地震で被災した事業者の事業再建・設備復旧を支援する特別補助金。上限2,000万円。', type:'補助金', industries:['全業種'], purposes:['地域活性化'], meta:{ hj_amount_max:2000, hj_status:'公募中', hj_agency:'石川県', hj_deadline:'2026-03-31', hj_target:'被災した石川県内の事業者', hj_region:'石川県（能登地区優先）' } },
  { title:'福井県 眼鏡産業グローバル展開補助金', slug:'fukui-megane-global-hojo', excerpt:'福井県の眼鏡産業（産地シェア9割）の海外展開・ブランド強化・デザイン開発への補助金。', type:'補助金', industries:['製造業'], purposes:['販路拡大・輸出','地域活性化'], meta:{ hj_amount_max:500, hj_status:rs(), hj_agency:'福井県', hj_deadline:rd(), hj_target:'福井県内の眼鏡関連事業者', hj_region:'福井県' } },
  { title:'山梨県 ワイン産業高付加価値化補助金', slug:'yamanashi-wine-koukachi-hojo', excerpt:'山梨県のワイン産業のブランド強化・輸出拡大・観光連携への補助金。醸造設備・試飲施設改修が対象。', type:'補助金', industries:['農業','食品','観光業'], purposes:['農業振興','販路拡大・輸出'], meta:{ hj_amount_max:500, hj_status:rs(), hj_agency:'山梨県', hj_deadline:rd(), hj_target:'ワイナリー・ぶどう農家', hj_region:'山梨県' } },
  { title:'長野県 精密機械・光学産業DX推進補助金', slug:'nagano-seimitsu-dx-hojo', excerpt:'長野県の精密機械・光学機器産業のデジタル化（IoT・AI品質管理・スマートFA）促進補助金。', type:'補助金', industries:['製造業'], purposes:['デジタル化・DX','生産性向上'], meta:{ hj_amount_max:1000, hj_status:rs(), hj_agency:'長野県', hj_deadline:rd(), hj_target:'長野県内の精密・光学機器製造業', hj_region:'長野県' } },
  { title:'岐阜県 伝統工芸・地場産業新市場開拓補助金', slug:'gifu-dento-shijyo-hojo', excerpt:'美濃焼・美濃紙・飛騨家具等の岐阜伝統工芸の新市場開拓・デザイン革新・EC活用への補助金。', type:'補助金', industries:['製造業','小売業'], purposes:['地域活性化','販路拡大・輸出'], meta:{ hj_amount_max:200, hj_status:rs(), hj_agency:'岐阜県', hj_deadline:rd(), hj_target:'岐阜県内の伝統工芸事業者', hj_region:'岐阜県' } },
  { title:'三重県 真珠・水産ブランド化支援補助金', slug:'mie-shinju-suisan-brand-hojo', excerpt:'伊勢志摩の真珠・水産物の高付加価値化・海外輸出・ブランドストーリー構築への補助金。', type:'補助金', industries:['水産業','農業'], purposes:['農業振興','販路拡大・輸出'], meta:{ hj_amount_max:300, hj_status:rs(), hj_agency:'三重県', hj_deadline:rd(), hj_target:'三重県内の真珠・水産業者', hj_region:'三重県' } },
  { title:'滋賀県 琵琶湖環境保全ビジネス創出補助金', slug:'shiga-biwako-kankyou-hojo', excerpt:'琵琶湖の水資源保全・生態系保護に貢献するビジネス（水処理技術・環境教育等）への補助金。', type:'補助金', industries:['環境','農業','観光業'], purposes:['脱炭素・環境','地域活性化'], meta:{ hj_amount_max:500, hj_status:rs(), hj_agency:'滋賀県', hj_deadline:rd(), hj_target:'滋賀県内の事業者', hj_region:'滋賀県' } },
  { title:'京都府 文化観光・歴史資源活用促進補助金', slug:'kyoto-bunka-kanko-rekishi-hojo', excerpt:'京都の歴史・文化資源を活かした高付加価値観光コンテンツ開発・体験施設整備への補助金。', type:'補助金', industries:['観光業','文化・芸術'], purposes:['観光振興','地域活性化'], meta:{ hj_amount_max:500, hj_status:rs(), hj_agency:'京都府', hj_deadline:rd(), hj_target:'観光・文化事業者', hj_region:'京都府' } },
  { title:'兵庫県 神戸医療産業都市・バイオスタートアップ補助金', slug:'hyogo-kobe-bio-startup-hojo', excerpt:'神戸医療産業都市構想に基づくバイオテクノロジー・医療機器スタートアップへの補助金。', type:'補助金', industries:['医療・福祉','IT・情報通信'], purposes:['イノベーション','創業支援'], meta:{ hj_amount_max:5000, hj_status:rs(), hj_agency:'兵庫県・神戸市', hj_deadline:rd(), hj_target:'バイオ・医療スタートアップ', hj_region:'兵庫県神戸市' } },
  { title:'奈良県 鹿・吉野スギ資源活用産業振興補助金', slug:'nara-shika-yoshino-sugi-hojo', excerpt:'奈良の鹿・吉野スギ等の地域資源を活用した新商品開発・観光連携・輸出への補助金。', type:'補助金', industries:['農業','林業','観光業'], purposes:['地域活性化','農業振興'], meta:{ hj_amount_max:200, hj_status:rs(), hj_agency:'奈良県', hj_deadline:rd(), hj_target:'奈良県内の事業者', hj_region:'奈良県' } },
  { title:'和歌山県 梅・蜜柑・有田みかん産業強化補助金', slug:'wakayama-ume-mikan-hojo', excerpt:'和歌山の梅・蜜柑産業の高付加価値化・6次産業化・海外輸出への補助金。機械化・加工施設整備が対象。', type:'補助金', industries:['農業','食品'], purposes:['農業振興','販路拡大・輸出'], meta:{ hj_amount_max:500, hj_status:rs(), hj_agency:'和歌山県', hj_deadline:rd(), hj_target:'農業者・食品加工事業者', hj_region:'和歌山県' } },
  { title:'鳥取県 スタートアップ移住・創業支援補助金', slug:'tottori-startup-iju-hojo', excerpt:'鳥取県へ移住してスタートアップを設立する企業家への補助金。生活費・オフィス費・採用費が対象。', type:'補助金', industries:['IT・情報通信','農業','観光業'], purposes:['創業支援','地域活性化'], meta:{ hj_amount_max:300, hj_status:rs(), hj_agency:'鳥取県', hj_deadline:rd(), hj_target:'移住創業者', hj_region:'鳥取県' } },
  { title:'島根県 出雲・石見地域資源活用ビジネス補助金', slug:'shimane-izumo-iwami-biz-hojo', excerpt:'出雲大社・石見銀山等の歴史観光資源とデジタル技術を融合した新事業への補助金。', type:'補助金', industries:['観光業','IT・情報通信'], purposes:['観光振興','デジタル化・DX'], meta:{ hj_amount_max:300, hj_status:rs(), hj_agency:'島根県', hj_deadline:rd(), hj_target:'島根県内の事業者', hj_region:'島根県' } },
  { title:'岡山県 デニム・繊維産業ブランド強化補助金', slug:'okayama-denim-seni-brand-hojo', excerpt:'岡山・倉敷のデニム産業の海外展開・D2C化・高付加価値化への補助金。デザイン開発・EC構築が対象。', type:'補助金', industries:['製造業','小売業'], purposes:['地域活性化','販路拡大・輸出'], meta:{ hj_amount_max:200, hj_status:rs(), hj_agency:'岡山県', hj_deadline:rd(), hj_target:'繊維・アパレル事業者', hj_region:'岡山県' } },
  { title:'広島県 自動車・造船産業カーボンニュートラル転換補助金', slug:'hiroshima-jidousha-zosen-cn-hojo', excerpt:'広島の自動車・造船産業のEV対応・カーボンニュートラル設備投資への補助金。サプライヤー支援も対象。', type:'補助金', industries:['製造業'], purposes:['脱炭素・環境','設備投資'], meta:{ hj_amount_max:5000, hj_status:rs(), hj_agency:'広島県', hj_deadline:rd(), hj_target:'広島県内の製造業', hj_region:'広島県' } },
  { title:'山口県 石油化学・素材産業新事業展開補助金', slug:'yamaguchi-sekiyu-sozai-hojo', excerpt:'山口県の石油化学・素材産業のグリーン転換・新用途開発・海外展開への補助金。', type:'補助金', industries:['製造業','エネルギー'], purposes:['脱炭素・環境','イノベーション'], meta:{ hj_amount_max:3000, hj_status:rs(), hj_agency:'山口県', hj_deadline:rd(), hj_target:'山口県内の化学・素材メーカー', hj_region:'山口県' } },
  { title:'徳島県 LEDコンテンツ・阿波おどりDX補助金', slug:'tokushima-led-awaodori-dx-hojo', excerpt:'阿波おどり・LEDアート等の徳島のコンテンツ産業のデジタル展開・海外輸出への補助金。', type:'補助金', industries:['IT・情報通信','観光業','文化・芸術'], purposes:['デジタル化・DX','観光振興'], meta:{ hj_amount_max:300, hj_status:rs(), hj_agency:'徳島県', hj_deadline:rd(), hj_target:'コンテンツ・観光事業者', hj_region:'徳島県' } },
  { title:'香川県 うどん産業・食文化ブランド化支援補助金', slug:'kagawa-udon-brand-hojo', excerpt:'讃岐うどん等の香川の食文化ブランドを活かしたインバウンド誘客・食品輸出・6次産業化への補助金。', type:'補助金', industries:['食品','農業','観光業'], purposes:['観光振興','販路拡大・輸出'], meta:{ hj_amount_max:200, hj_status:rs(), hj_agency:'香川県', hj_deadline:rd(), hj_target:'食品事業者・農業者', hj_region:'香川県' } },
  { title:'愛媛県 みかん・真珠・造船ブランド連携補助金', slug:'ehime-mikan-shinju-brand-hojo', excerpt:'愛媛のみかん・真珠・造船の主要産業を横断したブランディング・海外PR・連携事業への補助金。', type:'補助金', industries:['農業','水産業','製造業'], purposes:['地域活性化','販路拡大・輸出'], meta:{ hj_amount_max:300, hj_status:rs(), hj_agency:'愛媛県', hj_deadline:rd(), hj_target:'愛媛県内の事業者', hj_region:'愛媛県' } },
  { title:'高知県 四万十川・カツオ資源保全型ビジネス補助金', slug:'kochi-shimanto-katsuo-hojo', excerpt:'高知の清流・水産資源を活かしたサステナブルビジネス（エコツアー・持続可能漁業）への補助金。', type:'補助金', industries:['水産業','観光業','農業'], purposes:['脱炭素・環境','観光振興'], meta:{ hj_amount_max:300, hj_status:rs(), hj_agency:'高知県', hj_deadline:rd(), hj_target:'高知県内の事業者', hj_region:'高知県' } },
  { title:'佐賀県 有田焼・陶磁器産業グローバル展開補助金', slug:'saga-arita-tojiki-global-hojo', excerpt:'有田焼を核とした佐賀の陶磁器産業の海外展開・現代デザイン融合・EC構築への補助金。', type:'補助金', industries:['製造業','小売業'], purposes:['地域活性化','販路拡大・輸出'], meta:{ hj_amount_max:300, hj_status:rs(), hj_agency:'佐賀県', hj_deadline:rd(), hj_target:'陶磁器製造・販売事業者', hj_region:'佐賀県' } },
  { title:'長崎県 離島・半島産業振興特別補助金', slug:'nagasaki-ritou-hanto-hojo', excerpt:'長崎の離島・半島地域の産業（漁業・観光・農業）振興に向けた特別補助金。物流コスト支援も含む。', type:'補助金', industries:['水産業','観光業','農業'], purposes:['地域活性化'], meta:{ hj_amount_max:500, hj_status:rs(), hj_agency:'長崎県', hj_deadline:rd(), hj_target:'離島・半島の事業者', hj_region:'長崎県（離島・半島）' } },
  { title:'熊本県 半導体・電子部品産業集積強化補助金', slug:'kumamoto-handotai-shueki-hojo', excerpt:'TSMCをはじめとする半導体産業集積を背景に熊本県内の関連製造業の設備投資・人材育成を支援。', type:'補助金', industries:['製造業'], purposes:['設備投資','雇用・人材'], meta:{ hj_amount_max:20000, hj_status:'公募中', hj_agency:'熊本県', hj_deadline:'2026-03-31', hj_target:'熊本県内の半導体・電子部品製造業', hj_region:'熊本県' } },
  { title:'大分県 温泉・地熱資源活用産業化補助金', slug:'oita-onsen-chinetsu-hojo', excerpt:'大分の豊富な温泉・地熱資源を活用した発電・農業（温室栽培）・観光事業への補助金。', type:'補助金', industries:['エネルギー','農業','観光業'], purposes:['脱炭素・環境','地域活性化'], meta:{ hj_amount_max:1000, hj_status:rs(), hj_agency:'大分県', hj_deadline:rd(), hj_target:'大分県内の事業者', hj_region:'大分県' } },
  { title:'宮崎県 農業王国・フードバレー構想推進補助金', slug:'miyazaki-food-valley-hojo', excerpt:'宮崎の農畜産物（マンゴー・牛肉・鶏肉）のブランド強化・加工・輸出を一体的に支援する補助金。', type:'補助金', industries:['農業','食品'], purposes:['農業振興','販路拡大・輸出'], meta:{ hj_amount_max:500, hj_status:rs(), hj_agency:'宮崎県', hj_deadline:rd(), hj_target:'農業者・食品加工事業者', hj_region:'宮崎県' } },
  { title:'鹿児島県 黒豚・黒毛和牛・本格焼酎ブランド補助金', slug:'kagoshima-kurobuta-shochu-hojo', excerpt:'鹿児島のブランド農畜産物と本格焼酎の海外展開・観光連携・6次産業化への補助金。', type:'補助金', industries:['農業','食品'], purposes:['農業振興','販路拡大・輸出'], meta:{ hj_amount_max:500, hj_status:rs(), hj_agency:'鹿児島県', hj_deadline:rd(), hj_target:'農業者・酒造事業者', hj_region:'鹿児島県' } },
];

const allSubsidies = [...CITY_SUBSIDIES, ...INDUSTRY_ADVANCED, ...TREND_SUBSIDIES, ...PREFECTURAL_EXTRA];

async function main() {
  await initSlugs();
  console.log(`登録済みスラッグ: ${slugSet.size}件`);

  const limited = allSubsidies.slice(0, LIMIT);
  let ok = 0, skip = 0, err = 0;

  for (const s of limited) {
    if (slugSet.has(s.slug)) { console.log(`SKIP: ${s.title}`); skip++; continue; }
    if (DRY_RUN) { console.log(`[DRY] ${s.title}`); ok++; continue; }

    const typeId  = await term('subsidy_type', s.type);
    const indIds  = await Promise.all((s.industries||[]).map(i => term('subsidy_industry', i)));
    const purIds  = await Promise.all((s.purposes||[]).map(p => term('subsidy_purpose', p)));
    const content = `<!-- wp:paragraph -->\n<p>${s.excerpt}</p>\n<!-- /wp:paragraph -->`;

    const result = await wpPost('subsidies', {
      title: s.title, slug: s.slug, status: 'publish',
      excerpt: s.excerpt, content,
      meta: s.meta,
      subsidy_type:     typeId ? [typeId] : [],
      subsidy_industry: indIds.filter(Boolean),
      subsidy_purpose:  purIds.filter(Boolean),
    });

    if (result.id) { console.log(`OK [${result.id}]: ${s.title}`); ok++; }
    else { console.error(`ERR: ${s.title}`, JSON.stringify(result).slice(0,80)); err++; }

    await new Promise(r => setTimeout(r, DELAY));
  }

  console.log(`\n=== 完了 ===\n登録: ${ok}件 / スキップ: ${skip}件 / エラー: ${err}件`);
}

main().catch(e => { console.error(e); process.exit(1); });
