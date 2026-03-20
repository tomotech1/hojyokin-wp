<?php
/**
 * 補助金ナビ WP - カスタム投稿タイプ・メタフィールド・タクソノミー定義
 *
 * このファイルは mu-plugins に配置して使用する:
 *   app/public/wp-content/mu-plugins/hojyokin-cpt.php
 *
 * @package HojyokinNavi
 * @version 1.0.0
 */

// 直接アクセス禁止
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// ============================================================
// 1. CPT: subsidies（補助金個別ページ）
// ============================================================

/**
 * カスタム投稿タイプを登録する
 * フック: init
 */
function hjnavi_register_post_types() {

	// ---- subsidies: 補助金個別ページ ----
	$subsidies_labels = array(
		'name'                  => '補助金',
		'singular_name'         => '補助金',
		'menu_name'             => '補助金',
		'add_new'               => '新規追加',
		'add_new_item'          => '新規補助金を追加',
		'edit_item'             => '補助金を編集',
		'new_item'              => '新規補助金',
		'view_item'             => '補助金を表示',
		'search_items'          => '補助金を検索',
		'not_found'             => '補助金が見つかりません',
		'not_found_in_trash'    => 'ゴミ箱に補助金はありません',
		'all_items'             => 'すべての補助金',
		'archives'              => '補助金アーカイブ',
		'attributes'            => '補助金属性',
		'parent_item_colon'     => '親補助金:',
		'featured_image'        => 'アイキャッチ画像',
		'set_featured_image'    => 'アイキャッチ画像を設定',
		'remove_featured_image' => 'アイキャッチ画像を削除',
		'use_featured_image'    => 'アイキャッチ画像として使用',
	);

	$subsidies_args = array(
		'labels'              => $subsidies_labels,
		'description'         => '補助金個別ディレクトリページ',
		'public'              => true,
		'publicly_queryable'  => true,
		'show_ui'             => true,
		'show_in_menu'        => true,
		'show_in_nav_menus'   => true,
		'show_in_admin_bar'   => true,
		'show_in_rest'        => true,
		'rest_base'           => 'subsidies',
		'query_var'           => true,
		'rewrite'             => array(
			'slug'       => 'subsidies',
			'with_front' => false,
		),
		'capability_type'     => 'post',
		'has_archive'         => true,
		'hierarchical'        => false,
		'menu_position'       => 5,
		'menu_icon'           => 'dashicons-money-alt',
		'supports'            => array(
			'title',
			'editor',
			'thumbnail',
			'custom-fields',
			'excerpt',
			'revisions',
		),
	);

	register_post_type( 'subsidies', $subsidies_args );
}
add_action( 'init', 'hjnavi_register_post_types' );

// ============================================================
// 2. タクソノミー登録
// ============================================================

/**
 * カスタムタクソノミーを登録する
 * フック: init
 */
function hjnavi_register_taxonomies() {

	// ---- subsidy_type: 補助金種別（階層あり - カテゴリー型）----
	$type_labels = array(
		'name'                       => '補助金種別',
		'singular_name'              => '補助金種別',
		'menu_name'                  => '補助金種別',
		'all_items'                  => 'すべての種別',
		'parent_item'                => '親種別',
		'parent_item_colon'          => '親種別:',
		'new_item_name'              => '新規種別名',
		'add_new_item'               => '新規種別を追加',
		'edit_item'                  => '種別を編集',
		'update_item'                => '種別を更新',
		'view_item'                  => '種別を表示',
		'search_items'               => '種別を検索',
		'not_found'                  => '種別が見つかりません',
	);

	register_taxonomy(
		'subsidy_type',
		array( 'subsidies' ),
		array(
			'labels'            => $type_labels,
			'hierarchical'      => true,
			'show_ui'           => true,
			'show_in_rest'      => true,
			'rest_base'         => 'subsidy_type',
			'show_admin_column' => true,
			'rewrite'           => array(
				'slug'         => 'subsidy-type',
				'with_front'   => false,
				'hierarchical' => true,
			),
		)
	);

	// ---- subsidy_industry: 対象業種（階層なし - タグ型）----
	$industry_labels = array(
		'name'                       => '対象業種',
		'singular_name'              => '対象業種',
		'menu_name'                  => '対象業種',
		'all_items'                  => 'すべての業種',
		'new_item_name'              => '新規業種名',
		'add_new_item'               => '新規業種を追加',
		'edit_item'                  => '業種を編集',
		'update_item'                => '業種を更新',
		'view_item'                  => '業種を表示',
		'separate_items_with_commas' => '業種をコンマで区切る',
		'add_or_remove_items'        => '業種を追加または削除',
		'search_items'               => '業種を検索',
		'not_found'                  => '業種が見つかりません',
	);

	register_taxonomy(
		'subsidy_industry',
		array( 'subsidies' ),
		array(
			'labels'            => $industry_labels,
			'hierarchical'      => false,
			'show_ui'           => true,
			'show_in_rest'      => true,
			'rest_base'         => 'subsidy_industry',
			'show_admin_column' => true,
			'rewrite'           => array(
				'slug'       => 'industry',
				'with_front' => false,
			),
		)
	);

	// ---- subsidy_purpose: 目的・用途（階層なし - タグ型）----
	$purpose_labels = array(
		'name'                       => '目的・用途',
		'singular_name'              => '目的・用途',
		'menu_name'                  => '目的・用途',
		'all_items'                  => 'すべての目的',
		'new_item_name'              => '新規目的名',
		'add_new_item'               => '新規目的を追加',
		'edit_item'                  => '目的を編集',
		'update_item'                => '目的を更新',
		'view_item'                  => '目的を表示',
		'separate_items_with_commas' => '目的をコンマで区切る',
		'add_or_remove_items'        => '目的を追加または削除',
		'search_items'               => '目的を検索',
		'not_found'                  => '目的が見つかりません',
	);

	register_taxonomy(
		'subsidy_purpose',
		array( 'subsidies' ),
		array(
			'labels'            => $purpose_labels,
			'hierarchical'      => false,
			'show_ui'           => true,
			'show_in_rest'      => true,
			'rest_base'         => 'subsidy_purpose',
			'show_admin_column' => true,
			'rewrite'           => array(
				'slug'       => 'purpose',
				'with_front' => false,
			),
		)
	);
}
add_action( 'init', 'hjnavi_register_taxonomies' );

// ============================================================
// 3. メタフィールド登録（REST API + Gutenberg対応）
// ============================================================

/**
 * 補助金メタフィールドを登録する
 * フック: init
 */
function hjnavi_register_meta_fields() {

	$meta_fields = array(
		// 上限額（整数・円）
		'hj_amount_max'          => array( 'type' => 'integer', 'description' => '上限額（円）' ),
		// 補助率（文字列・例: "2/3"）
		'hj_amount_rate'         => array( 'type' => 'string',  'description' => '補助率（例: 2/3）' ),
		// 申請締切（YYYY-MM-DD）
		'hj_deadline'            => array( 'type' => 'string',  'description' => '申請締切日（YYYY-MM-DD）' ),
		// 公募期間テキスト
		'hj_application_period'  => array( 'type' => 'string',  'description' => '公募期間テキスト' ),
		// 対象者
		'hj_target'              => array( 'type' => 'string',  'description' => '対象者（例: 中小企業・個人事業主）' ),
		// 対象地域
		'hj_region'              => array( 'type' => 'string',  'description' => '対象地域（例: 全国）' ),
		// 実施機関
		'hj_agency'              => array( 'type' => 'string',  'description' => '実施機関（例: 経済産業省）' ),
		// ステータス
		'hj_status'              => array( 'type' => 'string',  'description' => 'ステータス（募集中/終了/予定）' ),
		// 公式URL
		'hj_official_url'        => array( 'type' => 'string',  'description' => '公式URL' ),
		// 申請URL
		'hj_application_url'     => array( 'type' => 'string',  'description' => '申請URL' ),
		// 最小従業員数
		'hj_min_employees'       => array( 'type' => 'integer', 'description' => '最小従業員数' ),
		// 最大従業員数
		'hj_max_employees'       => array( 'type' => 'integer', 'description' => '最大従業員数' ),
		// 対象年度
		'hj_fiscal_year'         => array( 'type' => 'string',  'description' => '対象年度（例: 2025年度）' ),
		// SEOPress タイトル
		'_seopress_titles_title' => array( 'type' => 'string',  'description' => 'SEOPressタイトル' ),
		// SEOPress ディスクリプション
		'_seopress_titles_desc'  => array( 'type' => 'string',  'description' => 'SEOPressディスクリプション' ),
	);

	foreach ( $meta_fields as $key => $config ) {
		register_post_meta(
			'subsidies',
			$key,
			array(
				'single'            => true,
				'type'              => $config['type'],
				'description'       => $config['description'],
				'show_in_rest'      => true,
				'sanitize_callback' => $config['type'] === 'integer' ? 'absint' : 'sanitize_text_field',
				'auth_callback'     => function () {
					return current_user_can( 'edit_posts' );
				},
			)
		);
	}
}
add_action( 'init', 'hjnavi_register_meta_fields' );

// ============================================================
// 4. 管理画面メタボックス
// ============================================================

/**
 * 補助金情報メタボックスを追加する
 */
function hjnavi_add_meta_boxes() {
	add_meta_box(
		'hjnavi_subsidy_info',
		'補助金基本情報',
		'hjnavi_render_subsidy_meta_box',
		'subsidies',
		'normal',
		'high'
	);
}
add_action( 'add_meta_boxes', 'hjnavi_add_meta_boxes' );

/**
 * 補助金情報メタボックスの描画
 */
function hjnavi_render_subsidy_meta_box( $post ) {
	wp_nonce_field( 'hjnavi_save_subsidy_meta', 'hjnavi_meta_nonce' );

	$fields = array(
		'hj_amount_max'         => array( 'label' => '上限額（円）',        'type' => 'number' ),
		'hj_amount_rate'        => array( 'label' => '補助率',             'type' => 'text',   'placeholder' => '例: 2/3' ),
		'hj_deadline'           => array( 'label' => '申請締切',            'type' => 'text',   'placeholder' => 'YYYY-MM-DD' ),
		'hj_application_period' => array( 'label' => '公募期間',            'type' => 'text',   'placeholder' => '例: 2025年4月1日〜6月30日' ),
		'hj_target'             => array( 'label' => '対象者',             'type' => 'text',   'placeholder' => '例: 中小企業・個人事業主' ),
		'hj_region'             => array( 'label' => '対象地域',            'type' => 'text',   'placeholder' => '例: 全国' ),
		'hj_agency'             => array( 'label' => '実施機関',            'type' => 'text',   'placeholder' => '例: 経済産業省' ),
		'hj_status'             => array( 'label' => 'ステータス',          'type' => 'select', 'options' => array( '' => '選択してください', '募集中' => '募集中', '予定' => '予定', '終了' => '終了' ) ),
		'hj_official_url'       => array( 'label' => '公式URL',            'type' => 'url' ),
		'hj_application_url'    => array( 'label' => '申請URL',            'type' => 'url' ),
		'hj_min_employees'      => array( 'label' => '最小従業員数',        'type' => 'number' ),
		'hj_max_employees'      => array( 'label' => '最大従業員数',        'type' => 'number' ),
		'hj_fiscal_year'        => array( 'label' => '対象年度',            'type' => 'text',   'placeholder' => '例: 2025年度' ),
	);

	echo '<table class="form-table">';
	foreach ( $fields as $key => $field ) {
		$value = get_post_meta( $post->ID, $key, true );
		echo '<tr>';
		echo '<th><label for="' . esc_attr( $key ) . '">' . esc_html( $field['label'] ) . '</label></th>';
		echo '<td>';

		if ( $field['type'] === 'select' ) {
			echo '<select id="' . esc_attr( $key ) . '" name="' . esc_attr( $key ) . '">';
			foreach ( $field['options'] as $opt_val => $opt_label ) {
				echo '<option value="' . esc_attr( $opt_val ) . '"' . selected( $value, $opt_val, false ) . '>' . esc_html( $opt_label ) . '</option>';
			}
			echo '</select>';
		} else {
			echo '<input type="' . esc_attr( $field['type'] ) . '" '
				. 'id="' . esc_attr( $key ) . '" '
				. 'name="' . esc_attr( $key ) . '" '
				. 'value="' . esc_attr( $value ) . '" '
				. 'class="regular-text" '
				. ( ! empty( $field['placeholder'] ) ? 'placeholder="' . esc_attr( $field['placeholder'] ) . '"' : '' )
				. '>';
		}

		echo '</td></tr>';
	}
	echo '</table>';
}

/**
 * 補助金メタデータを保存する
 */
function hjnavi_save_subsidy_meta( $post_id ) {
	// Nonce検証
	if ( ! isset( $_POST['hjnavi_meta_nonce'] ) || ! wp_verify_nonce( $_POST['hjnavi_meta_nonce'], 'hjnavi_save_subsidy_meta' ) ) {
		return;
	}
	// 自動保存スキップ
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}
	// 権限確認
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	$integer_fields = array( 'hj_amount_max', 'hj_min_employees', 'hj_max_employees' );
	$string_fields  = array( 'hj_amount_rate', 'hj_deadline', 'hj_application_period', 'hj_target', 'hj_region', 'hj_agency', 'hj_status', 'hj_official_url', 'hj_application_url', 'hj_fiscal_year' );

	foreach ( $integer_fields as $field ) {
		if ( isset( $_POST[ $field ] ) ) {
			update_post_meta( $post_id, $field, absint( $_POST[ $field ] ) );
		}
	}
	foreach ( $string_fields as $field ) {
		if ( isset( $_POST[ $field ] ) ) {
			update_post_meta( $post_id, $field, sanitize_text_field( $_POST[ $field ] ) );
		}
	}
}
add_action( 'save_post_subsidies', 'hjnavi_save_subsidy_meta' );

// ============================================================
// 5. テンプレートルーティング
// ============================================================

/**
 * カスタム投稿・タクソノミー用テンプレートをmu-pluginsから読み込む
 * フック: template_include
 */
function hjnavi_template_include( $template ) {
	$template_dir = __DIR__ . '/hojyokin-templates/';

	// 補助金個別ページ
	if ( is_singular( 'subsidies' ) ) {
		$t = $template_dir . 'single-subsidies.php';
		if ( file_exists( $t ) ) return $t;
	}

	// 補助金アーカイブページ
	if ( is_post_type_archive( 'subsidies' ) ) {
		$t = $template_dir . 'archive-subsidies.php';
		if ( file_exists( $t ) ) return $t;
	}

	// タクソノミーアーカイブ（種別・業種・目的）
	if ( is_tax( array( 'subsidy_type', 'subsidy_industry', 'subsidy_purpose' ) ) ) {
		$t = $template_dir . 'archive-subsidies.php';
		if ( file_exists( $t ) ) return $t;
	}

	// フロントページ
	if ( is_front_page() ) {
		$t = $template_dir . 'front-page.php';
		if ( file_exists( $t ) ) return $t;
	}

	// 補助金診断ページ（slug: shindan）
	if ( is_page( 'shindan' ) ) {
		$t = $template_dir . 'page-shindan.php';
		if ( file_exists( $t ) ) return $t;
	}

	// お問い合わせページ（slug: contact）
	if ( is_page( 'contact' ) ) {
		$t = $template_dir . 'page-contact.php';
		if ( file_exists( $t ) ) return $t;
	}

	// プライバシーポリシーページ
	if ( is_page( array( 'privacy', 'privacy-policy' ) ) ) {
		$t = $template_dir . 'page-privacy.php';
		if ( file_exists( $t ) ) return $t;
	}

	// コラム一覧（blog page / is_home() or is_page('blog')）
	if ( is_home() || is_page( 'blog' ) ) {
		$t = $template_dir . 'archive-blog.php';
		if ( file_exists( $t ) ) return $t;
	}

	// カテゴリー・タグアーカイブ（ブログ系）
	if ( is_category() || is_tag() ) {
		$t = $template_dir . 'archive-blog.php';
		if ( file_exists( $t ) ) return $t;
	}

	// 補助金種別・業種・目的 一覧ページ
	if ( is_page( array( 'subsidy-type', 'subsidy-types', 'industry', 'purpose' ) ) ) {
		$t = $template_dir . 'page-subsidy-types.php';
		if ( file_exists( $t ) ) return $t;
	}

	// 利用規約ページ
	if ( is_page( 'terms' ) ) {
		$t = $template_dir . 'page-terms.php';
		if ( file_exists( $t ) ) return $t;
	}

	// お気に入りリストページ
	if ( is_page( array( 'favorites', 'お気に入り', 'okiniiri' ) ) ) {
		$t = $template_dir . 'page-favorites.php';
		if ( file_exists( $t ) ) return $t;
	}

	// 通常記事（pSEO）
	if ( is_singular( 'post' ) ) {
		$t = $template_dir . 'single-post.php';
		if ( file_exists( $t ) ) return $t;
	}

	return $template;
}
add_filter( 'template_include', 'hjnavi_template_include' );

// ============================================================
// 6. ヘルパー関数
// ============================================================

/**
 * 金額を人間が読みやすい形式にフォーマットする
 * 例: 50000000 → "5,000万円"、100000000 → "1億円"
 *
 * @param int|string $amount 金額（円）
 * @return string フォーマット済み文字列
 */
function hjnavi_format_amount( $amount ) {
	if ( ! $amount ) return '—';
	$amount = intval( $amount );
	// hj_amount_max は万円単位で保存
	if ( $amount >= 10000 ) {
		// 1億円以上（10000万円以上）
		$oku = $amount / 10000;
		return number_format( $oku, ( $oku == intval( $oku ) ) ? 0 : 1 ) . '億円';
	}
	// 1万円〜9999万円
	return number_format( $amount ) . '万円';
}

/**
 * ステータスバッジHTMLを返す
 *
 * @param string $status ステータス文字列
 * @return string HTML
 */
function hjnavi_status_badge( $status ) {
	if ( ! $status ) return '';

	switch ( $status ) {
		case '公募中':
		case '募集中':
		case '受付中':
			// 緑：公募中・受付中（点滅）
			$style = 'display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;padding:3px 10px;border-radius:99px;background:#dcfce7;color:#15803d;border:1px solid #86efac;';
			$dot   = '<span style="width:7px;height:7px;border-radius:50%;background:#16a34a;display:inline-block;animation:hjStatusPulse 1.4s ease-in-out infinite;"></span>';
			break;
		case '予定':
			// 青：予定
			$style = 'display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;padding:3px 10px;border-radius:99px;background:#dbeafe;color:#1d4ed8;border:1px solid #93c5fd;';
			$dot   = '<span style="width:7px;height:7px;border-radius:50%;background:#2563eb;display:inline-block;"></span>';
			break;
		case '終了':
			// グレー：終了
			$style = 'display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;padding:3px 10px;border-radius:99px;background:#f3f4f6;color:#6b7280;border:1px solid #d1d5db;';
			$dot   = '<span style="width:7px;height:7px;border-radius:50%;background:#9ca3af;display:inline-block;"></span>';
			break;
		default:
			// オレンジ：その他（審査中・結果待ち等）
			$style = 'display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;padding:3px 10px;border-radius:99px;background:#fef3c7;color:#d97706;border:1px solid #fcd34d;';
			$dot   = '<span style="width:7px;height:7px;border-radius:50%;background:#f59e0b;display:inline-block;"></span>';
			break;
	}

	return sprintf(
		'<span style="%s">%s %s</span>',
		esc_attr( $style ),
		$dot,
		esc_html( $status )
	);
}

/**
 * 締切日を判定して警告を表示する
 *
 * @param string $deadline YYYY-MM-DD
 * @return string HTMLバッジまたは空文字
 */
function hjnavi_deadline_alert( $deadline ) {
	if ( ! $deadline ) return '';

	$today     = current_time( 'Y-m-d' );
	$diff_days = ( strtotime( $deadline ) - strtotime( $today ) ) / 86400;

	if ( $diff_days < 0 ) {
		return '<span class="status-badge status-badge--closed">締切済</span>';
	} elseif ( $diff_days <= 14 ) {
		return '<span class="deadline-near-badge">⏰ 締切まで' . intval( $diff_days ) . '日</span>';
	}
	return '';
}

// ============================================================
// 7. アセット読み込み
// ============================================================

/**
 * フロントエンドアセットをエンキューする
 * フック: wp_enqueue_scripts
 */
function hjnavi_enqueue_assets() {
	$css_file = WP_CONTENT_DIR . '/plugins/hojyokin-assets/output.css';
	$css_url  = content_url( '/plugins/hojyokin-assets/output.css' );
	$ver      = file_exists( $css_file ) ? filemtime( $css_file ) : '1.0';
	wp_enqueue_style( 'hjnavi-style', $css_url, array(), $ver );

	// Ajax URL をインラインスクリプトで渡す
	wp_add_inline_script(
		'jquery',
		'var hjnaviAjax = ' . wp_json_encode( array( 'url' => admin_url( 'admin-ajax.php' ) ) ) . ';'
	);
}
add_action( 'wp_enqueue_scripts', 'hjnavi_enqueue_assets' );

// ============================================================
// 8. Ajax検索（`hjnavi_search` アクション）
// ============================================================

/**
 * Ajax補助金検索ハンドラー（ログイン済み・未ログイン共通）
 */
function hjnavi_ajax_search() {
	$q = isset( $_GET['q'] ) ? sanitize_text_field( wp_unslash( $_GET['q'] ) ) : '';

	if ( strlen( $q ) < 1 ) {
		wp_send_json( array() );
	}

	$query = new WP_Query( array(
		'post_type'      => 'subsidies',
		'posts_per_page' => 8,
		'post_status'    => 'publish',
		's'              => $q,
		'orderby'        => 'relevance',
	) );

	$results = array();
	if ( $query->have_posts() ) {
		while ( $query->have_posts() ) {
			$query->the_post();
			$post_id = get_the_ID();
			$status  = get_post_meta( $post_id, 'hj_status', true );
			$amount  = get_post_meta( $post_id, 'hj_amount_max', true );
			$results[] = array(
				'title'      => get_the_title(),
				'url'        => get_permalink(),
				'status'     => $status ?: '',
				'amount_max' => hjnavi_format_amount( $amount ),
				'agency'     => get_post_meta( $post_id, 'hj_agency', true ) ?: '',
			);
		}
		wp_reset_postdata();
	}

	wp_send_json( $results );
}
add_action( 'wp_ajax_hjnavi_search',        'hjnavi_ajax_search' );
add_action( 'wp_ajax_nopriv_hjnavi_search', 'hjnavi_ajax_search' );

// ============================================================
// 9. スキーマ出力（構造化データ）
// ============================================================

/**
 * 補助金詳細ページのFAQスキーマ・BreadcrumbListを出力する
 * フック: wp_head
 */
function hjnavi_output_schema() {
	if ( ! is_singular( 'subsidies' ) ) return;

	$post_id = get_the_ID();
	$title   = get_the_title();
	$url     = get_permalink();
	$amount  = get_post_meta( $post_id, 'hj_amount_max', true );
	$status  = get_post_meta( $post_id, 'hj_status', true );

	// パンくずスキーマ
	$breadcrumb_schema = array(
		'@context'        => 'https://schema.org',
		'@type'           => 'BreadcrumbList',
		'itemListElement' => array(
			array(
				'@type'    => 'ListItem',
				'position' => 1,
				'name'     => 'ホーム',
				'item'     => home_url( '/' ),
			),
			array(
				'@type'    => 'ListItem',
				'position' => 2,
				'name'     => '補助金一覧',
				'item'     => home_url( '/subsidies/' ),
			),
			array(
				'@type'    => 'ListItem',
				'position' => 3,
				'name'     => $title,
				'item'     => $url,
			),
		),
	);

	// FAQ スキーマ（補助金基本情報をQ&A形式で）
	$faq_items = array();
	if ( $amount ) {
		$faq_items[] = array(
			'@type'          => 'Question',
			'name'           => $title . 'の補助金上限額はいくらですか？',
			'acceptedAnswer' => array(
				'@type' => 'Answer',
				'text'  => '上限額は ' . hjnavi_format_amount( $amount ) . ' です。',
			),
		);
	}
	$target = get_post_meta( $post_id, 'hj_target', true );
	if ( $target ) {
		$faq_items[] = array(
			'@type'          => 'Question',
			'name'           => $title . 'の対象者は誰ですか？',
			'acceptedAnswer' => array(
				'@type' => 'Answer',
				'text'  => $target,
			),
		);
	}
	$deadline = get_post_meta( $post_id, 'hj_deadline', true );
	if ( $deadline ) {
		$faq_items[] = array(
			'@type'          => 'Question',
			'name'           => $title . 'の申請締切はいつですか？',
			'acceptedAnswer' => array(
				'@type' => 'Answer',
				'text'  => $deadline . ' です。',
			),
		);
	}

	echo '<script type="application/ld+json">' . wp_json_encode( $breadcrumb_schema, JSON_UNESCAPED_UNICODE ) . '</script>' . "\n";

	if ( ! empty( $faq_items ) ) {
		$faq_schema = array(
			'@context'   => 'https://schema.org',
			'@type'      => 'FAQPage',
			'mainEntity' => $faq_items,
		);
		echo '<script type="application/ld+json">' . wp_json_encode( $faq_schema, JSON_UNESCAPED_UNICODE ) . '</script>' . "\n";
	}
}
add_action( 'wp_head', 'hjnavi_output_schema' );

// ============================================================
// 10. タクソノミーベースURL（/purpose/, /industry/）を補助金種別一覧ページにリダイレクト
// ============================================================
add_action( 'template_redirect', function() {
	$req = trim( parse_url( $_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH ), '/' );

	// iCal ダウンロード処理
	if ( isset( $_GET['hjcal'] ) && $_GET['hjcal'] === 'ics' ) {
		$post_id = intval( $_GET['post'] ?? 0 );
		if ( ! $post_id ) {
			wp_die( 'Invalid request.' );
		}
		$title    = get_the_title( $post_id );
		$deadline = get_post_meta( $post_id, 'hj_deadline', true );
		$url      = get_permalink( $post_id );
		$agency   = get_post_meta( $post_id, 'hj_agency', true );

		// 締切日がある場合はその日付、ない場合は3ヶ月後をフォールバック
		if ( $deadline && preg_match( '/(\d{4})[年\/\-](\d{1,2})[月\/\-](\d{1,2})/', $deadline, $dm ) ) {
			$date    = sprintf( '%04d%02d%02d', $dm[1], $dm[2], $dm[3] );
			$summary = $title . ' 申請締切';
		} else {
			$date    = date( 'Ymd', strtotime( '+3 months' ) );
			$summary = $title . '（補助金nowでチェック）';
		}
		$uid = 'hjnavi-' . $post_id . '@hojyokin-now.jp';
		$now = gmdate( 'Ymd\THis\Z' );

		$ics  = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//補助金now//hojyokin-now.jp//JA\r\n";
		$ics .= "X-WR-CALNAME:補助金now\r\n";
		$ics .= "BEGIN:VEVENT\r\n";
		$ics .= "UID:{$uid}\r\n";
		$ics .= "DTSTAMP:{$now}\r\n";
		$ics .= "DTSTART;VALUE=DATE:{$date}\r\n";
		$ics .= "DTEND;VALUE=DATE:{$date}\r\n";
		$ics .= "SUMMARY:{$summary}\r\n";
		$ics .= "DESCRIPTION:実施機関: {$agency}\\n詳細: {$url}\r\n";
		$ics .= "URL:{$url}\r\n";
		$ics .= "END:VEVENT\r\nEND:VCALENDAR\r\n";

		$filename = sanitize_file_name( $title ) . '.ics';
		// iOS Safari は attachment を開けないため inline で配信
		header( 'Content-Type: text/calendar; charset=UTF-8' );
		header( 'Content-Disposition: inline; filename="' . $filename . '"' );
		header( 'Content-Length: ' . strlen( $ics ) );
		header( 'Cache-Control: no-cache, must-revalidate' );
		echo $ics;
		exit;
	}

	if ( $req === 'purpose' || $req === 'industry' ) {
		wp_redirect( home_url( '/subsidy-types/' ), 301 );
		exit;
	}
} );

// ============================================================
// 11. rewrite フラッシュ（CPT/タクソノミー登録後）
// ============================================================

/**
 * プラグインが有効化されたときにパーマリンクをフラッシュする
 */
function hjnavi_rewrite_flush() {
	hjnavi_register_post_types();
	hjnavi_register_taxonomies();
	flush_rewrite_rules();
}
register_activation_hook( __FILE__, 'hjnavi_rewrite_flush' );
