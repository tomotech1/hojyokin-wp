<?php
/**
 * 補助金ナビ - archive-subsidies.php
 * 補助金ディレクトリ一覧（タクソノミーアーカイブ兼用）
 */
if ( ! defined( 'ABSPATH' ) ) exit;

$current_term = is_tax() ? get_queried_object() : null;
$current_tax  = $current_term ? $current_term->taxonomy : '';

// ── フィルター値取得 ───────────────────────────────────────────────────────
$f_type     = isset( $_GET['type'] )     ? sanitize_text_field( $_GET['type'] )     : '';
$f_industry = isset( $_GET['industry'] ) ? sanitize_text_field( $_GET['industry'] ) : '';
$f_purpose  = isset( $_GET['purpose'] )  ? sanitize_text_field( $_GET['purpose'] )  : '';
$f_status   = isset( $_GET['status'] )   ? sanitize_text_field( $_GET['status'] )   : '';
$f_region   = isset( $_GET['region'] )   ? sanitize_text_field( $_GET['region'] )   : '';
$f_order    = isset( $_GET['orderby'] )  ? sanitize_text_field( $_GET['orderby'] )  : 'date';
$f_s        = isset( $_GET['s'] )        ? sanitize_text_field( $_GET['s'] )        : '';
$f_amount   = isset( $_GET['amount_min'] ) ? intval( $_GET['amount_min'] ) : 0;

$paged    = max( 1, get_query_var( 'paged' ) ?: ( isset( $_GET['paged'] ) ? intval( $_GET['paged'] ) : 1 ) );
$per_page = 18;

// ── クエリ構築 ──────────────────────────────────────────────────────────────
$tax_query  = array( 'relation' => 'AND' );
$meta_query = array( 'relation' => 'AND' );

// タクソノミーフィルタ（タームslug）
if ( $current_term ) {
    $tax_query[] = array(
        'taxonomy' => $current_tax,
        'field'    => 'term_id',
        'terms'    => $current_term->term_id,
    );
}
if ( $f_type ) {
    $tax_query[] = array( 'taxonomy' => 'subsidy_type', 'field' => 'slug', 'terms' => $f_type );
}
if ( $f_industry ) {
    $tax_query[] = array( 'taxonomy' => 'subsidy_industry', 'field' => 'slug', 'terms' => $f_industry );
}
if ( $f_purpose ) {
    $tax_query[] = array( 'taxonomy' => 'subsidy_purpose', 'field' => 'slug', 'terms' => $f_purpose );
}

// メタフィルタ
if ( $f_status ) {
    // 「公募中」「受付中」をまとめて受け付ける
    if ( $f_status === '公募中' ) {
        $meta_query[] = array(
            'relation' => 'OR',
            array( 'key' => 'hj_status', 'value' => '公募中' ),
            array( 'key' => 'hj_status', 'value' => '受付中' ),
        );
    } else {
        $meta_query[] = array( 'key' => 'hj_status', 'value' => $f_status );
    }
}
if ( $f_region ) {
    $meta_query[] = array( 'key' => 'hj_region', 'value' => $f_region, 'compare' => 'LIKE' );
}
if ( $f_amount > 0 ) {
    $meta_query[] = array( 'key' => 'hj_amount_max', 'value' => $f_amount, 'compare' => '>=', 'type' => 'NUMERIC' );
}

// 並び順
$orderby_map = array(
    'amount'   => array( 'orderby' => 'meta_value_num', 'meta_key' => 'hj_amount_max', 'order' => 'DESC' ),
    'deadline' => array( 'orderby' => 'meta_value',     'meta_key' => 'hj_deadline',    'order' => 'ASC'  ),
    'title'    => array( 'orderby' => 'title',                                           'order' => 'ASC'  ),
    'date'     => array( 'orderby' => 'date',                                            'order' => 'DESC' ),
);
$ob = $orderby_map[ $f_order ] ?? $orderby_map['date'];

$query_args = array(
    'post_type'      => 'subsidies',
    'post_status'    => 'publish',
    'posts_per_page' => $per_page,
    'paged'          => $paged,
    'orderby'        => $ob['orderby'],
    'order'          => $ob['order'],
    'tax_query'      => count( $tax_query ) > 1 ? $tax_query : array(),
    'meta_query'     => count( $meta_query ) > 1 ? $meta_query : array(),
);
if ( isset( $ob['meta_key'] ) ) $query_args['meta_key'] = $ob['meta_key'];

// キーワード検索
if ( $f_s ) {
    $query_args['s'] = $f_s;
    add_filter( 'posts_search', function( $search, $wp_query ) {
        global $wpdb;
        if ( ! $wp_query->is_main_query() ) return $search;
        return $search; // WP default でOK
    }, 10, 2 );
}

$subsidy_query = new WP_Query( $query_args );
$total_found   = $subsidy_query->found_posts;
$total_pages   = ceil( $total_found / $per_page );

// ── フィルター選択肢データ ─────────────────────────────────────────────────
$all_types      = get_terms( array( 'taxonomy' => 'subsidy_type',     'hide_empty' => false, 'number' => 30 ) );
$all_industries = get_terms( array( 'taxonomy' => 'subsidy_industry', 'hide_empty' => false, 'number' => 20 ) );
$all_purposes   = get_terms( array( 'taxonomy' => 'subsidy_purpose',  'hide_empty' => false, 'number' => 20 ) );

// 地域一覧（メタ値から生成・キャッシュ活用）
$region_cache_key = 'hjnavi_unique_regions';
$unique_regions   = wp_cache_get( $region_cache_key );
if ( false === $unique_regions ) {
    $all_regions_raw = get_posts( array(
        'post_type'      => 'subsidies',
        'posts_per_page' => -1,
        'fields'         => 'ids',
        'no_found_rows'  => true,
    ) );
    $unique_regions = array();
    foreach ( $all_regions_raw as $rp ) {
        $r = get_post_meta( $rp, 'hj_region', true );
        if ( $r && strlen( $r ) <= 10 && ! in_array( $r, $unique_regions ) ) $unique_regions[] = $r;
    }
    sort( $unique_regions );
    wp_cache_set( $region_cache_key, $unique_regions, '', 300 );
}

// ページタイトル
if ( $current_term ) {
    $archive_title = $current_term->name . ' の補助金一覧';
    $archive_desc  = $current_term->description ?: $current_term->name . 'に関連する補助金・助成金を一覧で表示しています。';
} elseif ( $f_s ) {
    $archive_title = '「' . esc_html( $f_s ) . '」の検索結果';
    $archive_desc  = '';
} else {
    $archive_title = '補助金・助成金ディレクトリ';
    $archive_desc  = '国・都道府県・市区町村の補助金・助成金・給付金・融資制度を一覧検索。種別・業種・目的・地域・金額でフィルタリングできます。';
}

// アクティブフィルター数
$active_filters = array_filter( array( $f_type, $f_industry, $f_purpose, $f_status, $f_region, $f_s, $f_amount ) );

include __DIR__ . '/parts/header.php';
?>

<!-- アーカイブヘッダー -->
<section class="archive-header">
  <div class="max-w-site mx-auto px-5 py-10">
    <nav class="flex items-center flex-wrap gap-2 text-sm mb-4">
      <a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="text-white/70 hover:text-white no-underline">ホーム</a>
      <span class="text-white/40">/</span>
      <?php if ( $current_term ) : ?>
        <a href="<?php echo esc_url( home_url( '/subsidies/' ) ); ?>" class="text-white/70 hover:text-white no-underline">補助金一覧</a>
        <span class="text-white/40">/</span>
        <span class="text-white"><?php echo esc_html( $current_term->name ); ?></span>
      <?php else : ?>
        <span class="text-white">補助金一覧</span>
      <?php endif; ?>
    </nav>
    <h1 class="text-3xl md:text-4xl font-black text-white mb-2"><?php echo esc_html( $archive_title ); ?></h1>
    <?php if ( $archive_desc ) : ?>
      <p class="text-white/75 text-base"><?php echo esc_html( $archive_desc ); ?></p>
    <?php endif; ?>
    <div class="flex items-center gap-4 mt-3">
      <p class="text-white/60 text-sm">全 <strong class="text-white text-lg"><?php echo esc_html( number_format( $total_found ) ); ?></strong> 件</p>
      <?php if ( count( $active_filters ) > 0 ) : ?>
        <a href="<?php echo esc_url( $current_term ? get_term_link( $current_term ) : home_url( '/subsidies/' ) ); ?>"
           class="text-white/60 hover:text-white text-sm border border-white/30 rounded-full px-3 py-1 no-underline">
          フィルターをリセット ×
        </a>
      <?php endif; ?>
    </div>
  </div>
</section>

<!-- ── フィルターパネル ──────────────────────────────────────────────────── -->
<div class="bg-white border-b border-hj-border shadow-sm">
  <form method="get" action="<?php echo esc_url( $current_term ? get_term_link( $current_term ) : home_url( '/subsidies/' ) ); ?>" id="hjnaviFilterForm">
    <div class="max-w-site mx-auto px-5 py-4 grid grid-cols-2 gap-3">

      <!-- キーワード検索 -->
      <div class="col-span-2 flex items-center border border-hj-border rounded-lg overflow-hidden">
        <input type="text" name="s" value="<?php echo esc_attr( $f_s ); ?>"
               placeholder="キーワードで検索..."
               class="flex-1 px-3 py-2 text-sm outline-none bg-white">
        <button type="submit" class="px-3 py-2 bg-hj-primary text-white text-sm hover:bg-hj-primary/90">🔍</button>
      </div>

      <!-- ステータスチップ -->
      <div class="col-span-2 flex items-center gap-1 flex-wrap">
        <?php
        $statuses = array( '' => 'すべて', '公募中' => '公募中・受付中', '予定' => '予定', '終了' => '終了' );
        foreach ( $statuses as $val => $label ) :
          $is_active = $f_status === $val;
          $chip_url  = add_query_arg( array_filter( array(
            'status'   => $val,
            'type'     => $f_type,
            'industry' => $f_industry,
            'purpose'  => $f_purpose,
            'region'   => $f_region,
            'orderby'  => $f_order !== 'date' ? $f_order : '',
            's'        => $f_s,
          ) ), $current_term ? get_term_link( $current_term ) : home_url( '/subsidies/' ) );
        ?>
          <a href="<?php echo esc_url( $chip_url ); ?>"
             class="filter-chip text-xs px-3 py-1 rounded-full border transition-colors no-underline
                    <?php echo $is_active ? 'bg-hj-primary text-white border-hj-primary' : 'bg-white text-hj-dark border-hj-border hover:border-hj-primary hover:text-hj-primary'; ?>">
            <?php echo esc_html( $label ); ?>
          </a>
        <?php endforeach; ?>
      </div>

      <!-- 種別セレクト -->
      <select name="type" class="filter-select text-sm px-3 py-2 border border-hj-border rounded-lg bg-white" onchange="this.form.submit()">
        <option value="">種別</option>
        <?php foreach ( (array)$all_types as $at ) : if ( is_wp_error( $at ) ) continue; ?>
          <option value="<?php echo esc_attr( $at->slug ); ?>" <?php selected( $f_type, $at->slug ); ?>>
            <?php echo esc_html( $at->name ); ?> (<?php echo esc_html( $at->count ); ?>)
          </option>
        <?php endforeach; ?>
      </select>

      <!-- 業種セレクト -->
      <select name="industry" class="filter-select text-sm px-3 py-2 border border-hj-border rounded-lg bg-white" onchange="this.form.submit()">
        <option value="">業種</option>
        <?php foreach ( (array)$all_industries as $ai ) : if ( is_wp_error( $ai ) ) continue; ?>
          <option value="<?php echo esc_attr( $ai->slug ); ?>" <?php selected( $f_industry, $ai->slug ); ?>>
            <?php echo esc_html( $ai->name ); ?> (<?php echo esc_html( $ai->count ); ?>)
          </option>
        <?php endforeach; ?>
      </select>

      <!-- 目的セレクト -->
      <select name="purpose" class="filter-select text-sm px-3 py-2 border border-hj-border rounded-lg bg-white" onchange="this.form.submit()">
        <option value="">目的</option>
        <?php foreach ( (array)$all_purposes as $ap ) : if ( is_wp_error( $ap ) ) continue; ?>
          <option value="<?php echo esc_attr( $ap->slug ); ?>" <?php selected( $f_purpose, $ap->slug ); ?>>
            <?php echo esc_html( $ap->name ); ?> (<?php echo esc_html( $ap->count ); ?>)
          </option>
        <?php endforeach; ?>
      </select>

      <!-- 地域セレクト -->
      <?php if ( ! empty( $unique_regions ) ) : ?>
      <select name="region" class="filter-select text-sm px-3 py-2 border border-hj-border rounded-lg bg-white" onchange="this.form.submit()">
        <option value="">地域</option>
        <?php foreach ( $unique_regions as $reg ) : ?>
          <option value="<?php echo esc_attr( $reg ); ?>" <?php selected( $f_region, $reg ); ?>><?php echo esc_html( $reg ); ?></option>
        <?php endforeach; ?>
      </select>
      <?php endif; ?>

      <!-- 金額フィルタ -->
      <select name="amount_min" class="filter-select text-sm px-3 py-2 border border-hj-border rounded-lg bg-white" onchange="this.form.submit()">
        <option value="0">上限額</option>
        <option value="100"  <?php selected( $f_amount, 100 ); ?>>100万円以上</option>
        <option value="500"  <?php selected( $f_amount, 500 ); ?>>500万円以上</option>
        <option value="1000" <?php selected( $f_amount, 1000 ); ?>>1,000万円以上</option>
        <option value="5000" <?php selected( $f_amount, 5000 ); ?>>5,000万円以上</option>
      </select>

      <!-- 並び順 -->
      <select name="orderby" class="filter-select text-sm px-3 py-2 border border-hj-border rounded-lg bg-white" onchange="this.form.submit()">
        <option value="date"     <?php selected( $f_order, 'date' ); ?>>新着順</option>
        <option value="amount"   <?php selected( $f_order, 'amount' ); ?>>金額が高い順</option>
        <option value="deadline" <?php selected( $f_order, 'deadline' ); ?>>締切が近い順</option>
        <option value="title"    <?php selected( $f_order, 'title' ); ?>>名称順</option>
      </select>

    </div><!-- /inner -->

    <!-- アクティブフィルタータグ -->
    <?php if ( count( $active_filters ) > 0 ) : ?>
    <div class="max-w-site mx-auto px-5 pb-2 flex flex-wrap gap-2 text-xs">
      <?php if ( $f_s ) : ?>
        <span class="bg-hj-hero text-hj-primary rounded px-2 py-1">🔍 <?php echo esc_html( $f_s ); ?></span>
      <?php endif; ?>
      <?php if ( $f_status ) : ?>
        <span class="bg-hj-hero text-hj-primary rounded px-2 py-1"><?php echo esc_html( $f_status ); ?></span>
      <?php endif; ?>
      <?php if ( $f_type ) : ?>
        <?php $tt = get_term_by( 'slug', $f_type, 'subsidy_type' ); ?>
        <span class="bg-hj-hero text-hj-primary rounded px-2 py-1">種別: <?php echo $tt ? esc_html( $tt->name ) : esc_html( $f_type ); ?></span>
      <?php endif; ?>
      <?php if ( $f_industry ) : ?>
        <?php $ti = get_term_by( 'slug', $f_industry, 'subsidy_industry' ); ?>
        <span class="bg-hj-hero text-hj-primary rounded px-2 py-1">業種: <?php echo $ti ? esc_html( $ti->name ) : esc_html( $f_industry ); ?></span>
      <?php endif; ?>
      <?php if ( $f_purpose ) : ?>
        <?php $tp = get_term_by( 'slug', $f_purpose, 'subsidy_purpose' ); ?>
        <span class="bg-hj-hero text-hj-primary rounded px-2 py-1">目的: <?php echo $tp ? esc_html( $tp->name ) : esc_html( $f_purpose ); ?></span>
      <?php endif; ?>
      <?php if ( $f_region ) : ?>
        <span class="bg-hj-hero text-hj-primary rounded px-2 py-1">📍 <?php echo esc_html( $f_region ); ?></span>
      <?php endif; ?>
      <?php if ( $f_amount > 0 ) : ?>
        <span class="bg-hj-hero text-hj-primary rounded px-2 py-1">💰 <?php echo esc_html( number_format( $f_amount ) ); ?>万円以上</span>
      <?php endif; ?>
    </div>
    <?php endif; ?>

  </form>
</div>

<!-- ── グリッド ─────────────────────────────────────────────────────────── -->
<div class="max-w-site mx-auto px-5 py-8">

  <?php if ( $subsidy_query->have_posts() ) : ?>

  <!-- 表示切替 -->
  <div class="flex items-center justify-between mb-5">
    <p class="text-sm text-hj-muted">
      <?php
      $from = ( $paged - 1 ) * $per_page + 1;
      $to   = min( $paged * $per_page, $total_found );
      printf( '%d〜%d件目 / 全%s件', $from, $to, number_format( $total_found ) );
      ?>
    </p>
    <div class="flex gap-2 text-sm" id="viewToggle">
      <button onclick="setView('grid')" id="btn-grid" class="px-3 py-1 rounded border border-hj-border bg-hj-primary text-white">グリッド</button>
      <button onclick="setView('table')" id="btn-table" class="px-3 py-1 rounded border border-hj-border text-hj-muted bg-white">テーブル</button>
    </div>
  </div>

  <!-- グリッドビュー -->
  <div id="view-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
    <?php while ( $subsidy_query->have_posts() ) : $subsidy_query->the_post();
      $sid        = get_the_ID();
      $hj_status  = get_post_meta( $sid, 'hj_status',       true );
      $hj_amount  = get_post_meta( $sid, 'hj_amount_max',   true );
      $hj_rate    = get_post_meta( $sid, 'hj_amount_rate',  true );
      $hj_dead    = get_post_meta( $sid, 'hj_deadline',     true );
      $hj_agency  = get_post_meta( $sid, 'hj_agency',       true );
      $hj_region  = get_post_meta( $sid, 'hj_region',       true );
      $hj_target  = get_post_meta( $sid, 'hj_target',       true );
      $hj_offurl  = get_post_meta( $sid, 'hj_official_url', true ) ?: get_post_meta( $sid, 'hj_url', true );
      $hj_fiscal  = get_post_meta( $sid, 'hj_fiscal_year',  true );
      $sq_types   = get_the_terms( $sid, 'subsidy_type' );
      $sq_inds    = get_the_terms( $sid, 'subsidy_industry' );
      $is_open    = in_array( $hj_status, array( '公募中', '受付中' ) );
      $is_expired = $hj_status === '終了';
    ?>
    <article class="subsidy-card no-underline group flex flex-col <?php echo $is_expired ? 'opacity-60' : ''; ?>">

      <!-- ヘッダー: ステータス + 締切 + 年度 -->
      <div class="flex items-start justify-between gap-2 mb-3">
        <div class="flex items-center gap-1.5">
          <?php echo hjnavi_status_badge( $hj_status ); ?>
          <?php if ( $hj_fiscal ) : ?>
            <span class="text-xs text-hj-muted bg-hj-bg px-2 py-0.5 rounded"><?php echo esc_html( $hj_fiscal ); ?>年度</span>
          <?php endif; ?>
        </div>
        <?php if ( $hj_dead && $hj_dead !== '随時' ) : ?>
          <span class="text-xs flex-shrink-0 <?php echo hjnavi_deadline_alert( $hj_dead ) ? 'text-red-500 font-bold' : 'text-hj-muted'; ?>">
            締切 <?php echo esc_html( $hj_dead ); ?>
          </span>
        <?php elseif ( $hj_dead === '随時' ) : ?>
          <span class="text-xs text-green-600 flex-shrink-0">随時受付</span>
        <?php endif; ?>
      </div>

      <!-- 種別タグ -->
      <?php if ( $sq_types && ! is_wp_error( $sq_types ) ) : ?>
        <div class="flex flex-wrap gap-1 mb-2">
          <?php foreach ( array_slice( $sq_types, 0, 1 ) as $sqt ) : ?>
            <span class="subsidy-card__tag text-xs px-2 py-0.5"><?php echo esc_html( $sqt->name ); ?></span>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>

      <!-- 補助金名 -->
      <a href="<?php the_permalink(); ?>" class="no-underline">
        <p class="subsidy-card__name group-hover:text-hj-primary transition-colors mb-3 flex-grow leading-snug font-bold text-hj-dark">
          <?php the_title(); ?>
        </p>
      </a>

      <!-- 金額・補助率 -->
      <div class="flex items-baseline gap-2 mb-3 bg-hj-hero rounded-lg px-3 py-2">
        <?php if ( $hj_amount ) : ?>
          <span class="subsidy-card__amount text-hj-primary font-black"><?php echo esc_html( hjnavi_format_amount( $hj_amount ) ); ?></span>
          <span class="text-xs text-hj-muted">上限</span>
        <?php else : ?>
          <span class="text-hj-muted text-sm">上限額 要確認</span>
        <?php endif; ?>
        <?php if ( $hj_rate ) : ?>
          <span class="text-sm font-semibold text-hj-primary ml-auto">補助率 <?php echo esc_html( $hj_rate ); ?></span>
        <?php endif; ?>
      </div>

      <!-- 実施機関・地域 -->
      <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-hj-muted mb-3">
        <?php if ( $hj_agency ) : ?>
          <div class="col-span-2 truncate flex items-start gap-1">
            <span class="flex-shrink-0">🏛</span>
            <span class="truncate"><?php echo esc_html( $hj_agency ); ?></span>
          </div>
        <?php endif; ?>
        <?php if ( $hj_region ) : ?>
          <div class="flex items-center gap-1">
            <span>📍</span>
            <span><?php echo esc_html( $hj_region ); ?></span>
          </div>
        <?php endif; ?>
        <?php if ( $hj_target ) : ?>
          <div class="flex items-start gap-1 col-span-<?php echo $hj_region ? '1' : '2'; ?>">
            <span class="flex-shrink-0">👥</span>
            <span class="line-clamp-1"><?php echo esc_html( $hj_target ); ?></span>
          </div>
        <?php endif; ?>
      </div>

      <!-- 概要（抜粋） -->
      <?php $exc = get_the_excerpt(); if ( $exc ) : ?>
        <p class="text-xs text-hj-muted mb-3 line-clamp-2"><?php echo esc_html( $exc ); ?></p>
      <?php endif; ?>

      <!-- 業種タグ -->
      <?php if ( $sq_inds && ! is_wp_error( $sq_inds ) ) : ?>
        <div class="flex flex-wrap gap-1 mb-2">
          <?php foreach ( array_slice( $sq_inds, 0, 3 ) as $si ) : ?>
            <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"><?php echo esc_html( $si->name ); ?></span>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>

      <!-- フッター: 詳細リンク + 公式URL -->
      <div class="flex items-center gap-2 mt-auto pt-3 border-t border-hj-border">
        <a href="<?php the_permalink(); ?>"
           class="flex-1 text-center text-sm py-1.5 rounded-lg border border-hj-primary text-hj-primary hover:bg-hj-primary hover:text-white transition-colors no-underline font-semibold">
          詳細を見る
        </a>
        <?php if ( $hj_offurl ) : ?>
          <a href="<?php echo esc_url( $hj_offurl ); ?>" target="_blank" rel="noopener noreferrer"
             class="text-sm py-1.5 px-3 rounded-lg bg-hj-primary text-white hover:bg-hj-primary/90 transition-colors no-underline"
             onclick="event.stopPropagation()">
            公式 ↗
          </a>
        <?php endif; ?>
      </div>

    </article>
    <?php endwhile; ?>
  </div>

  <!-- テーブルビュー -->
  <div id="view-table" class="hidden overflow-x-auto">
    <table class="w-full text-sm border-collapse">
      <thead>
        <tr class="bg-hj-primary text-white text-left">
          <th class="px-4 py-3 min-w-[240px]">補助金名</th>
          <th class="px-3 py-3 whitespace-nowrap">種別</th>
          <th class="px-3 py-3 whitespace-nowrap">上限額</th>
          <th class="px-3 py-3 whitespace-nowrap">補助率</th>
          <th class="px-3 py-3 whitespace-nowrap">ステータス</th>
          <th class="px-3 py-3 whitespace-nowrap">締切</th>
          <th class="px-3 py-3 whitespace-nowrap">地域</th>
          <th class="px-3 py-3 whitespace-nowrap">対象者</th>
          <th class="px-3 py-3 whitespace-nowrap">実施機関</th>
          <th class="px-3 py-3 whitespace-nowrap">リンク</th>
        </tr>
      </thead>
      <tbody>
        <?php
        $subsidy_query->rewind_posts();
        $row = 0;
        while ( $subsidy_query->have_posts() ) : $subsidy_query->the_post();
          $sid       = get_the_ID();
          $hj_status = get_post_meta( $sid, 'hj_status',      true );
          $hj_amount = get_post_meta( $sid, 'hj_amount_max',  true );
          $hj_rate   = get_post_meta( $sid, 'hj_amount_rate', true );
          $hj_dead   = get_post_meta( $sid, 'hj_deadline',    true );
          $hj_agency = get_post_meta( $sid, 'hj_agency',      true );
          $hj_region = get_post_meta( $sid, 'hj_region',      true );
          $hj_target = get_post_meta( $sid, 'hj_target',      true );
          $hj_offurl = get_post_meta( $sid, 'hj_official_url', true ) ?: get_post_meta( $sid, 'hj_url', true );
          $sq_types  = get_the_terms( $sid, 'subsidy_type' );
          $row++;
        ?>
        <tr class="<?php echo $row % 2 === 0 ? 'bg-hj-bg' : 'bg-white'; ?> border-b border-hj-border hover:bg-hj-hero transition-colors">
          <td class="px-4 py-3">
            <a href="<?php the_permalink(); ?>" class="font-semibold text-hj-dark hover:text-hj-primary no-underline line-clamp-2">
              <?php the_title(); ?>
            </a>
          </td>
          <td class="px-3 py-3 whitespace-nowrap">
            <?php if ( $sq_types && ! is_wp_error( $sq_types ) ) echo esc_html( $sq_types[0]->name ); ?>
          </td>
          <td class="px-3 py-3 whitespace-nowrap font-bold text-hj-primary">
            <?php echo $hj_amount ? esc_html( hjnavi_format_amount( $hj_amount ) ) : '要確認'; ?>
          </td>
          <td class="px-3 py-3 whitespace-nowrap text-hj-muted">
            <?php echo esc_html( $hj_rate ?: '—' ); ?>
          </td>
          <td class="px-3 py-3 whitespace-nowrap">
            <?php echo hjnavi_status_badge( $hj_status ); ?>
          </td>
          <td class="px-3 py-3 whitespace-nowrap text-hj-muted text-xs">
            <?php echo esc_html( $hj_dead ?: '—' ); ?>
          </td>
          <td class="px-3 py-3 whitespace-nowrap text-hj-muted text-xs">
            <?php echo esc_html( $hj_region ?: '全国' ); ?>
          </td>
          <td class="px-3 py-3 text-hj-muted text-xs max-w-[140px]">
            <span class="line-clamp-2"><?php echo esc_html( $hj_target ?: '—' ); ?></span>
          </td>
          <td class="px-3 py-3 text-hj-muted text-xs max-w-[140px]">
            <span class="line-clamp-1"><?php echo esc_html( $hj_agency ?: '—' ); ?></span>
          </td>
          <td class="px-3 py-3 whitespace-nowrap">
            <div class="flex gap-1">
              <a href="<?php the_permalink(); ?>" class="text-xs px-2 py-1 border border-hj-primary text-hj-primary rounded hover:bg-hj-primary hover:text-white no-underline">詳細</a>
              <?php if ( $hj_offurl ) : ?>
                <a href="<?php echo esc_url( $hj_offurl ); ?>" target="_blank" rel="noopener noreferrer"
                   class="text-xs px-2 py-1 bg-hj-primary text-white rounded hover:bg-hj-primary/90 no-underline">公式↗</a>
              <?php endif; ?>
            </div>
          </td>
        </tr>
        <?php endwhile; wp_reset_postdata(); ?>
      </tbody>
    </table>
  </div>

  <!-- ページネーション -->
  <?php if ( $total_pages > 1 ) : ?>
  <nav class="pagination mt-8 flex justify-center items-center flex-wrap gap-2" aria-label="ページネーション">
    <?php
    $base_url = add_query_arg( array_filter( array(
      'status'      => $f_status,
      'type'        => $f_type,
      'industry'    => $f_industry,
      'purpose'     => $f_purpose,
      'region'      => $f_region,
      'orderby'     => $f_order !== 'date' ? $f_order : '',
      's'           => $f_s,
      'amount_min'  => $f_amount ?: '',
    ) ), $current_term ? get_term_link( $current_term ) : home_url( '/subsidies/' ) );

    // ページURL生成（フィルター条件を保持）
    function hjnavi_page_url( $base, $p ) {
      if ( $p <= 1 ) return remove_query_arg( 'paged', $base );
      return add_query_arg( 'paged', $p, $base );
    }

    if ( $paged > 1 ) :
    ?>
      <a href="<?php echo esc_url( hjnavi_page_url( $base_url, $paged - 1 ) ); ?>"
         class="pagination__item px-4 py-2 border border-hj-border rounded-lg hover:bg-hj-primary hover:text-white hover:border-hj-primary transition-colors no-underline text-sm">← 前へ</a>
    <?php endif; ?>

    <?php for ( $p = max( 1, $paged - 2 ); $p <= min( $total_pages, $paged + 2 ); $p++ ) : ?>
      <a href="<?php echo esc_url( hjnavi_page_url( $base_url, $p ) ); ?>"
         class="pagination__item px-4 py-2 border rounded-lg transition-colors no-underline text-sm
                <?php echo $p === $paged ? 'bg-hj-primary text-white border-hj-primary font-bold' : 'border-hj-border hover:bg-hj-primary hover:text-white hover:border-hj-primary'; ?>"
         <?php echo $p === $paged ? 'aria-current="page"' : ''; ?>>
        <?php echo esc_html( $p ); ?>
      </a>
    <?php endfor; ?>

    <?php if ( $paged < $total_pages ) : ?>
      <a href="<?php echo esc_url( hjnavi_page_url( $base_url, $paged + 1 ) ); ?>"
         class="pagination__item px-4 py-2 border border-hj-border rounded-lg hover:bg-hj-primary hover:text-white hover:border-hj-primary transition-colors no-underline text-sm">次へ →</a>
    <?php endif; ?>

    <span class="text-sm text-hj-muted ml-4"><?php echo $paged; ?>/<?php echo $total_pages; ?>ページ</span>
  </nav>
  <?php endif; ?>

  <?php else : ?>
  <div class="text-center py-20">
    <span class="text-6xl block mb-4">🔍</span>
    <h2 class="text-2xl font-black text-hj-dark mb-3">条件に合う補助金が見つかりませんでした</h2>
    <p class="text-hj-muted mb-2">フィルターを変更してもう一度お試しください。</p>
    <p class="text-sm text-hj-muted mb-6">キーワードのスペルを確認するか、条件を緩めてみましょう。</p>
    <a href="<?php echo esc_url( home_url( '/subsidies/' ) ); ?>" class="btn-primary">
      すべての補助金を見る
    </a>
  </div>
  <?php endif; ?>

</div><!-- /main -->

<!-- ビュー切替JS -->
<script>
function setView(v) {
  document.getElementById('view-grid').classList.toggle('hidden', v !== 'grid');
  document.getElementById('view-table').classList.toggle('hidden', v !== 'table');
  document.getElementById('btn-grid').className  = v === 'grid'  ? 'px-3 py-1 rounded border border-hj-primary bg-hj-primary text-white text-sm' : 'px-3 py-1 rounded border border-hj-border text-hj-muted bg-white text-sm';
  document.getElementById('btn-table').className = v === 'table' ? 'px-3 py-1 rounded border border-hj-primary bg-hj-primary text-white text-sm' : 'px-3 py-1 rounded border border-hj-border text-hj-muted bg-white text-sm';
  localStorage.setItem('hjnavi_view', v);
}
(function(){
  const saved = localStorage.getItem('hjnavi_view');
  if (saved === 'table') setView('table');
})();
</script>

<?php include __DIR__ . '/parts/footer.php'; ?>
