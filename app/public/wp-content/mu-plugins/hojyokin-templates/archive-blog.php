<?php
/**
 * 補助金now - archive-blog.php
 * コラム記事一覧ページ
 */
if ( ! defined( 'ABSPATH' ) ) exit;

$paged    = get_query_var('paged') ?: 1;
$per_page = 12;

$cat_slug = get_query_var('category_name') ?: '';
$tag_slug = get_query_var('tag') ?: '';

$args = array(
  'post_type'      => 'post',
  'post_status'    => 'publish',
  'posts_per_page' => $per_page,
  'paged'          => $paged,
  'orderby'        => 'date',
  'order'          => 'DESC',
);
if ( $cat_slug ) $args['category_name'] = $cat_slug;
if ( $tag_slug ) $args['tag'] = $tag_slug;

$articles = new WP_Query( $args );
$all_cats = get_categories( array( 'hide_empty' => true, 'orderby' => 'count', 'order' => 'DESC', 'number' => 20 ) );

include __DIR__ . '/parts/header.php';
?>

<!-- パンくず -->
<nav class="breadcrumb bg-hj-bg">
  <a href="<?php echo esc_url( home_url( '/' ) ); ?>">ホーム</a>
  <span class="bc-sep">/</span>
  <span class="bc-current">補助金コラム</span>
</nav>

<!-- ヘッダー -->
<section style="background:linear-gradient(135deg,#0a2540,#1A6B3C);padding:2.5rem 1rem;text-align:center;color:#fff;">
  <h1 style="font-size:1.75rem;font-weight:900;margin-bottom:0.5rem;color:#fff;">📰 補助金コラム</h1>
  <p style="color:rgba(255,255,255,0.8);font-size:1rem;">補助金・助成金に関する最新情報・申請ガイド・業種別解説をお届けします</p>
</section>

<!-- カテゴリフィルタ -->
<?php if ( $all_cats ) : ?>
<div style="background:#fff;border-bottom:1px solid #e5e7eb;padding:1rem 0;">
  <div class="max-w-site mx-auto px-5 flex flex-wrap gap-2 items-center">
    <a href="<?php echo esc_url( home_url( '/blog/' ) ); ?>"
       class="filter-chip text-sm px-3 py-1 rounded-full border no-underline transition-colors
              <?php echo !$cat_slug ? 'bg-hj-primary text-white border-hj-primary' : 'bg-white text-hj-dark border-hj-border hover:border-hj-primary hover:text-hj-primary'; ?>">
      すべて
    </a>
    <?php foreach ( $all_cats as $c ) : ?>
      <a href="<?php echo esc_url( get_category_link( $c->term_id ) ); ?>"
         class="filter-chip text-sm px-3 py-1 rounded-full border no-underline transition-colors
                <?php echo $cat_slug === $c->slug ? 'bg-hj-primary text-white border-hj-primary' : 'bg-white text-hj-dark border-hj-border hover:border-hj-primary hover:text-hj-primary'; ?>">
        <?php echo esc_html( $c->name ); ?> <span style="opacity:0.7;">(<?php echo $c->count; ?>)</span>
      </a>
    <?php endforeach; ?>
  </div>
</div>
<?php endif; ?>

<!-- 記事一覧 -->
<div class="max-w-site mx-auto px-5 py-10">
  <?php if ( $articles->have_posts() ) : ?>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    <?php while ( $articles->have_posts() ) : $articles->the_post();
      $a_id    = get_the_ID();
      $a_thumb = get_the_post_thumbnail_url( $a_id, 'medium_large' );
      $a_cats  = get_the_category( $a_id );
      $a_cat   = $a_cats ? $a_cats[0] : null;
    ?>
    <a href="<?php the_permalink(); ?>" class="blog-card no-underline group">
      <div class="blog-card__img-wrap">
        <?php if ( $a_thumb ) : ?>
          <img src="<?php echo esc_url( $a_thumb ); ?>"
               alt="<?php echo esc_attr( get_the_title() ); ?>"
               class="blog-card__img" loading="lazy">
        <?php else : ?>
          <div class="blog-card__img flex items-center justify-center text-5xl bg-hj-hero">📰</div>
        <?php endif; ?>
      </div>
      <div class="blog-card__body">
        <?php if ( $a_cat ) : ?>
          <span class="blog-card__cat" style="background:#1A6B3C;color:#fff;"><?php echo esc_html( $a_cat->name ); ?></span>
        <?php endif; ?>
        <p class="blog-card__title"><?php the_title(); ?></p>
        <p class="blog-card__meta">
          <span>📅 <?php echo get_the_date( 'Y年m月d日' ); ?></span>
        </p>
        <p class="blog-card__excerpt"><?php echo esc_html( wp_trim_words( get_the_excerpt(), 55, '...' ) ); ?></p>
      </div>
    </a>
    <?php endwhile; wp_reset_postdata(); ?>
  </div>

  <!-- ページネーション -->
  <?php if ( $articles->max_num_pages > 1 ) : ?>
  <div style="margin-top:3rem;display:flex;justify-content:center;gap:0.5rem;flex-wrap:wrap;">
    <?php for ( $i = 1; $i <= $articles->max_num_pages; $i++ ) : ?>
      <a href="<?php echo esc_url( $i === 1 ? home_url('/blog/') : home_url('/blog/page/' . $i . '/') ); ?>"
         style="display:inline-flex;align-items:center;justify-content:center;width:2.5rem;height:2.5rem;border-radius:0.5rem;font-weight:700;font-size:1rem;text-decoration:none;
                <?php echo $i === $paged ? 'background:linear-gradient(135deg,#1A6B3C,#155830);color:#fff;' : 'background:#fff;color:#374151;border:1px solid #e5e7eb;'; ?>">
        <?php echo $i; ?>
      </a>
    <?php endfor; ?>
  </div>
  <?php endif; ?>

  <?php else : ?>
  <div style="text-align:center;padding:4rem 1rem;color:#6b7280;">
    <div style="font-size:3rem;margin-bottom:1rem;">📰</div>
    <p style="font-weight:700;font-size:1.1rem;">記事がまだありません</p>
  </div>
  <?php endif; ?>
</div>

<?php include __DIR__ . '/parts/footer.php'; ?>
