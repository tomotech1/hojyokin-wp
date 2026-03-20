/**
 * 非補助金種別（助成金・融資・給付金・交付金・税制優遇）の充実スクリプト
 * 使い方: node scripts/register-non-hojo-bulk.mjs [--dry-run] [--limit=N]
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
const DELAY   = 300;

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
const slugCache = new Set();
async function initSlugCache() {
  for (let p = 1; p <= 6; p++) {
    const d = await wpGet(`subsidies?per_page=100&page=${p}&_fields=slug`);
    if (!Array.isArray(d) || !d.length) break;
    d.forEach(s => slugCache.add(s.slug));
  }
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
  const created = await wpPost(taxonomy, { name, slug: name.toLowerCase().replace(/[^\w]/g, '-') });
  if (created.id) { termCache[key] = created.id; return created.id; }
  return null;
}

// ============================================================
// 助成金データ（雇用・労務・人材系）
// ============================================================
const JOSEIKIN = [
  { title:'キャリアアップ助成金（正社員化コース）', slug:'career-up-seishain-joseikin-3',
    excerpt:'非正規雇用労働者を正社員化した事業主に支給。1人あたり最大80万円（生産性要件を満たす場合）。随時申請可能。',
    type:'助成金', industries:['製造業','サービス業','小売業'], purposes:['雇用・人材'],
    meta:{ hj_amount_max:80, hj_status:'受付中', hj_agency:'厚生労働省', hj_deadline:'随時', hj_target:'中小企業・個人事業主', hj_region:'全国' } },
  { title:'人材確保等支援助成金（雇用管理制度助成コース）', slug:'jinzai-kakuho-koyo-kanri-3',
    excerpt:'雇用管理制度（諸手当・研修・健康づくり制度等）を導入・実施した事業主に支給。離職率の低下が条件。',
    type:'助成金', industries:['製造業','建設業','医療・福祉'], purposes:['雇用・人材'],
    meta:{ hj_amount_max:57, hj_status:'受付中', hj_agency:'厚生労働省', hj_deadline:'随時', hj_target:'中小企業', hj_region:'全国' } },
  { title:'両立支援等助成金（出生時両立支援コース）', slug:'ryoritsu-shienkin-shussho-3',
    excerpt:'男性労働者が育児休業を取得しやすい職場環境整備に取り組む事業主に支給。子の出生後8週間以内の休業が対象。',
    type:'助成金', industries:['全業種'], purposes:['雇用・人材','働き方改革'],
    meta:{ hj_amount_max:20, hj_status:'受付中', hj_agency:'厚生労働省', hj_deadline:'随時', hj_target:'中小企業', hj_region:'全国' } },
  { title:'雇用調整助成金（特例措置）', slug:'koyo-chosei-tokureisochi-3',
    excerpt:'経済上の理由により事業活動の縮小を余儀なくされた事業主が休業・教育訓練・出向を実施した場合に支給。',
    type:'助成金', industries:['全業種'], purposes:['雇用・人材'],
    meta:{ hj_amount_max:100, hj_status:'受付中', hj_agency:'厚生労働省', hj_deadline:'随時', hj_target:'中小企業・大企業', hj_region:'全国' } },
  { title:'特定求職者雇用開発助成金（就職困難者コース）', slug:'tokutei-kyushoku-koyo-3',
    excerpt:'高齢者・障害者・母子家庭の母等の就職困難者を継続して雇用する事業主に支給。最大240万円。',
    type:'助成金', industries:['全業種'], purposes:['雇用・人材'],
    meta:{ hj_amount_max:240, hj_status:'受付中', hj_agency:'厚生労働省', hj_deadline:'随時', hj_target:'中小企業', hj_region:'全国' } },
  { title:'働き方改革推進支援助成金（労働時間短縮・年休促進支援コース）', slug:'hatarakikata-roudojikan-3',
    excerpt:'時間外労働の削減や年次有給休暇取得促進のための環境整備に取り組む中小企業事業主に支給。',
    type:'助成金', industries:['中小企業全般'], purposes:['働き方改革'],
    meta:{ hj_amount_max:250, hj_status:'受付中', hj_agency:'厚生労働省', hj_deadline:'随時', hj_target:'中小企業', hj_region:'全国' } },
  { title:'業務改善助成金（生産性向上支援）', slug:'gyomu-kaizen-seisansei-3',
    excerpt:'事業場内最低賃金を一定額以上引き上げ、設備投資等を行う中小企業・小規模事業者に支給。最大600万円。',
    type:'助成金', industries:['中小企業全般'], purposes:['生産性向上','賃上げ'],
    meta:{ hj_amount_max:600, hj_status:'受付中', hj_agency:'厚生労働省', hj_deadline:'随時', hj_target:'中小企業・小規模事業者', hj_region:'全国' } },
  { title:'人材開発支援助成金（人的資本強化コース）', slug:'jinzai-kaihatsu-jinteki-shihon-3',
    excerpt:'従業員のデジタル・ITスキル強化に向けた訓練を実施する事業主に支給。訓練費用の75%（中小企業）。',
    type:'助成金', industries:['全業種'], purposes:['デジタル化・DX','雇用・人材'],
    meta:{ hj_amount_max:150, hj_status:'受付中', hj_agency:'厚生労働省', hj_deadline:'随時', hj_target:'中小企業', hj_region:'全国' } },
  { title:'地域雇用開発助成金（地域雇用開発コース）', slug:'chiiki-koyo-kaihatsu-3',
    excerpt:'雇用機会が特に不足している地域で事業所を設置・整備し、雇用を増加させた事業主に支給。',
    type:'助成金', industries:['全業種'], purposes:['地域活性化','雇用・人材'],
    meta:{ hj_amount_max:320, hj_status:'受付中', hj_agency:'厚生労働省', hj_deadline:'随時', hj_target:'中小企業', hj_region:'特定地域' } },
  { title:'助成金活用セット（厚労省系4制度まとめて申請支援）', slug:'joseikin-set-koroshosho-4seido',
    excerpt:'キャリアアップ・人材確保・両立支援・業務改善の4助成金を一括して活用する中小企業向け支援プログラム。',
    type:'助成金', industries:['中小企業全般'], purposes:['雇用・人材'],
    meta:{ hj_amount_max:500, hj_status:'受付中', hj_agency:'厚生労働省', hj_deadline:'随時', hj_target:'中小企業', hj_region:'全国' } },
];

// ============================================================
// 融資データ（日本公庫・政策金融系）
// ============================================================
const YUSHI = [
  { title:'日本政策金融公庫 新創業融資制度（無担保・無保証）', slug:'nihon-koko-shinsogyo-yushi-3',
    excerpt:'新たに事業を始める方・事業開始後税務申告を2期終えていない方向けの無担保・無保証融資。上限3,000万円。',
    type:'融資', industries:['全業種'], purposes:['創業支援'],
    meta:{ hj_amount_max:3000, hj_status:'受付中', hj_agency:'日本政策金融公庫', hj_deadline:'随時', hj_target:'創業予定者・創業後2期以内', hj_region:'全国' } },
  { title:'小規模事業者経営改善資金（マル経融資）', slug:'marukei-yushi-3',
    excerpt:'商工会議所・商工会の経営指導を6ヶ月以上受けた小規模事業者向け無担保・無保証融資。上限2,000万円。',
    type:'融資', industries:['小規模事業者全般'], purposes:['経営改善'],
    meta:{ hj_amount_max:2000, hj_status:'受付中', hj_agency:'日本政策金融公庫', hj_deadline:'随時', hj_target:'小規模事業者', hj_region:'全国' } },
  { title:'事業再構築融資（日本公庫・新分野展開支援）', slug:'jigyou-saikozo-yushi-3',
    excerpt:'主要な事業の転換や新分野への展開を図る中小企業向け低利融資。設備投資・運転資金に活用可能。',
    type:'融資', industries:['全業種'], purposes:['事業再構築・転換'],
    meta:{ hj_amount_max:7200, hj_status:'受付中', hj_agency:'日本政策金融公庫', hj_deadline:'随時', hj_target:'中小企業', hj_region:'全国' } },
  { title:'中小企業経営力強化資金（専門家連携型）', slug:'keieiry oku-kyoka-yushi-3',
    excerpt:'認定経営革新等支援機関の支援を受けて経営革新を図る中小企業向け低利融資。基準利率より優遇。',
    type:'融資', industries:['全業種'], purposes:['経営改善','生産性向上'],
    meta:{ hj_amount_max:7200, hj_status:'受付中', hj_agency:'日本政策金融公庫', hj_deadline:'随時', hj_target:'中小企業', hj_region:'全国' } },
  { title:'女性・若者・シニア起業家支援融資', slug:'josei-wakamono-senior-yushi-3',
    excerpt:'女性または35歳未満・55歳以上の方が新たに事業を始める場合の低利融資。無担保・無保証人で最大7,200万円。',
    type:'融資', industries:['全業種'], purposes:['創業支援'],
    meta:{ hj_amount_max:7200, hj_status:'受付中', hj_agency:'日本政策金融公庫', hj_deadline:'随時', hj_target:'女性・若者・シニア起業家', hj_region:'全国' } },
  { title:'農業経営強化支援融資（スーパーL資金2026）', slug:'super-l-yushi-2026',
    excerpt:'農業経営基盤強化促進法に基づく認定農業者向け低利融資。農地・施設・機械等の取得資金に活用可能。',
    type:'融資', industries:['農業'], purposes:['農業振興'],
    meta:{ hj_amount_max:300000, hj_status:'受付中', hj_agency:'農林漁業金融公庫', hj_deadline:'随時', hj_target:'認定農業者', hj_region:'全国' } },
  { title:'中小企業向けグリーン・トランジション融資', slug:'gt-yushi-chusho-3',
    excerpt:'脱炭素化・省エネ・再エネ導入に取り組む中小企業向けのグリーン資金調達融資。金利優遇あり。',
    type:'融資', industries:['製造業','建設業','小売業'], purposes:['脱炭素・環境'],
    meta:{ hj_amount_max:10000, hj_status:'受付中', hj_agency:'日本政策金融公庫', hj_deadline:'随時', hj_target:'中小企業', hj_region:'全国' } },
  { title:'セーフティネット貸付（経営環境変化対応資金）', slug:'safety-net-kashitsuke-3',
    excerpt:'社会的・経済的環境の変化により一時的に業況が悪化している中小企業向け緊急融資。上限4,800万円。',
    type:'融資', industries:['全業種'], purposes:['経営改善'],
    meta:{ hj_amount_max:4800, hj_status:'受付中', hj_agency:'日本政策金融公庫', hj_deadline:'随時', hj_target:'中小企業・小規模事業者', hj_region:'全国' } },
  { title:'信用保証協会 セーフティネット保証5号（売上減少型）', slug:'safety-net-hosho-5go-3',
    excerpt:'特定業種で売上が20%以上減少した中小企業向けの信用保証付き融資。保証限度額最大2億8,000万円。',
    type:'融資', industries:['特定業種'], purposes:['経営改善'],
    meta:{ hj_amount_max:28000, hj_status:'受付中', hj_agency:'信用保証協会', hj_deadline:'随時', hj_target:'中小企業', hj_region:'全国' } },
  { title:'沖縄振興開発金融公庫 中小企業向け特別融資', slug:'okinawa-kouko-chusho-yushi',
    excerpt:'沖縄県内の中小企業の設備投資・運転資金を支援する低利融資。観光・製造・情報通信業が主な対象。',
    type:'融資', industries:['観光業','製造業','情報通信業'], purposes:['地域活性化'],
    meta:{ hj_amount_max:50000, hj_status:'受付中', hj_agency:'沖縄振興開発金融公庫', hj_deadline:'随時', hj_target:'沖縄県内中小企業', hj_region:'沖縄県' } },
];

// ============================================================
// 給付金・交付金データ
// ============================================================
const KYUFUKIN = [
  { title:'エネルギー価格激変緩和対策給付金（2026年版）', slug:'energy-kakuhen-kanwa-kyufukin-2026',
    excerpt:'エネルギーコスト上昇の影響を受ける中小企業・小規模事業者向け給付金。電力・ガス・燃料油の価格高騰に対応。',
    type:'給付金', industries:['製造業','農業','運輸業'], purposes:['脱炭素・環境','経営改善'],
    meta:{ hj_amount_max:150, hj_status:'予定', hj_agency:'経済産業省', hj_deadline:'2026-09-30', hj_target:'中小企業・小規模事業者', hj_region:'全国' } },
  { title:'物価高騰対応重点支援地方交付金（小規模事業者向け）', slug:'bukka-koto-chihokofukin-3',
    excerpt:'物価高騰の影響を受けた小規模事業者向けに都道府県・市区町村が実施する交付金。地域によって内容が異なる。',
    type:'交付金', industries:['全業種'], purposes:['経営改善'],
    meta:{ hj_amount_max:100, hj_status:'公募中', hj_agency:'内閣府・各都道府県', hj_deadline:'2025-12-31', hj_target:'小規模事業者', hj_region:'全国（地域差あり）' } },
  { title:'農業者向け経営安定給付金（ゲタ・ナラシ対策）', slug:'noka-keiei-antei-kyufukin-3',
    excerpt:'収入が減少した農業者に対する補填給付金。米・麦・大豆・てん菜等が対象作物。交付単価は毎年設定。',
    type:'給付金', industries:['農業'], purposes:['農業振興'],
    meta:{ hj_amount_max:500, hj_status:'受付中', hj_agency:'農林水産省', hj_deadline:'随時', hj_target:'農業者', hj_region:'全国' } },
  { title:'子育て支援事業者給付金（保育所・学童クラブ向け）', slug:'kosodate-shien-kyufukin-3',
    excerpt:'保育所・学童クラブ等を運営する事業者向けの処遇改善・施設整備給付金。保育士の賃上げが主な目的。',
    type:'給付金', industries:['医療・福祉'], purposes:['雇用・人材'],
    meta:{ hj_amount_max:200, hj_status:'受付中', hj_agency:'内閣府・こども家庭庁', hj_deadline:'随時', hj_target:'保育所・学童クラブ等', hj_region:'全国' } },
  { title:'地域公共交通維持給付金（過疎地バス・鉄道向け）', slug:'chiiki-kotsu-kyufukin-3',
    excerpt:'過疎地域等でバス・鉄道等の公共交通サービスを維持する事業者向け給付金。地域住民の生活を支える制度。',
    type:'給付金', industries:['運輸業'], purposes:['地域活性化'],
    meta:{ hj_amount_max:300, hj_status:'受付中', hj_agency:'国土交通省', hj_deadline:'随時', hj_target:'公共交通事業者', hj_region:'過疎地域' } },
  { title:'中山間地域等直接支払交付金（第5期対策）', slug:'chusankan-chokusetsu-kofukin-5ki',
    excerpt:'急傾斜地等の不利な条件下で農業生産活動を行う農業者に対する交付金。農地の維持・保全が目的。',
    type:'交付金', industries:['農業'], purposes:['農業振興','地域活性化'],
    meta:{ hj_amount_max:100, hj_status:'受付中', hj_agency:'農林水産省', hj_deadline:'随時', hj_target:'中山間地域の農業者', hj_region:'中山間地域' } },
  { title:'漁業者向け燃油高騰対策給付金（水産業向け）', slug:'gyogyo-nenyu-koto-kyufukin-3',
    excerpt:'燃油価格の高騰で経営が圧迫されている漁業者・養殖業者向け給付金。漁船の燃油使用量に応じて交付。',
    type:'給付金', industries:['水産業'], purposes:['農業振興'],
    meta:{ hj_amount_max:50, hj_status:'受付中', hj_agency:'農林水産省', hj_deadline:'随時', hj_target:'漁業者・養殖業者', hj_region:'全国' } },
  { title:'森林環境譲与税を活用した林業活性化交付金', slug:'shinrin-kankyozeiryo-kotai-kofukin',
    excerpt:'森林環境譲与税を財源として市区町村が実施する林業活性化・木材利用促進交付金。',
    type:'交付金', industries:['林業'], purposes:['脱炭素・環境','地域活性化'],
    meta:{ hj_amount_max:200, hj_status:'受付中', hj_agency:'各市区町村', hj_deadline:'随時', hj_target:'林業者・木材関連事業者', hj_region:'全国（市区町村により異なる）' } },
];

// ============================================================
// 税制優遇データ
// ============================================================
const ZEISEIYUGU = [
  { title:'中小企業投資促進税制（機械装置・ソフトウェア）', slug:'chusho-toshi-sokushin-zesei-3',
    excerpt:'中小企業が機械装置・ソフトウェア等を取得した場合に税額控除（7%）または特別償却（30%）を選択適用できる制度。',
    type:'税制優遇', industries:['製造業','情報通信業'], purposes:['設備投資','デジタル化・DX'],
    meta:{ hj_amount_max:0, hj_status:'受付中', hj_agency:'国税庁', hj_deadline:'随時', hj_target:'中小企業者等', hj_region:'全国' } },
  { title:'中小企業経営強化税制（A類型・B類型・C類型）', slug:'keiei-kyoka-zesei-abc-3',
    excerpt:'経営力向上計画の認定を受けた中小企業が対象設備を取得した場合の即時償却または税額控除（10%）制度。',
    type:'税制優遇', industries:['全業種'], purposes:['生産性向上','設備投資'],
    meta:{ hj_amount_max:0, hj_status:'受付中', hj_agency:'経済産業省・国税庁', hj_deadline:'随時', hj_target:'中小企業者等', hj_region:'全国' } },
  { title:'賃上げ促進税制（中小企業向け強化版2026）', slug:'chinageke-sokushin-zesei-2026',
    excerpt:'給与等支給総額を前年度比1.5%以上増加させた中小企業に対し、増加額の15%（最大40%）を法人税等から税額控除。',
    type:'税制優遇', industries:['全業種'], purposes:['賃上げ','雇用・人材'],
    meta:{ hj_amount_max:0, hj_status:'受付中', hj_agency:'国税庁', hj_deadline:'随時', hj_target:'中小企業者', hj_region:'全国' } },
  { title:'カーボンニュートラル投資促進税制（脱炭素設備）', slug:'carbon-neutral-toshi-zesei-3',
    excerpt:'需要開拓商品の生産・炭素生産性向上に資する設備投資に対する税額控除（5%・10%）または特別償却制度。',
    type:'税制優遇', industries:['製造業'], purposes:['脱炭素・環境'],
    meta:{ hj_amount_max:0, hj_status:'受付中', hj_agency:'国税庁', hj_deadline:'随時', hj_target:'青色申告法人', hj_region:'全国' } },
  { title:'デジタルトランスフォーメーション（DX）投資促進税制', slug:'dx-toshi-sokushin-zesei-3',
    excerpt:'DX認定を受けた法人等がデジタル関連設備を取得した場合の税額控除（3%・5%）または特別償却（30%）制度。',
    type:'税制優遇', industries:['全業種'], purposes:['デジタル化・DX'],
    meta:{ hj_amount_max:0, hj_status:'受付中', hj_agency:'経済産業省・国税庁', hj_deadline:'随時', hj_target:'DX認定事業者', hj_region:'全国' } },
  { title:'スタートアップへの再投資促進税制（エンジェル税制拡充）', slug:'angel-zesei-kakucho-3',
    excerpt:'スタートアップ企業の株式を売却し同年中に別のスタートアップ株式へ再投資した場合の課税繰延制度。',
    type:'税制優遇', industries:['IT・情報通信','製造業'], purposes:['イノベーション'],
    meta:{ hj_amount_max:0, hj_status:'受付中', hj_agency:'国税庁', hj_deadline:'随時', hj_target:'個人投資家', hj_region:'全国' } },
];

const allSubsidies = [...JOSEIKIN, ...YUSHI, ...KYUFUKIN, ...ZEISEIYUGU];

async function main() {
  await initSlugCache();
  console.log(`スラッグキャッシュ: ${slugCache.size}件`);

  const limited = allSubsidies.slice(0, LIMIT);
  let ok = 0, skip = 0, err = 0;

  for (const s of limited) {
    if (slugCache.has(s.slug)) {
      console.log(`SKIP: ${s.title}`);
      skip++;
      continue;
    }
    if (DRY_RUN) {
      console.log(`[DRY] ${s.type}: ${s.title}`);
      ok++;
      continue;
    }

    const typeId     = s.type ? await getOrCreateTerm('subsidy_type', s.type) : null;
    const indIds     = await Promise.all((s.industries || []).map(i => getOrCreateTerm('subsidy_industry', i)));
    const purIds     = await Promise.all((s.purposes   || []).map(p => getOrCreateTerm('subsidy_purpose',  p)));
    const content    = `<!-- wp:paragraph -->\n<p>${s.excerpt}</p>\n<!-- /wp:paragraph -->`;

    const payload = {
      title: s.title, slug: s.slug, status: 'publish',
      excerpt: s.excerpt, content,
      meta: s.meta,
      subsidy_type:     typeId ? [typeId] : [],
      subsidy_industry: indIds.filter(Boolean),
      subsidy_purpose:  purIds.filter(Boolean),
    };

    const result = await wpPost('subsidies', payload);
    if (result.id) {
      console.log(`OK [${result.id}] ${s.type}: ${s.title}`);
      ok++;
    } else {
      console.error(`ERR: ${s.title}`, JSON.stringify(result).slice(0, 80));
      err++;
    }
    await new Promise(r => setTimeout(r, DELAY));
  }

  console.log(`\n=== 完了 ===`);
  console.log(`登録: ${ok}件 / スキップ: ${skip}件 / エラー: ${err}件`);
}

main().catch(e => { console.error(e); process.exit(1); });
