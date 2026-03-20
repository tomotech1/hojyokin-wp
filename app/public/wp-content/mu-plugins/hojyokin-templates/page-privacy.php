<?php
/**
 * 補助金now - page-privacy.php
 * プライバシーポリシー
 */
if ( ! defined( 'ABSPATH' ) ) exit;
include __DIR__ . '/parts/header.php';
$site_name = '補助金now';
$site_url  = home_url('/');
?>

<nav class="breadcrumb bg-hj-bg">
  <a href="<?php echo esc_url( $site_url ); ?>">ホーム</a>
  <span class="bc-sep">/</span>
  <span class="bc-current">プライバシーポリシー</span>
</nav>

<div class="max-w-site mx-auto px-5 py-12">
  <div style="background:#fff;border-radius:1rem;padding:2rem 2.5rem;max-width:800px;margin:0 auto;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <h1 style="font-size:1.75rem;font-weight:900;color:#111827;margin-bottom:0.5rem;">プライバシーポリシー</h1>
    <p style="font-size:0.95rem;color:#6b7280;margin-bottom:2rem;">最終更新日: <?php echo date('Y年m月d日'); ?></p>

    <div class="post-content" style="line-height:1.9;color:#374151;">
      <p><?php echo esc_html( $site_name ); ?>（以下「当サイト」）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めます。本ポリシーは、当サイトにおける個人情報の取り扱いについて説明します。</p>

      <h2>1. 収集する情報</h2>
      <p>当サイトでは、以下の情報を収集する場合があります。</p>
      <ul>
        <li>お問い合わせフォームを通じてご提供いただいた氏名・メールアドレス・会社名・ご相談内容</li>
        <li>Cookieを通じて収集されるアクセスログ・利用状況データ（Google Analytics等）</li>
        <li>お気に入り登録・診断結果など、ブラウザのローカルストレージに保存されるデータ</li>
      </ul>

      <h2>2. 情報の利用目的</h2>
      <p>収集した情報は以下の目的で利用します。</p>
      <ul>
        <li>お問い合わせへの対応・回答</li>
        <li>サービス改善・コンテンツ品質向上のための分析</li>
        <li>法令に基づく対応</li>
      </ul>

      <h2>3. 第三者への提供</h2>
      <p>当サイトは、法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供しません。</p>

      <h2>4. Cookieについて</h2>
      <p>当サイトはGoogle Analytics等のアクセス解析ツールを使用しており、Cookieを利用してアクセス情報を収集しています。Cookieによって個人を特定することはありません。ブラウザの設定でCookieを無効にすることも可能です。</p>

      <h2>5. 情報の管理・セキュリティ</h2>
      <p>収集した個人情報は適切なセキュリティ対策のもとで管理し、情報漏洩の防止に努めます。</p>

      <h2>6. ポリシーの変更</h2>
      <p>本プライバシーポリシーは、法令の変更やサービスの改善に応じて予告なく変更することがあります。変更後のポリシーはこのページに掲示します。</p>

      <h2>7. お問い合わせ</h2>
      <p>プライバシーに関するお問い合わせは<a href="<?php echo esc_url( home_url('/contact/') ); ?>">こちらのお問い合わせフォーム</a>よりご連絡ください。</p>
    </div>
  </div>
</div>

<?php include __DIR__ . '/parts/footer.php'; ?>
