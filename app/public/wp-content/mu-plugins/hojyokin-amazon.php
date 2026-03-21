<?php
/**
 * 補助金ナビ Amazon アソシエイト統合
 * StoreID: paramore416-22
 *
 * Amazon検索アフィリエイトリンク（API不要・確実に表示）
 * 記事末尾・ディレクトリページ・サイドバーの3箇所に自動挿入
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'HJ_AMAZON_TAG', 'paramore416-22' );

/* ============================================================
   CSS
   ============================================================ */
add_action( 'wp_head', function () {
	?>
<style id="hj-amazon-css">
/* 記事末尾・ディレクトリ用 */
.hj-amazon-box {
  margin: 2rem 0;
  border: 1px solid #FFD580;
  border-radius: 12px;
  background: linear-gradient(135deg, #fffdf0, #fff8e7);
  padding: 20px;
}
.hj-amazon-box__title {
  font-size: 15px; font-weight: 700; color: #92400e;
  margin-bottom: 14px; display: flex; align-items: center; gap: 6px;
}
.hj-amazon-box__books {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.hj-amazon-book-card {
  display: flex; flex-direction: column; align-items: center;
  background: #fff; border: 1px solid #e5e7eb; border-radius: 10px;
  padding: 14px 10px; text-decoration: none; color: inherit;
  transition: box-shadow .2s, transform .2s;
}
.hj-amazon-book-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,.1); transform: translateY(-2px);
  text-decoration: none; color: inherit;
}
.hj-amazon-book-card__icon {
  font-size: 40px; margin-bottom: 8px;
}
.hj-amazon-book-card__label {
  font-size: 12px; font-weight: 700; color: #111; text-align: center;
  line-height: 1.4; margin-bottom: 8px;
}
.hj-amazon-book-card__btn {
  font-size: 11px; font-weight: 700; color: #fff;
  background: #FF9900; border-radius: 6px; padding: 5px 14px;
  display: inline-flex; align-items: center; gap: 4px;
}
/* 検索リンクボタン */
.hj-amazon-search-link {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 14px; font-weight: 700; color: #111;
  background: #FF9900; border-radius: 8px; padding: 10px 22px;
  text-decoration: none; transition: background .2s;
}
.hj-amazon-search-link:hover { background: #e68a00; color: #111; text-decoration: none; }
/* サイドバー */
.hj-amazon-sidebar-wrap {
  background: #fffdf0; border: 1px solid #FFD580;
  border-radius: 10px; padding: 14px 16px; margin-bottom: 1.5rem;
}
.hj-amazon-sidebar-wrap__title {
  font-size: 13px; font-weight: 700; color: #92400e;
  margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #FFD580;
  display: flex; align-items: center; gap: 6px;
}
.hj-amazon-sidebar-wrap__list { list-style: none; padding: 0; margin: 0 0 12px; }
.hj-amazon-sidebar-wrap__list li { margin-bottom: 8px; }
.hj-amazon-sidebar-wrap__list a {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: #111; text-decoration: none;
  padding: 8px 10px; border-radius: 8px; background: #fff;
  border: 1px solid #e5e7eb; transition: background .2s;
}
.hj-amazon-sidebar-wrap__list a:hover { background: #fff8e7; text-decoration: none; color: #111; }
</style>
	<?php
} );

/* ============================================================
   キーワード決定ロジック
   ============================================================ */
function hjnavi_amazon_keyword( $hint = '' ) {
	$map = array(
		'IT導入'    => 'IT導入補助金 申請',
		'ものづくり' => 'ものづくり補助金 採択',
		'持続化'    => '小規模事業者持続化補助金',
		'創業'      => '起業 補助金 申請',
		'DX'        => 'DX 補助金 IT化',
		'省エネ'    => '省エネ 補助金 申請',
		'雇用'      => '雇用 助成金 申請',
		'農業'      => '農業 補助金 助成金',
	);
	foreach ( $map as $k => $v ) {
		if ( mb_strpos( $hint, $k ) !== false ) return $v;
	}
	return '補助金 申請 おすすめ';
}

/* ============================================================
   Amazon検索URL生成
   ============================================================ */
function hjnavi_amazon_search_url( $keyword ) {
	return 'https://www.amazon.co.jp/s?k=' . rawurlencode( $keyword ) . '&tag=' . HJ_AMAZON_TAG;
}

/* ============================================================
   おすすめ書籍データ（ジャンル別）
   ============================================================ */
function hjnavi_amazon_book_suggestions( $keyword ) {
	$books = array(
		array(
			'icon'  => '📘',
			'label' => '補助金の基礎知識',
			'query' => '補助金 助成金 入門',
		),
		array(
			'icon'  => '📝',
			'label' => '申請書の書き方',
			'query' => '補助金 申請書 書き方',
		),
		array(
			'icon'  => '💰',
			'label' => '資金調達ガイド',
			'query' => '中小企業 資金調達 補助金',
		),
		array(
			'icon'  => '📊',
			'label' => '事業計画書の作り方',
			'query' => '事業計画書 作り方 テンプレート',
		),
	);

	/* キーワードに応じてカスタマイズ */
	if ( mb_strpos( $keyword, 'IT' ) !== false || mb_strpos( $keyword, 'DX' ) !== false ) {
		$books[0] = array( 'icon' => '💻', 'label' => 'IT導入・DX推進', 'query' => 'IT導入補助金 DX推進 ガイド' );
	} elseif ( mb_strpos( $keyword, 'ものづくり' ) !== false ) {
		$books[0] = array( 'icon' => '🏭', 'label' => 'ものづくり補助金', 'query' => 'ものづくり補助金 採択 ガイド' );
	} elseif ( mb_strpos( $keyword, '創業' ) !== false || mb_strpos( $keyword, '起業' ) !== false ) {
		$books[0] = array( 'icon' => '🚀', 'label' => '起業・創業ガイド', 'query' => '起業 創業 補助金 助成金' );
	}

	return $books;
}

/* ============================================================
   メイン表示関数（記事末尾・ディレクトリページ用）
   モーションウィジェット + フォールバックリンクカード
   ============================================================ */
function hjnavi_amazon_native_html( $keyword = '補助金 申請', $section_title = '📚 関連書籍・参考資料', $rows = 1 ) {
	static $widget_count = 0;
	$widget_count++;
	$widget_id = 'hj-amz-widget-' . $widget_count;

	$books = hjnavi_amazon_book_suggestions( $keyword );
	$search_url = hjnavi_amazon_search_url( $keyword );

	ob_start();
	?>
<div class="hj-amazon-box">
  <?php if ( $section_title ) : ?>
  <div class="hj-amazon-box__title"><?php echo esc_html( $section_title ); ?></div>
  <?php endif; ?>

  <!-- Amazon モーションウィジェット -->
  <div id="<?php echo esc_attr( $widget_id ); ?>" class="hj-amazon-widget-area" style="min-height:250px;margin-bottom:12px;">
    <script type="text/javascript">
    amzn_assoc_ad_type = "responsive_search_widget";
    amzn_assoc_tracking_id = "<?php echo esc_js( HJ_AMAZON_TAG ); ?>";
    amzn_assoc_marketplace = "amazon";
    amzn_assoc_region = "JP";
    amzn_assoc_placement = "";
    amzn_assoc_search_type = "search_widget";
    amzn_assoc_width = "auto";
    amzn_assoc_height = "auto";
    amzn_assoc_default_search_category = "All";
    amzn_assoc_default_search_key = "<?php echo esc_js( $keyword ); ?>";
    amzn_assoc_theme = "light";
    amzn_assoc_bg_color = "FFFFFF";
    </script>
    <script src="//ws-fe.amazon-adsystem.com/widgets/q?ServiceVersion=20070822&Operation=GetScript&ID=OneJS&WS=1&MarketPlace=JP"></script>
  </div>

  <!-- フォールバック: ウィジェット未読み込み時のリンクカード -->
  <div id="<?php echo esc_attr( $widget_id ); ?>-fallback" class="hj-amazon-box__books">
    <?php foreach ( $books as $book ) : ?>
    <a href="<?php echo esc_url( hjnavi_amazon_search_url( $book['query'] ) ); ?>" class="hj-amazon-book-card" target="_blank" rel="noopener nofollow">
      <span class="hj-amazon-book-card__icon"><?php echo $book['icon']; ?></span>
      <span class="hj-amazon-book-card__label"><?php echo esc_html( $book['label'] ); ?></span>
      <span class="hj-amazon-book-card__btn">Amazonで探す</span>
    </a>
    <?php endforeach; ?>
  </div>
  <script>
  (function(){
    var w = document.getElementById('<?php echo esc_js( $widget_id ); ?>');
    var f = document.getElementById('<?php echo esc_js( $widget_id ); ?>-fallback');
    /* ウィジェットが読み込まれたらフォールバックを非表示 */
    setTimeout(function(){
      if (w && w.querySelector('iframe, .amzn-assoc-ad')) {
        if (f) f.style.display = 'none';
      } else {
        /* ウィジェットが空なら非表示にしてフォールバックを表示 */
        if (w) w.style.display = 'none';
      }
    }, 3000);
  })();
  </script>

  <div style="text-align:center;margin-top:12px;">
    <a href="<?php echo esc_url( $search_url ); ?>" class="hj-amazon-search-link" target="_blank" rel="noopener nofollow">
      🛒 「<?php echo esc_html( $keyword ); ?>」をAmazonで検索
    </a>
  </div>
</div>
	<?php
	return ob_get_clean();
}

/* ============================================================
   サイドバー用HTML（コンパクト版）
   ============================================================ */
function hjnavi_amazon_sidebar_html( $keyword = '補助金 申請 おすすめ', $count_unused = 4 ) {
	static $sb_count = 0;
	$sb_count++;
	$sb_id = 'hj-amz-sb-' . $sb_count;

	$items = array(
		array( 'icon' => '📘', 'label' => '補助金 入門書',       'query' => '補助金 助成金 入門' ),
		array( 'icon' => '📝', 'label' => '申請書の書き方',      'query' => '補助金 申請書 書き方' ),
		array( 'icon' => '💰', 'label' => '資金調達ガイド',      'query' => '中小企業 資金調達' ),
		array( 'icon' => '📊', 'label' => '事業計画テンプレート', 'query' => '事業計画書 作り方' ),
	);

	ob_start();
	?>
<div class="hj-amazon-sidebar-wrap">
  <div class="hj-amazon-sidebar-wrap__title">📚 関連書籍</div>

  <!-- サイドバー用モーションウィジェット -->
  <div id="<?php echo esc_attr( $sb_id ); ?>" style="margin-bottom:10px;">
    <script type="text/javascript">
    amzn_assoc_ad_type = "responsive_search_widget";
    amzn_assoc_tracking_id = "<?php echo esc_js( HJ_AMAZON_TAG ); ?>";
    amzn_assoc_marketplace = "amazon";
    amzn_assoc_region = "JP";
    amzn_assoc_placement = "";
    amzn_assoc_search_type = "search_widget";
    amzn_assoc_width = "auto";
    amzn_assoc_height = "auto";
    amzn_assoc_default_search_category = "All";
    amzn_assoc_default_search_key = "<?php echo esc_js( $keyword ); ?>";
    amzn_assoc_theme = "light";
    amzn_assoc_bg_color = "FFFFFF";
    </script>
    <script src="//ws-fe.amazon-adsystem.com/widgets/q?ServiceVersion=20070822&Operation=GetScript&ID=OneJS&WS=1&MarketPlace=JP"></script>
  </div>

  <!-- フォールバックリンク -->
  <ul id="<?php echo esc_attr( $sb_id ); ?>-fallback" class="hj-amazon-sidebar-wrap__list">
    <?php foreach ( $items as $item ) : ?>
    <li>
      <a href="<?php echo esc_url( hjnavi_amazon_search_url( $item['query'] ) ); ?>" target="_blank" rel="noopener nofollow">
        <span><?php echo $item['icon']; ?></span>
        <span><?php echo esc_html( $item['label'] ); ?></span>
      </a>
    </li>
    <?php endforeach; ?>
  </ul>
  <script>
  (function(){
    var w = document.getElementById('<?php echo esc_js( $sb_id ); ?>');
    var f = document.getElementById('<?php echo esc_js( $sb_id ); ?>-fallback');
    setTimeout(function(){
      if (w && w.querySelector('iframe, .amzn-assoc-ad')) {
        if (f) f.style.display = 'none';
      } else {
        if (w) w.style.display = 'none';
      }
    }, 3000);
  })();
  </script>

  <div style="text-align:center;">
    <a href="<?php echo esc_url( hjnavi_amazon_search_url( $keyword ) ); ?>" class="hj-amazon-search-link" target="_blank" rel="noopener nofollow" style="font-size:12px;padding:8px 16px;">
      🛒 Amazonで書籍を探す
    </a>
  </div>
</div>
	<?php
	return ob_get_clean();
}

/* ============================================================
   後方互換
   ============================================================ */
function hjnavi_amazon_cards_html( $keyword, $count = 4, $title = '📚 関連書籍・参考資料' ) {
	return hjnavi_amazon_native_html( $keyword, $title, 1 );
}

/* ============================================================
   記事末尾への自動挿入（single-post / single-subsidies）
   ============================================================ */
add_filter( 'the_content', function ( $content ) {
	if ( ! is_singular( array( 'post', 'subsidies' ) ) || ! in_the_loop() || ! is_main_query() ) {
		return $content;
	}
	$post    = get_post();
	$keyword = hjnavi_amazon_keyword( $post ? $post->post_title : '' );
	return $content . hjnavi_amazon_native_html( $keyword, '📚 関連書籍・参考資料', 1 );
} );

/* ============================================================
   ショートコード: [hj_amazon_search keyword="..." title="..."]
   ============================================================ */
add_shortcode( 'hj_amazon_search', function ( $atts ) {
	$atts = shortcode_atts( array(
		'keyword' => '補助金 申請',
		'title'   => '関連書籍をAmazonで探す',
		'count'   => 4,
	), $atts, 'hj_amazon_search' );
	return hjnavi_amazon_native_html( $atts['keyword'], '📚 ' . $atts['title'], 1 );
} );

/* ============================================================
   ショートコード: [hj_amazon_book asin="..." title="..." author="..." img="..."]
   ============================================================ */
add_shortcode( 'hj_amazon_book', function ( $atts ) {
	$atts = shortcode_atts( array(
		'asin'   => '',
		'title'  => '',
		'author' => '',
		'img'    => '',
	), $atts, 'hj_amazon_book' );

	if ( empty( $atts['asin'] ) ) return '';
	$url = 'https://www.amazon.co.jp/dp/' . esc_attr( $atts['asin'] ) . '?tag=' . HJ_AMAZON_TAG;

	ob_start();
	?>
<a href="<?php echo esc_url( $url ); ?>" style="display:flex;gap:12px;align-items:flex-start;background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:14px;text-decoration:none;color:inherit;margin:1.5rem 0;" target="_blank" rel="noopener nofollow">
  <?php if ( $atts['img'] ) : ?>
    <img src="<?php echo esc_url( $atts['img'] ); ?>" alt="<?php echo esc_attr( $atts['title'] ); ?>" style="width:64px;min-width:64px;height:auto;border-radius:4px;" loading="lazy">
  <?php else : ?>
    <div style="width:64px;min-width:64px;height:84px;background:#f3f4f6;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:28px;">📚</div>
  <?php endif; ?>
  <div>
    <div style="font-size:10px;font-weight:700;color:#FF9900;background:#fff8ee;border:1px solid #FFD580;border-radius:4px;padding:2px 8px;display:inline-block;margin-bottom:6px;">Amazon アソシエイト</div>
    <?php if ( $atts['title'] ) : ?>
      <div style="font-size:13px;font-weight:700;color:#111;line-height:1.5;margin-bottom:4px;"><?php echo esc_html( $atts['title'] ); ?></div>
    <?php endif; ?>
    <?php if ( $atts['author'] ) : ?>
      <div style="font-size:11.5px;color:#6b7280;margin-bottom:6px;"><?php echo esc_html( $atts['author'] ); ?></div>
    <?php endif; ?>
    <span style="display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:700;color:#fff;background:#FF9900;border-radius:6px;padding:5px 14px;">🛒 Amazonで見る</span>
  </div>
</a>
	<?php
	return ob_get_clean();
} );
