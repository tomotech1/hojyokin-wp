// register-subsidies-bulk4.mjs
// BLOCK A: ライフステージ別 / BLOCK B: 規模・業態別 / BLOCK C: テーマ別 / BLOCK D: 業界特化 / BLOCK E: R&D
import fetch from 'node-fetch';

const BASE  = 'http://localhost:10010/wp-json/wp/v2';
const AUTH  = 'Basic ' + Buffer.from('admin:3gj2 mOm5 wImw 1w3r ZJD6 Sy9U').toString('base64');

async function getTaxId(taxonomy, slug) {
  const r = await fetch(`${BASE}/${taxonomy}?slug=${slug}`, { headers: { Authorization: AUTH } });
  const d = await r.json();
  return d[0]?.id || null;
}

async function post(item) {
  const typeId = item.typeSlug ? await getTaxId('subsidy_type', item.typeSlug) : null;
  const body = {
    title: item.title, status: 'publish',
    meta: {
      hj_agency: item.agency||'', hj_amount_max: item.amount||0,
      hj_amount_rate: item.rate||'', hj_deadline: item.deadline||'',
      hj_status: item.status||'公募中', hj_target: item.target||'',
      hj_region: item.region||'全国', hj_difficulty: item.diff||3,
      hj_ai_summary: item.summary||'', hj_adoption_rate: item.adoption||50,
      hj_official_url: item.url||'https://www.meti.go.jp/',
    },
    ...(typeId ? { subsidy_type: [typeId] } : {}),
  };
  const r = await fetch(`${BASE}/subsidies`, {
    method: 'POST', headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const d = await r.json();
  if (d.id) { console.log(`OK [${d.id}]: ${item.title}`); return true; }
  console.error(`ERR: ${item.title} — ${JSON.stringify(d).slice(0,120)}`);
  return false;
}

const items = [
  // ===== BLOCK A: ライフステージ・ライフイベント別 =====
  { title:'女性起業家スタートアップ支援補助金', agency:'内閣府 男女共同参画局', amount:2000000, rate:'2/3', deadline:'2025年9月30日', status:'公募中', target:'女性起業家・創業予定者', region:'全国', diff:2, typeSlug:'hojo-kin', adoption:55, summary:'女性が新たにビジネスを起こす際に必要な経費を支援します。店舗改装費・設備費・広告宣伝費が対象。上限200万円、補助率2/3。メンタリング支援も付帯し、創業後3年間のフォローアップが受けられます。' },
  { title:'シニア起業・第二創業支援補助金', agency:'経済産業省 中小企業庁', amount:1000000, rate:'1/2', deadline:'2025年10月31日', status:'公募中', target:'55歳以上の起業家・経営者', region:'全国', diff:2, typeSlug:'hojo-kin', adoption:60, summary:'豊富な経験を持つシニア世代の起業・第二創業を資金面から支援します。上限100万円で補助率1/2。販路開拓、デジタル化、人材育成費用に活用可能です。' },
  { title:'障害者・福祉的就労起業支援補助金', agency:'厚生労働省', amount:3000000, rate:'3/4', deadline:'2025年8月31日', status:'公募中', target:'障害者雇用事業者・就労継続支援事業所', region:'全国', diff:2, typeSlug:'hojo-kin', adoption:65, summary:'障害者が働きやすい環境づくりや、福祉的就労の場を創出する事業者を支援します。設備投資・バリアフリー化・ITシステム導入に最大300万円を補助します。' },
  { title:'事業承継円滑化補助金', agency:'中小企業庁', amount:6000000, rate:'2/3', deadline:'2025年7月31日', status:'公募中', target:'事業承継を行う中小企業・小規模事業者', region:'全国', diff:3, typeSlug:'hojo-kin', adoption:48, summary:'親族内承継・第三者承継を問わず、経営資源の引き継ぎに要する費用を支援します。専門家費用・設備投資・デジタル化対応に上限600万円。承継後の経営革新にも活用できます。' },
  { title:'M&A・経営資源集約補助金', agency:'中小企業庁', amount:2000000, rate:'1/2', deadline:'2025年9月30日', status:'公募中', target:'M&Aを活用する中小企業', region:'全国', diff:3, typeSlug:'hojo-kin', adoption:52, summary:'M&Aによる経営資源の集約・活用を後押しするため、専門家費用（FA・DD・PMI）を補助します。上限200万円、補助率1/2。中小M&Aガイドラインに準拠した支援機関の活用が要件です。' },
  { title:'廃業・再チャレンジ支援補助金', agency:'中小企業庁', amount:1000000, rate:'2/3', deadline:'2025年11月30日', status:'公募中', target:'廃業予定・再起業を目指す事業者', region:'全国', diff:2, typeSlug:'hojo-kin', adoption:70, summary:'やむを得ず廃業する事業者が次のビジネスに挑戦するため、廃業手続き費用・再起業準備費用を支援します。上限100万円で補助率2/3。セカンドステージを応援します。' },
  { title:'フリーランス・個人事業主デジタル化補助金', agency:'デジタル庁', amount:500000, rate:'2/3', deadline:'2025年8月31日', status:'公募中', target:'フリーランス・個人事業主', region:'全国', diff:1, typeSlug:'hojo-kin', adoption:75, summary:'個人で働くフリーランスがビジネスをデジタル化するための費用を支援します。会計ソフト・請求書管理・プロジェクト管理ツールの導入費用が対象。上限50万円で使いやすい設計です。' },
  { title:'若手農業者経営発展支援補助金', agency:'農林水産省', amount:5000000, rate:'1/2', deadline:'2025年10月31日', status:'公募中', target:'45歳以下の農業者・新規就農者', region:'全国', diff:3, typeSlug:'hojo-kin', adoption:45, summary:'若手農業者が経営を発展させるための機械・施設整備を支援します。農業用機械・ハウス施設・スマート農業機器の導入に上限500万円。認定農業者・認定新規就農者が対象です。' },
  { title:'女性・若者地方創業促進補助金', agency:'総務省 地域力創造グループ', amount:2000000, rate:'3/4', deadline:'2025年9月30日', status:'公募中', target:'地方移住創業を目指す女性・39歳以下の若者', region:'全国', diff:2, typeSlug:'hojo-kin', adoption:60, summary:'地方への移住を伴う創業・起業を特に手厚く支援します。女性・39歳以下は補助率3/4に引き上げ。地域の課題解決型ビジネスを優先採択します。' },
  { title:'事業再生・経営改善支援補助金', agency:'中小企業再生支援協議会', amount:3000000, rate:'2/3', deadline:'2025年8月31日', status:'公募中', target:'経営困難な中小企業・事業再生計画策定事業者', region:'全国', diff:3, typeSlug:'hojo-kin', adoption:55, summary:'経営危機に直面した中小企業が専門家の支援を受けて再生計画を策定・実行するための費用を補助します。弁護士・税理士・コンサルタント費用が対象。上限300万円。' },

  // ===== BLOCK B: 規模別・業態別 =====
  { title:'小規模事業者持続化補助金（特別枠）', agency:'日本商工会議所', amount:2000000, rate:'3/4', deadline:'2025年11月30日', status:'公募中', target:'従業員5名以下の小規模事業者', region:'全国', diff:2, typeSlug:'hojo-kin', adoption:40, summary:'小規模事業者が経営計画を策定し、販路開拓に取り組む費用を支援します。特別枠（賃上げ・卒業・後継者・創業）では補助率3/4、上限200万円に拡充されます。' },
  { title:'中堅企業グローバル競争力強化補助金', agency:'経済産業省', amount:100000000, rate:'1/3', deadline:'2025年7月31日', status:'公募中', target:'従業員300〜2000名の中堅企業', region:'全国', diff:4, typeSlug:'hojo-kin', adoption:30, summary:'中堅企業がグローバル市場での競争力強化に取り組む大型投資を支援します。生産設備・研究開発・海外拠点整備に最大1億円。サプライチェーン強靭化への取り組みを優遇します。' },
  { title:'社会的企業・ソーシャルビジネス育成補助金', agency:'内閣府 地方創生推進室', amount:3000000, rate:'2/3', deadline:'2025年9月30日', status:'公募中', target:'社会的企業・NPO法人・協同組合', region:'全国', diff:2, typeSlug:'hojo-kin', adoption:58, summary:'地域課題・社会課題の解決を事業として行う組織の立ち上げ・拡大を支援します。事業費・人件費・システム開発費が対象。インパクト評価の実施が採択要件のひとつです。' },
  { title:'農業法人経営力向上支援補助金', agency:'農林水産省 農業経営局', amount:10000000, rate:'1/2', deadline:'2025年10月31日', status:'公募中', target:'農業生産法人・農事組合法人', region:'全国', diff:3, typeSlug:'hojo-kin', adoption:42, summary:'農業法人の経営体力強化・スマート農業化・6次産業化を総合支援します。農業機械・加工施設・販路開拓システムに上限1000万円。GAP認証取得を検討する法人は加点されます。' },
  { title:'漁業者経営安定・漁船省エネ化補助金', agency:'水産庁', amount:5000000, rate:'1/2', deadline:'2025年8月31日', status:'公募中', target:'漁業者・漁協・漁業法人', region:'全国', diff:3, typeSlug:'hojo-kin', adoption:50, summary:'燃油高騰に対応するための省エネ型漁船エンジン換装・漁具の軽量化・漁港ICT化を支援します。上限500万円で補助率1/2。水産資源の持続的利用に貢献する取り組みを優先します。' },
  { title:'NPO・市民活動団体デジタル化補助金', agency:'内閣府 市民活動促進課', amount:500000, rate:'3/4', deadline:'2025年11月30日', status:'公募中', target:'認定NPO法人・特定非営利活動法人', region:'全国', diff:1, typeSlug:'hojo-kin', adoption:72, summary:'NPO・市民活動団体がデジタルツールを活用した効率的な運営体制を構築するための費用を補助します。CRM・会計ソフト・オンライン寄付システムの導入に上限50万円。' },
  { title:'農産物輸出力強化・農業6次産業化補助金', agency:'農林水産省', amount:30000000, rate:'1/2', deadline:'2025年9月30日', status:'公募中', target:'農業者・農業法人・6次産業化事業者', region:'全国', diff:3, typeSlug:'hojo-kin', adoption:38, summary:'農産物の付加価値向上と海外輸出を目指す加工施設整備・ブランド化・マーケティング活動を支援します。GI取得・有機JAS認証・輸出対応HACCP整備も対象。上限3000万円。' },
  { title:'小売商店街活性化・空き店舗対策補助金', agency:'中小企業庁 商業課', amount:2000000, rate:'2/3', deadline:'2025年10月31日', status:'公募中', target:'商店街振興組合・小売事業者', region:'全国', diff:2, typeSlug:'hojo-kin', adoption:55, summary:'商店街の空き店舗を活用した新規出店や、商店街のイベント・共同宣伝・ICT化を支援します。空き店舗改装費・設備費・テナント誘致費に上限200万円。賑わい創出を重視します。' },
  { title:'水産加工業者販路開拓・ブランド化補助金', agency:'水産庁 加工流通課', amount:3000000, rate:'1/2', deadline:'2025年9月30日', status:'公募中', target:'水産加工業者・漁業協同組合', region:'全国', diff:3, typeSlug:'hojo-kin', adoption:48, summary:'地域の水産物を活かした加工品開発・パッケージデザイン・展示会出展・EC販売構築を支援します。国産水産物の消費拡大と漁業者所得向上を目指す取り組みに最大300万円。' },
  { title:'協同組合・中小企業組合共同事業補助金', agency:'中小企業庁 経営支援部', amount:5000000, rate:'1/2', deadline:'2025年11月30日', status:'公募中', target:'中小企業等協同組合・事業協同組合', region:'全国', diff:3, typeSlug:'hojo-kin', adoption:45, summary:'複数の中小企業が共同で行う設備投資・研究開発・販路開拓・人材育成を支援します。単独では難しいスケールメリットを活かした共同事業に上限500万円を補助します。' },

  // ===== BLOCK C: テーマ・課題解決型 =====
  { title:'物価高騰対策・省エネ設備導入補助金', agency:'経済産業省 資源エネルギー庁', amount:5000000, rate:'1/2', deadline:'2025年8月31日', status:'公募中', target:'中小企業・小規模事業者', region:'全国', diff:2, typeSlug:'hojo-kin', adoption:60, summary:'電気・ガス・燃油の価格高騰に対応するため、省エネ型設備への更新を支援します。LED照明・高効率空調・省エネ型冷蔵冷凍機器の導入に上限500万円。診断結果に基づく計画が必要です。' },
  { title:'エネルギーコスト削減・燃料転換支援補助金', agency:'資源エネルギー庁', amount:10000000, rate:'1/3', deadline:'2025年10月31日', status:'公募中', target:'製造業・農業・運輸業事業者', region:'全国', diff:3, typeSlug:'hojo-kin', adoption:40, summary:'化石燃料から電気・水素・バイオマス等への燃料転換を行う設備投資を支援します。ボイラー更新・電化設備・熱利用システムに上限1000万円。カーボンニュートラルへの移行を加速します。' },
  { title:'人材確保・採用強化支援補助金', agency:'厚生労働省', amount:1000000, rate:'2/3', deadline:'2025年9月30日', status:'公募中', target:'人手不足に悩む中小企業', region:'全国', diff:2, typeSlug:'joseikin', adoption:65, summary:'慢性的な人手不足に直面する中小企業の採用活動・定着支援・職場環境改善を後押しします。採用サイト構築・合同企業説明会出展・給与管理システム導入に上限100万円。' },
  { title:'働き方改革・時間外労働削減支援補助金', agency:'厚生労働省 労働基準局', amount:500000, rate:'3/4', deadline:'2025年8月31日', status:'公募中', target:'中小企業・小規模事業者', region:'全国', diff:2, typeSlug:'joseikin', adoption:70, summary:'時間外労働の削減に向けた業務プロセス改善・システム導入・労務管理ツール整備を支援します。勤怠管理システム・ペーパーレス化・シフト管理ツールの費用に上限50万円。' },
  { title:'中小企業DX推進・業務デジタル化補助金', agency:'デジタル庁・中小企業庁', amount:4500000, rate:'2/3', deadline:'2025年10月31日', status:'公募中', target:'DX未着手の中小企業', region:'全国', diff:2, typeSlug:'hojo-kin', adoption:50, summary:'まだデジタル化が進んでいない中小企業のクラウド移行・業務自動化・データ活用基盤整備を支援します。ERPシステム・CRM・RPA・SaaS活用に上限450万円。DX認定取得支援も含みます。' },
  { title:'AI活用・機械学習導入実証補助金', agency:'経済産業省 AI政策室', amount:10000000, rate:'1/2', deadline:'2025年9月30日', status:'公募中', target:'AIを活用する製造・サービス・流通業', region:'全国', diff:4, typeSlug:'hojo-kin', adoption:35, summary:'AI・機械学習を自社業務に導入する実証実験・PoC開発・本番システム構築を支援します。製造ラインの品質検査AI・需要予測・チャットボット等に上限1000万円。外部専門家連携が要件です。' },
  { title:'カーボンニュートラル経営加速化補助金', agency:'環境省', amount:20000000, rate:'1/2', deadline:'2025年7月31日', status:'公募中', target:'SBT・RE100目標設定企業・中小企業', region:'全国', diff:4, typeSlug:'hojo-kin', adoption:32, summary:'温室効果ガス削減目標（SBT等）を設定し、脱炭素経営に取り組む企業の設備投資・省エネ・再エネ導入を集中支援します。CO₂削減量に応じたインセンティブ設計。上限2000万円。' },
  { title:'太陽光・蓄電池自家消費型導入支援補助金', agency:'環境省・経済産業省', amount:15000000, rate:'1/3', deadline:'2025年11月30日', status:'公募中', target:'中小企業・農業者・商業施設', region:'全国', diff:2, typeSlug:'hojo-kin', adoption:55, summary:'工場・店舗・農地等への太陽光発電システムと蓄電池のセット導入を後押しします。自家消費率が高い計画を優先採択。上限1500万円で電力コスト削減と停電対策を両立できます。' },
  { title:'海外展開・輸出促進支援補助金', agency:'経済産業省・JETRO', amount:5000000, rate:'1/2', deadline:'2025年9月30日', status:'公募中', target:'海外展開を目指す中小企業', region:'全国', diff:3, typeSlug:'hojo-kin', adoption:45, summary:'海外市場への進出・輸出拡大に取り組む中小企業の調査・展示会出展・EC構築・認証取得費用を支援します。JETROのサポートと組み合わせることで採択率が向上します。上限500万円。' },
  { title:'バリアフリー・UD化設備整備補助金', agency:'国土交通省', amount:3000000, rate:'2/3', deadline:'2025年10月31日', status:'公募中', target:'店舗・施設・中小企業の建物所有者', region:'全国', diff:2, typeSlug:'hojo-kin', adoption:62, summary:'店舗・事務所・公共施設のバリアフリー化やユニバーサルデザイン対応改修を支援します。スロープ設置・多目的トイレ・点字ブロック・自動ドアの設置工事費に上限300万円。' },
  { title:'女性活躍推進・職場環境改善補助金', agency:'厚生労働省 雇用均等局', amount:1000000, rate:'3/4', deadline:'2025年8月31日', status:'公募中', target:'えるぼし認定・くるみん認定を目指す中小企業', region:'全国', diff:2, typeSlug:'joseikin', adoption:68, summary:'女性が活躍しやすい職場環境の整備に取り組む中小企業を支援します。育児支援設備・テレワーク環境・キャリア支援プログラムに上限100万円。えるぼし認定取得を目指す企業を優遇。' },
  { title:'高齢者・シニア就労促進支援補助金', agency:'厚生労働省 高齢労働課', amount:500000, rate:'3/4', deadline:'2025年9月30日', status:'公募中', target:'60歳以上を積極採用する中小企業', region:'全国', diff:1, typeSlug:'joseikin', adoption:75, summary:'高齢者が働きやすい職場づくりと定着促進のための設備改善・業務改善を支援します。重量物軽減設備・作業補助ツール・健康管理システムの導入に上限50万円。' },
  { title:'外国人材受入・多文化共生職場整備補助金', agency:'出入国在留管理庁・厚生労働省', amount:1000000, rate:'2/3', deadline:'2025年10月31日', status:'公募中', target:'特定技能・技能実習生受入企業', region:'全国', diff:2, typeSlug:'joseikin', adoption:60, summary:'外国人労働者を受け入れる事業所の生活支援・言語サポート・多文化研修・宿舎整備に要する費用を補助します。上限100万円。共生社会の実現に向けた環境整備を支援します。' },
  { title:'サプライチェーン強靭化・国内回帰投資補助金', agency:'経済産業省', amount:500000000, rate:'1/3', deadline:'2025年7月31日', status:'公募中', target:'製造業（国内回帰・生産拠点整備）', region:'全国', diff:5, typeSlug:'hojo-kin', adoption:20, summary:'海外依存度の高い重要物資の国内生産・備蓄を強化するための設備投資を支援します。半導体・医薬品・重要鉱物等の戦略物資に関わる製造ラインに最大5億円の大型補助。' },

  // ===== BLOCK D: 業界特化型 =====
  { title:'美容室・理容室設備更新・省エネ化補助金', agency:'経済産業省 生活衛生関係営業指導センター', amount:1000000, rate:'1/2', deadline:'2025年11月30日', status:'公募中', target:'美容業・理容業事業者', region:'全国', diff:2, typeSlug:'hojo-kin', adoption:55, summary:'美容室・理容室の設備更新（シャンプー台・椅子・ドライヤー等）と省エネ型機器への買い替えを支援します。給湯設備・LED照明・空調設備の省エネ化にも活用可能。上限100万円。' },
  { title:'介護施設ICT・介護ロボット導入補助金', agency:'厚生労働省 老健局', amount:10000000, rate:'3/4', deadline:'2025年9月30日', status:'公募中', target:'特別養護老人ホーム・介護老人保健施設・訪問介護事業所', region:'全国', diff:2, typeSlug:'hojo-kin', adoption:60, summary:'介護現場の人手不足解消とケアの質向上のため、介護ロボット・見守りセンサー・記録システム・コミュニケーション支援機器の導入を手厚く支援します。上限1000万円、補助率3/4。' },
  { title:'保育所・幼稚園施設整備・安全対策補助金', agency:'こども家庭庁', amount:50000000, rate:'2/3', deadline:'2025年8月31日', status:'公募中', target:'認可保育所・幼稚園・認定こども園', region:'全国', diff:3, typeSlug:'koufukin', adoption:55, summary:'子どもが安心・安全に過ごせる保育・教育環境の整備を支援します。園舎改修・遊具更新・防犯カメラ設置・感染症対策設備に最大5000万円。待機児童解消に資する施設を優先します。' },
  { title:'学習塾・教育事業者デジタル教育導入補助金', agency:'文部科学省', amount:2000000, rate:'1/2', deadline:'2025年10月31日', status:'公募中', target:'学習塾・民間教育機関・教育系スタートアップ', region:'全国', diff:2, typeSlug:'hojo-kin', adoption:52, summary:'タブレット・学習管理システム・AIドリル・オンライン授業システムを導入する教育機関を支援します。個別最適化学習の実現に向けたEdTech活用に上限200万円。' },
  { title:'飲食店リノベーション・衛生強化補助金', agency:'厚生労働省 食品安全部', amount:3000000, rate:'1/2', deadline:'2025年9月30日', status:'公募中', target:'飲食店・食品製造業・総菜店', region:'全国', diff:2, typeSlug:'hojo-kin', adoption:50, summary:'飲食店の店舗改装・厨房設備更新・HACCPに基づく衛生管理設備整備を支援します。食洗機・冷蔵冷凍設備・換気システム・POSシステムの導入費用に上限300万円。' },
  { title:'旅館・民宿・ゲストハウス再生投資補助金', agency:'観光庁', amount:10000000, rate:'1/2', deadline:'2025年8月31日', status:'公募中', target:'旅館・民宿・簡易宿所・ゲストハウス', region:'全国', diff:3, typeSlug:'hojo-kin', adoption:45, summary:'老朽化した旅館・宿泊施設の再生投資・インバウンド対応改修・多言語対応システムを支援します。客室改装・バリアフリー化・決済システム・Wi-Fi整備に上限1000万円。' },
  { title:'小売業デジタル化・EC立ち上げ支援補助金', agency:'経済産業省 商務情報政策局', amount:2000000, rate:'2/3', deadline:'2025年11月30日', status:'公募中', target:'実店舗を持つ小売業者', region:'全国', diff:2, typeSlug:'hojo-kin', adoption:58, summary:'実店舗を持つ小売業者がオンライン販売を始める、または在庫管理・POS連携を強化するための費用を補助します。ECサイト構築・在庫管理システム・決済端末に上限200万円。' },
  { title:'クリーニング・洗濯業省エネ・設備更新補助金', agency:'経済産業省 生活衛生課', amount:2000000, rate:'1/2', deadline:'2025年10月31日', status:'公募中', target:'クリーニング業者・コインランドリー事業者', region:'全国', diff:2, typeSlug:'hojo-kin', adoption:60, summary:'クリーニング業の省エネ型乾燥機・洗濯機への更新、コインランドリーの新規開業・増設投資を支援します。ヒートポンプ乾燥機・省エネ型機器への更新に上限200万円。' },
  { title:'運送業・物流DX・電動化支援補助金', agency:'国土交通省 自動車局', amount:10000000, rate:'1/3', deadline:'2025年9月30日', status:'公募中', target:'中小運送業者・物流事業者', region:'全国', diff:3, typeSlug:'hojo-kin', adoption:42, summary:'物流2024年問題への対応とCO₂削減を両立するため、電気トラック・ハイブリッド車・ルート最適化システム・配送管理DXへの投資を支援します。上限1000万円。' },
  { title:'医療機関・クリニック設備高度化補助金', agency:'厚生労働省 医政局', amount:30000000, rate:'1/3', deadline:'2025年8月31日', status:'公募中', target:'診療所・クリニック・中小病院', region:'全国', diff:3, typeSlug:'hojo-kin', adoption:38, summary:'地域医療を支える診療所・クリニックの医療機器更新・電子カルテ導入・医療DX化を支援します。オンライン診療システム・AI診断支援・遠隔医療設備に上限3000万円。' },

  // ===== BLOCK E: R&D・イノベーション =====
  { title:'大学発スタートアップ事業化支援補助金', agency:'文部科学省・経済産業省', amount:50000000, rate:'2/3', deadline:'2025年9月30日', status:'公募中', target:'大学発ベンチャー・大学技術移転機関', region:'全国', diff:4, typeSlug:'hojo-kin', adoption:28, summary:'大学の研究成果を事業化するスタートアップの事業化フェーズを集中支援します。プロトタイプ開発・試験・薬事・安全認証取得・マーケティングに最大5000万円。大学TLOとの連携が要件。' },
  { title:'知的財産・特許取得グローバル戦略支援補助金', agency:'特許庁', amount:3000000, rate:'2/3', deadline:'2025年10月31日', status:'公募中', target:'中小企業・スタートアップ・個人発明家', region:'全国', diff:3, typeSlug:'hojo-kin', adoption:55, summary:'海外への特許・商標・意匠出願費用を支援します。PCT出願・各国別出願・先行技術調査・知財戦略コンサルティング費用が対象。グローバルに事業展開を目指す企業を優遇。上限300万円。' },
  { title:'試作品・プロトタイプ開発加速化補助金', agency:'経済産業省 製造産業局', amount:10000000, rate:'2/3', deadline:'2025年8月31日', status:'公募中', target:'ものづくり中小企業・製造スタートアップ', region:'全国', diff:3, typeSlug:'hojo-kin', adoption:40, summary:'新製品・新技術の試作品・プロトタイプ開発を加速するための費用を支援します。材料費・外注加工費・試験費・設計費に上限1000万円。3Dプリンタ・CNCなどの活用も対象です。' },
  { title:'オープンイノベーション・産学連携研究補助金', agency:'経済産業省・文部科学省', amount:30000000, rate:'1/2', deadline:'2025年7月31日', status:'公募中', target:'中小企業と大学・研究機関の連携プロジェクト', region:'全国', diff:4, typeSlug:'hojo-kin', adoption:30, summary:'中小企業と大学・公的研究機関が共同で行う研究開発プロジェクトを支援します。革新的な技術・製品・サービスの開発を目指す連携体に最大3000万円。国際共同研究には加算あり。' },
  { title:'量子技術・次世代コンピューティング活用補助金', agency:'内閣府 量子技術・イノベーション戦略室', amount:100000000, rate:'1/2', deadline:'2025年9月30日', status:'予定', target:'量子技術応用を目指す企業・研究機関', region:'全国', diff:5, typeSlug:'hojo-kin', adoption:15, summary:'量子コンピュータ・量子通信・量子センサー等の量子技術を社会実装するための研究開発と実証を支援します。量子クラウドアクセス費用・アルゴリズム開発・ユースケース実証に最大1億円。' },
  { title:'バイオテクノロジー・ゲノム研究事業化補助金', agency:'経済産業省 バイオ産業課', amount:50000000, rate:'1/2', deadline:'2025年10月31日', status:'予定', target:'バイオベンチャー・製薬・農業バイオ企業', region:'全国', diff:5, typeSlug:'hojo-kin', adoption:20, summary:'ゲノム編集・バイオ医薬・機能性食品・バイオ農薬等のバイオテクノロジーを活用した製品・サービス開発を支援します。前臨床試験・臨床試験準備・規制対応費用に最大5000万円。' },
  { title:'宇宙産業・衛星データ利活用事業化補助金', agency:'内閣府 宇宙政策委員会・JAXA', amount:100000000, rate:'1/2', deadline:'2025年8月31日', status:'予定', target:'宇宙関連スタートアップ・宇宙利用企業', region:'全国', diff:5, typeSlug:'hojo-kin', adoption:18, summary:'小型衛星開発・衛星データ解析・宇宙輸送・月面探査等の宇宙産業参入を支援します。衛星設計・製造・打上げ準備費用、地上設備整備に最大1億円。民間宇宙利用の拡大を促進します。' },
  { title:'次世代素材・マテリアルズイノベーション補助金', agency:'経済産業省 素材産業室', amount:30000000, rate:'1/2', deadline:'2025年9月30日', status:'公募中', target:'素材メーカー・化学企業・研究開発型中小企業', region:'全国', diff:4, typeSlug:'hojo-kin', adoption:28, summary:'カーボンファイバー・セラミックス・バイオプラスチック・超電導材料等の次世代素材開発と社会実装を支援します。材料合成・評価・成形加工技術開発に最大3000万円。' },
  { title:'医療AI・デジタルヘルス製品開発補助金', agency:'厚生労働省・経済産業省', amount:50000000, rate:'1/2', deadline:'2025年10月31日', status:'公募中', target:'医療AI開発企業・ヘルスケアスタートアップ', region:'全国', diff:4, typeSlug:'hojo-kin', adoption:25, summary:'AI診断支援・デジタル治療・遠隔医療・健康管理AIの製品開発と薬事承認取得を支援します。プログラム医療機器（SaMD）の開発・臨床評価・承認申請費用に最大5000万円。' },
  { title:'スマートシティ・MaaS実証支援補助金', agency:'国土交通省・デジタル庁', amount:100000000, rate:'1/2', deadline:'2025年9月30日', status:'予定', target:'自治体・交通事業者・モビリティスタートアップ', region:'全国', diff:4, typeSlug:'hojo-kin', adoption:22, summary:'都市のデジタル化・自動運転・MaaS（モビリティ・アズ・ア・サービス）の実証実験と社会実装を支援します。自動運転バス・デマンド交通・統合移動アプリ開発に最大1億円。' },
];

async function main() {
  let ok=0, ng=0;
  for (const item of items) {
    const res = await post(item);
    if (res) ok++; else ng++;
    await new Promise(r => setTimeout(r, 300));
  }
  console.log(`\n=== 完了 ===\n登録: ${ok}件 / エラー: ${ng}件`);
}

main();
