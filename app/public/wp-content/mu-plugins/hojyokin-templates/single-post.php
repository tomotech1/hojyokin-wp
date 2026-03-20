<?php
/**
 * 補助金ナビ - single-post.php
 * ブログ記事個別テンプレート（補助金コラム）
 */
if ( ! defined( 'ABSPATH' ) ) exit;

while ( have_posts() ) : the_post();
$pid        = get_the_ID();
$thumb      = get_the_post_thumbnail_url( $pid, 'large' );
$cats       = get_the_category( $pid );
$tags       = get_the_tags( $pid );
$content    = get_the_content();
$author_id  = get_the_author_meta( 'ID' );
$word_count = str_word_count( strip_tags( $content ) );
$read_min   = max( 1, ceil( $word_count / 400 ) );
// AI要約: SEOPress メタディスクリプション（Gemini生成）を優先使用
$excerpt = get_post_meta( $pid, '_seopress_titles_desc', true );
if ( ! $excerpt ) $excerpt = $post->post_excerpt ?: '';

include __DIR__ . '/parts/header.php';
?>

<!-- パンくず -->
<nav class="breadcrumb bg-hj-bg">
  <a href="<?php echo esc_url( home_url( '/' ) ); ?>">ホーム</a>
  <span class="bc-sep">/</span>
  <a href="<?php echo esc_url( home_url( '/blog/' ) ); ?>">コラム</a>
  <?php if ( $cats ) : ?>
    <span class="bc-sep">/</span>
    <a href="<?php echo esc_url( get_category_link( $cats[0]->term_id ) ); ?>"><?php echo esc_html( $cats[0]->name ); ?></a>
  <?php endif; ?>
  <span class="bc-sep">/</span>
  <span class="bc-current truncate max-w-xs"><?php the_title(); ?></span>
</nav>

<!-- メインコンテンツ（2カラムグリッド） -->
<div class="max-w-site mx-auto px-5 pt-5 pb-12 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
  <main class="min-w-0">

    <!-- サムネイル -->
    <?php if ( $thumb ) : ?>
    <div class="rounded-xl overflow-hidden mb-5" style="height:380px;">
      <img src="<?php echo esc_url( $thumb ); ?>"
           alt="<?php echo esc_attr( get_the_title() ); ?>"
           style="width:100%;height:100%;object-fit:cover;object-position:center top;display:block;">
    </div>
    <?php else : ?>
    <div class="rounded-xl overflow-hidden mb-5 flex items-center justify-center text-7xl"
         style="height:260px;background:linear-gradient(135deg,#dcf0e4,#d1fae5)">💰</div>
    <?php endif; ?>

    <!-- 白カード: タイトル〜本文〜著者 -->
    <div class="bg-white rounded-xl shadow-sm" style="border:1px solid #D1E7D9;padding:1.8rem 2rem;">

    <!-- カテゴリーバッジ -->
    <?php if ( $cats ) : ?>
    <div class="flex flex-wrap gap-2 mb-3">
      <?php foreach ( array_slice( $cats, 0, 3 ) as $cat ) : ?>
        <a href="<?php echo esc_url( get_category_link( $cat->term_id ) ); ?>"
           style="display:inline-block;background:#1A6B3C;color:#fff;font-size:12px;font-weight:700;padding:3px 12px;border-radius:4px;text-decoration:none;letter-spacing:0.02em;">
          <?php echo esc_html( $cat->name ); ?>
        </a>
      <?php endforeach; ?>
    </div>
    <?php endif; ?>

    <!-- H1タイトル -->
    <h1 style="font-size:clamp(1.3rem,2.6vw,1.75rem);font-weight:800;color:#1a1a1a;line-height:1.4;margin:0 0 0.8rem;"><?php the_title(); ?></h1>

    <!-- メタ情報 + シェア -->
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:0.5rem;color:#6B7280;font-size:12px;margin-bottom:1.2rem;">
      <span style="background:#f0f7f2;border:1px solid #D1E7D9;border-radius:8px;padding:4px 10px;display:inline-flex;align-items:center;gap:4px;">📅 <?php echo get_the_date( 'Y年m月d日' ); ?></span>
      <span style="background:#f0f7f2;border:1px solid #D1E7D9;border-radius:8px;padding:4px 10px;display:inline-flex;align-items:center;gap:4px;">⏱ 約<?php echo esc_html( $read_min ); ?>分</span>
      <span style="background:#f0f7f2;border:1px solid #D1E7D9;border-radius:8px;padding:4px 10px;display:inline-flex;align-items:center;gap:4px;">✍️ <?php echo esc_html( get_the_author() ); ?></span>
      <span style="margin-left:auto;display:flex;gap:6px;">
        <a href="https://twitter.com/intent/tweet?text=<?php echo urlencode( get_the_title() ); ?>&url=<?php echo urlencode( get_permalink() ); ?>"
           target="_blank" rel="noopener"
           style="display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:6px;background:#000;color:#fff;text-decoration:none;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=<?php echo urlencode( get_permalink() ); ?>"
           target="_blank" rel="noopener"
           style="display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:6px;background:#1877f2;color:#fff;text-decoration:none;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        </a>
        <a href="https://line.me/R/msg/text/?<?php echo urlencode( get_the_title() . ' ' . get_permalink() ); ?>"
           target="_blank" rel="noopener"
           style="display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:6px;background:#06C755;color:#fff;text-decoration:none;font-size:11px;font-weight:700;">
          LINE
        </a>
      </span>
    </div>

    <!-- AI要約ボックス（記事本文に [hj_summary] がない場合のみ表示） -->
    <?php
    $has_shortcode_summary = has_shortcode( get_the_content(), 'hj_summary' );
    if ( $excerpt && ! $has_shortcode_summary ) :
    ?>
    <div class="hj-summary-box mb-6">
      <div class="hj-summary-box__header">
        <span>🤖 AI要約</span>
      </div>
      <div class="hj-summary-box__body">
        <?php echo esc_html( $excerpt ); ?>
      </div>
    </div>
    <?php endif; ?>

    <!-- AI要約直下CTA: 記事テーマに合った補助金へ -->
    <?php
    $cats_for_cta = $cats ? $cats[0]->name : '';
    $cta_subsidy_url = home_url( '/subsidies/' );
    // カテゴリから関連補助金URLを推定
    if ( $cats_for_cta ) {
        $cat_type_map = array(
            '業種別補助金'  => '?industry=',
            '都道府県別補助金' => '',
            '目的別補助金'  => '?purpose=',
            '助成金ガイド'  => '?type=joseikin',
            '申請ガイド'    => '',
        );
        foreach ( $cat_type_map as $c => $p ) {
            if ( strpos( $cats_for_cta, $c ) !== false ) {
                $cta_subsidy_url = home_url( '/subsidies/' . $p );
                break;
            }
        }
    }
    ?>
    <div style="margin:0 0 1.5rem;padding:1.2rem 1.5rem;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1.5px solid #86efac;border-radius:1rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.75rem;">
      <div>
        <p style="font-size:13px;font-weight:800;color:#15803d;margin:0 0 3px;">💰 この記事に関連する補助金を探す</p>
        <p style="font-size:12px;color:#166534;margin:0;">最新の募集情報・上限額・補助率をまとめて確認</p>
      </div>
      <a href="<?php echo esc_url( $cta_subsidy_url ); ?>"
         style="display:inline-flex;align-items:center;gap:6px;background:#1A6B3C;color:#fff;font-size:13px;font-weight:700;padding:8px 18px;border-radius:8px;text-decoration:none;flex-shrink:0;white-space:nowrap;">
        補助金を探す →
      </a>
    </div>

    <!-- 記事本文 -->
    <article class="post-content">
      <?php the_content(); ?>
    </article>

    <!-- 記事末尾CTA: 補助金一覧 -->
    <div class="hj-auto-cta" style="margin-top:2rem;">
      <p class="hj-auto-cta__title">💰 あなたに最適な補助金を今すぐ確認</p>
      <p class="hj-auto-cta__desc">補助金now では<?php echo esc_html( number_format( wp_count_posts('subsidies')->publish ) ); ?>件以上の補助金・助成金を無料で検索できます。</p>
      <a href="<?php echo esc_url( home_url( '/subsidies/' ) ); ?>" class="hj-auto-cta__btn">補助金ディレクトリを見る →</a>
    </div>

    <!-- 記事末尾CTA: 申請サポート -->
    <div class="hj-auto-cta" style="background:linear-gradient(135deg,#1A56DB,#1648C0);margin-top:1rem;">
      <p class="hj-auto-cta__title">📋 補助金申請のプロに無料相談</p>
      <p class="hj-auto-cta__desc">申請書類の作成から採択まで、専門家がサポートします</p>
      <a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>" class="hj-auto-cta__btn">無料相談してみる →</a>
    </div>

    <!-- タグ -->
    <?php if ( $tags ) : ?>
    <div class="mt-8 pt-6 border-t border-hj-border">
      <p style="font-size:13.5px;" class="font-bold text-hj-muted mb-3">タグ:</p>
      <div class="flex flex-wrap gap-2">
        <?php
        $tag_colors = array( '#1A6B3C', '#1A56DB', '#F59E0B', '#10B981', '#EF4444', '#06B6D4', '#8B5CF6', '#F97316', '#6366F1', '#EC4899' );
        foreach ( $tags as $tag ) :
          $tc = $tag_colors[ abs( crc32( $tag->name ) ) % count( $tag_colors ) ];
        ?>
          <a href="<?php echo esc_url( get_tag_link( $tag->term_id ) ); ?>"
             class="inline-flex items-center font-bold px-4 py-2 rounded-full no-underline transition-all hover:opacity-80"
             style="font-size:12px;color:<?php echo $tc; ?>;background:<?php echo $tc; ?>12;border:1px solid <?php echo $tc; ?>30;">
            #<?php echo esc_html( $tag->name ); ?>
          </a>
        <?php endforeach; ?>
      </div>
    </div>
    <?php endif; ?>

    <!-- 著者プロフィール -->
    <div class="mt-8 pt-6 border-t border-hj-border">
      <div class="bg-hj-hero rounded-2xl p-6 flex items-start gap-5">
        <div class="flex-shrink-0">
          <?php echo get_avatar( $author_id, 72, '', '', array( 'class' => 'rounded-2xl' ) ); ?>
        </div>
        <div>
          <p style="font-size:12px;" class="font-bold text-hj-muted mb-1">著者</p>
          <p style="font-size:16px;" class="font-black text-hj-dark mb-2"><?php echo esc_html( get_the_author() ); ?></p>
          <?php $bio = get_the_author_meta( 'description' ); if ( $bio ) : ?>
            <p style="font-size:13px;" class="text-hj-muted leading-relaxed"><?php echo esc_html( $bio ); ?></p>
          <?php endif; ?>
        </div>
      </div>
    </div>

    </div><!-- /.bg-white 白カード閉じ -->

    <!-- 前後の記事 -->
    <div class="mt-8 pt-6 border-t border-hj-border grid grid-cols-2 gap-4">
      <?php $prev = get_previous_post(); if ( $prev ) : ?>
        <a href="<?php echo esc_url( get_permalink( $prev->ID ) ); ?>" class="article-card block no-underline group">
          <div class="article-card__body">
            <p style="font-size:12px;" class="font-bold text-hj-muted mb-2">← 前の記事</p>
            <p class="article-card__title" style="font-size:13px;"><?php echo esc_html( $prev->post_title ); ?></p>
          </div>
        </a>
      <?php else : ?><div></div><?php endif; ?>
      <?php $next = get_next_post(); if ( $next ) : ?>
        <a href="<?php echo esc_url( get_permalink( $next->ID ) ); ?>" class="article-card block no-underline group text-right">
          <div class="article-card__body">
            <p style="font-size:12px;" class="font-bold text-hj-muted mb-2">次の記事 →</p>
            <p class="article-card__title" style="font-size:13px;"><?php echo esc_html( $next->post_title ); ?></p>
          </div>
        </a>
      <?php endif; ?>
    </div>

    <!-- 関連補助金カード（ランダム4件） -->
    <?php
    $related_sub = new WP_Query( array( 'post_type' => 'subsidies', 'posts_per_page' => 4, 'orderby' => 'rand' ) );
    if ( $related_sub->have_posts() ) :
    ?>
    <div class="mt-8">
      <h2 class="text-2xl font-black text-hj-dark mb-5">💰 関連補助金</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <?php while ( $related_sub->have_posts() ) : $related_sub->the_post();
          $rs_id     = get_the_ID();
          $rs_status = get_post_meta( $rs_id, 'hj_status', true );
          $rs_amount = get_post_meta( $rs_id, 'hj_amount_max', true );
          $rs_agency = get_post_meta( $rs_id, 'hj_agency', true );
        ?>
        <a href="<?php the_permalink(); ?>" class="subsidy-card no-underline group">
          <div class="flex items-center justify-between mb-2">
            <?php echo hjnavi_status_badge( $rs_status ); ?>
          </div>
          <p class="font-black text-hj-dark group-hover:text-hj-primary transition-colors mb-2 text-base leading-snug"><?php the_title(); ?></p>
          <?php if ( $rs_amount ) : ?>
            <p class="text-xl font-black text-hj-primary">最大 <?php echo esc_html( hjnavi_format_amount( $rs_amount ) ); ?></p>
          <?php endif; ?>
          <?php if ( $rs_agency ) : ?>
            <p class="text-xs text-hj-muted mt-1">🏛 <?php echo esc_html( $rs_agency ); ?></p>
          <?php endif; ?>
        </a>
        <?php endwhile; wp_reset_postdata(); ?>
      </div>
    </div>
    <?php endif; ?>

  </main>

  <!-- サイドバー -->
  <aside class="space-y-5">
    <?php include __DIR__ . '/parts/sidebar-common.php'; ?>
  </aside>

</div>

<?php endwhile; ?>

<?php include __DIR__ . '/parts/footer.php'; ?>
