<?php
/**
 * 補助金now - page-shindan.php
 * 補助金診断ページ（固定ページ slug: shindan）
 */
if ( ! defined( 'ABSPATH' ) ) exit;

include __DIR__ . '/parts/header.php';

// 診断用補助金データ（DB から取得）
$all_subsidies = get_posts( array(
  'post_type'      => 'subsidies',
  'posts_per_page' => -1,
  'post_status'    => 'publish',
  'fields'         => 'ids',
) );
$total_count = count( $all_subsidies );
?>

<style>
.shindan-wrap { max-width: 860px; margin: 0 auto; padding: 2rem 1rem 4rem; }
.shindan-hero { text-align:center; padding: 3rem 1rem 2rem; background: linear-gradient(135deg,#0a2540,#1A56DB 40%,#1A6B3C); border-radius: 1.5rem; color:#fff; margin-bottom: 2rem; }
.shindan-hero h1 { font-size: 2rem; font-weight: 900; margin-bottom: 0.5rem; color: #fff; }
.step-indicator { display:flex; justify-content:center; align-items:center; gap:0.5rem; margin-bottom:2rem; }
.step-dot { width:2rem; height:2rem; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.8rem; font-weight:900; background:#e5e7eb; color:#9ca3af; flex-shrink:0; }
.step-dot.active { background:linear-gradient(135deg,#1A56DB,#1A6B3C); color:#fff; }
.step-dot.done { background:#1A6B3C; color:#fff; }
.step-line { flex:1; height:2px; background:#e5e7eb; max-width:3rem; }
.step-line.done { background:#1A6B3C; }
.q-card { background:#fff; border-radius:1rem; padding:1.75rem; box-shadow:0 2px 12px rgba(0,0,0,0.06); margin-bottom:1.5rem; }
.q-title { font-size:1.1rem; font-weight:900; color:#111827; margin-bottom:1.25rem; display:flex; gap:0.75rem; align-items:flex-start; }
.q-num { flex-shrink:0; background:linear-gradient(135deg,#1A56DB,#1A6B3C); color:#fff; width:1.75rem; height:1.75rem; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.8rem; font-weight:900; margin-top:0.1rem; }
.q-opts { display:grid; gap:0.6rem; }
.q-opt { display:flex; align-items:center; gap:0.75rem; padding:0.85rem 1rem; border:2px solid #e5e7eb; border-radius:0.75rem; cursor:pointer; transition:all 0.2s; font-size:0.9rem; font-weight:500; }
.q-opt:hover { border-color:#1A56DB; background:#eff6ff; }
.q-opt input { display:none; }
.q-opt.selected { border-color:#1A56DB; background:#eff6ff; font-weight:700; }
.q-opt.selected::before { content:'✓'; color:#1A56DB; font-weight:900; margin-right:-0.25rem; }
.btn-next { display:block; width:100%; padding:1rem; background:linear-gradient(135deg,#1A56DB,#1A6B3C); color:#fff; font-weight:900; font-size:1rem; border:none; border-radius:0.75rem; cursor:pointer; transition:opacity 0.2s; }
.btn-next:hover { opacity:0.9; }
.btn-next:disabled { opacity:0.4; cursor:not-allowed; }
.result-card { background:#fff; border-radius:1rem; padding:1.75rem; box-shadow:0 2px 12px rgba(0,0,0,0.06); margin-bottom:1rem; border-left:4px solid; }
.result-card.high { border-color:#1A6B3C; }
.result-card.mid { border-color:#1A56DB; }
.result-card.low { border-color:#9ca3af; }
.match-badge { display:inline-block; padding:0.25rem 0.75rem; border-radius:999px; font-weight:900; font-size:0.85rem; margin-bottom:0.5rem; }
.match-high { background:#dcfce7; color:#15803d; }
.match-mid { background:#dbeafe; color:#1e40af; }
.match-low { background:#f3f4f6; color:#6b7280; }
.progress-bar-wrap { height:12px; background:#e5e7eb; border-radius:6px; overflow:hidden; margin:0.5rem 0; }
.progress-bar-fill { height:100%; border-radius:6px; transition:width 1s ease; }
</style>

<!-- パンくず -->
<nav class="breadcrumb bg-hj-bg">
  <a href="<?php echo esc_url( home_url( '/' ) ); ?>">ホーム</a>
  <span class="bc-sep">/</span>
  <span class="bc-current">補助金診断</span>
</nav>

<div class="shindan-wrap">

  <!-- ヒーロー -->
  <div class="shindan-hero">
    <div style="font-size:3rem;margin-bottom:0.5rem;">🔍</div>
    <h1>補助金かんたん診断</h1>
    <p style="color:rgba(255,255,255,0.8);font-size:0.95rem;">いくつかの質問に答えるだけで、あなたの事業に合った補助金・助成金の適合度が分かります</p>
    <p style="color:rgba(255,255,255,0.6);font-size:0.8rem;margin-top:0.5rem;">※当サイト独自の算出基準であり、実際の受給を保証するものではありません</p>
  </div>

  <!-- 診断フォーム -->
  <div id="shindan-form">

    <!-- ステップ表示 -->
    <div class="step-indicator" id="step-indicator">
      <div class="step-dot active" data-step="1">1</div>
      <div class="step-line" data-line="1"></div>
      <div class="step-dot" data-step="2">2</div>
      <div class="step-line" data-line="2"></div>
      <div class="step-dot" data-step="3">3</div>
      <div class="step-line" data-line="3"></div>
      <div class="step-dot" data-step="4">4</div>
      <div class="step-line" data-line="4"></div>
      <div class="step-dot" data-step="5">5</div>
      <div class="step-line" data-line="5"></div>
      <div class="step-dot" data-step="6">6</div>
    </div>

    <!-- Q1 -->
    <div class="q-card" data-step="1">
      <p class="q-title"><span class="q-num">1</span> あなたの事業形態を教えてください</p>
      <div class="q-opts">
        <label class="q-opt" data-key="entity" data-val="corp">
          <input type="radio" name="entity" value="corp"> 🏢 法人（株式会社・合同会社など）
        </label>
        <label class="q-opt" data-key="entity" data-val="sole">
          <input type="radio" name="entity" value="sole"> 🏠 個人事業主・フリーランス
        </label>
        <label class="q-opt" data-key="entity" data-val="npo">
          <input type="radio" name="entity" value="npo"> 🤝 NPO・社会福祉法人
        </label>
        <label class="q-opt" data-key="entity" data-val="startup">
          <input type="radio" name="entity" value="startup"> 🚀 スタートアップ・創業予定
        </label>
      </div>
    </div>

    <!-- Q2 -->
    <div class="q-card" data-step="2" style="display:none;">
      <p class="q-title"><span class="q-num">2</span> 従業員数（正社員）は何名ですか？</p>
      <div class="q-opts">
        <label class="q-opt" data-key="emp" data-val="0">
          <input type="radio" name="emp" value="0"> 👤 0名（一人）/ 創業前
        </label>
        <label class="q-opt" data-key="emp" data-val="5">
          <input type="radio" name="emp" value="5"> 👥 1〜5名
        </label>
        <label class="q-opt" data-key="emp" data-val="20">
          <input type="radio" name="emp" value="20"> 👨‍👩‍👧‍👦 6〜20名
        </label>
        <label class="q-opt" data-key="emp" data-val="100">
          <input type="radio" name="emp" value="100"> 🏭 21〜100名
        </label>
        <label class="q-opt" data-key="emp" data-val="300">
          <input type="radio" name="emp" value="300"> 🏢 101〜300名
        </label>
        <label class="q-opt" data-key="emp" data-val="999">
          <input type="radio" name="emp" value="999"> 🏙 300名以上
        </label>
      </div>
    </div>

    <!-- Q3 -->
    <div class="q-card" data-step="3" style="display:none;">
      <p class="q-title"><span class="q-num">3</span> 主な業種を教えてください</p>
      <div class="q-opts">
        <label class="q-opt" data-key="industry" data-val="it">
          <input type="radio" name="industry" value="it"> 💻 IT・デジタル・ソフトウェア
        </label>
        <label class="q-opt" data-key="industry" data-val="mfg">
          <input type="radio" name="industry" value="mfg"> 🏭 製造業・ものづくり
        </label>
        <label class="q-opt" data-key="industry" data-val="retail">
          <input type="radio" name="industry" value="retail"> 🛒 小売・飲食・サービス業
        </label>
        <label class="q-opt" data-key="industry" data-val="agri">
          <input type="radio" name="industry" value="agri"> 🌾 農業・林業・水産業
        </label>
        <label class="q-opt" data-key="industry" data-val="med">
          <input type="radio" name="industry" value="med"> 🏥 医療・福祉・介護
        </label>
        <label class="q-opt" data-key="industry" data-val="const">
          <input type="radio" name="industry" value="const"> 🔨 建設・不動産
        </label>
        <label class="q-opt" data-key="industry" data-val="other">
          <input type="radio" name="industry" value="other"> 📦 その他
        </label>
      </div>
    </div>

    <!-- Q4 -->
    <div class="q-card" data-step="4" style="display:none;">
      <p class="q-title"><span class="q-num">4</span> 補助金・助成金を活用したい目的は？（最も近いもの）</p>
      <div class="q-opts">
        <label class="q-opt" data-key="purpose" data-val="dx">
          <input type="radio" name="purpose" value="dx"> 🖥 IT導入・DX推進・システム化
        </label>
        <label class="q-opt" data-key="purpose" data-val="hr">
          <input type="radio" name="purpose" value="hr"> 👨‍💼 雇用・採用・人材育成
        </label>
        <label class="q-opt" data-key="purpose" data-val="equipment">
          <input type="radio" name="purpose" value="equipment"> ⚙️ 設備投資・機械導入
        </label>
        <label class="q-opt" data-key="purpose" data-val="new">
          <input type="radio" name="purpose" value="new"> 💡 新商品・新サービス開発
        </label>
        <label class="q-opt" data-key="purpose" data-val="global">
          <input type="radio" name="purpose" value="global"> 🌏 海外展開・輸出促進
        </label>
        <label class="q-opt" data-key="purpose" data-val="eco">
          <input type="radio" name="purpose" value="eco"> 🌱 省エネ・環境対策・脱炭素
        </label>
        <label class="q-opt" data-key="purpose" data-val="startup">
          <input type="radio" name="purpose" value="startup"> 🚀 創業・スタートアップ支援
        </label>
      </div>
    </div>

    <!-- Q5 -->
    <div class="q-card" data-step="5" style="display:none;">
      <p class="q-title"><span class="q-num">5</span> お住まいの地域（事業所の所在地）は？</p>
      <div class="q-opts">
        <label class="q-opt" data-key="region" data-val="national">
          <input type="radio" name="region" value="national"> 🗾 全国対象（地域問わず申請したい）
        </label>
        <label class="q-opt" data-key="region" data-val="tokyo">
          <input type="radio" name="region" value="tokyo"> 🗼 東京都
        </label>
        <label class="q-opt" data-key="region" data-val="kanto">
          <input type="radio" name="region" value="kanto"> 🌸 関東（東京除く）
        </label>
        <label class="q-opt" data-key="region" data-val="kansai">
          <input type="radio" name="region" value="kansai"> 🏯 関西（大阪・京都・兵庫など）
        </label>
        <label class="q-opt" data-key="region" data-val="chubu">
          <input type="radio" name="region" value="chubu"> 🗻 中部・東海
        </label>
        <label class="q-opt" data-key="region" data-val="other">
          <input type="radio" name="region" value="other"> 📍 その他の地域
        </label>
      </div>
    </div>

    <!-- Q6 -->
    <div class="q-card" data-step="6" style="display:none;">
      <p class="q-title"><span class="q-num">6</span> 希望する補助金の種類は？</p>
      <div class="q-opts">
        <label class="q-opt" data-key="type" data-val="hojyo">
          <input type="radio" name="type" value="hojyo"> 💰 補助金（採択後に費用の一部を補助）
        </label>
        <label class="q-opt" data-key="type" data-val="joseikin">
          <input type="radio" name="type" value="joseikin"> 🤝 助成金（要件を満たせばほぼ受給可能）
        </label>
        <label class="q-opt" data-key="type" data-val="kyufukin">
          <input type="radio" name="type" value="kyufukin"> 🎁 給付金（生活・事業継続のための支援）
        </label>
        <label class="q-opt" data-key="type" data-val="yushi">
          <input type="radio" name="type" value="yushi"> 🏦 融資（低金利での借入制度）
        </label>
        <label class="q-opt" data-key="type" data-val="any">
          <input type="radio" name="type" value="any"> 🔍 すべての種類から探したい
        </label>
      </div>
    </div>

    <!-- 次へボタン -->
    <button class="btn-next" id="btn-next" disabled onclick="nextStep()">
      次の質問へ →
    </button>

  </div><!-- /#shindan-form -->

  <!-- 結果エリア（非表示） -->
  <div id="shindan-result" style="display:none;">
    <div style="text-align:center;padding:2rem 0 1rem;">
      <div style="font-size:3rem;margin-bottom:0.5rem;">🎉</div>
      <h2 style="font-size:1.5rem;font-weight:900;color:#111827;margin-bottom:0.5rem;">診断結果</h2>
      <p style="color:#6b7280;font-size:0.9rem;">あなたの回答をもとに、適合度の高い補助金・助成金をピックアップしました</p>
    </div>
    <div id="result-list"></div>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:0.75rem;padding:1rem;margin-top:1.5rem;font-size:0.85rem;color:#92400e;">
      ⚠️ <strong>免責事項</strong>：当サイトの診断結果はあくまでも目安であり、実際の受給・採択を保証するものではありません。詳細な要件・申請方法は各制度の公式ページや専門家にご確認ください。
    </div>
    <div style="margin-top:1.5rem;display:flex;gap:1rem;flex-wrap:wrap;justify-content:center;">
      <a href="<?php echo esc_url( home_url( '/subsidies/' ) ); ?>" class="btn-next" style="display:inline-block;width:auto;padding:0.85rem 2rem;text-decoration:none;">
        📋 補助金一覧を見る
      </a>
      <button onclick="resetShindan()" style="padding:0.85rem 2rem;background:#f3f4f6;color:#374151;font-weight:700;border:none;border-radius:0.75rem;cursor:pointer;font-size:0.95rem;">
        🔄 もう一度診断する
      </button>
    </div>
  </div>

</div><!-- /.shindan-wrap -->

<script>
var currentStep = 1;
var maxSteps = 6;
var answers = {};

// 選択肢クリック
document.querySelectorAll('.q-opt').forEach(function(opt) {
  opt.addEventListener('click', function() {
    var key = this.dataset.key;
    var val = this.dataset.val;
    // 同じステップ内の選択をリセット
    document.querySelectorAll('[data-key="' + key + '"]').forEach(function(o) {
      o.classList.remove('selected');
    });
    this.classList.add('selected');
    answers[key] = val;
    document.getElementById('btn-next').disabled = false;
  });
});

function nextStep() {
  // ステップ更新
  var current = document.querySelector('[data-step="' + currentStep + '"].q-card');
  var indicator = document.querySelector('.step-dot[data-step="' + currentStep + '"]');
  var line = document.querySelector('[data-line="' + currentStep + '"]');

  if (indicator) { indicator.classList.remove('active'); indicator.classList.add('done'); }
  if (line) line.classList.add('done');

  if (currentStep < maxSteps) {
    currentStep++;
    var next = document.querySelector('[data-step="' + currentStep + '"].q-card');
    if (next) next.style.display = '';
    var nextDot = document.querySelector('.step-dot[data-step="' + currentStep + '"]');
    if (nextDot) nextDot.classList.add('active');

    // ボタンリセット
    var hasAns = answers[next ? next.querySelector('[data-key]').dataset.key : ''] !== undefined;
    document.getElementById('btn-next').disabled = !hasAns;
    document.getElementById('btn-next').textContent = currentStep < maxSteps ? '次の質問へ →' : '診断結果を見る 🎉';
    // スクロール
    next.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    // 結果表示
    showResult();
  }
}

function showResult() {
  document.getElementById('shindan-form').style.display = 'none';
  document.getElementById('shindan-result').style.display = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderResult();
}

function calcMatch(subsidy) {
  var score = 0;
  var max = 100;

  // ステータス（公募中は+20）
  var status = subsidy.status || '';
  if (['公募中','募集中','受付中'].indexOf(status) >= 0) score += 20;
  else if (status === '予定') score += 10;
  else if (status === '終了') score -= 10;

  // 種別マッチ
  var typeAns = answers.type || 'any';
  if (typeAns !== 'any') {
    var typeMap = { hojyo: ['補助金'], joseikin: ['助成金'], kyufukin: ['給付金'], yushi: ['融資'] };
    var wanted = typeMap[typeAns] || [];
    var typeMatch = false;
    (subsidy.types || []).forEach(function(t) {
      wanted.forEach(function(w) { if (t.indexOf(w) >= 0) typeMatch = true; });
    });
    if (typeMatch) score += 25;
    else score -= 10;
  } else {
    score += 10; // any は軽くプラス
  }

  // 目的マッチ
  var purposeAns = answers.purpose || '';
  var purposeKeywords = {
    dx: ['IT','デジタル','DX','システム','ソフト','クラウド'],
    hr: ['雇用','採用','人材','訓練','育成'],
    equipment: ['設備','機械','製造','ものづくり'],
    new: ['研究','開発','新商品','新サービス','イノベーション'],
    global: ['海外','輸出','国際','グローバル'],
    eco: ['省エネ','環境','脱炭素','再生可能','GX'],
    startup: ['創業','スタートアップ','起業','新規']
  };
  var keywords = purposeKeywords[purposeAns] || [];
  var title = subsidy.title || '';
  keywords.forEach(function(kw) {
    if (title.indexOf(kw) >= 0) score += 8;
  });

  // 業種マッチ
  var indAns = answers.industry || '';
  var indKeywords = {
    it: ['IT','デジタル','ソフト','システム','情報'],
    mfg: ['製造','ものづくり','工場','加工'],
    retail: ['小売','飲食','サービス','店舗'],
    agri: ['農業','林業','水産','農林'],
    med: ['医療','福祉','介護','病院'],
    const: ['建設','不動産','工事'],
  };
  var indKws = indKeywords[indAns] || [];
  indKws.forEach(function(kw) {
    if (title.indexOf(kw) >= 0) score += 5;
  });

  // 地域マッチ
  var regionAns = answers.region || 'national';
  var subRegion = subsidy.region || '全国';
  if (subRegion === '全国' || regionAns === 'national') {
    score += 10;
  } else {
    var regionKeyMap = {
      tokyo: ['東京'],
      kanto: ['神奈川','埼玉','千葉','茨城','栃木','群馬','山梨'],
      kansai: ['大阪','京都','兵庫','滋賀','奈良','和歌山'],
      chubu: ['愛知','静岡','岐阜','三重','長野','山梨','新潟','富山','石川','福井'],
    };
    var matchPrefectures = regionKeyMap[regionAns] || [];
    matchPrefectures.forEach(function(pref) {
      if (subRegion.indexOf(pref) >= 0) score += 10;
    });
  }

  // 従業員数チェック
  var empAns = parseInt(answers.emp || '0');
  var minEmp = parseInt(subsidy.min_emp || '0') || 0;
  var maxEmp = parseInt(subsidy.max_emp || '999') || 999;
  if (empAns >= minEmp && empAns <= maxEmp) score += 5;

  // 0-100 クランプ
  return Math.max(0, Math.min(100, score));
}

function renderResult() {
  var resultEl = document.getElementById('result-list');
  var subsidies = <?php
    // PHP側で補助金リストをJSONで出力（最大100件）
    $sub_posts = get_posts( array(
      'post_type'      => 'subsidies',
      'posts_per_page' => 100,
      'post_status'    => 'publish',
      'orderby'        => 'rand',
    ) );
    $sub_json = array();
    foreach ( $sub_posts as $sp ) {
      $types_t = get_the_terms( $sp->ID, 'subsidy_type' );
      $sub_json[] = array(
        'id'      => $sp->ID,
        'title'   => $sp->post_title,
        'url'     => get_permalink( $sp->ID ),
        'status'  => get_post_meta( $sp->ID, 'hj_status', true ),
        'amount'  => get_post_meta( $sp->ID, 'hj_amount_max', true ),
        'rate'    => get_post_meta( $sp->ID, 'hj_amount_rate', true ),
        'agency'  => get_post_meta( $sp->ID, 'hj_agency', true ),
        'region'  => get_post_meta( $sp->ID, 'hj_region', true ),
        'min_emp' => get_post_meta( $sp->ID, 'hj_min_employees', true ),
        'max_emp' => get_post_meta( $sp->ID, 'hj_max_employees', true ),
        'types'   => $types_t && ! is_wp_error( $types_t ) ? wp_list_pluck( $types_t, 'name' ) : array(),
      );
    }
    echo wp_json_encode( $sub_json );
  ?>;

  // スコア計算
  var scored = subsidies.map(function(s) {
    return Object.assign({}, s, { score: calcMatch(s) });
  }).sort(function(a, b) { return b.score - a.score; });

  var top = scored.slice(0, 10);
  var html = '';

  top.forEach(function(s, i) {
    var level = s.score >= 60 ? 'high' : s.score >= 35 ? 'mid' : 'low';
    var badgeClass = s.score >= 60 ? 'match-high' : s.score >= 35 ? 'match-mid' : 'match-low';
    var barColor = s.score >= 60 ? '#1A6B3C' : s.score >= 35 ? '#1A56DB' : '#9ca3af';
    var amountText = s.amount ? '最大 ' + formatAmt(s.amount) : (s.rate ? s.rate : '');
    html += '<div class="result-card ' + level + '">';
    html += '<span class="match-badge ' + badgeClass + '">適合度 ' + s.score + '%</span>';
    html += '<div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:' + s.score + '%;background:' + barColor + ';"></div></div>';
    html += '<h3 style="font-size:1rem;font-weight:900;margin:0.5rem 0 0.25rem;">';
    html += '<a href="' + s.url + '" style="color:#111827;text-decoration:none;">' + escHtml(s.title) + '</a>';
    html += '</h3>';
    if (amountText) html += '<p style="color:#1A56DB;font-weight:700;font-size:0.9rem;">' + escHtml(amountText) + '</p>';
    if (s.agency) html += '<p style="color:#6b7280;font-size:0.8rem;">🏛 ' + escHtml(s.agency) + '</p>';
    html += '<div style="margin-top:0.75rem;display:flex;gap:0.5rem;flex-wrap:wrap;">';
    html += '<a href="' + s.url + '" style="display:inline-block;padding:0.4rem 1rem;background:linear-gradient(135deg,#1A56DB,#1A6B3C);color:#fff;border-radius:0.5rem;font-size:0.85rem;font-weight:700;text-decoration:none;">詳細を見る →</a>';
    html += '</div>';
    html += '</div>';
  });

  if (top.length === 0) {
    html = '<div style="text-align:center;padding:2rem;color:#6b7280;">条件に合う補助金が見つかりませんでした。<br><a href="<?php echo esc_url( home_url( '/subsidies/' ) ); ?>" style="color:#1A56DB;">補助金一覧をご覧ください</a></div>';
  }

  resultEl.innerHTML = html;
}

function formatAmt(n) {
  n = parseInt(n);
  if (!n) return '';
  if (n >= 10000) return (n/10000).toFixed(n % 10000 === 0 ? 0 : 1) + '億円';
  if (n >= 1000) return (n/1000).toFixed(n % 1000 === 0 ? 0 : 1) + '千万円';
  return n + '万円';
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function resetShindan() {
  currentStep = 1;
  answers = {};
  document.querySelectorAll('.q-card').forEach(function(c, i) {
    c.style.display = i === 0 ? '' : 'none';
  });
  document.querySelectorAll('.q-opt').forEach(function(o) { o.classList.remove('selected'); });
  document.querySelectorAll('input[type=radio]').forEach(function(r) { r.checked = false; });
  document.querySelectorAll('.step-dot').forEach(function(d, i) {
    d.classList.remove('active','done');
    if (i === 0) d.classList.add('active');
  });
  document.querySelectorAll('.step-line').forEach(function(l) { l.classList.remove('done'); });
  document.getElementById('btn-next').disabled = true;
  document.getElementById('btn-next').textContent = '次の質問へ →';
  document.getElementById('shindan-form').style.display = '';
  document.getElementById('shindan-result').style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
</script>

<?php include __DIR__ . '/parts/footer.php'; ?>
