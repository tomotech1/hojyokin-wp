<?php
/**
 * 補助金now - page-contact.php
 * 申請サポート・お問い合わせページ
 */
if ( ! defined( 'ABSPATH' ) ) exit;
include __DIR__ . '/parts/header.php';
?>

<nav class="breadcrumb bg-hj-bg">
  <a href="<?php echo esc_url( home_url( '/' ) ); ?>">ホーム</a>
  <span class="bc-sep">/</span>
  <span class="bc-current">申請サポート・お問い合わせ</span>
</nav>

<div class="max-w-site mx-auto px-5 py-12">

  <!-- ヒーロー -->
  <div style="background:linear-gradient(135deg,#0a2540,#1A56DB 40%,#1A6B3C);border-radius:1.5rem;padding:3rem 2rem;text-align:center;color:#fff;margin-bottom:3rem;">
    <div style="font-size:3rem;margin-bottom:0.75rem;">📋</div>
    <h1 style="font-size:1.75rem;font-weight:900;margin-bottom:0.5rem;color:#fff;">補助金申請サポート</h1>
    <p style="color:rgba(255,255,255,0.8);font-size:1rem;max-width:480px;margin:0 auto;">補助金・助成金の申請でお困りですか？専門スタッフが無料でご相談に応じます。</p>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">

    <!-- 左: サービス紹介 -->
    <div>
      <h2 style="font-size:1.3rem;font-weight:900;color:#111827;margin-bottom:1.5rem;">サポート内容</h2>
      <?php
      $services = array(
        array( '🔍', '補助金マッチング', '事業内容をヒアリングし、最適な補助金・助成金をご提案します。' ),
        array( '📝', '申請書類の作成支援', '採択率の高い事業計画書・申請書類の作成をサポートします。' ),
        array( '📋', '申請手続きの代行', '複雑な申請手続きをスムーズに進められるようサポートします。' ),
        array( '📊', '採択後のフォロー', '実績報告書の作成・提出まで、採択後の手続きもお任せください。' ),
      );
      foreach ( $services as $s ) :
      ?>
        <div style="display:flex;gap:1rem;align-items:flex-start;padding:1.1rem;background:#fff;border:1px solid #e5e7eb;border-radius:0.75rem;margin-bottom:0.75rem;">
          <span style="font-size:1.75rem;flex-shrink:0;"><?php echo $s[0]; ?></span>
          <div>
            <p style="font-weight:800;font-size:1rem;color:#111827;margin-bottom:0.25rem;"><?php echo esc_html( $s[1] ); ?></p>
            <p style="font-size:0.95rem;color:#6b7280;line-height:1.7;"><?php echo esc_html( $s[2] ); ?></p>
          </div>
        </div>
      <?php endforeach; ?>

      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:0.75rem;padding:1.25rem;margin-top:1.5rem;">
        <p style="font-weight:800;font-size:1rem;color:#0369a1;margin-bottom:0.5rem;">💡 初回相談は無料です</p>
        <p style="font-size:0.95rem;color:#0c4a6e;line-height:1.7;">補助金の種類・申請可否の確認まで、初回相談は完全無料で承っています。お気軽にご連絡ください。</p>
      </div>
    </div>

    <!-- 右: お問い合わせフォーム -->
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:1rem;padding:2rem;">
      <h2 style="font-size:1.2rem;font-weight:900;color:#111827;margin-bottom:1.5rem;">お問い合わせフォーム</h2>
      <?php if ( function_exists( 'wpcf7_enqueue_scripts' ) ) : ?>
        <?php echo do_shortcode( '[contact-form-7 id="1" title="お問い合わせ"]' ); ?>
      <?php else : ?>
      <form id="hjContactForm" style="display:flex;flex-direction:column;gap:1rem;">
        <div>
          <label style="display:block;font-weight:700;font-size:1rem;color:#374151;margin-bottom:0.4rem;">お名前 <span style="color:#ef4444;">*</span></label>
          <input type="text" name="name" required placeholder="山田 太郎"
                 style="width:100%;border:1px solid #d1d5db;border-radius:0.5rem;padding:0.75rem 1rem;font-size:1rem;box-sizing:border-box;">
        </div>
        <div>
          <label style="display:block;font-weight:700;font-size:1rem;color:#374151;margin-bottom:0.4rem;">会社名・屋号</label>
          <input type="text" name="company" placeholder="株式会社〇〇"
                 style="width:100%;border:1px solid #d1d5db;border-radius:0.5rem;padding:0.75rem 1rem;font-size:1rem;box-sizing:border-box;">
        </div>
        <div>
          <label style="display:block;font-weight:700;font-size:1rem;color:#374151;margin-bottom:0.4rem;">メールアドレス <span style="color:#ef4444;">*</span></label>
          <input type="email" name="email" required placeholder="info@example.com"
                 style="width:100%;border:1px solid #d1d5db;border-radius:0.5rem;padding:0.75rem 1rem;font-size:1rem;box-sizing:border-box;">
        </div>
        <div>
          <label style="display:block;font-weight:700;font-size:1rem;color:#374151;margin-bottom:0.4rem;">ご相談内容 <span style="color:#ef4444;">*</span></label>
          <select name="subject" style="width:100%;border:1px solid #d1d5db;border-radius:0.5rem;padding:0.75rem 1rem;font-size:1rem;background:#fff;box-sizing:border-box;">
            <option value="">選択してください</option>
            <option>補助金・助成金の種類を教えてほしい</option>
            <option>申請できるか確認したい</option>
            <option>申請書類の作成を手伝ってほしい</option>
            <option>採択後の手続きについて相談したい</option>
            <option>その他</option>
          </select>
        </div>
        <div>
          <label style="display:block;font-weight:700;font-size:1rem;color:#374151;margin-bottom:0.4rem;">メッセージ</label>
          <textarea name="message" rows="4" placeholder="ご質問・ご要望をお気軽にご記入ください"
                    style="width:100%;border:1px solid #d1d5db;border-radius:0.5rem;padding:0.75rem 1rem;font-size:1rem;resize:vertical;box-sizing:border-box;"></textarea>
        </div>
        <button type="submit"
                style="background:linear-gradient(135deg,#1A6B3C,#155830);color:#fff;font-weight:900;padding:0.9rem;border:none;border-radius:0.75rem;font-size:1.05rem;cursor:pointer;">
          送信する →
        </button>
      </form>
      <div id="hjContactThanks" style="display:none;text-align:center;padding:2rem;">
        <div style="font-size:3rem;margin-bottom:0.5rem;">✅</div>
        <p style="font-weight:800;font-size:1.2rem;color:#1A6B3C;">送信が完了しました</p>
        <p style="font-size:1rem;color:#6b7280;margin-top:0.5rem;">2営業日以内にご連絡いたします。</p>
      </div>
      <script>
      document.getElementById('hjContactForm').addEventListener('submit', function(e) {
        e.preventDefault();
        this.style.display = 'none';
        document.getElementById('hjContactThanks').style.display = 'block';
      });
      </script>
      <?php endif; ?>
    </div>
  </div>
</div>

<?php include __DIR__ . '/parts/footer.php'; ?>
