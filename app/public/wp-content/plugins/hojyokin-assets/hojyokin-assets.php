<?php
/**
 * Plugin Name: 補助金ナビ Assets
 * Plugin URI:  https://github.com/tomotech1/hojyokin-wp
 * Description: TailwindCSS（output.css）および補助金ナビ共通JS をエンキューするプラグイン。
 * Version:     1.0.0
 * Author:      tomotech1
 * License:     MIT
 *
 * @package HojyokinNavi
 */

// 直接アクセス禁止
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * フロントエンドアセットのエンキュー
 * フック: wp_enqueue_scripts
 */
function hjnavi_plugin_enqueue_assets() {

	$plugin_dir_url  = plugin_dir_url( __FILE__ );
	$plugin_dir_path = plugin_dir_path( __FILE__ );

	// ---- CSS（TailwindCSS ビルド済み）----
	$css_file = $plugin_dir_path . 'output.css';
	$css_url  = $plugin_dir_url . 'output.css';
	$css_ver  = file_exists( $css_file ) ? filemtime( $css_file ) : '1.0.0';

	wp_enqueue_style(
		'hjnavi-style',
		$css_url,
		array(),
		$css_ver
	);

	// ---- JS（メインスクリプト、存在する場合のみ）----
	$js_file = $plugin_dir_path . 'output.js';
	$js_url  = $plugin_dir_url . 'output.js';
	if ( file_exists( $js_file ) ) {
		$js_ver = filemtime( $js_file );
		wp_enqueue_script(
			'hjnavi-script',
			$js_url,
			array( 'jquery' ),
			$js_ver,
			true  // フッターに配置
		);
	}

	// ---- Ajax URL をJSに渡す ----
	// jQuery が読み込まれた後にインラインスクリプトを追加する
	wp_add_inline_script(
		'jquery',
		'var hjnaviAjax = ' . wp_json_encode( array(
			'url'   => admin_url( 'admin-ajax.php' ),
			'nonce' => wp_create_nonce( 'hjnavi_ajax_nonce' ),
		) ) . ';'
	);
}
add_action( 'wp_enqueue_scripts', 'hjnavi_plugin_enqueue_assets' );

/**
 * 管理画面アセットのエンキュー（補助金管理用スタイル）
 * フック: admin_enqueue_scripts
 */
function hjnavi_admin_enqueue_assets( $hook ) {
	// 補助金投稿タイプ編集画面のみ
	if ( ! in_array( $hook, array( 'post.php', 'post-new.php' ) ) ) {
		return;
	}

	$screen = get_current_screen();
	if ( ! $screen || $screen->post_type !== 'subsidies' ) {
		return;
	}

	// 管理画面用インラインCSS
	wp_add_inline_style( 'wp-admin', '
		#hjnavi_subsidy_info .form-table th { width: 140px; font-size: 13px; }
		#hjnavi_subsidy_info .form-table td { font-size: 13px; }
		#hjnavi_subsidy_info .regular-text { width: 100%; max-width: 400px; }
		#hjnavi_subsidy_info select { min-width: 160px; }
	' );
}
add_action( 'admin_enqueue_scripts', 'hjnavi_admin_enqueue_assets' );

/**
 * プラグイン有効化時のメッセージ
 */
function hjnavi_plugin_activation_notice() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	// output.css が存在しない場合に警告
	$css_file = plugin_dir_path( __FILE__ ) . 'output.css';
	if ( ! file_exists( $css_file ) ) {
		echo '<div class="notice notice-warning is-dismissible">';
		echo '<p><strong>補助金ナビ Assets:</strong> output.css が見つかりません。';
		echo 'プロジェクトルートで <code>npm run build</code> を実行してください。</p>';
		echo '</div>';
	}
}
add_action( 'admin_notices', 'hjnavi_plugin_activation_notice' );

/**
 * プラグイン情報の表示（wp-admin/plugins.php）
 */
function hjnavi_add_plugin_meta_links( $links, $file ) {
	if ( plugin_basename( __FILE__ ) === $file ) {
		$css_file = plugin_dir_path( __FILE__ ) . 'output.css';
		$css_ver  = file_exists( $css_file ) ? filemtime( $css_file ) : 'Not built';
		$links[] = '<span>CSS: v' . esc_html( $css_ver ) . '</span>';
	}
	return $links;
}
add_filter( 'plugin_row_meta', 'hjnavi_add_plugin_meta_links', 10, 2 );
