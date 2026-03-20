/**
 * 助成金・給付金・融資・税制優遇 追加登録スクリプト（REST API版）
 * 使い方: node scripts/register-joseikin-kyufukin.mjs [--limit=N] [--dry-run]
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

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const LIMIT   = parseInt((args.find(a => a.startsWith('--limit=')) || '--limit=9999').split('=')[1]);
const DELAY   = 300;

const auth = Buffer.from(`${WP_USER}:${WP_PASS}`).toString('base64');

function toSlug(str) {
  return str.toLowerCase().replace(/[^\w\s-]/g,'').replace(/[\s_]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
}

// ==============================
// 助成金データ（雇用・人材系）
// ==============================
const JOSEIKIN = [
  // 厚生労働省系助成金
  { title:'両立支援等助成金（育児休業等支援コース）', slug:'ryoritsu-shien-ikukyu-joseikin',
    type:'助成金', amount:28.5, rate:'定額', deadline:'随時', status:'受付中',
    agency:'厚生労働省・都道府県労働局', target:'雇用保険適用事業主', region:'全国',
    industries:['製造業','サービス業','IT・情報通信業'], purposes:['雇用創出','人材育成'],
    excerpt:'育児休業取得を促進するための環境整備・取得・職場復帰に取り組む中小企業事業主を助成します。' },
  { title:'両立支援等助成金（介護離職防止支援コース）', slug:'ryoritsu-shien-kaigo-joseikin',
    type:'助成金', amount:30, rate:'定額', deadline:'随時', status:'受付中',
    agency:'厚生労働省・都道府県労働局', target:'雇用保険適用事業主', region:'全国',
    industries:['製造業','サービス業','医療・介護'], purposes:['雇用創出','人材育成'],
    excerpt:'介護を理由とした離職防止のための制度導入・取得に取り組む事業主を助成します。' },
  { title:'特定求職者雇用開発助成金（特定就職困難者コース）', slug:'tokutei-kyushokusha-koyou-joseikin',
    type:'助成金', amount:240, rate:'定額', deadline:'随時', status:'受付中',
    agency:'ハローワーク・厚生労働省', target:'雇用保険適用事業主', region:'全国',
    industries:['製造業','小売業','サービス業'], purposes:['雇用創出'],
    excerpt:'高齢者・障害者・母子家庭の母等の就職困難者をハローワーク等の紹介で雇い入れた事業主に支給される助成金です。' },
  { title:'トライアル雇用助成金（一般トライアルコース）', slug:'trial-koyou-joseikin',
    type:'助成金', amount:4, rate:'月額', deadline:'随時', status:'受付中',
    agency:'ハローワーク・厚生労働省', target:'雇用保険適用事業主', region:'全国',
    industries:['製造業','小売業','飲食業'], purposes:['雇用創出'],
    excerpt:'職業経験不足等で就職困難な求職者を試行雇用（トライアル）した事業主に月額最大4万円を最長3か月助成します。' },
  { title:'地域雇用開発助成金（地域雇用開発コース）', slug:'chiiki-koyou-kaihatsu-joseikin',
    type:'助成金', amount:480, rate:'定額', deadline:'随時', status:'受付中',
    agency:'ハローワーク・厚生労働省', target:'同意雇用開発促進地域の事業主', region:'全国',
    industries:['製造業','農業','観光・宿泊業'], purposes:['雇用創出'],
    excerpt:'雇用機会が不足している地域（同意雇用開発促進地域）において事業所設置・整備を行い雇用を創出した事業主を助成します。' },
  { title:'人材確保等支援助成金（雇用管理制度助成コース）', slug:'jinzai-kakuho-koyoukanri-joseikin',
    type:'助成金', amount:57, rate:'定額', deadline:'随時', status:'受付中',
    agency:'厚生労働省・都道府県労働局', target:'雇用保険適用事業主', region:'全国',
    industries:['製造業','小売業','サービス業'], purposes:['人材育成','雇用創出'],
    excerpt:'評価・処遇制度・研修制度・健康づくり制度・メンター制度等の雇用管理制度を整備・実施し離職率低下を目指す事業主を助成。' },
  { title:'人材確保等支援助成金（介護福祉機器助成コース）', slug:'jinzai-kakuho-kaigo-kiki-joseikin',
    type:'助成金', amount:150, rate:'1/2', deadline:'随時', status:'受付中',
    agency:'厚生労働省・都道府県労働局', target:'介護事業者', region:'全国',
    industries:['医療・介護'], purposes:['人材育成','設備投資'],
    excerpt:'介護従事者の離職防止・定着促進のために介護福祉機器（ロボット・センサー等）を導入した事業主を助成します。' },
  { title:'産業雇用安定助成金（事業再構築支援コース）', slug:'sangyo-koyou-antei-joseikin',
    type:'助成金', amount:60, rate:'4/5', deadline:'2025-03-31', status:'受付中',
    agency:'厚生労働省', target:'中小企業事業主', region:'全国',
    industries:['製造業','サービス業'], purposes:['雇用創出'],
    excerpt:'新型コロナウイルス感染症の影響で事業の再構築を余儀なくされた事業主が労働者の雇用を維持する場合に助成します。' },
  { title:'雇用安定助成金（雇用調整給付金）', slug:'koyou-antei-joseikin-chosei',
    type:'助成金', amount:100, rate:'4/5〜10/10', deadline:'随時', status:'受付中',
    agency:'厚生労働省', target:'雇用保険適用事業主', region:'全国',
    industries:['製造業','観光・宿泊業','飲食業'], purposes:['雇用創出'],
    excerpt:'景気変動・産業構造の変化等で事業縮小を余儀なくされた事業主が一時的に雇用調整を行う際の助成金です。' },
  { title:'障害者雇用安定助成金（障害者職場定着支援コース）', slug:'shougaisha-koyou-antei-joseikin',
    type:'助成金', amount:120, rate:'3/4', deadline:'随時', status:'受付中',
    agency:'独立行政法人高齢・障害・求職者雇用支援機構', target:'障害者を雇用する事業主', region:'全国',
    industries:['製造業','サービス業','小売業'], purposes:['雇用創出'],
    excerpt:'障害者の職場定着・能力開発のための職場支援員の配置・職場環境の整備等を行う事業主を助成します。' },
  // 中小企業・創業系助成金
  { title:'創業・起業助成金（地域創業助成金）', slug:'sogyou-kigyou-joseikin',
    type:'助成金', amount:200, rate:'2/3', deadline:'随時', status:'受付中',
    agency:'各都道府県・市区町村', target:'創業予定者・創業3年未満', region:'全国',
    industries:['サービス業','小売業','飲食業'], purposes:['起業・創業'],
    excerpt:'地域での新規創業を支援する助成金。創業に伴う設備費・開業費・広告費等が対象となります。' },
  { title:'中小企業経営安定化補助金（緊急対応）', slug:'chusho-keiei-anteika-joseikin',
    type:'助成金', amount:100, rate:'2/3', deadline:'2025-03-31', status:'受付中',
    agency:'中小企業庁', target:'中小企業・小規模事業者', region:'全国',
    industries:['製造業','小売業','サービス業'], purposes:['生産性向上'],
    excerpt:'原材料費・エネルギーコスト高騰に直面する中小企業の経営安定化のための緊急支援助成金です。' },
  { title:'小売業・飲食業等感染症対策助成金', slug:'kouri-inshoku-kansen-joseikin',
    type:'助成金', amount:50, rate:'3/4', deadline:'2025-03-31', status:'受付中',
    agency:'各都道府県', target:'小売業・飲食業事業者', region:'全国',
    industries:['小売業','飲食業'], purposes:['感染症対策'],
    excerpt:'新型コロナウイルス等感染症対策のための設備（飛沫防止パネル・消毒設備等）導入を助成します。' },
  { title:'女性活躍推進助成金（職場環境整備コース）', slug:'josei-katsuryaku-joseikin',
    type:'助成金', amount:72, rate:'定額', deadline:'随時', status:'受付中',
    agency:'厚生労働省・各都道府県労働局', target:'常時雇用する労働者が301人以上の企業', region:'全国',
    industries:['製造業','サービス業','IT・情報通信業'], purposes:['雇用創出','人材育成'],
    excerpt:'女性が活躍しやすい職場環境の整備（数値目標の達成）に取り組む事業主に支給される助成金です。' },
  { title:'高年齢者就業確保措置助成金（高年齢者無期雇用転換コース）', slug:'kounenrei-shugyo-kakuho-joseikin',
    type:'助成金', amount:48, rate:'定額', deadline:'随時', status:'受付中',
    agency:'独立行政法人高齢・障害・求職者雇用支援機構', target:'雇用保険適用事業主', region:'全国',
    industries:['製造業','サービス業','小売業'], purposes:['雇用創出'],
    excerpt:'有期契約の高年齢労働者（60歳以上）を無期雇用に転換した中小企業事業主に支給される助成金です。' },
];

// ==============================
// 給付金データ
// ==============================
const KYUFUKIN = [
  { title:'子育て世帯への特別給付金', slug:'kosodate-setai-kyufukin',
    type:'給付金', amount:10, rate:'定額', deadline:'随時', status:'受付中',
    agency:'内閣府・市区町村', target:'子育て世帯', region:'全国',
    industries:[], purposes:['雇用創出'],
    excerpt:'子育て世帯の生活を支援するための給付金。0〜18歳の子を持つ世帯が対象です。' },
  { title:'低所得者支援給付金（物価高対応）', slug:'teishotoku-shien-kyufukin',
    type:'給付金', amount:10, rate:'定額', deadline:'随時', status:'受付中',
    agency:'内閣府・市区町村', target:'住民税均等割非課税世帯', region:'全国',
    industries:[], purposes:['雇用創出'],
    excerpt:'物価高騰の影響を受けた低所得世帯（住民税均等割非課税世帯）を支援する給付金です。' },
  { title:'新型コロナウイルス感染症対応休業支援金・給付金', slug:'corona-kyugyo-shien-kyufukin',
    type:'給付金', amount:33, rate:'8/10', deadline:'2024-06-30', status:'終了',
    agency:'厚生労働省', target:'休業手当を受けられない労働者', region:'全国',
    industries:['飲食業','観光・宿泊業','小売業'], purposes:['雇用創出'],
    excerpt:'新型コロナウイルスの影響で事業者の判断で休業し、休業手当を受けられなかった労働者を直接支援した給付金です。' },
  { title:'事業復活支援金（中小企業・個人事業主向け）', slug:'jigyou-fukkatsu-shienkin',
    type:'給付金', amount:250, rate:'定額', deadline:'2022-05-31', status:'終了',
    agency:'経済産業省', target:'中小企業・個人事業主', region:'全国',
    industries:['飲食業','観光・宿泊業','小売業','サービス業'], purposes:['生産性向上'],
    excerpt:'コロナの影響で売上が大幅に減少した中小企業・個人事業主に一時支援金として最大250万円を給付した制度です。' },
  { title:'一時支援金（月次支援金）', slug:'ichiji-shienkin',
    type:'給付金', amount:60, rate:'定額', deadline:'2021-09-30', status:'終了',
    agency:'経済産業省', target:'中小企業・個人事業主', region:'全国',
    industries:['飲食業','観光・宿泊業','小売業'], purposes:['生産性向上'],
    excerpt:'緊急事態措置・まん延防止等重点措置の影響で売上が50%以上減少した事業者に支給された月次支援金です。' },
  { title:'持続化給付金', slug:'jizokuka-kyufukin',
    type:'給付金', amount:200, rate:'定額', deadline:'2021-02-15', status:'終了',
    agency:'経済産業省', target:'中小企業・個人事業主', region:'全国',
    industries:['製造業','小売業','飲食業','サービス業'], purposes:['生産性向上'],
    excerpt:'2020年に売上が50%以上減少した事業者を支援するために実施された持続化給付金（最大法人200万円・個人100万円）です。' },
  { title:'農業者緊急経営支援給付金', slug:'nogyo-kinkyuu-keiei-kyufukin',
    type:'給付金', amount:50, rate:'定額', deadline:'随時', status:'受付中',
    agency:'農林水産省・各都道府県', target:'農業者', region:'全国',
    industries:['農業'], purposes:['生産性向上'],
    excerpt:'肥料・燃油等の資材費高騰による農業者の経営への影響を緩和するための緊急支援給付金です。' },
  { title:'水産業者経営緊急支援給付金', slug:'suisan-kinkyuu-keiei-kyufukin',
    type:'給付金', amount:100, rate:'定額', deadline:'随時', status:'受付中',
    agency:'水産庁・各都道府県', target:'漁業者・養殖業者', region:'全国',
    industries:['林業・水産業'], purposes:['生産性向上'],
    excerpt:'燃油・餌料等の価格高騰による漁業者・養殖業者の経営を支援する緊急給付金です。' },
  { title:'電力・ガス・食料品等価格高騰緊急支援給付金', slug:'denryoku-gas-kakaku-kyufukin',
    type:'給付金', amount:7, rate:'定額', deadline:'2023-02-28', status:'終了',
    agency:'内閣府・市区町村', target:'住民税均等割非課税世帯', region:'全国',
    industries:[], purposes:['生産性向上'],
    excerpt:'電気・ガス・食料品等の価格高騰により家計への影響が大きい低所得世帯（住民税非課税等）に1世帯7万円を給付した制度です。' },
  { title:'重点支援地方交付金（事業者向け）', slug:'juten-shien-koufukin',
    type:'給付金', amount:50, rate:'定額', deadline:'随時', status:'受付中',
    agency:'各都道府県・市区町村', target:'中小企業・小規模事業者', region:'全国',
    industries:['飲食業','小売業','サービス業'], purposes:['生産性向上'],
    excerpt:'物価高騰の影響を受けた事業者を支援するために都道府県・市区町村が独自に実施する給付金です。' },
];

// ==============================
// 融資・低利ローンデータ
// ==============================
const YUSHI = [
  { title:'日本政策金融公庫・新型コロナウイルス感染症特別貸付', slug:'jfc-corona-tokubetsu-kashitsuke',
    type:'融資', amount:60000, rate:'0.21〜1.11%', deadline:'2024-09-30', status:'終了',
    agency:'日本政策金融公庫', target:'中小企業・小規模事業者・個人事業主', region:'全国',
    industries:['製造業','小売業','飲食業'], purposes:['生産性向上'],
    excerpt:'新型コロナウイルス感染症の影響を受けた事業者に対する特別な融資制度。低利・無担保・無保証人で最大6,000万円。' },
  { title:'日本政策金融公庫・小規模事業者経営改善資金（マル経融資）', slug:'jfc-marukei-yushi',
    type:'融資', amount:2000, rate:'1.21〜1.56%', deadline:'随時', status:'受付中',
    agency:'日本政策金融公庫・商工会議所', target:'小規模事業者', region:'全国',
    industries:['小売業','飲食業','サービス業'], purposes:['生産性向上','設備投資'],
    excerpt:'商工会議所・商工会の経営指導を受けた小規模事業者が利用できる無担保・無保証人の低利融資制度です。' },
  { title:'日本政策金融公庫・創業融資（新創業融資制度）', slug:'jfc-sogyo-yushi',
    type:'融資', amount:3000, rate:'2.16〜2.85%', deadline:'随時', status:'受付中',
    agency:'日本政策金融公庫', target:'創業予定者・創業後税務申告2期未満', region:'全国',
    industries:['サービス業','IT・情報通信業','小売業'], purposes:['起業・創業'],
    excerpt:'創業時に利用できる無担保・無保証人の融資制度。自己資金が創業資金の10分の1以上あれば申し込めます。' },
  { title:'中小企業信用補完制度（信用保証協会保証）', slug:'chusho-shinyohosho-seido',
    type:'融資', amount:28000, rate:'保証料0.45〜2.20%', deadline:'随時', status:'受付中',
    agency:'信用保証協会', target:'中小企業・小規模事業者', region:'全国',
    industries:['製造業','小売業','サービス業'], purposes:['生産性向上','設備投資'],
    excerpt:'信用保証協会が金融機関の融資を保証することで、担保不足の中小企業でも融資を受けやすくする制度です。' },
  { title:'セーフティネット保証制度（売上減少対応）', slug:'safety-net-hosho',
    type:'融資', amount:28000, rate:'保証料0.45〜2.20%', deadline:'随時', status:'受付中',
    agency:'信用保証協会・市区町村', target:'中小企業', region:'全国',
    industries:['製造業','小売業','観光・宿泊業'], purposes:['生産性向上'],
    excerpt:'自然災害・取引先の倒産・売上減少等により経営が悪化した中小企業を支援するセーフティネット保証制度です。' },
  { title:'危機関連保証制度', slug:'kiki-kanren-hosho',
    type:'融資', amount:28000, rate:'保証料0.45%', deadline:'随時', status:'受付中',
    agency:'信用保証協会', target:'中小企業', region:'全国',
    industries:['製造業','小売業','飲食業'], purposes:['生産性向上'],
    excerpt:'大規模な経済危機・災害等の影響で急激に売上が減少した中小企業を支援する危機関連保証制度です。' },
  { title:'事業再生ファンド（中小企業再生支援協議会）', slug:'jigyou-saisi-fund',
    type:'融資', amount:10000, rate:'協議', deadline:'随時', status:'受付中',
    agency:'中小企業再生支援協議会', target:'事業再生を目指す中小企業', region:'全国',
    industries:['製造業','小売業','飲食業'], purposes:['事業承継'],
    excerpt:'過剰債務を抱え経営再建が必要な中小企業を、中小企業再生支援協議会が支援する事業再生ファンドです。' },
  { title:'農業経営基盤強化資金（スーパーL資金）', slug:'nogyo-kiban-kyoka-yushi',
    type:'融資', amount:300000, rate:'0.10〜0.50%', deadline:'随時', status:'受付中',
    agency:'農林漁業信用基金・日本政策金融公庫', target:'認定農業者', region:'全国',
    industries:['農業'], purposes:['設備投資'],
    excerpt:'農業経営改善計画の認定を受けた農業者（認定農業者）が利用できる低利の長期融資制度です。' },
  { title:'林業・木材産業改善資金', slug:'ringyo-mokuzai-kaizen-yushi',
    type:'融資', amount:1000, rate:'無利子', deadline:'随時', status:'受付中',
    agency:'都道府県・林業信用基金', target:'林業・木材産業者', region:'全国',
    industries:['林業・水産業'], purposes:['設備投資'],
    excerpt:'林業・木材産業の改善に必要な機械・施設の導入に活用できる無利子または低利の融資制度です。' },
  { title:'観光産業等生産性向上のための融資制度', slug:'kanko-seisansei-yushi',
    type:'融資', amount:10000, rate:'0.50〜1.00%', deadline:'随時', status:'受付中',
    agency:'日本政策投資銀行（DBJ）', target:'観光関連事業者', region:'全国',
    industries:['観光・宿泊業'], purposes:['設備投資','生産性向上'],
    excerpt:'観光産業の生産性向上・高付加価値化のための設備投資等を支援する日本政策投資銀行の融資制度です。' },
];

// ==============================
// 税制優遇データ
// ==============================
const ZEIZEI = [
  { title:'中小企業投資促進税制', slug:'chusho-toshi-sokushin-zeisei',
    type:'税制優遇', amount:0, rate:'即時償却・税額控除7%', deadline:'2025-03-31', status:'受付中',
    agency:'経済産業省・国税庁', target:'中小企業・小規模事業者', region:'全国',
    industries:['製造業','IT・情報通信業'], purposes:['設備投資'],
    excerpt:'一定の機械装置等を取得した中小企業が即時償却または取得価額の7%（特定の場合10%）の税額控除を受けられる制度です。' },
  { title:'中小企業向け所得拡大促進税制', slug:'shotoku-kakudai-sokushin-zeisei',
    type:'税制優遇', amount:0, rate:'増加額の15〜40%控除', deadline:'2025-03-31', status:'受付中',
    agency:'国税庁', target:'中小企業', region:'全国',
    industries:['製造業','サービス業','IT・情報通信業'], purposes:['人材育成','雇用創出'],
    excerpt:'給与等の支給額が一定以上増加した中小企業が、増加額の最大40%を法人税から控除できる税制優遇制度です。' },
  { title:'研究開発税制（試験研究費の特別控除）', slug:'kenkyu-kaihatsu-zeisei',
    type:'税制優遇', amount:0, rate:'試験研究費の最大17%税額控除', deadline:'2025-03-31', status:'受付中',
    agency:'国税庁', target:'企業全般', region:'全国',
    industries:['製造業','IT・情報通信業'], purposes:['研究開発'],
    excerpt:'試験研究費の一定割合を法人税額から控除できる制度。中小企業の場合、試験研究費の最大17%が控除されます。' },
  { title:'中小企業者等の少額減価償却資産の取得価額の損金算入特例', slug:'shougaku-genkashokyaku-tokurei',
    type:'税制優遇', amount:30, rate:'即時損金算入', deadline:'2025-03-31', status:'受付中',
    agency:'国税庁', target:'中小企業・小規模事業者', region:'全国',
    industries:['製造業','小売業','サービス業'], purposes:['設備投資'],
    excerpt:'30万円未満の少額減価償却資産を取得した場合に全額を即時に損金算入できる中小企業向けの特例制度です。' },
  { title:'中小企業防災・減災投資促進税制', slug:'chusho-bousai-toshi-zeisei',
    type:'税制優遇', amount:0, rate:'即時償却・税額控除20%', deadline:'2025-03-31', status:'受付中',
    agency:'経済産業省・国税庁', target:'中小企業', region:'全国',
    industries:['製造業','小売業'], purposes:['設備投資'],
    excerpt:'事業継続力強化計画の認定を受けた中小企業が防災・減災設備を取得した場合に20%の税額控除が受けられます。' },
  { title:'中小企業経営強化税制', slug:'chusho-keiei-kyoka-zeisei',
    type:'税制優遇', amount:0, rate:'即時償却・税額控除10%', deadline:'2025-03-31', status:'受付中',
    agency:'経済産業省・国税庁', target:'中小企業・小規模事業者', region:'全国',
    industries:['製造業','IT・情報通信業','サービス業'], purposes:['設備投資','生産性向上'],
    excerpt:'経営力向上計画の認定を受けた中小企業が特定設備等を取得した場合に即時償却または10%の税額控除が受けられます。' },
  { title:'地方法人特別税の廃止・地方税改革（企業立地促進）', slug:'chiho-hojin-tokubetsu-zei',
    type:'税制優遇', amount:0, rate:'固定資産税軽減等', deadline:'随時', status:'受付中',
    agency:'各都道府県・市区町村', target:'地方に立地する企業', region:'全国',
    industries:['製造業','IT・情報通信業'], purposes:['設備投資'],
    excerpt:'地方圏への企業誘致・立地を促進するための固定資産税軽減・不動産取得税減免等の地方税優遇措置です。' },
  { title:'消費税インボイス制度対応支援（小規模事業者向け税負担軽減）', slug:'invoice-shougaku-zeisei',
    type:'税制優遇', amount:0, rate:'納税額80%控除（2年間）', deadline:'2025-10-01', status:'受付中',
    agency:'国税庁', target:'課税事業者になった小規模事業者', region:'全国',
    industries:['小売業','サービス業','飲食業'], purposes:['デジタル化'],
    excerpt:'インボイス制度の導入に伴い課税事業者になった小規模事業者が、納税額の80%（その後50%）を控除できる激変緩和措置です。' },
];

// ==============================
// 全データ結合
// ==============================
function buildEntry(s, defaultType) {
  return {
    title: s.title, slug: s.slug,
    excerpt: s.excerpt,
    subsidy_type: s.type || defaultType,
    industries: s.industries || [],
    purposes: s.purposes || [],
    meta: {
      hj_amount_max: String(s.amount),
      hj_amount_rate: s.rate,
      hj_deadline: s.deadline,
      hj_status: s.status,
      hj_agency: s.agency,
      hj_target: s.target,
      hj_region: s.region,
      hj_fiscal_year: '2024',
    },
  };
}

const allEntries = [
  ...JOSEIKIN.map(s => buildEntry(s, '助成金')),
  ...KYUFUKIN.map(s => buildEntry(s, '給付金')),
  ...YUSHI.map(s => buildEntry(s, '融資')),
  ...ZEIZEI.map(s => buildEntry(s, '税制優遇')),
];

console.log(`総エントリ数: ${allEntries.length} 件`);
console.log(`  助成金: ${JOSEIKIN.length}件, 給付金: ${KYUFUKIN.length}件, 融資: ${YUSHI.length}件, 税制優遇: ${ZEIZEI.length}件`);

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
  const limited = allEntries.slice(0, LIMIT);
  let ok = 0, skip = 0, err = 0;

  for (const s of limited) {
    if (await slugExists(s.slug)) {
      console.log(`SKIP: ${s.title}`);
      skip++; continue;
    }

    if (DRY_RUN) {
      console.log(`[DRY-RUN] ${s.subsidy_type}: ${s.title} (${s.slug})`);
      ok++; continue;
    }

    const typeTermIds     = s.subsidy_type ? [await getOrCreateTerm('subsidy_type', s.subsidy_type)].filter(Boolean) : [];
    const industryTermIds = await Promise.all((s.industries || []).map(i => getOrCreateTerm('subsidy_industry', i)));
    const purposeTermIds  = await Promise.all((s.purposes  || []).map(p => getOrCreateTerm('subsidy_purpose',  p)));

    const result = await wpPost('subsidies', {
      title:   s.title,
      slug:    s.slug,
      status:  'publish',
      excerpt: s.excerpt,
      content: `<!-- wp:paragraph -->\n<p>${s.excerpt}</p>\n<!-- /wp:paragraph -->`,
      meta:    s.meta,
      subsidy_type:     typeTermIds.filter(Boolean),
      subsidy_industry: industryTermIds.filter(Boolean),
      subsidy_purpose:  purposeTermIds.filter(Boolean),
    });

    if (result.id) {
      console.log(`OK [${result.id}] ${s.subsidy_type}: ${s.title}`);
      ok++;
    } else {
      console.error(`ERR: ${s.title}`, result.message || JSON.stringify(result).slice(0,100));
      err++;
    }

    await new Promise(r => setTimeout(r, DELAY));
  }

  console.log(`\n=== 完了 ===`);
  console.log(`登録: ${ok}件 / スキップ: ${skip}件 / エラー: ${err}件`);
}

main().catch(e => { console.error(e); process.exit(1); });
