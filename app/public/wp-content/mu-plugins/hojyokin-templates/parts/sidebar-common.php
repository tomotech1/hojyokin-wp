<?php
/**
 * 補助金ナビ - 共通サイドバー
 * 補助金サイト用ウィジェット集
 */
if ( ! defined( 'ABSPATH' ) ) exit;
?>
<aside class="space-y-5">

  <!-- 補助金を申請サポート CTA -->
  <div class="sidebar-widget overflow-hidden relative" style="background:linear-gradient(135deg,#0f3d21,#1A6B3C,#2d9150)">
    <div class="absolute top-0 right-0 w-24 h-24 rounded-full opacity-20" style="background:radial-gradient(circle,#F59E0B,transparent);transform:translate(30%,-30%)"></div>
    <p class="text-xl font-black text-white mb-1 relative">補助金を探す</p>
    <p class="text-base text-white/75 mb-4 relative">あなたに最適な補助金を無料で検索</p>
    <a href="<?php echo esc_url( home_url( '/subsidies/' ) ); ?>"
       class="relative block text-center bg-white text-hj-primary text-lg font-black py-3 rounded-xl hover:bg-gray-50 transition-colors no-underline shadow-md">
      💰 補助金一覧を見る →
    </a>
  </div>

  <!-- 新着補助金ウィジェット -->
  <?php
  $sb_latest = new WP_Query( array(
    'post_type'      => 'subsidies',
    'posts_per_page' => 5,
    'orderby'        => 'date',
    'order'          => 'DESC',
    'post_status'    => 'publish',
  ) );
  if ( $sb_latest->have_posts() ) :
  ?>
  <div class="sidebar-widget">
    <p class="sidebar-widget__title">🆕 新着補助金</p>
    <?php while ( $sb_latest->have_posts() ) : $sb_latest->the_post();
      $sb_id     = get_the_ID();
      $sb_status = get_post_meta( $sb_id, 'hj_status', true );
      $sb_amount = get_post_meta( $sb_id, 'hj_amount_max', true );
      $sb_badge_color = $sb_status === '募集中' ? '#1A6B3C' : ( $sb_status === '予定' ? '#1A56DB' : '#9CA3AF' );
    ?>
    <a href="<?php the_permalink(); ?>" class="flex items-start gap-3 py-3 border-b border-hj-border last:border-0 no-underline group">
      <div class="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style="background:#f0f7f2;">💰</div>
      <div class="min-w-0 flex-1">
        <p class="text-base font-bold text-hj-dark truncate group-hover:text-hj-primary transition-colors leading-snug mb-1"><?php the_title(); ?></p>
        <div class="flex items-center gap-2 flex-wrap">
          <?php if ( $sb_amount ) : ?>
            <span class="text-xs font-bold text-hj-primary">最大 <?php echo esc_html( hjnavi_format_amount( $sb_amount ) ); ?></span>
          <?php endif; ?>
          <?php if ( $sb_status ) : ?>
            <span class="text-xs font-bold" style="color:<?php echo esc_attr( $sb_badge_color ); ?>"><?php echo esc_html( $sb_status ); ?></span>
          <?php endif; ?>
        </div>
      </div>
    </a>
    <?php endwhile; wp_reset_postdata(); ?>
    <a href="<?php echo esc_url( home_url( '/subsidies/' ) ); ?>"
       class="block text-center text-base font-bold text-hj-primary hover:text-hj-primary/80 mt-3 pt-3 border-t border-hj-border no-underline">
      もっと見る →
    </a>
  </div>
  <?php endif; ?>

  <!-- 締切間近ウィジェット -->
  <?php
  $today      = current_time( 'Y-m-d' );
  $near_date  = date( 'Y-m-d', strtotime( '+30 days' ) );
  $sb_near = new WP_Query( array(
    'post_type'      => 'subsidies',
    'posts_per_page' => 5,
    'post_status'    => 'publish',
    'meta_query'     => array(
      'relation' => 'AND',
      array(
        'key'     => 'hj_deadline',
        'value'   => $today,
        'compare' => '>=',
        'type'    => 'DATE',
      ),
      array(
        'key'     => 'hj_deadline',
        'value'   => $near_date,
        'compare' => '<=',
        'type'    => 'DATE',
      ),
    ),
    'meta_key'       => 'hj_deadline',
    'orderby'        => 'meta_value',
    'order'          => 'ASC',
  ) );
  if ( $sb_near->have_posts() ) :
  ?>
  <div class="sidebar-widget">
    <p class="sidebar-widget__title">⏰ 締切間近（30日以内）</p>
    <?php while ( $sb_near->have_posts() ) : $sb_near->the_post();
      $sn_id       = get_the_ID();
      $sn_deadline = get_post_meta( $sn_id, 'hj_deadline', true );
      $sn_diff     = $sn_deadline ? ceil( ( strtotime( $sn_deadline ) - strtotime( $today ) ) / 86400 ) : null;
    ?>
    <a href="<?php the_permalink(); ?>" class="flex items-start gap-3 py-3 border-b border-hj-border last:border-0 no-underline group">
      <div class="flex-shrink-0 text-center" style="min-width:40px;">
        <?php if ( $sn_diff !== null ) : ?>
          <span class="block text-xl font-black leading-none" style="color:#EF4444;"><?php echo esc_html( $sn_diff ); ?></span>
          <span class="block text-xs text-hj-muted">日後</span>
        <?php endif; ?>
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-base font-bold text-hj-dark group-hover:text-hj-primary transition-colors leading-snug truncate"><?php the_title(); ?></p>
        <?php if ( $sn_deadline ) : ?>
          <p class="text-xs text-hj-muted mt-0.5">締切: <?php echo esc_html( $sn_deadline ); ?></p>
        <?php endif; ?>
      </div>
    </a>
    <?php endwhile; wp_reset_postdata(); ?>
  </div>
  <?php endif; ?>

  <!-- 種別ナビ -->
  <?php
  $sb_types = get_terms( array(
    'taxonomy'   => 'subsidy_type',
    'orderby'    => 'count',
    'order'      => 'DESC',
    'number'     => 10,
    'hide_empty' => false,
    'parent'     => 0,
  ) );
  if ( $sb_types && ! is_wp_error( $sb_types ) ) :
  ?>
  <div class="sidebar-widget">
    <p class="sidebar-widget__title">📂 補助金種別</p>
    <div class="space-y-0.5">
      <?php foreach ( $sb_types as $stype ) : ?>
        <a href="<?php echo esc_url( get_term_link( $stype ) ); ?>"
           class="flex items-center justify-between py-2.5 px-3 rounded-xl text-base no-underline text-hj-muted hover:bg-hj-bg hover:text-hj-dark transition-colors">
          <span># <?php echo esc_html( $stype->name ); ?></span>
          <span class="text-sm bg-gray-100 rounded-full px-2.5 py-0.5 text-hj-light"><?php echo intval( $stype->count ); ?></span>
        </a>
      <?php endforeach; ?>
    </div>
  </div>
  <?php endif; ?>

  <!-- 業種ナビ -->
  <?php
  $sb_industries = get_terms( array(
    'taxonomy'   => 'subsidy_industry',
    'orderby'    => 'count',
    'order'      => 'DESC',
    'number'     => 8,
    'hide_empty' => false,
  ) );
  if ( $sb_industries && ! is_wp_error( $sb_industries ) ) :
  ?>
  <div class="sidebar-widget">
    <p class="sidebar-widget__title">🏭 業種から探す</p>
    <div class="flex flex-wrap gap-2">
      <?php foreach ( $sb_industries as $sindustry ) : ?>
        <a href="<?php echo esc_url( get_term_link( $sindustry ) ); ?>"
           class="inline-flex items-center text-sm font-bold px-3 py-1.5 rounded-full border border-hj-border bg-white text-hj-muted hover:bg-hj-bg hover:text-hj-dark no-underline transition-colors">
          <?php echo esc_html( $sindustry->name ); ?>
        </a>
      <?php endforeach; ?>
    </div>
  </div>
  <?php endif; ?>

  <!-- サイトナビ -->
  <div class="sidebar-widget">
    <p class="sidebar-widget__title">🔗 サイトナビ</p>
    <div class="space-y-1">
      <a href="<?php echo esc_url( home_url( '/subsidies/' ) ); ?>" class="flex items-center gap-3 text-base font-medium text-hj-muted hover:text-hj-dark hover:bg-hj-bg no-underline py-2.5 px-3 rounded-xl transition-colors">💰 補助金一覧</a>
      <a href="<?php echo esc_url( home_url( '/subsidy-type/' ) ); ?>" class="flex items-center gap-3 text-base font-medium text-hj-muted hover:text-hj-dark hover:bg-hj-bg no-underline py-2.5 px-3 rounded-xl transition-colors">📂 種別一覧</a>
      <a href="<?php echo esc_url( home_url( '/industry/' ) ); ?>" class="flex items-center gap-3 text-base font-medium text-hj-muted hover:text-hj-dark hover:bg-hj-bg no-underline py-2.5 px-3 rounded-xl transition-colors">🏭 業種一覧</a>
      <a href="<?php echo esc_url( home_url( '/purpose/' ) ); ?>" class="flex items-center gap-3 text-base font-medium text-hj-muted hover:text-hj-dark hover:bg-hj-bg no-underline py-2.5 px-3 rounded-xl transition-colors">🎯 目的一覧</a>
      <a href="<?php echo esc_url( home_url( '/blog/' ) ); ?>" class="flex items-center gap-3 text-base font-medium text-hj-muted hover:text-hj-dark hover:bg-hj-bg no-underline py-2.5 px-3 rounded-xl transition-colors">📰 コラム</a>
      <a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>" class="flex items-center gap-3 text-base font-medium text-hj-muted hover:text-hj-dark hover:bg-hj-bg no-underline py-2.5 px-3 rounded-xl transition-colors">📋 申請サポート</a>
    </div>
  </div>

</aside>
