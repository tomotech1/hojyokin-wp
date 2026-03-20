<?php
/**
 * 補助金ナビ Article Widgets
 * 記事用ビジュアルウィジェット ショートコード集
 */
if ( ! defined( 'ABSPATH' ) ) exit;

/* ============================================================
   インラインCSS（wp_head で一度だけ出力）
   ============================================================ */
add_action( 'wp_head', function () {
	if ( ! is_singular( 'post' ) ) return;
	?>
<style id="hj-article-widgets-css">
/* ---- AI要約ボックス ---- */
.hj-summary-box {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #D1E7D9;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  margin-bottom: 1.75rem;
}
.hj-summary-box__header {
  background: #1A6B3C;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.hj-summary-box__body {
  background: #fafafa;
  padding: 16px 20px;
  font-size: 14.5px;
  line-height: 1.85;
  color: #374151;
}

/* ---- ポイントボックス ---- */
.hj-point-box {
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-left: 4px solid #F59E0B;
  border-radius: 10px;
  padding: 14px 18px;
  margin: 1.4rem 0;
  font-size: 13px;
  line-height: 1.9;
  color: #92400e;
  position: relative;
}
.hj-point-box::before {
  content: '✅ ポイント';
  display: block;
  font-size: 12px;
  font-weight: 800;
  color: #B45309;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: .04em;
}

/* ---- マーカー（インライン強調） ---- */
.hj-marker-yellow { background-color: #FFE066; padding: 0 3px; border-radius: 2px; }
.hj-marker-pink   { background-color: #FFB3D9; padding: 0 3px; border-radius: 2px; }
.hj-marker-blue   { background-color: #B3D9FF; padding: 0 3px; border-radius: 2px; }

/* ---- インフォボックス ---- */
.hj-infobox {
  border-radius: 10px;
  padding: 14px 18px;
  margin: 1.4rem 0;
  font-size: 13px;
  line-height: 1.9;
  border-left-width: 4px;
  border-left-style: solid;
}
.hj-infobox__title {
  font-size: 13px;
  font-weight: 800;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.hj-infobox--info    { background: #f0f7f2; border-color: #1A6B3C; color: #0f3d21; }
.hj-infobox--success { background: #f0fdf4; border-color: #16A34A; color: #14532d; }
.hj-infobox--warning { background: #fffbeb; border-color: #F59E0B; color: #92400e; }
.hj-infobox--danger  { background: #fff1f2; border-color: #EF4444; color: #7f1d1d; }

/* ---- CTAボタン ---- */
.hj-cta-wrap { text-align: center; margin: 1.6rem 0; }
.hj-cta-btn {
  display: inline-block;
  padding: 12px 28px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 800;
  text-decoration: none;
  color: #fff;
  transition: opacity .15s, transform .15s;
  box-shadow: 0 4px 14px rgba(0,0,0,.15);
}
.hj-cta-btn:hover { opacity: .88; transform: translateY(-2px); color: #fff; text-decoration: none; }
.hj-cta-btn--green { background: linear-gradient(135deg, #1A6B3C, #155830); }
.hj-cta-btn--amber { background: linear-gradient(135deg, #F59E0B, #D97706); }
.hj-cta-btn--blue  { background: linear-gradient(135deg, #1A56DB, #1648C0); }

/* ---- 関連補助金カード ---- */
.hj-related-subsidies { margin: 1.8rem 0; }
.hj-related-subsidies__title {
  font-size: 15px;
  font-weight: 800;
  color: #111;
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 2px solid #D1E7D9;
}
.hj-rs-card {
  background: #fff;
  border: 1px solid #D1E7D9;
  border-radius: 12px;
  padding: 12px 16px;
  text-decoration: none;
  display: block;
  transition: transform .15s, box-shadow .15s;
  margin-bottom: 8px;
}
.hj-rs-card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(26,107,60,.12); text-decoration: none; }
.hj-rs-card__name { font-size: 13px; font-weight: 800; color: #111827; margin-bottom: 4px; }
.hj-rs-card__meta { font-size: 12px; color: #6B7280; display: flex; gap: 8px; flex-wrap: wrap; }
.hj-rs-card__amount { color: #1A6B3C; font-weight: 700; }
.hj-rs-card__status-active  { color: #1A6B3C; }
.hj-rs-card__status-planned { color: #1A56DB; }
.hj-rs-card__status-closed  { color: #9CA3AF; }

/* ---- アンケート ---- */
.hj-poll-widget {
  background: #f9fafb;
  border: 1px solid #D1E7D9;
  border-radius: 14px;
  padding: 18px;
  margin: 1.8rem 0;
}
.hj-poll-widget__question {
  font-size: 14px;
  font-weight: 800;
  color: #111;
  margin-bottom: 12px;
}
.hj-poll-option {
  display: block;
  width: 100%;
  text-align: left;
  background: #fff;
  border: 2px solid #D1E7D9;
  border-radius: 8px;
  padding: 9px 14px;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #374151;
  cursor: pointer;
  transition: border-color .15s, background .15s;
}
.hj-poll-option:hover:not(:disabled) { border-color: #1A6B3C; background: #f0f7f2; }
.hj-poll-option:disabled { cursor: default; }
.hj-poll-result { margin-top: 4px; }
.hj-poll-result__row { margin-bottom: 8px; font-size: 12px; color: #374151; }
.hj-poll-result__label { display: flex; justify-content: space-between; margin-bottom: 3px; font-weight: 700; }
.hj-poll-result__bar-wrap { background: #e5e7eb; border-radius: 999px; height: 8px; overflow: hidden; }
.hj-poll-result__bar { height: 8px; border-radius: 999px; background: linear-gradient(90deg, #1A6B3C, #2d9150); transition: width .4s ease; }
.hj-poll-result__bar--voted { background: linear-gradient(90deg, #F59E0B, #D97706); }
.hj-poll-total { font-size: 11px; color: #9CA3AF; margin-top: 8px; text-align: right; }

/* ---- レーティング ---- */
.hj-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 1.2rem 0;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 13px;
}
.hj-rating__label { font-weight: 800; color: #92400e; flex-shrink: 0; }
.hj-rating__stars { color: #F59E0B; font-size: 18px; letter-spacing: 2px; line-height: 1; }
.hj-rating__score { font-size: 16px; font-weight: 900; color: #B45309; margin-left: 4px; }

/* ---- 長所短所 ---- */
.hj-pros-cons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 1.6rem 0;
}
@media (max-width: 560px) {
  .hj-pros-cons { grid-template-columns: 1fr; }
}
.hj-pros, .hj-cons {
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 13px;
}
.hj-pros { background: #f0fdf4; border: 1px solid #86efac; }
.hj-cons { background: #fff1f2; border: 1px solid #fca5a5; }
.hj-pros__title { font-size: 13px; font-weight: 800; color: #15803d; margin-bottom: 8px; }
.hj-cons__title { font-size: 13px; font-weight: 800; color: #b91c1c; margin-bottom: 8px; }
.hj-pros ul, .hj-cons ul { margin: 0; padding: 0; list-style: none; }
.hj-pros ul li { padding: 3px 0 3px 18px; position: relative; color: #166534; line-height: 1.7; font-size: 13px; }
.hj-pros ul li::before { content: '✓'; position: absolute; left: 0; color: #16A34A; font-weight: 900; }
.hj-cons ul li { padding: 3px 0 3px 18px; position: relative; color: #991b1b; line-height: 1.7; font-size: 13px; }
.hj-cons ul li::before { content: '✗'; position: absolute; left: 0; color: #EF4444; font-weight: 900; }
</style>
	<?php
}, 20 );

/* ============================================================
   ショートコード登録
   ============================================================ */
add_action( 'init', function () {

	/* ---------- [hj_summary] AI要約ボックス ---------- */
	add_shortcode( 'hj_summary', function ( $atts, $content = null ) {
		global $post;
		$atts = shortcode_atts( array( 'text' => '' ), $atts, 'hj_summary' );
		// get_the_excerpt() はthe_contentフィルタを再帰呼出しするため使用禁止
		// post_excerptフィールドを直接取得する
		$text = ! empty( $atts['text'] ) ? $atts['text'] : '';
		if ( ! $text && $post ) {
			$text = $post->post_excerpt ?: '';
		}
		if ( ! $text ) return '';
		ob_start();
		?>
		<div class="hj-summary-box">
			<div class="hj-summary-box__header">🤖 AIによる要約</div>
			<div class="hj-summary-box__body"><?php echo esc_html( $text ); ?></div>
		</div>
		<?php
		return ob_get_clean();
	} );

	/* ---------- [hj_point]...[/hj_point] ポイントボックス ---------- */
	add_shortcode( 'hj_point', function ( $atts, $content = null ) {
		if ( is_null( $content ) ) return '';
		return '<div class="hj-point-box">' . wp_kses_post( do_shortcode( $content ) ) . '</div>';
	} );

	/* ---------- [hj_marker color="yellow|pink|blue"]...[/hj_marker] ---------- */
	add_shortcode( 'hj_marker', function ( $atts, $content = null ) {
		if ( is_null( $content ) ) return '';
		$atts  = shortcode_atts( array( 'color' => 'yellow' ), $atts, 'hj_marker' );
		$color = in_array( $atts['color'], array( 'yellow', 'pink', 'blue' ) ) ? $atts['color'] : 'yellow';
		return '<span class="hj-marker-' . esc_attr( $color ) . '">' . esc_html( $content ) . '</span>';
	} );

	/* ---------- [hj_infobox type="info|success|warning|danger" title="..." icon="..."]...[/hj_infobox] ---------- */
	add_shortcode( 'hj_infobox', function ( $atts, $content = null ) {
		if ( is_null( $content ) ) return '';
		$atts = shortcode_atts( array(
			'type'  => 'info',
			'title' => '',
			'icon'  => '',
		), $atts, 'hj_infobox' );
		$type          = in_array( $atts['type'], array( 'info', 'success', 'warning', 'danger' ) ) ? $atts['type'] : 'info';
		$default_icons = array( 'info' => 'ℹ️', 'success' => '✅', 'warning' => '⚠️', 'danger' => '🚨' );
		$icon          = ! empty( $atts['icon'] ) ? $atts['icon'] : $default_icons[ $type ];
		ob_start();
		?>
		<div class="hj-infobox hj-infobox--<?php echo esc_attr( $type ); ?>">
			<?php if ( $atts['title'] ) : ?>
				<div class="hj-infobox__title"><?php echo esc_html( $icon ); ?> <?php echo esc_html( $atts['title'] ); ?></div>
			<?php endif; ?>
			<?php echo wp_kses_post( do_shortcode( $content ) ); ?>
		</div>
		<?php
		return ob_get_clean();
	} );

	/* ---------- [hj_cta title="..." text="..." link="#" button="..." url="#" color="green|amber|blue"] ---------- */
	add_shortcode( 'hj_cta', function ( $atts ) {
		$atts = shortcode_atts( array(
			'title'  => '',
			'text'   => '',
			'link'   => '',
			'url'    => '',      // linkの別名
			'button' => '補助金一覧を見る →',
			'color'  => 'green',
		), $atts, 'hj_cta' );
		$color  = in_array( $atts['color'], array( 'green', 'amber', 'blue' ) ) ? $atts['color'] : 'green';
		$href   = $atts['link'] ?: $atts['url'] ?: '/subsidies/';
		$colors = array(
			'green' => array( 'bg' => 'linear-gradient(135deg,#1A6B3C,#155830)', 'btn' => '#F59E0B' ),
			'amber' => array( 'bg' => 'linear-gradient(135deg,#F59E0B,#D97706)', 'btn' => '#1A6B3C' ),
			'blue'  => array( 'bg' => 'linear-gradient(135deg,#1A56DB,#1648C0)', 'btn' => '#F59E0B' ),
		);
		$c = $colors[ $color ];
		ob_start();
		?>
		<div style="background:<?php echo esc_attr( $c['bg'] ); ?>;border-radius:14px;padding:1.4rem 1.6rem;margin:1.5rem 0;text-align:center;">
			<?php if ( $atts['title'] ) : ?>
			<p style="color:#fff;font-size:16px;font-weight:800;margin:0 0 0.4rem;"><?php echo esc_html( $atts['title'] ); ?></p>
			<?php endif; ?>
			<?php if ( $atts['text'] ) : ?>
			<p style="color:rgba(255,255,255,0.88);font-size:13px;margin:0 0 0.8rem;"><?php echo esc_html( $atts['text'] ); ?></p>
			<?php endif; ?>
			<a href="<?php echo esc_url( $href ); ?>"
			   style="display:inline-block;background:#fff;color:<?php echo esc_attr( $c['bg'] ); ?>;font-size:14px;font-weight:800;padding:0.55rem 1.6rem;border-radius:99px;text-decoration:none;">
				<?php echo esc_html( $atts['button'] ); ?>
			</a>
		</div>
		<?php
		return ob_get_clean();
	} );

	/* ---------- [hj_related_subsidies count="4" status="募集中"] 関連補助金カード ---------- */
	add_shortcode( 'hj_related_subsidies', function ( $atts ) {
		$atts = shortcode_atts( array(
			'count'  => 4,
			'status' => '',
		), $atts, 'hj_related_subsidies' );

		$query_args = array(
			'post_type'      => 'subsidies',
			'posts_per_page' => intval( $atts['count'] ),
			'orderby'        => 'rand',
			'post_status'    => 'publish',
		);

		// ステータスフィルタ
		if ( ! empty( $atts['status'] ) ) {
			$query_args['meta_query'] = array(
				array(
					'key'   => 'hj_status',
					'value' => sanitize_text_field( $atts['status'] ),
				),
			);
		}

		$q = new WP_Query( $query_args );
		if ( ! $q->have_posts() ) return '';

		ob_start();
		?>
		<div class="hj-related-subsidies">
			<div class="hj-related-subsidies__title">💰 関連補助金</div>
			<?php while ( $q->have_posts() ) : $q->the_post();
				$sid    = get_the_ID();
				$status = get_post_meta( $sid, 'hj_status', true );
				$amount = get_post_meta( $sid, 'hj_amount_max', true );
				$status_class = '';
				if ( $status === '募集中' ) $status_class = 'hj-rs-card__status-active';
				elseif ( $status === '予定' ) $status_class = 'hj-rs-card__status-planned';
				else $status_class = 'hj-rs-card__status-closed';
			?>
			<a href="<?php the_permalink(); ?>" class="hj-rs-card">
				<div class="hj-rs-card__name"><?php the_title(); ?></div>
				<div class="hj-rs-card__meta">
					<?php if ( $amount ) : ?>
						<span class="hj-rs-card__amount">最大 <?php echo esc_html( hjnavi_format_amount( $amount ) ); ?></span>
					<?php endif; ?>
					<?php if ( $status ) : ?>
						<span class="<?php echo esc_attr( $status_class ); ?>"><?php echo esc_html( $status ); ?></span>
					<?php endif; ?>
				</div>
			</a>
			<?php endwhile; wp_reset_postdata(); ?>
		</div>
		<?php
		return ob_get_clean();
	} );

	/* ---------- [hj_poll question="..." options="A,B,C,D"] アンケート ---------- */
	add_shortcode( 'hj_poll', function ( $atts ) {
		global $post;
		$atts = shortcode_atts( array(
			'question' => 'あなたが利用した補助金は？',
			'options'  => 'ものづくり補助金,事業再構築補助金,IT導入補助金,その他',
		), $atts, 'hj_poll' );

		$options = array_map( 'trim', explode( ',', $atts['options'] ) );
		$options = array_filter( $options );
		if ( empty( $options ) ) return '';

		$pid      = $post ? $post->ID : 0;
		$poll_id  = 'hj_poll_' . $pid . '_' . substr( md5( $atts['question'] ), 0, 8 );
		$opt_json = wp_json_encode( array_values( $options ) );

		ob_start();
		?>
		<div class="hj-poll-widget" id="<?php echo esc_attr( $poll_id ); ?>">
			<div class="hj-poll-widget__question"><?php echo esc_html( $atts['question'] ); ?></div>
			<div class="hj-poll-buttons">
				<?php foreach ( $options as $i => $opt ) : ?>
					<button class="hj-poll-option"
					        data-poll="<?php echo esc_attr( $poll_id ); ?>"
					        data-idx="<?php echo intval( $i ); ?>">
						<?php echo esc_html( $opt ); ?>
					</button>
				<?php endforeach; ?>
			</div>
			<div class="hj-poll-result" style="display:none"></div>
		</div>
		<script>
		(function(){
		  var POLL_ID = <?php echo wp_json_encode( $poll_id ); ?>;
		  var OPTIONS = <?php echo $opt_json; ?>;
		  var wrap    = document.getElementById(POLL_ID);
		  if(!wrap) return;

		  function getVotes(){ return JSON.parse(localStorage.getItem(POLL_ID+'_votes')||'null')||OPTIONS.map(function(){return 0;}); }
		  function setVotes(v){ localStorage.setItem(POLL_ID+'_votes', JSON.stringify(v)); }
		  function getVoted(){ return localStorage.getItem(POLL_ID); }
		  function setVoted(i){ localStorage.setItem(POLL_ID, i); }

		  function showResults(votedIdx){
		    var votes   = getVotes();
		    var total   = votes.reduce(function(a,b){return a+b;},0);
		    var buttons = wrap.querySelector('.hj-poll-buttons');
		    var results = wrap.querySelector('.hj-poll-result');
		    if(buttons) buttons.style.display='none';
		    results.innerHTML='';
		    results.style.display='block';
		    OPTIONS.forEach(function(opt,i){
		      var pct = total>0 ? Math.round(votes[i]/total*100) : 0;
		      var row = document.createElement('div');
		      row.className='hj-poll-result__row';
		      row.innerHTML='<div class="hj-poll-result__label"><span>'+(i===votedIdx?'✓ ':'')+opt+'</span><span>'+pct+'%</span></div>'
		        +'<div class="hj-poll-result__bar-wrap"><div class="hj-poll-result__bar'+(i===votedIdx?' hj-poll-result__bar--voted':'')+'" style="width:'+pct+'%"></div></div>';
		      results.appendChild(row);
		    });
		    var tot = document.createElement('div');
		    tot.className='hj-poll-total';
		    tot.textContent='合計 '+total+' 票';
		    results.appendChild(tot);
		  }

		  var voted = getVoted();
		  if(voted!==null){ showResults(parseInt(voted,10)); return; }

		  wrap.querySelectorAll('.hj-poll-option').forEach(function(btn){
		    btn.addEventListener('click', function(){
		      var idx   = parseInt(this.getAttribute('data-idx'),10);
		      var votes = getVotes();
		      votes[idx]++;
		      setVotes(votes);
		      setVoted(idx);
		      showResults(idx);
		    });
		  });
		})();
		</script>
		<?php
		return ob_get_clean();
	} );

	/* ---------- [hj_rating label="..." score="4.5"] 星評価 ---------- */
	add_shortcode( 'hj_rating', function ( $atts ) {
		$atts  = shortcode_atts( array( 'label' => '総合評価', 'score' => '4.0' ), $atts, 'hj_rating' );
		$score = floatval( $atts['score'] );
		$score = min( 5, max( 0, $score ) );
		$stars = '';
		for ( $i = 1; $i <= 5; $i++ ) {
			if ( $score >= $i ) $stars .= '★';
			elseif ( $score >= $i - 0.5 ) $stars .= '⭐';
			else $stars .= '☆';
		}
		ob_start();
		?>
		<div class="hj-rating">
			<span class="hj-rating__label"><?php echo esc_html( $atts['label'] ); ?></span>
			<span class="hj-rating__stars"><?php echo esc_html( $stars ); ?></span>
			<span class="hj-rating__score"><?php echo esc_html( number_format( $score, 1 ) ); ?></span>
		</div>
		<?php
		return ob_get_clean();
	} );

	/* ---------- [hj_pros_cons pros="A,B" cons="C,D"] 長所短所 ---------- */
	add_shortcode( 'hj_pros_cons', function ( $atts ) {
		$atts = shortcode_atts( array( 'pros' => '', 'cons' => '' ), $atts, 'hj_pros_cons' );
		$pros = array_filter( array_map( 'trim', explode( ',', $atts['pros'] ) ) );
		$cons = array_filter( array_map( 'trim', explode( ',', $atts['cons'] ) ) );
		if ( empty( $pros ) && empty( $cons ) ) return '';
		ob_start();
		?>
		<div class="hj-pros-cons">
			<div class="hj-pros">
				<div class="hj-pros__title">👍 メリット</div>
				<ul>
					<?php foreach ( $pros as $p ) : ?>
						<li><?php echo esc_html( $p ); ?></li>
					<?php endforeach; ?>
				</ul>
			</div>
			<div class="hj-cons">
				<div class="hj-cons__title">👎 注意点</div>
				<ul>
					<?php foreach ( $cons as $c ) : ?>
						<li><?php echo esc_html( $c ); ?></li>
					<?php endforeach; ?>
				</ul>
			</div>
		</div>
		<?php
		return ob_get_clean();
	} );

} );

/* ============================================================
   関連補助金メタボックス（記事編集画面）
   ============================================================ */

/**
 * 記事に関連補助金を紐づけるメタボックスを追加する
 */
add_action( 'add_meta_boxes', function () {
	add_meta_box(
		'hjnavi_related_subsidies_box',
		'関連補助金',
		'hjnavi_render_related_subsidies_box',
		'post',
		'side',
		'default'
	);
} );

/**
 * 関連補助金メタボックスの描画
 */
function hjnavi_render_related_subsidies_box( $post ) {
	wp_nonce_field( 'hjnavi_save_related_subsidies', 'hjnavi_related_nonce' );

	$saved = get_post_meta( $post->ID, 'hj_related_subsidy_ids', true );
	$saved = $saved ? array_map( 'intval', explode( ',', $saved ) ) : array();

	// 補助金一覧取得（最大100件）
	$subsidies = get_posts( array(
		'post_type'      => 'subsidies',
		'posts_per_page' => 100,
		'orderby'        => 'title',
		'order'          => 'ASC',
		'post_status'    => 'publish',
	) );

	echo '<p style="font-size:12px;color:#666;margin-bottom:8px;">関連する補助金を選択してください（複数選択可）</p>';
	echo '<div style="max-height:200px;overflow-y:auto;border:1px solid #ddd;padding:8px;border-radius:4px;">';

	foreach ( $subsidies as $subsidy ) {
		$checked = in_array( $subsidy->ID, $saved ) ? 'checked' : '';
		echo '<label style="display:block;font-size:12px;margin-bottom:4px;cursor:pointer;">';
		echo '<input type="checkbox" name="hj_related_subsidy_ids[]" value="' . esc_attr( $subsidy->ID ) . '" ' . $checked . '> ';
		echo esc_html( $subsidy->post_title );
		echo '</label>';
	}

	echo '</div>';
}

/**
 * 関連補助金メタデータを保存する
 */
add_action( 'save_post_post', function ( $post_id ) {
	if ( ! isset( $_POST['hjnavi_related_nonce'] ) || ! wp_verify_nonce( $_POST['hjnavi_related_nonce'], 'hjnavi_save_related_subsidies' ) ) {
		return;
	}
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) return;
	if ( ! current_user_can( 'edit_post', $post_id ) ) return;

	if ( ! empty( $_POST['hj_related_subsidy_ids'] ) && is_array( $_POST['hj_related_subsidy_ids'] ) ) {
		$ids = array_map( 'absint', $_POST['hj_related_subsidy_ids'] );
		update_post_meta( $post_id, 'hj_related_subsidy_ids', implode( ',', $ids ) );
	} else {
		delete_post_meta( $post_id, 'hj_related_subsidy_ids' );
	}
} );

/**
 * 関連補助金ウィジェットをレンダリングするヘルパー関数
 *
 * @param int $post_id 記事ID
 */
function hj_render_related_subsidy_widget( $post_id ) {
	$saved = get_post_meta( $post_id, 'hj_related_subsidy_ids', true );
	if ( ! $saved ) return;

	$ids = array_map( 'intval', explode( ',', $saved ) );
	if ( empty( $ids ) ) return;

	$subsidies = get_posts( array(
		'post_type'      => 'subsidies',
		'post__in'       => $ids,
		'posts_per_page' => 5,
		'orderby'        => 'post__in',
		'post_status'    => 'publish',
	) );

	if ( empty( $subsidies ) ) return;
	?>
	<div class="hj-related-subsidies">
		<div class="hj-related-subsidies__title">💰 関連補助金</div>
		<?php foreach ( $subsidies as $sub ) :
			$status = get_post_meta( $sub->ID, 'hj_status', true );
			$amount = get_post_meta( $sub->ID, 'hj_amount_max', true );
			$status_class = $status === '募集中' ? 'hj-rs-card__status-active' : ( $status === '予定' ? 'hj-rs-card__status-planned' : 'hj-rs-card__status-closed' );
		?>
		<a href="<?php echo esc_url( get_permalink( $sub->ID ) ); ?>" class="hj-rs-card">
			<div class="hj-rs-card__name"><?php echo esc_html( $sub->post_title ); ?></div>
			<div class="hj-rs-card__meta">
				<?php if ( $amount ) : ?>
					<span class="hj-rs-card__amount">最大 <?php echo esc_html( hjnavi_format_amount( $amount ) ); ?></span>
				<?php endif; ?>
				<?php if ( $status ) : ?>
					<span class="<?php echo esc_attr( $status_class ); ?>"><?php echo esc_html( $status ); ?></span>
				<?php endif; ?>
			</div>
		</a>
		<?php endforeach; ?>
	</div>
	<?php
}
