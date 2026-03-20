<?php
/**
 * 補助金now - page-subsidy-types.php
 * 補助金種別一覧ページ (/subsidy-type/)
 */
if ( ! defined( 'ABSPATH' ) ) exit;
include __DIR__ . '/parts/header.php';

// 全種別を取得
$types = get_terms( array(
    'taxonomy'   => 'subsidy_type',
    'hide_empty' => false,
    'orderby'    => 'count',
    'order'      => 'DESC',
) );

// 業種も取得
$industries = get_terms( array(
    'taxonomy'   => 'subsidy_industry',
    'hide_empty' => false,
    'orderby'    => 'count',
    'order'      => 'DESC',
    'number'     => 20,
) );

// 目的も取得
$purposes = get_terms( array(
    'taxonomy'   => 'subsidy_purpose',
    'hide_empty' => false,
    'orderby'    => 'count',
    'order'      => 'DESC',
    'number'     => 20,
) );

// アイコンマッピング
$type_icons = array(
    '補助金'  => '💰',
    '助成金'  => '🎁',
    '融資'    => '🏦',
    '給付金'  => '💴',
    '税制優遇' => '📋',
    '保証'    => '🛡',
);
?>

<nav class="breadcrumb bg-hj-bg">
  <a href="<?php echo esc_url( home_url( '/' ) ); ?>">ホーム</a>
  <span class="bc-sep">/</span>
  <span class="bc-current">補助金種別</span>
</nav>

<!-- ページヘッダー -->
<div class="archive-header">
  <div class="max-w-site mx-auto px-5 text-center">
    <h1 class="text-2xl md:text-3xl font-black text-white mb-2">補助金を種別で探す</h1>
    <p class="text-white/75 text-base">種別・業種・目的から補助金を絞り込めます</p>
  </div>
</div>

<div class="max-w-site mx-auto px-5 py-10 space-y-10">

  <!-- 補助金種別 -->
  <section>
    <h2 class="text-lg font-black text-hj-dark mb-4 flex items-center gap-2">
      <span class="w-1 h-6 bg-hj-primary rounded-full inline-block"></span>
      補助金の種別
    </h2>
    <?php if ( ! empty( $types ) && ! is_wp_error( $types ) ) : ?>
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      <?php foreach ( $types as $term ) :
        $icon = isset( $type_icons[ $term->name ] ) ? $type_icons[ $term->name ] : '📂';
        $link = get_term_link( $term );
      ?>
      <a href="<?php echo esc_url( is_wp_error( $link ) ? '#' : $link ); ?>"
         class="bg-white border border-hj-border rounded-xl p-4 flex items-center gap-3 no-underline hover:border-hj-primary/40 hover:shadow-md transition-all group">
        <span class="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-green-100 transition-colors"><?php echo $icon; ?></span>
        <div class="min-w-0">
          <p class="font-bold text-hj-dark text-sm leading-tight"><?php echo esc_html( $term->name ); ?></p>
          <p class="text-xs text-hj-muted mt-0.5"><?php echo number_format( $term->count ); ?> 件</p>
        </div>
      </a>
      <?php endforeach; ?>
    </div>
    <?php else : ?>
    <p class="text-hj-muted text-sm">種別データがありません</p>
    <?php endif; ?>
  </section>

  <!-- 業種別 -->
  <?php if ( ! empty( $industries ) && ! is_wp_error( $industries ) ) : ?>
  <section>
    <h2 class="text-lg font-black text-hj-dark mb-4 flex items-center gap-2">
      <span class="w-1 h-6 bg-blue-500 rounded-full inline-block"></span>
      業種から探す
    </h2>
    <div class="flex flex-wrap gap-2">
      <?php foreach ( $industries as $term ) :
        $link = get_term_link( $term );
      ?>
      <a href="<?php echo esc_url( is_wp_error( $link ) ? '#' : $link ); ?>"
         class="inline-flex items-center gap-1.5 bg-white border border-hj-border rounded-full px-4 py-2 text-sm font-bold text-hj-muted hover:bg-hj-bg hover:text-hj-dark hover:border-hj-primary/30 transition-all no-underline shadow-sm">
        <?php echo esc_html( $term->name ); ?>
        <span class="text-xs text-hj-muted/60">(<?php echo $term->count; ?>)</span>
      </a>
      <?php endforeach; ?>
    </div>
  </section>
  <?php endif; ?>

  <!-- 目的別 -->
  <?php if ( ! empty( $purposes ) && ! is_wp_error( $purposes ) ) : ?>
  <section>
    <h2 class="text-lg font-black text-hj-dark mb-4 flex items-center gap-2">
      <span class="w-1 h-6 bg-amber-500 rounded-full inline-block"></span>
      目的から探す
    </h2>
    <div class="flex flex-wrap gap-2">
      <?php foreach ( $purposes as $term ) :
        $link = get_term_link( $term );
      ?>
      <a href="<?php echo esc_url( is_wp_error( $link ) ? '#' : $link ); ?>"
         class="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-4 py-2 text-sm font-bold text-amber-800 hover:bg-amber-100 transition-all no-underline">
        🎯 <?php echo esc_html( $term->name ); ?>
        <span class="text-xs text-amber-600/70">(<?php echo $term->count; ?>)</span>
      </a>
      <?php endforeach; ?>
    </div>
  </section>
  <?php endif; ?>

  <!-- 一覧へのCTA -->
  <div class="bg-gradient-to-br from-hj-primary to-green-800 rounded-2xl p-8 text-center text-white">
    <p class="font-black text-xl mb-2">絞り込まずに全件見たい方は</p>
    <p class="text-white/80 text-sm mb-5">現在 <?php echo wp_count_posts('subsidies')->publish; ?> 件の補助金情報を掲載中</p>
    <a href="<?php echo esc_url( home_url( '/subsidies/' ) ); ?>"
       class="inline-flex items-center gap-2 bg-white text-hj-primary font-black px-6 py-3 rounded-xl no-underline hover:opacity-90 transition-opacity text-base">
      💰 補助金一覧を見る →
    </a>
  </div>

</div>

<?php include __DIR__ . '/parts/footer.php'; ?>
