<?php if ( ! defined( 'ABSPATH' ) ) exit; ?>
<footer class="site-footer">
  <!-- ロゴ＋サイト名＋概要文 -->
  <div class="max-w-site mx-auto px-5 pt-20 pb-8 border-b border-hj-border">
    <a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="inline-flex items-center gap-3 no-underline mb-4">
      <span style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#F59E0B,#D97706);box-shadow:0 2px 8px rgba(245,158,11,0.4);flex-shrink:0;">
        <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.93V18h-2v-1.07C9.39 16.54 8 15.38 8 14h2c0 .56.7 1 2 1s2-.44 2-1c0-.59-.42-1-2.13-1.26C9.77 12.48 8 11.57 8 10c0-1.38 1.39-2.54 3-2.93V6h2v1.07C14.61 7.46 16 8.62 16 10h-2c0-.56-.7-1-2-1s-2 .44-2 1c0 .59.42 1 2.13 1.26C14.23 11.52 16 12.43 16 14c0 1.38-1.39 2.54-3 2.93z"/>
        </svg>
      </span>
      <span class="text-2xl font-black" style="background:linear-gradient(135deg,#1A6B3C,#155830);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">補助金<span style="-webkit-text-fill-color:#F59E0B;">now</span></span>
    </a>
    <p class="text-lg text-hj-muted leading-relaxed max-w-xl">補助金nowは、日本の補助金・助成金情報を網羅したポータルサイトです。種別・業種・目的で絞り込んで、あなたのビジネスに最適な補助金を見つけよう。</p>
  </div>

  <div class="site-footer__inner">
    <!-- メニュー -->
    <div>
      <p class="footer-heading">メニュー</p>
      <a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="footer-link">ホーム</a>
      <a href="<?php echo esc_url( home_url( '/subsidies/' ) ); ?>" class="footer-link">補助金一覧</a>
      <a href="<?php echo esc_url( home_url( '/subsidies/?meta_key=hj_status&meta_value=募集中' ) ); ?>" class="footer-link">募集中の補助金</a>
      <a href="<?php echo esc_url( home_url( '/blog/' ) ); ?>" class="footer-link">コラム</a>
      <a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>" class="footer-link">申請サポート</a>
      <a href="<?php echo esc_url( home_url( '/shindan/' ) ); ?>" class="footer-link">補助金診断</a>
      <a href="<?php echo esc_url( home_url( '/favorites/' ) ); ?>" class="footer-link">お気に入りリスト</a>
    </div>

    <!-- 補助金種別 -->
    <div>
      <p class="footer-heading">補助金種別</p>
      <?php
      $ft_types = get_terms( array(
        'taxonomy'   => 'subsidy_type',
        'number'     => 10,
        'orderby'    => 'count',
        'order'      => 'DESC',
        'hide_empty' => false,
        'parent'     => 0,
      ) );
      if ( $ft_types && ! is_wp_error( $ft_types ) ) :
        foreach ( $ft_types as $ft ) : ?>
          <a href="<?php echo esc_url( get_term_link( $ft ) ); ?>" class="footer-link">
            <?php echo esc_html( $ft->name ); ?>
            <?php if ( $ft->count > 0 ) : ?><span class="text-xs text-hj-light">(<?php echo esc_html( $ft->count ); ?>)</span><?php endif; ?>
          </a>
        <?php endforeach;
      else : ?>
        <span class="text-sm text-hj-light">準備中...</span>
      <?php endif; ?>
    </div>

    <!-- 対象業種 -->
    <div>
      <p class="footer-heading">対象業種</p>
      <?php
      $ft_industries = get_terms( array(
        'taxonomy'   => 'subsidy_industry',
        'number'     => 8,
        'orderby'    => 'count',
        'order'      => 'DESC',
        'hide_empty' => false,
      ) );
      if ( $ft_industries && ! is_wp_error( $ft_industries ) ) :
        foreach ( $ft_industries as $fi ) : ?>
          <a href="<?php echo esc_url( get_term_link( $fi ) ); ?>" class="footer-link">
            <?php echo esc_html( $fi->name ); ?>
            <?php if ( $fi->count > 0 ) : ?><span class="text-xs text-hj-light">(<?php echo esc_html( $fi->count ); ?>)</span><?php endif; ?>
          </a>
        <?php endforeach;
      else : ?>
        <span class="text-sm text-hj-light">準備中...</span>
      <?php endif; ?>
    </div>

    <!-- サイトについて -->
    <div>
      <p class="footer-heading">サイトについて</p>
      <a href="<?php echo esc_url( home_url( '/terms/' ) ); ?>" class="footer-link">利用規約</a>
      <a href="<?php echo esc_url( home_url( '/privacy/' ) ); ?>" class="footer-link">プライバシーポリシー</a>
      <a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>" class="footer-link">お問い合わせ</a>
      <a href="<?php echo esc_url( home_url( '/subsidies/' ) ); ?>" class="footer-link">補助金を探す</a>
    </div>
  </div>

  <div class="site-footer__bottom">
    <p>&copy; <?php echo esc_html( date( 'Y' ) ); ?> 補助金now. All rights reserved.</p>
    <p class="text-sm text-hj-light">日本最大の補助金・助成金ポータル</p>
  </div>
</footer>

<!-- トップに戻るボタン -->
<button id="hjnaviBackToTop" class="back-to-top" aria-label="ページトップへ戻る" style="display:none">
  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7"/>
  </svg>
</button>

<!-- スクロールアニメーション + トップに戻る -->
<script>
(function(){
  /* スクロールアニメーション（Intersection Observer） */
  var animEls = document.querySelectorAll('.content-section, .subsidy-card, .blog-card, .article-card, .sidebar-widget, .type-pill, .sec-head, [data-anim]');
  if(animEls.length && 'IntersectionObserver' in window){
    animEls.forEach(function(el){ el.classList.add('scroll-anim'); });
    var obs = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ e.target.classList.add('scroll-anim--visible'); obs.unobserve(e.target); }
      });
    }, {threshold:0.08, rootMargin:'0px 0px -40px 0px'});
    animEls.forEach(function(el){ obs.observe(el); });
  }

  /* トップに戻るボタン */
  var btn = document.getElementById('hjnaviBackToTop');
  if(btn){
    var shown = false;
    window.addEventListener('scroll', function(){
      var y = window.pageYOffset || document.documentElement.scrollTop;
      if(y > 600 && !shown){ btn.style.display='flex'; shown=true; }
      else if(y <= 600 && shown){ btn.style.display='none'; shown=false; }
    }, {passive:true});
    btn.addEventListener('click', function(){
      window.scrollTo({top:0, behavior:'smooth'});
    });
  }

  /* スムーズスクロール（TOCリンク） */
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var id = this.getAttribute('href');
      if(id.length > 1){
        var tgt = document.querySelector(id);
        if(tgt){ e.preventDefault(); tgt.scrollIntoView({behavior:'smooth', block:'start'}); }
      }
    });
  });
})();
</script>

<!-- ヒーロー検索（front-page.php等で使うサジェスト） -->
<script>
(function(){
  var ajaxUrl = (typeof hjnaviAjax !== 'undefined') ? hjnaviAjax.url : '/wp-admin/admin-ajax.php';

  // 複数の検索窓に対応（ヘッダー + ヒーロー）
  var searchSets = [
    { input:'hjnaviHeroSearchInput', drop:'hjnaviHeroSearchDrop', results:'hjnaviHeroSearchResults', empty:'hjnaviHeroSearchEmpty', q:'hjnaviHeroSearchQ', wrap:'hjnaviHeroSearchWrap' }
  ];

  searchSets.forEach(function(s){
    var input   = document.getElementById(s.input);
    var drop    = document.getElementById(s.drop);
    var results = document.getElementById(s.results);
    var empty   = document.getElementById(s.empty);
    var qSpan   = document.getElementById(s.q);
    if(!input || !drop) return;

    var timer = null;

    input.addEventListener('input', function(){
      clearTimeout(timer);
      var q = this.value.trim();
      if(q.length < 1){ drop.classList.add('hidden'); return; }
      timer = setTimeout(function(){ doSearch(q, results, empty, qSpan, drop); }, 250);
    });

    input.addEventListener('focus', function(){
      if(this.value.trim().length >= 1 && results && results.children.length > 0) drop.classList.remove('hidden');
    });

    document.addEventListener('click', function(e){
      if(!e.target.closest('#'+s.wrap)) drop.classList.add('hidden');
    });
  });

  function doSearch(q, results, empty, qSpan, drop){
    fetch(ajaxUrl + '?action=hjnavi_search&q=' + encodeURIComponent(q))
      .then(function(r){ return r.json(); })
      .then(function(data){
        results.innerHTML = '';
        if(qSpan) qSpan.textContent = q;
        if(!data.length){
          empty.classList.remove('hidden');
          results.classList.add('hidden');
          drop.classList.remove('hidden');
          return;
        }
        empty.classList.add('hidden');
        results.classList.remove('hidden');
        data.forEach(function(v){
          var a = document.createElement('a');
          a.href = v.url;
          a.className = 'flex items-center gap-3 px-4 py-3 hover:bg-green-50 transition-colors no-underline';
          var statusColor = v.status === '募集中' ? '#1A6B3C' : (v.status === '予定' ? '#1A56DB' : '#9CA3AF');
          a.innerHTML =
            '<div style="width:36px;height:36px;border-radius:10px;background:#f0f7f2;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">💰</div>'
            + '<div style="min-width:0;flex:1;">'
            + '<div style="font-size:13px;font-weight:700;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + v.title + '</div>'
            + '<div style="font-size:11px;color:#6b7280;">'
            + (v.agency ? v.agency : '') + (v.agency && v.amount_max ? ' · ' : '') + (v.amount_max && v.amount_max !== '—' ? '最大 '+v.amount_max : '')
            + '</div></div>'
            + (v.status ? '<span style="font-size:11px;font-weight:700;color:'+statusColor+';flex-shrink:0;">'+v.status+'</span>' : '');
          results.appendChild(a);
        });
        drop.classList.remove('hidden');
      }).catch(function(){});
  }
})();
</script>

<?php wp_footer(); ?>
</body>
</html>
