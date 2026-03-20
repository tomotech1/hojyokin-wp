<?php
/**
 * 補助金now - page-terms.php
 * 利用規約
 */
if ( ! defined( 'ABSPATH' ) ) exit;
include __DIR__ . '/parts/header.php';
$site_name = '補助金now';
?>

<nav class="breadcrumb bg-hj-bg">
  <a href="<?php echo esc_url( home_url( '/' ) ); ?>">ホーム</a>
  <span class="bc-sep">/</span>
  <span class="bc-current">利用規約</span>
</nav>

<div class="max-w-site mx-auto px-5 py-12">
  <div style="background:#fff;border-radius:1rem;padding:2rem 2.5rem;max-width:800px;margin:0 auto;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <h1 style="font-size:1.75rem;font-weight:900;color:#111827;margin-bottom:0.5rem;">利用規約</h1>
    <p style="font-size:0.95rem;color:#6b7280;margin-bottom:2rem;">最終更新日: <?php echo date('Y年m月d日'); ?></p>

    <div class="post-content" style="line-height:1.9;color:#374151;">
      <p>本利用規約（以下「本規約」）は、<?php echo esc_html($site_name); ?>（以下「当サイト」）が提供するサービスの利用条件を定めるものです。ユーザーは本規約に同意の上、当サイトをご利用ください。</p>

      <h2>第1条（適用範囲）</h2>
      <p>本規約は、当サイトが提供する補助金情報サービス全般に適用されます。</p>

      <h2>第2条（情報の正確性について）</h2>
      <p>当サイトに掲載する補助金・助成金情報は可能な限り正確を期しますが、制度の変更・終了等により情報が古くなる場合があります。必ず公式サイトや所管省庁にてご確認ください。当サイトの情報を利用したことによる損害について、当サイトは一切の責任を負いかねます。</p>

      <h2>第3条（免責事項）</h2>
      <ul>
        <li>当サイトの補助金診断・マッチング結果は目安であり、受給・採択を保証するものではありません。</li>
        <li>補助金の申請・受給に関する最終判断はご自身の責任で行ってください。</li>
        <li>当サイトへのリンク先（外部サイト）の内容について、当サイトは責任を負いません。</li>
      </ul>

      <h2>第4条（禁止事項）</h2>
      <p>ユーザーは以下の行為を行ってはなりません。</p>
      <ul>
        <li>当サイトのコンテンツの無断転載・複製</li>
        <li>当サイトへの不正アクセス・サーバーへの過大な負荷をかける行為</li>
        <li>法令または公序良俗に違反する行為</li>
        <li>他のユーザーまたは第三者に不利益を与える行為</li>
      </ul>

      <h2>第5条（著作権）</h2>
      <p>当サイトのコンテンツ（テキスト・画像・デザイン等）の著作権は当サイトに帰属します。私的利用の範囲を超える無断転載・複製を禁じます。</p>

      <h2>第6条（規約の変更）</h2>
      <p>当サイトは、必要に応じて本規約を予告なく変更することがあります。変更後の規約はこのページに掲示します。</p>

      <h2>第7条（準拠法・管轄）</h2>
      <p>本規約は日本法に準拠します。当サイトに関する紛争については、日本の裁判所を専属的合意管轄裁判所とします。</p>
    </div>
  </div>
</div>

<?php include __DIR__ . '/parts/footer.php'; ?>
