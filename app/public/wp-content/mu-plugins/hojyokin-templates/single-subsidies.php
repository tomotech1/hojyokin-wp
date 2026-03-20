<?php
/**
 * 補助金now - single-subsidies.php
 * 補助金個別詳細テンプレート（高情報量版）
 */
if ( ! defined( 'ABSPATH' ) ) exit;

while ( have_posts() ) : the_post();

$post_id    = get_the_ID();
$thumb      = get_the_post_thumbnail_url( $post_id, 'large' );

// メタフィールド取得
$amount_max  = get_post_meta( $post_id, 'hj_amount_max', true );
$amount_rate = get_post_meta( $post_id, 'hj_amount_rate', true );
$deadline    = get_post_meta( $post_id, 'hj_deadline', true );
$period      = get_post_meta( $post_id, 'hj_application_period', true );
$target      = get_post_meta( $post_id, 'hj_target', true );
$region      = get_post_meta( $post_id, 'hj_region', true );
$agency      = get_post_meta( $post_id, 'hj_agency', true );
$status      = get_post_meta( $post_id, 'hj_status', true );
$official_url    = get_post_meta( $post_id, 'hj_official_url', true ) ?: get_post_meta( $post_id, 'hj_url', true );
$application_url = get_post_meta( $post_id, 'hj_application_url', true );
$min_emp     = get_post_meta( $post_id, 'hj_min_employees', true );
$max_emp     = get_post_meta( $post_id, 'hj_max_employees', true );
$fiscal_year = get_post_meta( $post_id, 'hj_fiscal_year', true );

// タクソノミー取得
$types      = get_the_terms( $post_id, 'subsidy_type' );
$industries = get_the_terms( $post_id, 'subsidy_industry' );
$purposes   = get_the_terms( $post_id, 'subsidy_purpose' );

// AI要約
$excerpt = get_post_meta( $post_id, '_seopress_titles_desc', true );
if ( ! $excerpt ) $excerpt = $post->post_excerpt ?: '';

// 今日の日付
$today = current_time( 'Y-m-d' );

// 補助金タイプ判定
$type_name  = ( $types && ! is_wp_error( $types ) ) ? $types[0]->name : '補助金';
$is_hojyo   = in_array( $type_name, array( '補助金', '補助金（国）', '補助金（都道府県）', '補助金（産業別）' ), true );
$is_joseikin = strpos( $type_name, '助成金' ) !== false;
$is_kyufukin = strpos( $type_name, '給付金' ) !== false;
$is_yushi    = strpos( $type_name, '融資' ) !== false;

// 難易度スコア（補助金タイプ・金額ベースで自動算出）
$difficulty = 3;
if ( $amount_max >= 10000 ) $difficulty = 5;
elseif ( $amount_max >= 3000 ) $difficulty = 4;
elseif ( $amount_max >= 500 ) $difficulty = 3;
elseif ( $is_joseikin ) $difficulty = 2;
elseif ( $is_kyufukin ) $difficulty = 1;

// 採択率（目安）
$adoption_rate_map = array( 5 => 20, 4 => 35, 3 => 55, 2 => 70, 1 => 85 );
$adoption_rate = $adoption_rate_map[ $difficulty ] ?? 50;

// 締切までの日数
$days_to_deadline = null;
if ( $deadline && preg_match( '/(\d{4})[年\/\-](\d{1,2})[月\/\-](\d{1,2})/', $deadline, $dm ) ) {
  $dl_date          = sprintf( '%04d-%02d-%02d', $dm[1], $dm[2], $dm[3] );
  $days_to_deadline = (int) round( ( strtotime( $dl_date ) - strtotime( $today ) ) / 86400 );
}

include __DIR__ . '/parts/header.php';
?>

<style>
.step-flow { position:relative; padding-left:2.5rem; }
.step-flow::before { content:''; position:absolute; left:1.1rem; top:0; bottom:0; width:2px; background:linear-gradient(180deg,#1A56DB,#1A6B3C); }
.step-item { position:relative; padding-bottom:1.5rem; }
.step-item:last-child { padding-bottom:0; }
.step-num { position:absolute; left:-2.5rem; top:0; width:2.2rem; height:2.2rem; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:0.85rem; color:#fff; background:linear-gradient(135deg,#1A56DB,#1A6B3C); border:2px solid #fff; box-shadow:0 0 0 2px #1A56DB; z-index:1; }
.check-item { display:flex; align-items:flex-start; gap:0.6rem; padding:0.6rem 0; border-bottom:1px solid #f0f0f0; }
.check-item:last-child { border-bottom:none; }
.check-icon { flex-shrink:0; width:1.3rem; height:1.3rem; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.7rem; color:#fff; background:#1A6B3C; margin-top:0.1rem; }
.check-icon.warn { background:#F59E0B; }
.faq-item { border:1px solid #e5e7eb; border-radius:0.75rem; margin-bottom:0.75rem; overflow:hidden; }
.faq-q { padding:1rem 1.25rem; font-weight:700; cursor:pointer; display:flex; justify-content:space-between; align-items:center; gap:0.5rem; background:#fff; }
.faq-q:hover { background:#f9fafb; }
.faq-q .faq-icon { flex-shrink:0; transition:transform 0.2s; }
.faq-q.open .faq-icon { transform:rotate(45deg); }
.faq-a { display:none; padding:0 1.25rem 1rem; font-size:1rem; color:#374151; line-height:1.7; }
.faq-a.open { display:block; }
.diff-star { display:inline-block; width:1.1rem; height:1.1rem; }
.share-btn { display:inline-flex; align-items:center; gap:0.4rem; padding:0.5rem 1rem; border-radius:0.5rem; font-weight:700; font-size:1rem; text-decoration:none; transition:opacity 0.2s; }
.share-btn:hover { opacity:0.85; }
.fav-btn { cursor:pointer; transition:all 0.2s; }
.fav-btn.active svg { fill:#EF4444; stroke:#EF4444; }
</style>

<!-- パンくず -->
<nav class="breadcrumb bg-hj-bg">
  <a href="<?php echo esc_url( home_url( '/' ) ); ?>">ホーム</a>
  <span class="bc-sep">/</span>
  <a href="<?php echo esc_url( home_url( '/subsidies/' ) ); ?>">補助金一覧</a>
  <?php if ( $types && ! is_wp_error( $types ) ) : ?>
    <span class="bc-sep">/</span>
    <a href="<?php echo esc_url( get_term_link( $types[0] ) ); ?>"><?php echo esc_html( $types[0]->name ); ?></a>
  <?php endif; ?>
  <span class="bc-sep">/</span>
  <span class="bc-current truncate max-w-xs"><?php the_title(); ?></span>
</nav>

<!-- ヒーローセクション -->
<section class="hero-section">
  <div class="hero-section__inner">
    <div>
      <!-- ステータスバッジ + 年度 -->
      <div class="flex flex-wrap items-center gap-3 mb-4">
        <?php echo hjnavi_status_badge( $status ); ?>
        <?php echo hjnavi_deadline_alert( $deadline ); ?>
        <?php if ( $fiscal_year ) : ?>
          <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-white/20 text-white border border-white/30">
            📅 <?php echo esc_html( $fiscal_year ); ?>
          </span>
        <?php endif; ?>
        <?php if ( $type_name ) : ?>
          <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-white/15 text-white border border-white/25">
            <?php echo esc_html( $type_name ); ?>
          </span>
        <?php endif; ?>
      </div>

      <!-- 補助金名 -->
      <h1 class="hero-title"><?php the_title(); ?></h1>

      <!-- 基本情報 -->
      <div class="hero-meta">
        <?php if ( $agency ) : ?>
          <span>🏛 <?php echo esc_html( $agency ); ?></span>
        <?php endif; ?>
        <?php if ( $region ) : ?>
          <span>📍 <?php echo esc_html( $region ); ?></span>
        <?php endif; ?>
        <?php if ( $target ) : ?>
          <span>👥 <?php echo esc_html( $target ); ?></span>
        <?php endif; ?>
      </div>

      <!-- 金額・補助率・難易度ハイライト -->
      <div class="flex flex-wrap items-center gap-6 mt-2">
        <?php if ( $amount_max ) : ?>
          <div class="stat-badge">
            <span class="stat-badge__value"><?php echo esc_html( hjnavi_format_amount( $amount_max ) ); ?></span>
            <span class="stat-badge__label">上限補助額</span>
          </div>
        <?php endif; ?>
        <?php if ( $amount_rate ) : ?>
          <div class="stat-badge">
            <span class="stat-badge__value"><?php echo esc_html( $amount_rate ); ?></span>
            <span class="stat-badge__label">補助率</span>
          </div>
        <?php endif; ?>
        <?php if ( $deadline ) : ?>
          <div class="stat-badge">
            <span class="stat-badge__value"><?php echo esc_html( $deadline ); ?></span>
            <span class="stat-badge__label">申請締切</span>
          </div>
        <?php endif; ?>
        <div class="stat-badge">
          <span class="stat-badge__value" style="font-size:1rem;">
            <?php for ( $i = 1; $i <= 5; $i++ ) : ?>
              <span style="color:<?php echo $i <= $difficulty ? '#F59E0B' : 'rgba(255,255,255,0.3)'; ?>;">★</span>
            <?php endfor; ?>
          </span>
          <span class="stat-badge__label">申請難易度</span>
        </div>
      </div>

      <!-- 申請ボタン -->
      <div class="flex flex-wrap gap-3 mt-6">
        <?php if ( $application_url && $status !== '終了' ) : ?>
          <a href="<?php echo esc_url( $application_url ); ?>" target="_blank" rel="noopener"
             class="btn-accent">
            📝 今すぐ申請する →
          </a>
        <?php endif; ?>
        <!-- お気に入りボタン -->
        <button class="fav-btn btn-secondary" onclick="toggleFav(<?php echo $post_id; ?>, this)" id="fav-<?php echo $post_id; ?>"
                title="お気に入りに追加">
          <svg style="width:1rem;height:1rem;vertical-align:middle;margin-right:0.25rem;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          お気に入り
        </button>
        <?php if ( $official_url ) : ?>
          <a href="<?php echo esc_url( $official_url ); ?>" target="_blank" rel="noopener"
             class="btn-secondary" style="margin-left:0.5rem;">
            🔗 公式サイト
          </a>
        <?php else : ?>
          <a href="https://www.google.com/search?q=<?php echo urlencode( get_the_title() ); ?>" target="_blank" rel="noopener"
             class="btn-secondary" style="margin-left:0.5rem;">
            🔍 詳細を検索
          </a>
        <?php endif; ?>
      </div>
    </div>

    <!-- TOCサイドバー（ヒーロー内） -->
    <div class="toc-sidebar hidden lg:block">
      <p class="toc-sidebar__title">📋 目次</p>
      <ul class="space-y-1">
        <li><a href="#detail" class="toc-sidebar__item"><span>補助金詳細</span></a></li>
        <li><a href="#eligibility" class="toc-sidebar__item"><span>申請要件</span></a></li>
        <li><a href="#how-to" class="toc-sidebar__item"><span>申請フロー</span></a></li>
        <li><a href="#tips" class="toc-sidebar__item"><span>申請のポイント</span></a></li>
        <li><a href="#faq" class="toc-sidebar__item"><span>よくある質問</span></a></li>
        <li><a href="#related" class="toc-sidebar__item"><span>関連補助金</span></a></li>
      </ul>
    </div>
  </div>
</section>

<!-- メインコンテンツ -->
<div class="content-wrap">
  <main class="min-w-0">

    <!-- AI要約ボックス -->
    <?php if ( $excerpt ) : ?>
    <div class="hj-summary-box mb-6">
      <div class="hj-summary-box__header">🤖 AI要約</div>
      <div class="hj-summary-box__body"><?php echo esc_html( $excerpt ); ?></div>
    </div>
    <?php endif; ?>

    <!-- 採択率インジケーター -->
    <div class="content-section" style="padding:1.25rem 1.5rem;">
      <div class="grid grid-cols-3 gap-4 text-center">
        <div>
          <p class="text-xs font-bold text-hj-muted mb-1">申請難易度</p>
          <div style="font-size:1.2rem;">
            <?php for ( $i = 1; $i <= 5; $i++ ) : ?>
              <span style="color:<?php echo $i <= $difficulty ? '#F59E0B' : '#e5e7eb'; ?>;">★</span>
            <?php endfor; ?>
          </div>
          <p class="text-xs text-hj-muted mt-1"><?php echo array(1=>'とても易しい',2=>'易しい',3=>'普通',4=>'難しい',5=>'非常に難しい')[$difficulty]; ?></p>
        </div>
        <div>
          <p class="text-xs font-bold text-hj-muted mb-1">目安採択率</p>
          <p class="text-2xl font-black text-hj-primary"><?php echo $adoption_rate; ?>%</p>
          <div style="height:6px;background:#e5e7eb;border-radius:3px;margin-top:4px;overflow:hidden;">
            <div style="width:<?php echo $adoption_rate; ?>%;height:100%;background:linear-gradient(90deg,#1A6B3C,#22c55e);border-radius:3px;"></div>
          </div>
        </div>
        <div>
          <?php if ( $days_to_deadline !== null && $days_to_deadline >= 0 ) : ?>
            <p class="text-xs font-bold text-hj-muted mb-1">締切まで</p>
            <p class="text-2xl font-black <?php echo $days_to_deadline <= 7 ? 'text-red-600' : ( $days_to_deadline <= 30 ? 'text-amber-600' : 'text-hj-dark' ); ?>">
              <?php echo $days_to_deadline; ?>日
            </p>
            <div style="height:6px;background:#e5e7eb;border-radius:3px;margin-top:4px;overflow:hidden;">
              <div style="width:<?php echo max(0, min(100, 100 - $days_to_deadline)); ?>%;height:100%;background:linear-gradient(90deg,<?php echo $days_to_deadline <= 7 ? '#EF4444,#f87171' : '#F59E0B,#fcd34d'; ?>);border-radius:3px;"></div>
            </div>
          <?php elseif ( $days_to_deadline !== null && $days_to_deadline < 0 ) : ?>
            <p class="text-xs font-bold text-hj-muted mb-1">ステータス</p>
            <p class="text-lg font-black text-gray-400">締切済</p>
          <?php else : ?>
            <p class="text-xs font-bold text-hj-muted mb-1">申請期間</p>
            <p class="text-sm font-bold text-hj-dark"><?php echo $period ? esc_html( $period ) : '随時'; ?></p>
          <?php endif; ?>
        </div>
      </div>
    </div>

    <!-- 補助金詳細テーブル -->
    <div class="content-section" id="detail">
      <h2 class="content-section__title">
        <span style="background:linear-gradient(135deg,#1A56DB,#1648C0);width:4px;height:24px;border-radius:2px;flex-shrink:0;display:inline-block;"></span>
        補助金の詳細
      </h2>
      <table class="info-table w-full">
        <?php if ( $amount_max ) : ?>
        <tr>
          <td class="font-bold text-hj-muted py-3.5 pr-5 w-36 align-top text-sm">上限補助額</td>
          <td class="py-3.5">
            <span class="text-2xl font-black text-hj-primary"><?php echo esc_html( hjnavi_format_amount( $amount_max ) ); ?></span>
            <?php if ( $amount_rate ) : ?>
              <span class="ml-3 text-base font-bold text-hj-secondary">（補助率 <?php echo esc_html( $amount_rate ); ?>）</span>
            <?php endif; ?>
          </td>
        </tr>
        <?php elseif ( $amount_rate ) : ?>
        <tr>
          <td class="font-bold text-hj-muted py-3.5 pr-5 w-36 align-top text-sm">補助率</td>
          <td class="py-3.5">
            <span class="text-xl font-black text-hj-secondary"><?php echo esc_html( $amount_rate ); ?></span>
          </td>
        </tr>
        <?php endif; ?>
        <?php if ( $fiscal_year ) : ?>
        <tr>
          <td class="font-bold text-hj-muted py-3.5 pr-5 w-36 align-top text-sm border-t border-hj-border">対象年度</td>
          <td class="py-3.5 border-t border-hj-border"><?php echo esc_html( $fiscal_year ); ?></td>
        </tr>
        <?php endif; ?>
        <?php if ( $period ) : ?>
        <tr>
          <td class="font-bold text-hj-muted py-3.5 pr-5 w-36 align-top text-sm border-t border-hj-border">公募期間</td>
          <td class="py-3.5 border-t border-hj-border"><?php echo esc_html( $period ); ?></td>
        </tr>
        <?php endif; ?>
        <?php if ( $deadline ) : ?>
        <tr>
          <td class="font-bold text-hj-muted py-3.5 pr-5 w-36 align-top text-sm border-t border-hj-border">申請締切</td>
          <td class="py-3.5 border-t border-hj-border">
            <span class="font-bold"><?php echo esc_html( $deadline ); ?></span>
            <span class="ml-2"><?php echo hjnavi_deadline_alert( $deadline ); ?></span>
          </td>
        </tr>
        <?php endif; ?>
        <?php if ( $agency ) : ?>
        <tr>
          <td class="font-bold text-hj-muted py-3.5 pr-5 w-36 align-top text-sm border-t border-hj-border">実施機関</td>
          <td class="py-3.5 border-t border-hj-border"><?php echo esc_html( $agency ); ?></td>
        </tr>
        <?php endif; ?>
        <?php if ( $region ) : ?>
        <tr>
          <td class="font-bold text-hj-muted py-3.5 pr-5 w-36 align-top text-sm border-t border-hj-border">対象地域</td>
          <td class="py-3.5 border-t border-hj-border"><?php echo esc_html( $region ); ?></td>
        </tr>
        <?php endif; ?>
        <?php if ( $target ) : ?>
        <tr>
          <td class="font-bold text-hj-muted py-3.5 pr-5 w-36 align-top text-sm border-t border-hj-border">対象者</td>
          <td class="py-3.5 border-t border-hj-border"><?php echo esc_html( $target ); ?></td>
        </tr>
        <?php endif; ?>
        <?php if ( $min_emp || $max_emp ) : ?>
        <tr>
          <td class="font-bold text-hj-muted py-3.5 pr-5 w-36 align-top text-sm border-t border-hj-border">対象規模</td>
          <td class="py-3.5 border-t border-hj-border">
            <?php
            if ( $min_emp && $max_emp ) echo esc_html( $min_emp ) . '名 〜 ' . esc_html( $max_emp ) . '名';
            elseif ( $min_emp ) echo esc_html( $min_emp ) . '名以上';
            elseif ( $max_emp ) echo esc_html( $max_emp ) . '名以下';
            ?>
          </td>
        </tr>
        <?php endif; ?>
        <?php if ( $industries && ! is_wp_error( $industries ) ) : ?>
        <tr>
          <td class="font-bold text-hj-muted py-3.5 pr-5 w-36 align-top text-sm border-t border-hj-border">対象業種</td>
          <td class="py-3.5 border-t border-hj-border flex flex-wrap gap-1">
            <?php foreach ( $industries as $ind ) : ?>
              <a href="<?php echo esc_url( get_term_link( $ind ) ); ?>"
                 class="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 no-underline hover:bg-blue-100">
                <?php echo esc_html( $ind->name ); ?>
              </a>
            <?php endforeach; ?>
          </td>
        </tr>
        <?php endif; ?>
        <?php if ( $purposes && ! is_wp_error( $purposes ) ) : ?>
        <tr>
          <td class="font-bold text-hj-muted py-3.5 pr-5 w-36 align-top text-sm border-t border-hj-border">目的・用途</td>
          <td class="py-3.5 border-t border-hj-border flex flex-wrap gap-1">
            <?php foreach ( $purposes as $pur ) : ?>
              <a href="<?php echo esc_url( get_term_link( $pur ) ); ?>"
                 class="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 no-underline hover:bg-amber-100">
                <?php echo esc_html( $pur->name ); ?>
              </a>
            <?php endforeach; ?>
          </td>
        </tr>
        <?php endif; ?>
        <?php if ( $official_url ) : ?>
        <tr>
          <td class="font-bold text-hj-muted py-3.5 pr-5 w-36 align-top text-sm border-t border-hj-border">公式サイト</td>
          <td class="py-3.5 border-t border-hj-border">
            <a href="<?php echo esc_url( $official_url ); ?>" target="_blank" rel="noopener"
               class="inline-flex items-center gap-1 text-hj-primary hover:underline font-bold text-sm">
              🔗 公式サイトはこちら
              <svg style="width:0.85rem;height:0.85rem;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
          </td>
        </tr>
        <?php endif; ?>
      </table>
    </div>

    <!-- 申請CTAバナー -->
    <?php if ( $application_url || $official_url ) : ?>
    <div class="hj-auto-cta" style="background:linear-gradient(135deg,#0f3d21,#1A6B3C);">
      <p class="hj-auto-cta__title">
        <?php if ( in_array( $status, array( '公募中', '募集中', '受付中' ), true ) ) : ?>
          🟢 現在公募中！お早めに申請ください
        <?php elseif ( $status === '予定' ) : ?>
          📌 近日公募開始予定です
        <?php else : ?>
          📋 次回の公募に備えて準備しましょう
        <?php endif; ?>
      </p>
      <?php if ( $deadline && $days_to_deadline !== null && $days_to_deadline >= 0 ) : ?>
        <p class="hj-auto-cta__desc">締切まであと <strong><?php echo $days_to_deadline; ?>日</strong>。今すぐ確認しましょう。</p>
      <?php endif; ?>
      <div class="flex flex-wrap justify-center gap-3" style="position:relative;">
        <?php if ( $application_url && $status !== '終了' ) : ?>
          <a href="<?php echo esc_url( $application_url ); ?>" target="_blank" rel="noopener" class="hj-auto-cta__btn">
            📝 申請ページへ →
          </a>
        <?php endif; ?>
        <?php if ( $official_url ) : ?>
          <a href="<?php echo esc_url( $official_url ); ?>" target="_blank" rel="noopener"
             class="hj-auto-cta__btn" style="background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.4);">
            🔗 公式サイトを確認する
          </a>
        <?php endif; ?>
      </div>
    </div>
    <?php endif; ?>

    <!-- 申請要件チェックリスト -->
    <div class="content-section" id="eligibility">
      <h2 class="content-section__title">
        <span style="background:linear-gradient(135deg,#1A6B3C,#155830);width:4px;height:24px;border-radius:2px;flex-shrink:0;display:inline-block;"></span>
        申請要件チェックリスト
      </h2>
      <p class="text-sm text-hj-muted mb-4">以下の要件を満たしているか確認しましょう（目安）</p>
      <div>
        <?php
        $checks = array();

        // 対象者ベースの要件
        if ( $target ) {
          $checks[] = array( 'ok', esc_html( $target ) . 'であること' );
        }

        // 地域ベース
        if ( $region && $region !== '全国' ) {
          $checks[] = array( 'ok', '事業所または活動地域が「' . esc_html( $region ) . '」内であること' );
        } else {
          $checks[] = array( 'ok', '国内で事業を営んでいること' );
        }

        // 業種ベース
        if ( $industries && ! is_wp_error( $industries ) ) {
          $ind_names = implode( '・', array_map( fn($i) => $i->name, $industries ) );
          $checks[] = array( 'ok', '対象業種（' . esc_html( $ind_names ) . '）に該当すること' );
        }

        // 規模ベース
        if ( $min_emp || $max_emp ) {
          $emp_str = '';
          if ( $min_emp && $max_emp ) $emp_str = $min_emp . '名以上' . $max_emp . '名以下';
          elseif ( $max_emp ) $emp_str = $max_emp . '名以下';
          else $emp_str = $min_emp . '名以上';
          $checks[] = array( 'ok', '従業員数が' . esc_html( $emp_str ) . 'であること' );
        }

        // 目的ベース
        if ( $purposes && ! is_wp_error( $purposes ) ) {
          $pur_names = implode( '・', array_map( fn($p) => $p->name, $purposes ) );
          $checks[] = array( 'ok', '利用目的が「' . esc_html( $pur_names ) . '」に該当すること' );
        }

        // 汎用要件
        $checks[] = array( 'ok', '過去に同種の補助金・助成金を不正受給していないこと' );
        $checks[] = array( 'warn', '申請書類一式（事業計画書・見積書等）を準備できること' );

        if ( $is_hojyo ) {
          $checks[] = array( 'warn', '採択後に経費を支出し、実績報告が必要なこと' );
        }
        if ( $is_joseikin ) {
          $checks[] = array( 'ok', '雇用保険の適用事業者であること' );
        }
        if ( $is_yushi ) {
          $checks[] = array( 'warn', '返済計画を立てた上で申請すること（融資のため返済義務あり）' );
        }

        foreach ( $checks as $chk ) :
        ?>
          <div class="check-item">
            <div class="check-icon <?php echo $chk[0] === 'warn' ? 'warn' : ''; ?>">
              <?php echo $chk[0] === 'warn' ? '！' : '✓'; ?>
            </div>
            <span class="text-base text-hj-dark leading-relaxed"><?php echo $chk[1]; ?></span>
          </div>
        <?php endforeach; ?>
      </div>
      <p class="text-xs text-hj-muted mt-3">※ 上記は目安です。詳細な要件は<a href="<?php echo $official_url ? esc_url( $official_url ) : '#'; ?>" target="_blank" class="text-hj-primary underline">公式ページ</a>でご確認ください。</p>
    </div>

    <!-- 申請フロー -->
    <div class="content-section" id="how-to">
      <h2 class="content-section__title">
        <span style="background:linear-gradient(135deg,#F59E0B,#D97706);width:4px;height:24px;border-radius:2px;flex-shrink:0;display:inline-block;"></span>
        申請の流れ（ステップガイド）
      </h2>
      <div class="step-flow mt-4">
        <?php
        $steps = array();
        if ( $is_joseikin ) {
          $steps = array(
            array( '📋', '要件確認・準備', '雇用形態・労働時間・賃金台帳などを整備します。社会保険・雇用保険の加入状況も確認しましょう。' ),
            array( '📝', '計画書の作成', '雇用管理改善計画書や訓練計画書を作成します。労働局・ハローワークへの相談もおすすめです。' ),
            array( '🏢', '申請書類の提出', '最寄りのハローワークまたは都道府県労働局に申請書類一式を提出します。' ),
            array( '🔍', '審査・承認', '提出書類の審査が行われます。審査期間は概ね2〜3ヶ月です。' ),
            array( '✅', '訓練・取組の実施', '計画に沿って雇用管理改善の取組を実施します。' ),
            array( '💰', '支給申請・受取', '取組完了後、実績報告と支給申請を行います。審査後に助成金が支給されます。' ),
          );
        } elseif ( $is_yushi ) {
          $steps = array(
            array( '💡', '事業計画の策定', '融資の目的・返済計画を含む事業計画書を作成します。' ),
            array( '🏦', '金融機関・窓口への相談', '最寄りの日本政策金融公庫・信用保証協会または指定の金融機関に相談します。' ),
            array( '📝', '申込書類の準備', '決算書・確定申告書・資金繰り表などを準備します。' ),
            array( '🔍', '審査', '申込書類をもとに信用審査が行われます（通常1〜2週間）。' ),
            array( '✅', '融資決定・契約', '融資条件が決定し、金銭消費貸借契約を締結します。' ),
            array( '💰', '融資実行・返済開始', '融資が実行されます。据置期間終了後、返済が始まります。' ),
          );
        } elseif ( $is_kyufukin ) {
          $steps = array(
            array( '📋', '給付要件の確認', '年収・世帯状況・職業などの要件を確認します。' ),
            array( '📑', '必要書類の準備', '申告書・収入証明・住民票などを準備します。' ),
            array( '🖥', 'オンライン申請 or 書面申請', '指定の申請フォームまたは申請書を窓口に提出します。' ),
            array( '🔍', '審査・確認', '給付要件に該当するか審査されます。' ),
            array( '💰', '給付金の受取', '審査通過後、指定口座に給付金が振り込まれます。' ),
          );
        } else {
          // 補助金デフォルト
          $steps = array(
            array( '🔍', '公募要領の確認', '公式サイトから公募要領をダウンロードし、補助対象・要件・スケジュールを確認します。' ),
            array( '📋', '申請要件の確認', '対象者・事業規模・対象経費などの要件を確認し、自社が該当するか検討します。' ),
            array( '📝', '事業計画書の作成', '審査に通るため、具体的な数値目標・実施スケジュール・費用対効果を記載した事業計画書を作成します。' ),
            array( '📁', '申請書類の準備・提出', '事業計画書・見積書・決算書などを揃えて、電子申請または郵送で提出します。' ),
            array( '🏆', '採択結果の通知', '提出後、審査が行われます。採択結果が通知されるまで通常1〜2ヶ月かかります。' ),
            array( '⚙️', '事業実施・経費支出', '採択後に事業を実施し、補助対象経費を支出します。採択前の経費は対象外になることが多いため注意が必要です。' ),
            array( '📊', '実績報告・補助金受取', '事業完了後に実績報告書を提出し、審査通過後に補助金が支払われます。', ),
          );
        }
        foreach ( $steps as $idx => $step ) :
        ?>
          <div class="step-item">
            <div class="step-num"><?php echo $idx + 1; ?></div>
            <div class="ml-0">
              <p class="font-black text-hj-dark mb-1"><?php echo $step[0]; ?> <?php echo esc_html( $step[1] ); ?></p>
              <p class="text-base text-hj-muted leading-relaxed"><?php echo esc_html( $step[2] ); ?></p>
            </div>
          </div>
        <?php endforeach; ?>
      </div>
    </div>

    <!-- 申請のポイント・注意事項 -->
    <div class="content-section" id="tips">
      <h2 class="content-section__title">
        <span style="background:linear-gradient(135deg,#EF4444,#DC2626);width:4px;height:24px;border-radius:2px;flex-shrink:0;display:inline-block;"></span>
        申請のポイント・注意事項
      </h2>
      <div class="space-y-3">
        <?php
        $tips = array();
        if ( $is_hojyo ) {
          $tips = array(
            array( '⚠️', '採択前の発注・購入・契約は補助対象外', '採択通知を受けた後に経費を支出する必要があります。事前に発注・契約した経費は原則として補助対象外となります。' ),
            array( '📑', '事業計画書の具体性が採択の鍵', '曖昧な計画書は採択率が下がります。数値目標・実施体制・スケジュールを具体的に記載しましょう。' ),
            array( '🔁', '実績報告まで完了して初めて補助金受取', '事業実施後の実績報告・精算払いが必要です。期限内に報告書を提出できるよう、スケジュール管理をしっかり行いましょう。' ),
            array( '📞', '不明点は採択前に事務局に確認', '申請要件・対象経費の解釈は事務局への確認が確実です。採択後のトラブルを防ぐためにも事前確認を推奨します。' ),
          );
        } elseif ( $is_joseikin ) {
          $tips = array(
            array( '✅', '社会保険・雇用保険の適正加入が必須', '申請時点で全ての対象労働者が雇用保険に加入している必要があります。' ),
            array( '📄', '支給要件の証拠書類を保管', '賃金台帳・出勤簿・雇用契約書などは支給申請時に必要です。日頃から整備しておきましょう。' ),
            array( '⏰', '申請期限を厳守', '取組実施後の支給申請には期限があります。期限を過ぎると受給できなくなります。' ),
            array( '🏛', 'ハローワーク・労働局への事前相談推奨', '要件確認・書類確認のために、申請前にハローワークや労働局への相談をおすすめします。' ),
          );
        } elseif ( $is_yushi ) {
          $tips = array(
            array( '💴', '融資は返済義務あり', '補助金・助成金と異なり、融資は借入金のため返済が必要です。無理のない返済計画を立ててください。' ),
            array( '📋', '創業・開業の場合は創業計画書が重要', '金融機関の審査では事業の実現可能性を判断します。具体的な数値と根拠を示した創業計画書を作成しましょう。' ),
            array( '🏦', '複数の金融機関・制度を比較検討', '金利・融資期間・据置期間などの条件が異なります。複数の制度を比較して最適な融資を選びましょう。' ),
          );
        } else {
          $tips = array(
            array( '✅', '要件を事前にしっかり確認', '対象者・対象経費の条件は制度によって細かく異なります。公募要領を熟読し、不明点は担当窓口に確認しましょう。' ),
            array( '📅', '申請期限に注意', '公募期間は限られており、締切直前は申請が集中することもあります。余裕を持って準備・提出しましょう。' ),
            array( '📁', '書類の不備は採択に影響', '記入漏れ・添付忘れは不採択の原因になります。提出前にチェックリストで確認する習慣をつけましょう。' ),
            array( '🤝', '専門家への相談も有効', '行政書士・中小企業診断士などの専門家に相談することで、採択率を高めることができます。' ),
          );
        }
        foreach ( $tips as $tip ) :
        ?>
          <div style="display:flex;gap:0.75rem;align-items:flex-start;background:#fffbeb;border:1px solid #fde68a;border-radius:0.75rem;padding:1rem;">
            <span style="font-size:1.3rem;flex-shrink:0;line-height:1;"><?php echo $tip[0]; ?></span>
            <div>
              <p class="font-bold text-hj-dark text-base mb-0.5"><?php echo esc_html( $tip[1] ); ?></p>
              <p class="text-sm text-hj-muted leading-relaxed"><?php echo esc_html( $tip[2] ); ?></p>
            </div>
          </div>
        <?php endforeach; ?>
      </div>
    </div>

    <!-- 本文エリア（post_contentがある場合） -->
    <?php if ( get_the_content() ) : ?>
    <div class="content-section">
      <h2 class="content-section__title">
        <span style="background:linear-gradient(135deg,#1A6B3C,#155830);width:4px;height:24px;border-radius:2px;flex-shrink:0;display:inline-block;"></span>
        詳細説明
      </h2>
      <div class="post-content" id="content">
        <?php the_content(); ?>
      </div>
    </div>
    <?php endif; ?>

    <!-- よくある質問（FAQ） -->
    <div class="content-section" id="faq">
      <h2 class="content-section__title">
        <span style="background:linear-gradient(135deg,#8B5CF6,#7C3AED);width:4px;height:24px;border-radius:2px;flex-shrink:0;display:inline-block;"></span>
        よくある質問（FAQ）
      </h2>
      <?php
      $faqs = array();
      if ( $is_joseikin ) {
        $faqs = array(
          array( 'Q. 何度でも申請できますか？', '多くの助成金は要件を満たせば複数回申請できますが、同一内容での重複申請は認められません。また、年度をまたいで継続的に活用できる制度もあります。詳しくは公式ページをご確認ください。' ),
          array( 'Q. 申請から受給までどのくらいかかりますか？', '一般的に2〜6ヶ月程度です。申請後、審査・現地調査・支給決定の手続きを経て支給されます。' ),
          array( 'Q. 複数の助成金を同時に申請できますか？', '原則として複数の制度に申請することは可能ですが、同一の経費に対して重複して受給することはできません。' ),
          array( 'Q. 不採択になった場合は？', '不採択の場合でも次回の申請期間に再挑戦できます。不採択理由を確認し、申請書類の改善を行いましょう。' ),
        );
      } elseif ( $is_yushi ) {
        $faqs = array(
          array( 'Q. 担保・保証人は必要ですか？', '制度によって異なります。日本政策金融公庫の「新創業融資制度」など、無担保・無保証人で利用できる制度もあります。詳しくは各機関にご相談ください。' ),
          array( 'Q. 申請から融資実行までどのくらいかかりますか？', '通常、申請から2週間〜1ヶ月程度で融資実行となります。ただし書類不備や追加審査が入ると時間がかかることもあります。' ),
          array( 'Q. 赤字でも利用できますか？', '制度によっては赤字でも利用できますが、返済能力の審査が厳しくなることがあります。事業改善計画を準備することをおすすめします。' ),
        );
      } elseif ( $is_kyufukin ) {
        $faqs = array(
          array( 'Q. 申請は一人でできますか？', 'はい、多くの給付金はオンラインや郵送で個人でも申請できます。必要書類を揃えて申請フォームに入力するだけです。' ),
          array( 'Q. 申請してから給付まで何日かかりますか？', '制度によって異なりますが、一般的に2週間〜2ヶ月程度です。書類に不備がある場合は時間がかかることがあります。' ),
          array( 'Q. 所得制限はありますか？', '多くの給付金制度は世帯収入や個人所得に上限が設けられています。詳しくは公式ページの要件をご確認ください。' ),
        );
      } else {
        $faqs = array(
          array( 'Q. 採択率はどのくらいですか？', '制度・公募回によって異なりますが、一般的に20〜60%程度です。事業計画書の質が採択率に大きく影響します。' ),
          array( 'Q. 申請から採択通知まで何日かかりますか？', '通常、申請締切から1〜2ヶ月後に採択結果が発表されます。事業開始のスケジュールは採択後に立てることをおすすめします。' ),
          array( 'Q. 補助金を受け取った後に義務はありますか？', '実績報告書の提出（事業完了後）、事業効果報告（数年間）、会計帳簿・書類の保管義務があります。' ),
          array( 'Q. 個人事業主でも申請できますか？', '多くの補助金は法人・個人事業主の両方が対象です。ただし一部は法人のみ対象の制度もありますので、公募要領でご確認ください。' ),
          array( 'Q. 複数の補助金を同時に申請できますか？', '同一の経費に対して複数の補助金を受給することは原則できませんが、異なる事業・経費であれば複数申請・受給が可能な場合もあります。' ),
        );
      }
      foreach ( $faqs as $fidx => $faq ) :
      ?>
        <div class="faq-item">
          <div class="faq-q" onclick="toggleFaq(this)">
            <span class="text-base font-bold"><?php echo esc_html( $faq[0] ); ?></span>
            <span class="faq-icon" style="font-size:1.2rem;color:#9ca3af;">+</span>
          </div>
          <div class="faq-a">
            <?php echo esc_html( $faq[1] ); ?>
          </div>
        </div>
      <?php endforeach; ?>
    </div>

    <!-- SNSシェア -->
    <div class="content-section" style="padding:1.25rem 1.5rem;">
      <p class="text-sm font-bold text-hj-dark mb-3">📣 この補助金情報をシェア</p>
      <div class="flex flex-wrap gap-2">
        <?php
        $share_title = urlencode( get_the_title() . ' | 補助金now' );
        $share_url   = urlencode( get_permalink() );
        ?>
        <a href="https://twitter.com/intent/tweet?text=<?php echo $share_title; ?>&url=<?php echo $share_url; ?>"
           target="_blank" rel="noopener" class="share-btn" style="background:#1DA1F2;color:#fff;">
          <svg style="width:1rem;height:1rem;" viewBox="0 0 24 24" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
          Xでシェア
        </a>
        <a href="https://line.me/R/msg/text/?<?php echo $share_title; ?>%0A<?php echo $share_url; ?>"
           target="_blank" rel="noopener" class="share-btn" style="background:#00B900;color:#fff;">
          <svg style="width:1rem;height:1rem;" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
          LINEでシェア
        </a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=<?php echo $share_url; ?>"
           target="_blank" rel="noopener" class="share-btn" style="background:#1877F2;color:#fff;">
          <svg style="width:1rem;height:1rem;" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          Facebookでシェア
        </a>
      </div>
    </div>

    <!-- 関連補助金 -->
    <?php
    $related_tax_query = array();
    if ( $types && ! is_wp_error( $types ) ) {
      $related_tax_query[] = array( 'taxonomy' => 'subsidy_type', 'field' => 'term_id', 'terms' => wp_list_pluck( $types, 'term_id' ) );
    }
    $related = new WP_Query( array(
      'post_type'      => 'subsidies',
      'posts_per_page' => 6,
      'post__not_in'   => array( $post_id ),
      'orderby'        => 'rand',
      'post_status'    => 'publish',
      'tax_query'      => $related_tax_query ?: array(),
    ) );
    // 同タクソノミーで6件未満ならランダム補充
    if ( $related->post_count < 4 ) {
      $related = new WP_Query( array(
        'post_type'      => 'subsidies',
        'posts_per_page' => 6,
        'post__not_in'   => array( $post_id ),
        'orderby'        => 'rand',
        'post_status'    => 'publish',
      ) );
    }
    if ( $related->have_posts() ) :
    ?>
    <div id="related" class="mt-8">
      <h2 class="text-xl font-black text-hj-dark mb-5 flex items-center gap-2">
        💰 関連補助金
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <?php while ( $related->have_posts() ) : $related->the_post();
          $r_id     = get_the_ID();
          $r_status = get_post_meta( $r_id, 'hj_status', true );
          $r_amount = get_post_meta( $r_id, 'hj_amount_max', true );
          $r_agency = get_post_meta( $r_id, 'hj_agency', true );
          $r_rate   = get_post_meta( $r_id, 'hj_amount_rate', true );
        ?>
        <a href="<?php the_permalink(); ?>" class="subsidy-card no-underline group">
          <div class="flex items-center justify-between mb-2">
            <?php echo hjnavi_status_badge( $r_status ); ?>
          </div>
          <p class="font-black text-hj-dark group-hover:text-hj-primary transition-colors mb-2 text-base leading-snug"><?php the_title(); ?></p>
          <?php if ( $r_amount ) : ?>
            <p class="text-lg font-black text-hj-primary">最大 <?php echo esc_html( hjnavi_format_amount( $r_amount ) ); ?>
              <?php if ( $r_rate ) : ?><span class="text-sm font-bold text-hj-secondary ml-1">（<?php echo esc_html( $r_rate ); ?>）</span><?php endif; ?>
            </p>
          <?php endif; ?>
          <?php if ( $r_agency ) : ?>
            <p class="text-xs text-hj-muted mt-1">🏛 <?php echo esc_html( $r_agency ); ?></p>
          <?php endif; ?>
        </a>
        <?php endwhile; wp_reset_postdata(); ?>
      </div>
    </div>
    <?php endif; ?>

  </main>

  <!-- サイドバー -->
  <aside class="space-y-5 lg:block">

    <!-- 申請ボタン（サイドバー・スティッキー） -->
    <div class="sidebar-widget" style="background:linear-gradient(135deg,#0f3d21,#1A6B3C);border-color:rgba(255,255,255,0.15);position:sticky;top:1.5rem;">
      <p class="text-lg font-black text-white mb-1">この補助金に申請</p>
      <div class="flex items-center gap-2 mb-3">
        <?php echo hjnavi_status_badge( $status ); ?>
        <?php if ( $fiscal_year ) : ?>
          <span class="text-xs text-white/70"><?php echo esc_html( $fiscal_year ); ?></span>
        <?php endif; ?>
      </div>
      <?php if ( $amount_max ) : ?>
        <p class="text-2xl font-black text-white mb-0.5"><?php echo esc_html( hjnavi_format_amount( $amount_max ) ); ?></p>
        <?php if ( $amount_rate ) : ?>
          <p class="text-xs text-white/70 mb-3">補助率 <?php echo esc_html( $amount_rate ); ?></p>
        <?php endif; ?>
      <?php endif; ?>
      <?php if ( $application_url && $status !== '終了' ) : ?>
        <a href="<?php echo esc_url( $application_url ); ?>" target="_blank" rel="noopener"
           class="block text-center bg-hj-accent text-white text-sm font-black py-3 rounded-xl hover:opacity-90 transition-all no-underline shadow-md mb-2">
          📝 申請ページへ →
        </a>
      <?php endif; ?>
      <?php if ( $official_url ) : ?>
        <a href="<?php echo esc_url( $official_url ); ?>" target="_blank" rel="noopener"
           class="block text-center bg-white/20 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-white/30 transition-all no-underline">
          🔗 公式サイトを見る
        </a>
      <?php endif; ?>

      <!-- お気に入りボタン（サイドバー） -->
      <button class="fav-btn mt-2 w-full text-center bg-white/10 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-white/20 transition-all border border-white/20"
              onclick="toggleFav(<?php echo $post_id; ?>, this)" id="fav-sb-<?php echo $post_id; ?>">
        <svg style="width:0.9rem;height:0.9rem;display:inline;vertical-align:middle;margin-right:0.25rem;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
        <span class="fav-label">お気に入りに追加</span>
      </button>
    </div>

    <!-- 申請期間 -->
    <?php if ( $deadline || $period ) : ?>
    <div class="sidebar-widget">
      <p class="sidebar-widget__title">📅 申請期間</p>
      <?php if ( $period ) : ?>
        <p class="text-sm font-bold text-hj-dark mb-2"><?php echo esc_html( $period ); ?></p>
      <?php endif; ?>
      <?php if ( $deadline ) : ?>
      <div class="bg-hj-bg rounded-xl p-3 text-center">
        <p class="text-xs font-bold text-hj-muted mb-1">申請締切</p>
        <p class="text-xl font-black text-hj-dark"><?php echo esc_html( $deadline ); ?></p>
        <?php echo hjnavi_deadline_alert( $deadline ); ?>
        <?php if ( $days_to_deadline !== null && $days_to_deadline >= 0 ) : ?>
          <p class="text-sm font-bold mt-1 <?php echo $days_to_deadline <= 7 ? 'text-red-600' : 'text-amber-600'; ?>">
            あと <?php echo $days_to_deadline; ?>日
          </p>
        <?php endif; ?>
      </div>
      <?php endif; ?>
    </div>
    <?php endif; ?>

    <!-- 難易度メーター -->
    <div class="sidebar-widget">
      <p class="sidebar-widget__title">📊 申請難易度</p>
      <div class="space-y-2">
        <?php
        $meter_items = array(
          array( '難易度', $difficulty, 5, '#F59E0B' ),
          array( '目安採択率', $adoption_rate, 100, '#1A6B3C' ),
        );
        foreach ( $meter_items as $mi ) :
        ?>
          <div>
            <div class="flex justify-between text-xs text-hj-muted mb-1">
              <span><?php echo esc_html( $mi[0] ); ?></span>
              <span class="font-bold"><?php echo $mi[0] === '難易度' ? array(1=>'★',2=>'★★',3=>'★★★',4=>'★★★★',5=>'★★★★★')[$mi[1]] : $mi[1] . '%'; ?></span>
            </div>
            <div style="height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden;">
              <div style="width:<?php echo $mi[0] === '難易度' ? ($mi[1]/$mi[2]*100) : $mi[1]; ?>%;height:100%;background:<?php echo $mi[3]; ?>;border-radius:3px;transition:width 0.5s;"></div>
            </div>
          </div>
        <?php endforeach; ?>
      </div>
    </div>

    <?php include __DIR__ . '/parts/sidebar-common.php'; ?>

  </aside>
</div>

<script>
// FAQ accordion
function toggleFaq(el) {
  el.classList.toggle('open');
  const ans = el.nextElementSibling;
  ans.classList.toggle('open');
}

// お気に入り機能（localStorage）
function getFavs() {
  try { return JSON.parse(localStorage.getItem('hj_favs') || '[]'); } catch { return []; }
}
function toggleFav(postId, btn) {
  let favs = getFavs();
  const idx = favs.indexOf(postId);
  if (idx >= 0) {
    favs.splice(idx, 1);
    updateFavBtn(postId, false);
  } else {
    favs.push(postId);
    updateFavBtn(postId, true);
  }
  localStorage.setItem('hj_favs', JSON.stringify(favs));
  // ヘッダーバッジ更新
  window.dispatchEvent(new StorageEvent('storage', { key: 'hj_favs' }));
}
function updateFavBtn(postId, active) {
  ['fav-' + postId, 'fav-sb-' + postId].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.classList.toggle('active', active);
    const label = btn.querySelector('.fav-label');
    if (label) label.textContent = active ? 'お気に入り済み ♥' : 'お気に入りに追加';
  });
}
// ページ読込時にfav状態を反映
(function() {
  const favs = getFavs();
  <?php echo "const thisPostId = $post_id;"; ?>
  if (favs.includes(thisPostId)) updateFavBtn(thisPostId, true);
})();
</script>

<?php endwhile; ?>

<?php include __DIR__ . '/parts/footer.php'; ?>
