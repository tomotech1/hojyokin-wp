<?php
/**
 * 補助金now - front-page.php（トップページ）
 */
if ( ! defined( 'ABSPATH' ) ) exit;

$total_subsidies = wp_count_posts( 'subsidies' )->publish;
$total_articles  = wp_count_posts( 'post' )->publish;

// 募集中件数
$active_count_q = new WP_Query( array(
  'post_type' => 'subsidies', 'posts_per_page' => -1, 'fields' => 'ids',
  'post_status' => 'publish',
  'meta_query' => array( array( 'key' => 'hj_status', 'value' => array('公募中','募集中','受付中'), 'compare' => 'IN' ) ),
) );
$active_count = $active_count_q->found_posts;

// 補助金種別
$subsidy_types = get_terms( array( 'taxonomy' => 'subsidy_type', 'orderby' => 'count', 'order' => 'DESC', 'number' => 12, 'hide_empty' => false, 'parent' => 0 ) );

// 業種タグ
$subsidy_industries = get_terms( array( 'taxonomy' => 'subsidy_industry', 'orderby' => 'count', 'order' => 'DESC', 'number' => 16, 'hide_empty' => false ) );

// 新着補助金
$latest_subsidies = new WP_Query( array( 'post_type' => 'subsidies', 'posts_per_page' => 8, 'orderby' => 'date', 'order' => 'DESC' ) );

// ピックアップ補助金（金額上位）
$pickup_subsidies = new WP_Query( array(
  'post_type' => 'subsidies', 'posts_per_page' => 4, 'post_status' => 'publish',
  'meta_key' => 'hj_amount_max', 'orderby' => 'meta_value_num', 'order' => 'DESC',
) );

// ホット補助金（公募中 + 締切が近い）
$today     = current_time( 'Y-m-d' );
$near_date = date( 'Y-m-d', strtotime( '+60 days' ) );
$hot_subsidies = new WP_Query( array(
  'post_type' => 'subsidies', 'posts_per_page' => 4, 'post_status' => 'publish',
  'meta_query' => array(
    'relation' => 'AND',
    array( 'key' => 'hj_status', 'value' => array('公募中','募集中','受付中'), 'compare' => 'IN' ),
    array( 'key' => 'hj_deadline', 'value' => $today, 'compare' => '>=', 'type' => 'DATE' ),
    array( 'key' => 'hj_deadline', 'value' => $near_date, 'compare' => '<=', 'type' => 'DATE' ),
  ),
  'meta_key' => 'hj_deadline', 'orderby' => 'meta_value', 'order' => 'ASC',
) );
// ホットが少ない場合はランダム公募中で補完
if ( $hot_subsidies->found_posts < 4 ) {
  $hot_subsidies = new WP_Query( array(
    'post_type' => 'subsidies', 'posts_per_page' => 4, 'post_status' => 'publish',
    'meta_query' => array( array( 'key' => 'hj_status', 'value' => array('公募中','募集中','受付中'), 'compare' => 'IN' ) ),
    'orderby' => 'rand',
  ) );
}

// 締切カレンダー用（未来の締切優先 → 過去も含めて最大10件）
$future_deadline = new WP_Query( array(
  'post_type' => 'subsidies', 'posts_per_page' => 10, 'post_status' => 'publish',
  'meta_query' => array(
    'relation' => 'AND',
    array( 'key' => 'hj_deadline', 'value' => '', 'compare' => '!=' ),
    array( 'key' => 'hj_deadline', 'value' => $today, 'compare' => '>=', 'type' => 'DATE' ),
  ),
  'meta_key' => 'hj_deadline', 'orderby' => 'meta_value', 'order' => 'ASC',
) );
// 未来の締切が少ない場合は過去3ヶ月も含める
$past_3m = date( 'Y-m-d', strtotime( '-3 months' ) );
$near_deadline = $future_deadline->found_posts >= 5 ? $future_deadline : new WP_Query( array(
  'post_type' => 'subsidies', 'posts_per_page' => 10, 'post_status' => 'publish',
  'meta_query' => array(
    'relation' => 'AND',
    array( 'key' => 'hj_deadline', 'value' => '', 'compare' => '!=' ),
    array( 'key' => 'hj_deadline', 'value' => $past_3m, 'compare' => '>=', 'type' => 'DATE' ),
  ),
  'meta_key' => 'hj_deadline', 'orderby' => 'meta_value', 'order' => 'ASC',
) );

// 新着記事
$articles = new WP_Query( array( 'post_type' => 'post', 'posts_per_page' => 3, 'orderby' => 'date', 'order' => 'DESC', 'post_status' => 'publish' ) );

// 都道府県リスト（日本地図用）
$prefectures = array(
  '北海道' => '北海道', '青森県' => '東北', '岩手県' => '東北', '宮城県' => '東北',
  '秋田県' => '東北', '山形県' => '東北', '福島県' => '東北',
  '茨城県' => '関東', '栃木県' => '関東', '群馬県' => '関東', '埼玉県' => '関東',
  '千葉県' => '関東', '東京都' => '関東', '神奈川県' => '関東',
  '新潟県' => '中部', '富山県' => '中部', '石川県' => '中部', '福井県' => '中部',
  '山梨県' => '中部', '長野県' => '中部', '岐阜県' => '中部', '静岡県' => '中部', '愛知県' => '中部',
  '三重県' => '近畿', '滋賀県' => '近畿', '京都府' => '近畿', '大阪府' => '近畿',
  '兵庫県' => '近畿', '奈良県' => '近畿', '和歌山県' => '近畿',
  '鳥取県' => '中国', '島根県' => '中国', '岡山県' => '中国', '広島県' => '中国', '山口県' => '中国',
  '徳島県' => '四国', '香川県' => '四国', '愛媛県' => '四国', '高知県' => '四国',
  '福岡県' => '九州', '佐賀県' => '九州', '長崎県' => '九州', '熊本県' => '九州',
  '大分県' => '九州', '宮崎県' => '九州', '鹿児島県' => '九州', '沖縄県' => '九州',
);
$region_groups = array();
foreach ( $prefectures as $pref => $group ) {
  $region_groups[ $group ][] = $pref;
}

include __DIR__ . '/parts/header.php';
?>

<style>
.hero-float { animation: heroFloat 6s ease-in-out infinite; }
@keyframes heroFloat { 0%,100% { transform:translateY(0) rotate(0deg); } 33% { transform:translateY(-12px) rotate(3deg); } 66% { transform:translateY(-6px) rotate(-2deg); } }
.hero-float-2 { animation: heroFloat2 8s ease-in-out infinite; }
@keyframes heroFloat2 { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-18px); } }
.hero-float-3 { animation: heroFloat3 5s ease-in-out infinite; }
@keyframes heroFloat3 { 0%,100% { transform:translateY(0) scale(1); } 50% { transform:translateY(-8px) scale(1.05); } }
.hot-badge { display:inline-flex;align-items:center;gap:4px;background:#ef4444;color:#fff;font-size:11px;font-weight:900;padding:2px 8px;border-radius:999px;animation:hjBadgePulse 1.5s ease-in-out infinite; }
.pickup-badge { display:inline-flex;align-items:center;gap:4px;background:#F59E0B;color:#fff;font-size:11px;font-weight:900;padding:2px 8px;border-radius:999px;animation:hjBadgePulseY 1.8s ease-in-out infinite; }
@keyframes hjBadgePulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.5)} 50%{box-shadow:0 0 0 5px rgba(239,68,68,0)} }
@keyframes hjBadgePulseY { 0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,0.5)} 50%{box-shadow:0 0 0 5px rgba(245,158,11,0)} }
.region-btn { display:block;padding:0.5rem 0.75rem;background:#fff;border:1px solid #e5e7eb;border-radius:0.5rem;font-size:0.8rem;font-weight:700;color:#374151;text-decoration:none;text-align:center;transition:all 0.15s; }
.region-btn:hover { background:#eff6ff;border-color:#1A56DB;color:#1A56DB; }
.region-group-title { font-size:0.7rem;font-weight:900;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.4rem;margin-top:0.75rem; }
</style>

<!-- ============================================================
     ヒーローセクション
     ============================================================ -->
<section class="home-hero">
  <!-- 装飾背景（充実版） -->
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    <!-- グロー背景（多層） -->
    <div class="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-20" style="background:radial-gradient(circle,#F59E0B,transparent)"></div>
    <div class="absolute bottom-0 -left-20 w-96 h-96 rounded-full opacity-20" style="background:radial-gradient(circle,#86efac,transparent)"></div>
    <div class="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-8" style="background:radial-gradient(ellipse,#F59E0B,transparent)"></div>
    <div class="absolute top-[60%] right-[10%] w-72 h-72 rounded-full opacity-10" style="background:radial-gradient(circle,#60a5fa,transparent)"></div>
    <div class="absolute top-[5%] left-[40%] w-48 h-48 rounded-full opacity-10" style="background:radial-gradient(circle,#a78bfa,transparent)"></div>
    <!-- 浮遊する通貨記号（増量） -->
    <span class="absolute top-[8%] left-[18%] text-white/10 font-black hero-float" style="font-size:4rem;animation-delay:0s;">¥</span>
    <span class="absolute top-[20%] right-[12%] text-white/8 font-black hero-float-2" style="font-size:3rem;animation-delay:1.5s;">¥</span>
    <span class="absolute bottom-[18%] left-[8%] text-white/8 font-black hero-float-3" style="font-size:2.5rem;animation-delay:3s;">¥</span>
    <span class="absolute bottom-[30%] right-[22%] text-white/6 font-black hero-float" style="font-size:5rem;animation-delay:2.5s;">¥</span>
    <span class="absolute top-[45%] left-[35%] text-white/6 font-black hero-float-2" style="font-size:6rem;animation-delay:4s;">¥</span>
    <span class="absolute top-[70%] right-[40%] text-white/5 font-black hero-float-3" style="font-size:3.5rem;animation-delay:1s;">¥</span>
    <span class="absolute top-[5%] right-[38%] text-white/6 font-black hero-float" style="font-size:2rem;animation-delay:5s;">¥</span>
    <!-- 補助金アイコン（浮遊・増量） -->
    <div class="absolute top-[15%] right-[8%] w-16 h-16 rounded-2xl flex items-center justify-center hero-float-2" style="animation-delay:0.5s;backdrop-filter:blur(4px);background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);">
      <svg class="w-8 h-8 text-white/40" viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
    </div>
    <div class="absolute top-[55%] left-[5%] w-14 h-14 rounded-2xl flex items-center justify-center hero-float" style="animation-delay:2s;backdrop-filter:blur(4px);background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);">
      <svg class="w-7 h-7 text-white/40" viewBox="0 0 24 24" fill="currentColor"><path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/></svg>
    </div>
    <div class="absolute bottom-[20%] right-[6%] w-12 h-12 rounded-full flex items-center justify-center hero-float-3" style="animation-delay:1s;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);">
      <svg class="w-6 h-6 text-white/40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
    </div>
    <div class="absolute top-[38%] right-[18%] w-12 h-12 rounded-2xl flex items-center justify-center hero-float-2" style="animation-delay:3.5s;background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.25);">
      <svg class="w-6 h-6" style="color:rgba(251,191,36,0.5);" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>
    </div>
    <div class="absolute bottom-[45%] left-[2%] w-10 h-10 rounded-full flex items-center justify-center hero-float" style="animation-delay:4.5s;background:rgba(96,165,250,0.15);border:1px solid rgba(96,165,250,0.25);">
      <svg class="w-5 h-5" style="color:rgba(147,197,253,0.6);" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
    </div>
    <!-- 泡（増量） -->
    <div class="absolute top-[28%] left-[2%] w-10 h-10 rounded-full border-2 border-white/15 hero-float" style="animation-delay:1.2s;"></div>
    <div class="absolute top-[12%] right-[25%] w-6 h-6 rounded-full border-2 border-white/15 hero-float-2" style="animation-delay:2.8s;"></div>
    <div class="absolute bottom-[35%] left-[50%] w-14 h-14 rounded-full border-2 border-white/10 hero-float-3" style="animation-delay:0.7s;"></div>
    <div class="absolute top-[65%] right-[35%] w-8 h-8 rounded-full border-2 border-white/10 hero-float" style="animation-delay:4s;"></div>
    <div class="absolute bottom-[10%] left-[30%] w-5 h-5 rounded-full bg-white/10 hero-float-2" style="animation-delay:3.5s;"></div>
    <div class="absolute top-[80%] left-[15%] w-4 h-4 rounded-full border border-white/20 hero-float-3" style="animation-delay:2.3s;"></div>
    <div class="absolute top-[3%] left-[55%] w-3 h-3 rounded-full bg-amber-300/20 hero-float" style="animation-delay:1.8s;"></div>
    <div class="absolute bottom-[55%] right-[3%] w-6 h-6 rounded-full border border-white/15 hero-float-2" style="animation-delay:5.5s;"></div>
    <!-- グリッド線（横＋縦） -->
    <div class="absolute inset-0" style="background:repeating-linear-gradient(0deg,transparent,transparent 80px,rgba(255,255,255,0.025) 80px,rgba(255,255,255,0.025) 81px),repeating-linear-gradient(90deg,transparent,transparent 120px,rgba(255,255,255,0.015) 120px,rgba(255,255,255,0.015) 121px);"></div>
    <!-- 対角線アクセント -->
    <div class="absolute top-0 left-0 w-full h-1" style="background:linear-gradient(90deg,transparent,rgba(245,158,11,0.3),transparent);"></div>
  </div>

  <div class="home-hero__inner">
    <div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 items-center">
      <div class="fade-in-up">
        <div class="home-hero__badge">
          <span class="w-2 h-2 bg-hj-accent rounded-full animate-pulse"></span>
          補助金now — 最新の補助金・助成金情報を一括検索
        </div>
        <h1 class="home-hero__title">
          あなたのビジネスに<br>
          最適な<span id="hjTypeWord" style="background:linear-gradient(135deg,#F59E0B,#FBBF24);-webkit-background-clip:text;-webkit-text-fill-color:transparent;display:inline-block;"></span><span id="hjTypeCursor" style="display:inline-block;width:3px;height:0.85em;background:linear-gradient(135deg,#F59E0B,#FBBF24);margin-left:2px;vertical-align:middle;border-radius:2px;animation:hjBlink 0.7s step-end infinite;"></span>
          を見つけよう
        </h1>
        <style>
        @keyframes hjBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        </style>
        <script>
        (function(){
          var words=['補助金','助成金','交付金','融資','給付金'];
          var el=document.getElementById('hjTypeWord');
          var cur=document.getElementById('hjTypeCursor');
          if(!el) return;
          var wi=0, ci=words[0].length, deleting=true;
          function tick(){
            var w=words[wi];
            if(!deleting){
              ci++;
              el.textContent=w.slice(0,ci);
              if(ci>=w.length){ deleting=true; setTimeout(tick,2000); return; }
              setTimeout(tick,100+Math.random()*60);
            } else {
              ci--;
              el.textContent=w.slice(0,ci);
              if(ci<=0){ deleting=false; wi=(wi+1)%words.length; setTimeout(tick,350); return; }
              setTimeout(tick,45+Math.random()*30);
            }
          }
          el.textContent=words[0];
          setTimeout(tick,2000);
        })();
        </script>
        <p class="home-hero__desc">
          国・都道府県・市区町村の補助金・助成金情報を一元管理。
          補助金名・業種・金額・地域で絞り込んで、申請可能な補助金を今すぐ確認できます。
        </p>

        <!-- ヒーロー検索フォーム -->
        <div class="relative max-w-2xl" id="hjnaviHeroSearchWrap">
          <form method="get" action="<?php echo esc_url( home_url( '/subsidies/' ) ); ?>" class="flex gap-0 w-full" autocomplete="off">
            <input type="search" name="s" id="hjnaviHeroSearchInput"
                   placeholder="補助金名・キーワードで検索..."
                   style="flex:1;background:#fff;border-radius:1rem 0 0 1rem;padding:1rem 1.25rem;font-size:1rem;font-weight:500;color:#1a1a1a;border:none;outline:none;box-shadow:0 4px 24px rgba(0,0,0,0.18);">
            <button type="submit"
                    style="background:linear-gradient(135deg,#F59E0B,#D97706);color:#fff;font-weight:900;font-size:0.95rem;padding:0 1.5rem;border:none;border-radius:0 1rem 1rem 0;cursor:pointer;display:flex;align-items:center;gap:0.4rem;white-space:nowrap;box-shadow:0 4px 24px rgba(0,0,0,0.18);min-width:90px;">
              <svg style="width:1.1rem;height:1.1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              検索
            </button>
          </form>
          <!-- サジェスト -->
          <div id="hjnaviHeroSearchDrop" class="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-[200] hidden overflow-hidden">
            <div id="hjnaviHeroSearchResults" class="max-h-80 overflow-y-auto divide-y divide-gray-50"></div>
            <div id="hjnaviHeroSearchEmpty" class="hidden px-5 py-5 text-center text-gray-500" style="font-size:15px;">
              🔍 「<span id="hjnaviHeroSearchQ"></span>」に一致する補助金が見つかりません
            </div>
          </div>
        </div>

        <!-- クイックフィルタ -->
        <div class="flex flex-wrap gap-2 mt-4">
          <a href="<?php echo esc_url( add_query_arg( 'status', '公募中', home_url( '/subsidies/' ) ) ); ?>"
             class="inline-flex items-center gap-1.5 bg-white/20 text-white text-sm font-bold px-4 py-2 rounded-full border border-white/30 hover:bg-white/30 no-underline transition-all">
            🟢 募集中のみ
          </a>
          <a href="<?php echo esc_url( add_query_arg( 'orderby', 'amount', home_url( '/subsidies/' ) ) ); ?>"
             class="inline-flex items-center gap-1.5 bg-white/20 text-white text-sm font-bold px-4 py-2 rounded-full border border-white/30 hover:bg-white/30 no-underline transition-all">
            💴 金額が高い順
          </a>
          <a href="<?php echo esc_url( add_query_arg( 'orderby', 'deadline', home_url( '/subsidies/' ) ) ); ?>"
             class="inline-flex items-center gap-1.5 bg-white/20 text-white text-sm font-bold px-4 py-2 rounded-full border border-white/30 hover:bg-white/30 no-underline transition-all">
            ⏰ 締切が近い順
          </a>
          <a href="<?php echo esc_url( home_url( '/shindan/' ) ); ?>"
             class="inline-flex items-center gap-1.5 bg-hj-accent/90 text-white text-sm font-bold px-4 py-2 rounded-full border border-white/30 hover:bg-hj-accent no-underline transition-all">
            🔍 補助金診断
          </a>
        </div>

        <!-- 統計 -->
        <div class="home-stats">
          <div class="home-stat">
            <p class="home-stat__num"><?php echo number_format( $total_subsidies ); ?>+</p>
            <p class="home-stat__label">掲載補助金</p>
          </div>
          <div class="home-stat">
            <p class="home-stat__num"><?php echo $active_count ?: '多数'; ?></p>
            <p class="home-stat__label">募集中</p>
          </div>
          <div class="home-stat">
            <p class="home-stat__num"><?php echo number_format( $total_articles ); ?>+</p>
            <p class="home-stat__label">コラム記事</p>
          </div>
          <div class="home-stat">
            <p class="home-stat__num">無料</p>
            <p class="home-stat__label">相談受付中</p>
          </div>
        </div>
      </div>

      <!-- 右カラム: 締切カレンダー -->
      <div class="hidden lg:block">
        <div class="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5">
          <!-- カレンダーヘッダー -->
          <p class="text-white font-black text-base mb-1 flex items-center gap-2">
            📅 申請締切カレンダー
          </p>
          <p class="text-white/60 text-xs mb-4"><?php echo date('Y年n月', strtotime($today)); ?> 基準</p>

          <?php
          // データを配列に収集してから月別グループ化
          $cal_items = array();
          if ( $near_deadline->have_posts() ) :
            while ( $near_deadline->have_posts() ) : $near_deadline->the_post();
              $nd_ts = strtotime( get_post_meta( get_the_ID(), 'hj_deadline', true ) );
              $cal_items[] = array(
                'url'     => get_permalink(),
                'title'   => get_the_title(),
                'ts'      => $nd_ts,
                'amount'  => get_post_meta( get_the_ID(), 'hj_amount_max', true ),
                'status'  => get_post_meta( get_the_ID(), 'hj_status', true ),
              );
            endwhile;
            wp_reset_postdata();
          endif;

          if ( $cal_items ) :
            $groups = array();
            foreach ( $cal_items as $ci ) {
              $mk = $ci['ts'] ? date( 'Y-m', $ci['ts'] ) : 'none';
              $groups[$mk][] = $ci;
            }
            foreach ( $groups as $mk => $citems ) :
              $month_label = $mk !== 'none' ? date( 'Y年n月', strtotime($mk.'-01') ) : '締切日未定';
          ?>
          <div class="mb-3">
            <p class="text-xs font-black text-white/50 mb-1 tracking-wider">── <?php echo esc_html($month_label); ?></p>
            <?php foreach ( $citems as $ci ) :
              $diff    = $ci['ts'] ? ceil(($ci['ts']-strtotime($today))/86400) : null;
              $is_past = $diff !== null && $diff < 0;
              $urgent  = $diff !== null && $diff >= 0 && $diff <= 14;
              $day_str = $ci['ts'] ? date('n/j', $ci['ts']) : '—';
            ?>
            <a href="<?php echo esc_url($ci['url']); ?>"
               class="flex items-center gap-2 py-2 border-b border-white/10 no-underline group"
               style="<?php echo $is_past ? 'opacity:0.5;' : ''; ?>">
              <div style="flex-shrink:0;width:2.2rem;text-align:center;background:<?php echo $urgent ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.1)'; ?>;border-radius:0.4rem;padding:1px 0;">
                <span style="display:block;font-size:0.85rem;font-weight:900;line-height:1.4;color:<?php echo $urgent ? '#fca5a5' : 'rgba(255,255,255,0.9)'; ?>;"><?php echo esc_html($day_str); ?></span>
              </div>
              <div style="min-width:0;flex:1;">
                <p style="font-size:0.8rem;font-weight:700;color:rgba(255,255,255,0.9);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"><?php echo esc_html($ci['title']); ?></p>
                <p style="font-size:0.7rem;color:rgba(255,255,255,0.55);">
                  <?php if($ci['amount']) echo esc_html(hjnavi_format_amount($ci['amount'])).'　'; ?>
                  <?php if($diff!==null && !$is_past) echo $diff===0?'<span style="color:#fca5a5;font-weight:700;">本日締切</span>':"<span style='color:#fdba74;font-weight:600;'>あと{$diff}日</span>";
                  elseif($is_past) echo '締切済'; ?>
                </p>
              </div>
              <?php if ($ci['status'] && !$is_past) : ?>
                <span style="flex-shrink:0;font-size:0.65rem;font-weight:700;padding:1px 6px;border-radius:99px;background:<?php echo ($ci['status']==='公募中'||$ci['status']==='募集中')?'rgba(34,197,94,0.25)':'rgba(96,165,250,0.25)';?>;color:<?php echo ($ci['status']==='公募中'||$ci['status']==='募集中')?'#86efac':'#93c5fd';?>;<?php echo ($ci['status']==='公募中'||$ci['status']==='募集中') ? 'animation:hjStatusPulse 1.4s ease-in-out infinite;' : ''; ?>"><?php echo esc_html($ci['status']); ?></span>
              <?php endif; ?>
            </a>
            <?php endforeach; ?>
          </div>
          <?php endforeach;
          else : ?>
            <p style="color:rgba(255,255,255,0.5);font-size:0.85rem;text-align:center;padding:1rem 0;">締切情報がありません</p>
          <?php endif; ?>

          <a href="<?php echo esc_url( add_query_arg('orderby','deadline', home_url('/subsidies/')) ); ?>"
             class="block text-center text-white/60 text-sm font-bold mt-4 pt-3 border-t border-white/15 hover:text-white no-underline transition-colors">
            締切順で全件表示 →
          </a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ============================================================
     🔥 ホット補助金（公募中）
     ============================================================ -->
<?php if ( $hot_subsidies->have_posts() ) : ?>
<section class="max-w-site mx-auto px-5 py-12">
  <div class="sec-head">
    <span class="sec-bar" style="background:linear-gradient(180deg,#ef4444,#dc2626)"></span>
    <h2 class="sec-title">🔥 今すぐ申請できる補助金</h2>
    <a href="<?php echo esc_url( add_query_arg('status','公募中', home_url('/subsidies/')) ); ?>" class="sec-link">募集中一覧 →</a>
  </div>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
    <?php while ( $hot_subsidies->have_posts() ) : $hot_subsidies->the_post();
      $h_id     = get_the_ID();
      $h_status = get_post_meta( $h_id, 'hj_status', true );
      $h_amount = get_post_meta( $h_id, 'hj_amount_max', true );
      $h_rate   = get_post_meta( $h_id, 'hj_amount_rate', true );
      $h_dead   = get_post_meta( $h_id, 'hj_deadline', true );
      $h_agency = get_post_meta( $h_id, 'hj_agency', true );
      $h_diff   = $h_dead ? ceil( ( strtotime( $h_dead ) - strtotime( $today ) ) / 86400 ) : null;
    ?>
    <a href="<?php the_permalink(); ?>" class="subsidy-card no-underline group" style="border-top:3px solid #ef4444;">
      <div class="flex items-center justify-between mb-2">
        <span class="hot-badge">🔥 HOT</span>
        <?php if ( $h_diff !== null ) : ?>
          <span class="text-xs font-bold <?php echo $h_diff <= 14 ? 'text-red-600' : 'text-amber-600'; ?>">あと<?php echo $h_diff; ?>日</span>
        <?php endif; ?>
      </div>
      <p class="subsidy-card__name group-hover:text-hj-primary transition-colors mb-3"><?php the_title(); ?></p>
      <div class="flex items-baseline gap-2 mb-2">
        <?php if ( $h_amount ) : ?>
          <span class="subsidy-card__amount"><?php echo esc_html( hjnavi_format_amount( $h_amount ) ); ?></span>
          <span class="text-xs text-hj-muted">上限</span>
        <?php endif; ?>
        <?php if ( $h_rate ) : ?>
          <span class="subsidy-card__rate ml-auto">補助率 <?php echo esc_html( $h_rate ); ?></span>
        <?php endif; ?>
      </div>
      <?php if ( $h_agency ) : ?>
        <p class="text-xs text-hj-muted truncate">🏛 <?php echo esc_html( $h_agency ); ?></p>
      <?php endif; ?>
    </a>
    <?php endwhile; wp_reset_postdata(); ?>
  </div>
</section>
<?php endif; ?>

<!-- ============================================================
     ⭐ ピックアップ補助金（高額）
     ============================================================ -->
<?php if ( $pickup_subsidies->have_posts() ) : ?>
<section class="bg-hj-hero py-12 border-y border-hj-border">
  <div class="max-w-site mx-auto px-5">
    <div class="sec-head">
      <span class="sec-bar" style="background:linear-gradient(180deg,#F59E0B,#D97706)"></span>
      <h2 class="sec-title">⭐ ピックアップ補助金（高額）</h2>
      <a href="<?php echo esc_url( add_query_arg('orderby','amount', home_url('/subsidies/')) ); ?>" class="sec-link">金額順で見る →</a>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <?php while ( $pickup_subsidies->have_posts() ) : $pickup_subsidies->the_post();
        $p_id     = get_the_ID();
        $p_status = get_post_meta( $p_id, 'hj_status', true );
        $p_amount = get_post_meta( $p_id, 'hj_amount_max', true );
        $p_rate   = get_post_meta( $p_id, 'hj_amount_rate', true );
        $p_agency = get_post_meta( $p_id, 'hj_agency', true );
      ?>
      <a href="<?php the_permalink(); ?>" class="subsidy-card no-underline group" style="border-top:3px solid #F59E0B;">
        <div class="flex items-center justify-between mb-2">
          <span class="pickup-badge">⭐ PICKUP</span>
          <?php echo hjnavi_status_badge( $p_status ); ?>
        </div>
        <p class="subsidy-card__name group-hover:text-hj-primary transition-colors mb-3"><?php the_title(); ?></p>
        <div class="flex items-baseline gap-2 mb-2">
          <?php if ( $p_amount ) : ?>
            <span class="text-2xl font-black text-amber-600"><?php echo esc_html( hjnavi_format_amount( $p_amount ) ); ?></span>
          <?php endif; ?>
          <?php if ( $p_rate ) : ?>
            <span class="text-xs text-hj-secondary ml-auto font-bold">補助率 <?php echo esc_html( $p_rate ); ?></span>
          <?php endif; ?>
        </div>
        <?php if ( $p_agency ) : ?>
          <p class="text-xs text-hj-muted truncate">🏛 <?php echo esc_html( $p_agency ); ?></p>
        <?php endif; ?>
      </a>
      <?php endwhile; wp_reset_postdata(); ?>
    </div>
  </div>
</section>
<?php endif; ?>

<!-- ============================================================
     新着補助金
     ============================================================ -->
<section class="max-w-site mx-auto px-5 py-12">
  <div class="sec-head">
    <span class="sec-bar" style="background:linear-gradient(180deg,#1A6B3C,#155830)"></span>
    <h2 class="sec-title">新着補助金</h2>
    <a href="<?php echo esc_url( home_url( '/subsidies/' ) ); ?>" class="sec-link">すべて見る →</a>
  </div>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
    <?php while ( $latest_subsidies->have_posts() ) : $latest_subsidies->the_post();
      $ls_id     = get_the_ID();
      $ls_status = get_post_meta( $ls_id, 'hj_status', true );
      $ls_amount = get_post_meta( $ls_id, 'hj_amount_max', true );
      $ls_rate   = get_post_meta( $ls_id, 'hj_amount_rate', true );
      $ls_dead   = get_post_meta( $ls_id, 'hj_deadline', true );
      $ls_agency = get_post_meta( $ls_id, 'hj_agency', true );
      $ls_types  = get_the_terms( $ls_id, 'subsidy_type' );
    ?>
    <a href="<?php the_permalink(); ?>" class="subsidy-card no-underline group">
      <div class="flex items-center justify-between mb-3">
        <?php echo hjnavi_status_badge( $ls_status ); ?>
        <?php if ( $ls_dead ) : ?>
          <span class="text-xs text-hj-muted"><?php echo esc_html( $ls_dead ); ?></span>
        <?php endif; ?>
      </div>
      <p class="subsidy-card__name group-hover:text-hj-primary transition-colors mb-3"><?php the_title(); ?></p>
      <div class="flex items-baseline gap-2 mb-3">
        <?php if ( $ls_amount ) : ?>
          <span class="subsidy-card__amount"><?php echo esc_html( hjnavi_format_amount( $ls_amount ) ); ?></span>
          <span class="text-sm text-hj-muted">上限</span>
        <?php else : ?>
          <span class="text-hj-muted text-sm">上限額 要確認</span>
        <?php endif; ?>
        <?php if ( $ls_rate ) : ?>
          <span class="subsidy-card__rate ml-auto">補助率 <?php echo esc_html( $ls_rate ); ?></span>
        <?php endif; ?>
      </div>
      <?php if ( $ls_agency ) : ?>
        <p class="text-xs text-hj-muted mb-2 truncate">🏛 <?php echo esc_html( $ls_agency ); ?></p>
      <?php endif; ?>
      <?php if ( $ls_types && ! is_wp_error( $ls_types ) ) : ?>
        <div class="flex flex-wrap gap-1 mt-2">
          <?php foreach ( array_slice( $ls_types, 0, 2 ) as $lt ) : ?>
            <span class="subsidy-card__tag text-xs"><?php echo esc_html( $lt->name ); ?></span>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    </a>
    <?php endwhile; wp_reset_postdata(); ?>
  </div>
</section>

<!-- ============================================================
     補助金種別ナビ
     ============================================================ -->
<?php if ( $subsidy_types && ! is_wp_error( $subsidy_types ) ) : ?>
<section class="bg-hj-hero py-12 border-y border-hj-border">
  <div class="max-w-site mx-auto px-5">
    <div class="sec-head">
      <span class="sec-bar" style="background:linear-gradient(180deg,#1A56DB,#1648C0)"></span>
      <h2 class="sec-title">種別から探す</h2>
    </div>
    <div class="flex flex-wrap gap-3">
      <?php foreach ( $subsidy_types as $stype ) : ?>
        <a href="<?php echo esc_url( get_term_link( $stype ) ); ?>" class="type-pill">
          📂 <?php echo esc_html( $stype->name ); ?>
          <?php if ( $stype->count > 0 ) : ?>
            <span class="text-xs bg-hj-border rounded-full px-2 py-0.5"><?php echo esc_html( $stype->count ); ?></span>
          <?php endif; ?>
        </a>
      <?php endforeach; ?>
    </div>
  </div>
</section>
<?php endif; ?>

<!-- ============================================================
     業種別ナビ
     ============================================================ -->
<?php if ( $subsidy_industries && ! is_wp_error( $subsidy_industries ) ) : ?>
<section class="max-w-site mx-auto px-5 py-12">
  <div class="sec-head">
    <span class="sec-bar" style="background:linear-gradient(180deg,#F59E0B,#D97706)"></span>
    <h2 class="sec-title">業種から探す</h2>
  </div>
  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
    <?php foreach ( $subsidy_industries as $sindustry ) : ?>
      <a href="<?php echo esc_url( get_term_link( $sindustry ) ); ?>"
         class="bg-white border border-hj-border rounded-2xl px-4 py-3 text-center no-underline hover:bg-hj-bg hover:border-hj-border-d hover:-translate-y-0.5 transition-all shadow-card group">
        <p class="text-base font-bold text-hj-dark group-hover:text-hj-primary transition-colors"><?php echo esc_html( $sindustry->name ); ?></p>
        <?php if ( $sindustry->count > 0 ) : ?>
          <p class="text-xs text-hj-muted mt-1"><?php echo esc_html( $sindustry->count ); ?> 件</p>
        <?php endif; ?>
      </a>
    <?php endforeach; ?>
  </div>
</section>
<?php endif; ?>

<!-- ============================================================
     地域から探す（都道府県リスト + エリア別）
     ============================================================ -->
<section class="bg-hj-hero py-12 border-y border-hj-border">
  <div class="max-w-site mx-auto px-5">
    <div class="sec-head">
      <span class="sec-bar" style="background:linear-gradient(180deg,#1A56DB,#1648C0)"></span>
      <h2 class="sec-title">地域から探す</h2>
      <a href="<?php echo esc_url( add_query_arg( 'region', '全国', home_url('/subsidies/') ) ); ?>" class="sec-link">全国の補助金 →</a>
    </div>

    <!-- エリア別タブ -->
    <div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:1.5rem;" id="regionTabBar">
      <?php foreach ( array_keys( $region_groups ) as $gname ) : ?>
        <button onclick="switchRegionTab('<?php echo esc_js($gname); ?>')"
                id="tab-<?php echo esc_attr($gname); ?>"
                style="padding:0.4rem 0.9rem;border-radius:999px;font-size:0.8rem;font-weight:700;border:2px solid #e5e7eb;background:#fff;color:#6b7280;cursor:pointer;transition:all 0.15s;">
          <?php echo esc_html($gname); ?>
        </button>
      <?php endforeach; ?>
    </div>

    <!-- 都道府県グリッド -->
    <?php foreach ( $region_groups as $gname => $prefs ) : ?>
    <div id="region-<?php echo esc_attr($gname); ?>" class="region-panel" style="display:none;">
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:0.5rem;">
        <?php foreach ( $prefs as $pref ) :
          $pref_url = add_query_arg( 'region', urlencode($pref), home_url('/subsidies/') );
        ?>
          <a href="<?php echo esc_url($pref_url); ?>" class="region-btn">
            <?php echo esc_html($pref); ?>
          </a>
        <?php endforeach; ?>
      </div>
    </div>
    <?php endforeach; ?>

    <!-- 全エリア表示（初期） -->
    <div id="region-all">
      <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
        <?php foreach ( $region_groups as $gname => $prefs ) : ?>
          <div style="flex:1;min-width:130px;">
            <p class="region-group-title"><?php echo esc_html($gname); ?></p>
            <?php foreach ( array_slice($prefs, 0, 4) as $pref ) : ?>
              <a href="<?php echo esc_url( add_query_arg('region', urlencode($pref), home_url('/subsidies/')) ); ?>"
                 class="region-btn" style="margin-bottom:0.3rem;"><?php echo esc_html($pref); ?></a>
            <?php endforeach; ?>
          </div>
        <?php endforeach; ?>
      </div>
      <div style="margin-top:1rem;">
        <a href="<?php echo esc_url( add_query_arg('region','全国', home_url('/subsidies/')) ); ?>"
           style="display:inline-flex;align-items:center;gap:0.4rem;padding:0.5rem 1.25rem;background:linear-gradient(135deg,#1A56DB,#1648C0);color:#fff;border-radius:0.75rem;font-weight:700;font-size:0.875rem;text-decoration:none;">
          🗾 全国の補助金を見る
        </a>
      </div>
    </div>
  </div>
</section>

<script>
var regionActive = null;
function switchRegionTab(name) {
  // all を隠す
  document.getElementById('region-all').style.display = 'none';
  // 前のタブを非アクティブ
  document.querySelectorAll('.region-panel').forEach(function(p){ p.style.display='none'; });
  document.querySelectorAll('#regionTabBar button').forEach(function(b){
    b.style.background='#fff'; b.style.color='#6b7280'; b.style.borderColor='#e5e7eb';
  });
  if (regionActive === name) {
    // 同じタブを押したらリセット
    regionActive = null;
    document.getElementById('region-all').style.display = '';
    return;
  }
  regionActive = name;
  var panel = document.getElementById('region-' + name);
  var tab   = document.getElementById('tab-' + name);
  if (panel) panel.style.display = '';
  if (tab)  { tab.style.background='linear-gradient(135deg,#1A56DB,#1648C0)'; tab.style.color='#fff'; tab.style.borderColor='#1A56DB'; }
}
</script>

<!-- ============================================================
     補助金診断バナー
     ============================================================ -->
<section class="max-w-site mx-auto px-5 py-8">
  <a href="<?php echo esc_url( home_url('/shindan/') ); ?>" class="no-underline block"
     style="background:linear-gradient(135deg,#0a2540,#1A56DB 40%,#1A6B3C);border-radius:1.25rem;padding:2rem 2.5rem;display:flex;align-items:center;gap:2rem;flex-wrap:wrap;">
    <div style="font-size:3.5rem;flex-shrink:0;">🔍</div>
    <div style="flex:1;">
      <p style="color:rgba(255,255,255,0.7);font-size:0.8rem;font-weight:700;margin-bottom:0.3rem;">あなたに合った補助金を探す</p>
      <p style="color:#fff;font-size:1.25rem;font-weight:900;margin-bottom:0.3rem;">補助金かんたん診断</p>
      <p style="color:rgba(255,255,255,0.75);font-size:0.875rem;">6つの質問に答えるだけで、あなたの事業に合った補助金の適合度がわかります</p>
    </div>
    <div style="flex-shrink:0;background:rgba(255,255,255,0.15);color:#fff;font-weight:900;padding:0.75rem 1.5rem;border-radius:0.75rem;border:1px solid rgba(255,255,255,0.3);font-size:0.9rem;">
      診断スタート →
    </div>
  </a>
</section>

<!-- ============================================================
     新着コラム記事
     ============================================================ -->
<?php if ( $articles->have_posts() ) : ?>
<section class="bg-hj-hero py-12 border-y border-hj-border">
  <div class="max-w-site mx-auto px-5">
    <div class="sec-head">
      <span class="sec-bar" style="background:linear-gradient(180deg,#1A6B3C,#155830)"></span>
      <h2 class="sec-title">補助金コラム</h2>
      <a href="<?php echo esc_url( home_url( '/blog/' ) ); ?>" class="sec-link">すべて見る →</a>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <?php while ( $articles->have_posts() ) : $articles->the_post();
        $ac_id    = get_the_ID();
        $ac_thumb = get_the_post_thumbnail_url( $ac_id, 'medium_large' );
        $ac_cats  = get_the_category( $ac_id );
        $ac_cat   = $ac_cats ? $ac_cats[0] : null;
      ?>
      <a href="<?php the_permalink(); ?>" class="blog-card no-underline group">
        <div class="blog-card__img-wrap">
          <?php if ( $ac_thumb ) : ?>
            <img src="<?php echo esc_url( $ac_thumb ); ?>" alt="<?php echo esc_attr( get_the_title() ); ?>" class="blog-card__img" loading="lazy">
          <?php else : ?>
            <div class="blog-card__img flex items-center justify-center text-5xl bg-hj-hero">📰</div>
          <?php endif; ?>
        </div>
        <div class="blog-card__body">
          <?php if ( $ac_cat ) : ?>
            <span class="blog-card__cat" style="background:#1A6B3C;color:#fff;"><?php echo esc_html( $ac_cat->name ); ?></span>
          <?php endif; ?>
          <p class="blog-card__title"><?php the_title(); ?></p>
          <p class="blog-card__meta"><span>📅 <?php echo get_the_date( 'Y年m月d日' ); ?></span></p>
          <p class="blog-card__excerpt"><?php echo esc_html( wp_trim_words( get_the_excerpt(), 60, '...' ) ); ?></p>
        </div>
      </a>
      <?php endwhile; wp_reset_postdata(); ?>
    </div>
  </div>
</section>
<?php endif; ?>

<!-- ヒーロー検索サジェスト（フロントページ用） -->
<script>
(function(){
  var hi = document.getElementById('hjnaviHeroSearchInput');
  var hd = document.getElementById('hjnaviHeroSearchDrop');
  var hr = document.getElementById('hjnaviHeroSearchResults');
  var he = document.getElementById('hjnaviHeroSearchEmpty');
  var hq = document.getElementById('hjnaviHeroSearchQ');
  var ht = null;
  if(!hi) return;
  hi.addEventListener('input', function(){
    clearTimeout(ht);
    var q = this.value.trim();
    if(q.length < 1){ hd.classList.add('hidden'); return; }
    ht = setTimeout(function(){ doHeroSearch(q); }, 250);
  });
  document.addEventListener('click', function(e){
    var w = document.getElementById('hjnaviHeroSearchWrap');
    if(w && !w.contains(e.target)) hd.classList.add('hidden');
  });
  function doHeroSearch(q){
    var url = (typeof hjnaviAjax!=='undefined' ? hjnaviAjax.url : '/wp-admin/admin-ajax.php') + '?action=hjnavi_search&q=' + encodeURIComponent(q);
    fetch(url).then(function(r){return r.json();}).then(function(data){
      hr.innerHTML='';
      if(data.length===0){
        hr.classList.add('hidden'); he.classList.remove('hidden'); hq.textContent=q;
      } else {
        he.classList.add('hidden'); hr.classList.remove('hidden');
        data.forEach(function(item){
          var a=document.createElement('a');
          a.href=item.url;
          a.className='flex items-center gap-3 px-4 py-3 hover:bg-hj-bg transition-colors no-underline group';
          var sc=item.status==='募集中'?'#1A6B3C':(item.status==='予定'?'#1A56DB':'#9CA3AF');
          a.innerHTML='<div style="width:2.5rem;height:2.5rem;border-radius:0.75rem;background:#f0f7f2;display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0;">💰</div>'
            +'<div style="flex:1;min-width:0;"><p style="font-size:15px;font-weight:700;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+esc(item.title)+'</p>'
            +(item.agency?'<p style="font-size:13px;color:#6B7280;">'+esc(item.agency)+'</p>':'')+'</div>'
            +'<div style="flex-shrink:0;">'+(item.status?'<span style="font-size:12px;font-weight:700;color:'+sc+';background:'+sc+'15;padding:2px 8px;border-radius:999px;">'+esc(item.status)+'</span>':'')+'</div>';
          hr.appendChild(a);
        });
        var all=document.createElement('a');
        all.href='<?php echo esc_js( home_url('/subsidies/') ); ?>?s='+encodeURIComponent(q);
        all.className='flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-hj-primary hover:bg-hj-bg no-underline border-t border-hj-border';
        all.innerHTML='🔍 「'+esc(q)+'」の全件検索 →';
        hr.appendChild(all);
      }
      hd.classList.remove('hidden');
    }).catch(function(){ hd.classList.add('hidden'); });
  }
  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
})();
</script>

<?php include __DIR__ . '/parts/footer.php'; ?>
