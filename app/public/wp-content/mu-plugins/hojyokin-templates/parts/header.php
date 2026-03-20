<?php if ( ! defined( 'ABSPATH' ) ) exit; ?>
<!DOCTYPE html>
<html <?php language_attributes(); ?> data-theme="hjnavi">
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<?php wp_head(); ?>
</head>
<body <?php body_class( 'bg-hj-bg' ); ?>>
<?php wp_body_open(); ?>

<div class="topbar">補助金now — 最新の補助金・助成金情報を無料で検索！申請締切・補助率・上限額を一覧で確認。</div>

<header class="site-header">
  <div class="site-header__inner">
    <!-- ロゴ -->
    <a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="site-logo" style="display:flex;align-items:center;gap:6px;background:none;">
      <span style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#F59E0B,#D97706);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.93V18h-2v-1.07C9.39 16.54 8 15.38 8 14h2c0 .56.7 1 2 1s2-.44 2-1c0-.59-.42-1-2.13-1.26C9.77 12.48 8 11.57 8 10c0-1.38 1.39-2.54 3-2.93V6h2v1.07C14.61 7.46 16 8.62 16 10h-2c0-.56-.7-1-2-1s-2 .44-2 1c0 .59.42 1 2.13 1.26C14.23 11.52 16 12.43 16 14c0 1.38-1.39 2.54-3 2.93z"/></svg>
      </span>
      <span style="font-weight:900;font-size:1.2rem;background:linear-gradient(135deg,#1A6B3C,#155830);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">補助金<span style="-webkit-text-fill-color:#F59E0B;">now</span></span>
    </a>

    <!-- ヘッダー検索（オートコンプリート付き） -->
    <div class="flex-1 max-w-xl hidden sm:block relative" id="hjnaviSearchWrap">
      <form method="get" action="<?php echo esc_url( home_url( '/subsidies/' ) ); ?>" autocomplete="off">
        <input type="search" name="s" id="hjnaviSearchInput"
               placeholder="補助金を検索..."
               class="header-search__input w-full"
               aria-label="補助金を検索"
               aria-autocomplete="list"
               aria-controls="hjnaviSearchDrop">
      </form>
      <!-- オートコンプリート ドロップダウン -->
      <div id="hjnaviSearchDrop" role="listbox"
           class="absolute top-full left-0 right-0 mt-1.5 bg-white border border-hj-border rounded-2xl shadow-2xl z-[200] hidden overflow-hidden">
        <div id="hjnaviSearchResults" class="max-h-96 overflow-y-auto divide-y divide-gray-50"></div>
        <div id="hjnaviSearchEmpty" class="hidden px-5 py-6 text-center text-hj-muted text-base">
          <span class="text-2xl block mb-1">🔍</span>「<span id="hjnaviSearchQ"></span>」に一致する補助金が見つかりません
        </div>
      </div>
    </div>

    <!-- PC ナビゲーション -->
    <nav class="hidden md:flex items-center gap-1 ml-auto">
      <a href="<?php echo esc_url( home_url( '/' ) ); ?>"
         class="header-nav__link <?php echo is_front_page() ? 'font-semibold text-hj-primary' : ''; ?>">ホーム</a>
      <a href="<?php echo esc_url( home_url( '/subsidies/' ) ); ?>"
         class="header-nav__link <?php echo is_post_type_archive( 'subsidies' ) ? 'font-semibold text-hj-primary' : ''; ?>">補助金一覧</a>
      <a href="<?php echo esc_url( home_url( '/subsidy-type/' ) ); ?>"
         class="header-nav__link <?php echo is_tax( 'subsidy_type' ) ? 'font-semibold text-hj-primary' : ''; ?>">種別</a>
      <a href="<?php echo esc_url( home_url( '/industry/' ) ); ?>"
         class="header-nav__link <?php echo is_tax( 'subsidy_industry' ) ? 'font-semibold text-hj-primary' : ''; ?>">業種</a>
      <a href="<?php echo esc_url( home_url( '/shindan/' ) ); ?>"
         class="header-nav__link <?php echo is_page('shindan') ? 'font-semibold text-hj-primary' : ''; ?>">診断</a>
      <a href="<?php echo esc_url( home_url( '/blog/' ) ); ?>"
         class="header-nav__link <?php echo ( is_singular( 'post' ) || is_home() ) && ! is_front_page() ? 'font-semibold text-hj-primary' : ''; ?>">コラム</a>
      <a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>"
         class="header-nav__link">相談</a>
      <a href="<?php echo esc_url( home_url( '/favorites/' ) ); ?>"
         class="header-nav__link <?php echo is_page('favorites') ? 'font-semibold text-hj-primary' : ''; ?>"
         id="hj-fav-nav-link" title="お気に入りリスト">❤️ <span id="hj-fav-count" class="hidden ml-0.5 text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5 font-bold"></span></a>
    </nav>

    <!-- ハンバーガー（モバイル） -->
    <button class="mobile-menu-btn" id="hjnaviMenuBtn" aria-label="メニューを開く" aria-expanded="false">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 12h16M4 18h16"/>
      </svg>
    </button>
  </div>
</header>

<!-- モバイルナビゲーション -->
<div class="mobile-nav" id="hjnaviMobileNav" role="dialog" aria-modal="true" aria-label="ナビゲーション">
  <div class="mobile-nav__panel">
    <div class="flex items-center justify-between px-6 py-4 border-b border-hj-border">
      <span class="flex items-center gap-2">
        <span style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#F59E0B,#D97706);flex-shrink:0;">
          <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.93V18h-2v-1.07C9.39 16.54 8 15.38 8 14h2c0 .56.7 1 2 1s2-.44 2-1c0-.59-.42-1-2.13-1.26C9.77 12.48 8 11.57 8 10c0-1.38 1.39-2.54 3-2.93V6h2v1.07C14.61 7.46 16 8.62 16 10h-2c0-.56-.7-1-2-1s-2 .44-2 1c0 .59.42 1 2.13 1.26C14.23 11.52 16 12.43 16 14c0 1.38-1.39 2.54-3 2.93z"/></svg>
        </span>
        <span class="font-black text-lg" style="background:linear-gradient(135deg,#1A6B3C,#155830);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">補助金<span style="-webkit-text-fill-color:#F59E0B;">now</span></span>
      </span>
      <button id="hjnaviMenuClose" class="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 text-hj-muted hover:bg-gray-200 transition-colors" aria-label="閉じる">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
    <div class="px-5 py-4 border-b border-hj-border">
      <form method="get" action="<?php echo esc_url( home_url( '/subsidies/' ) ); ?>">
        <input type="search" name="s" placeholder="補助金を検索..."
               class="w-full bg-gray-50 border border-hj-border rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-hj-primary/20">
      </form>
    </div>
    <nav class="flex-1 py-2">
      <a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="mobile-nav__link">🏠 ホーム</a>
      <a href="<?php echo esc_url( home_url( '/subsidies/' ) ); ?>" class="mobile-nav__link">💰 補助金一覧</a>
      <a href="<?php echo esc_url( home_url( '/subsidy-type/' ) ); ?>" class="mobile-nav__link">📂 種別から探す</a>
      <a href="<?php echo esc_url( home_url( '/industry/' ) ); ?>" class="mobile-nav__link">🏭 業種から探す</a>
      <a href="<?php echo esc_url( home_url( '/purpose/' ) ); ?>" class="mobile-nav__link">🎯 目的から探す</a>
      <a href="<?php echo esc_url( home_url( '/shindan/' ) ); ?>" class="mobile-nav__link">🔍 補助金診断</a>
      <a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>" class="mobile-nav__link">📋 申請サポート</a>
      <a href="<?php echo esc_url( home_url( '/blog/' ) ); ?>" class="mobile-nav__link">📰 コラム</a>
      <a href="<?php echo esc_url( home_url( '/favorites/' ) ); ?>" class="mobile-nav__link">❤️ お気に入りリスト</a>
    </nav>
    <div class="px-5 pb-6 pt-3 border-t border-hj-border">
      <a href="<?php echo esc_url( home_url( '/subsidies/' ) ); ?>"
         class="block w-full text-center text-white font-black py-3 rounded-2xl no-underline"
         style="background:linear-gradient(135deg,#1A6B3C,#155830)">補助金を探す →</a>
    </div>
  </div>
</div>

<!-- クッキー同意バー -->
<div class="cookie-bar" id="hjnaviCookieBar" style="display:none" role="banner" aria-label="Cookie同意">
  <p class="cookie-bar__text">
    当サイトはCookieを使用してユーザー体験の向上を図っています。サイトを続けて利用することでCookieの使用に同意したものとみなします。
    <a href="<?php echo esc_url( home_url( '/privacy/' ) ); ?>" class="text-hj-accent underline ml-1">プライバシーポリシー</a>
  </p>
  <button class="cookie-bar__btn" id="hjnaviCookieAccept">同意して続ける</button>
  <button class="cookie-bar__close" id="hjnaviCookieClose" aria-label="閉じる">✕</button>
</div>

<script>
(function(){
  /* モバイルメニュー */
  var btn  = document.getElementById('hjnaviMenuBtn');
  var nav  = document.getElementById('hjnaviMobileNav');
  var clos = document.getElementById('hjnaviMenuClose');
  function openNav(){  nav.classList.add('is-open'); document.body.style.overflow='hidden'; btn.setAttribute('aria-expanded','true'); }
  function closeNav(){ nav.classList.remove('is-open'); document.body.style.overflow=''; btn.setAttribute('aria-expanded','false'); }
  if(btn)  btn.addEventListener('click', openNav);
  if(clos) clos.addEventListener('click', closeNav);
  if(nav)  nav.addEventListener('click', function(e){ if(e.target===nav) closeNav(); });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeNav(); });

  /* クッキーバー */
  var bar  = document.getElementById('hjnaviCookieBar');
  var acc  = document.getElementById('hjnaviCookieAccept');
  var cls2 = document.getElementById('hjnaviCookieClose');
  if(bar && !localStorage.getItem('hjnavi_cookie_ok')){
    bar.style.display = 'flex';
    if(acc)  acc.addEventListener('click',  function(){ localStorage.setItem('hjnavi_cookie_ok','1'); bar.style.display='none'; });
    if(cls2) cls2.addEventListener('click', function(){ bar.style.display='none'; });
  }

  /* Ajax オートコンプリート検索 */
  var searchInput   = document.getElementById('hjnaviSearchInput');
  var searchDrop    = document.getElementById('hjnaviSearchDrop');
  var searchResults = document.getElementById('hjnaviSearchResults');
  var searchEmpty   = document.getElementById('hjnaviSearchEmpty');
  var searchQ       = document.getElementById('hjnaviSearchQ');
  var searchTimer   = null;

  function hjSearchClose(){ if(searchDrop) searchDrop.classList.add('hidden'); }
  function hjSearchOpen(){  if(searchDrop) searchDrop.classList.remove('hidden'); }

  if(searchInput){
    searchInput.addEventListener('input', function(){
      clearTimeout(searchTimer);
      var q = this.value.trim();
      if(q.length < 1){ hjSearchClose(); return; }
      searchTimer = setTimeout(function(){ hjDoSearch(q); }, 250);
    });
    searchInput.addEventListener('focus', function(){
      if(this.value.trim().length >= 1 && searchResults && searchResults.children.length > 0) hjSearchOpen();
    });
  }
  document.addEventListener('click', function(e){
    var wrap = document.getElementById('hjnaviSearchWrap');
    if(wrap && !wrap.contains(e.target)) hjSearchClose();
  });

  function hjDoSearch(q){
    var ajaxUrl = (typeof hjnaviAjax !== 'undefined') ? hjnaviAjax.url : '/wp-admin/admin-ajax.php';
    fetch(ajaxUrl + '?action=hjnavi_search&q=' + encodeURIComponent(q))
      .then(function(r){ return r.json(); })
      .then(function(data){
        if(!searchResults || !searchEmpty || !searchQ) return;
        searchResults.innerHTML = '';
        if(data.length === 0){
          searchResults.classList.add('hidden');
          searchEmpty.classList.remove('hidden');
          searchQ.textContent = q;
        } else {
          searchEmpty.classList.add('hidden');
          searchResults.classList.remove('hidden');
          data.forEach(function(item){
            var a = document.createElement('a');
            a.href = item.url;
            a.className = 'flex items-center gap-3 px-4 py-3 hover:bg-hj-bg transition-colors no-underline group';
            a.setAttribute('role','option');
            var statusColor = item.status === '募集中' ? '#1A6B3C' : (item.status === '予定' ? '#1A56DB' : '#9CA3AF');
            var badge = item.status
              ? '<span style="font-size:12px;font-weight:700;color:'+statusColor+';background:'+statusColor+'15;padding:2px 8px;border-radius:99px;flex-shrink:0;">'+hjEsc(item.status)+'</span>'
              : '';
            var amount = item.amount_max && item.amount_max !== '—'
              ? '<span style="font-size:13px;color:#6B7280;">最大 '+hjEsc(item.amount_max)+'</span>'
              : '';
            a.innerHTML = '<div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style="background:#f0f7f2;">💰</div>'
              + '<div class="flex-1 min-w-0">'
              + '<p style="font-size:15px;font-weight:700;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+hjEsc(item.title)+'</p>'
              + (item.agency ? '<p style="font-size:13px;color:#6B7280;">'+hjEsc(item.agency)+'</p>' : '')
              + '</div>'
              + '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex-shrink:0;">'
              + badge + amount
              + '</div>';
            searchResults.appendChild(a);
          });
          /* 全件検索リンク */
          var all = document.createElement('a');
          all.href = '<?php echo esc_js( home_url( '/subsidies/' ) ); ?>?s=' + encodeURIComponent(q);
          all.className = 'flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-hj-primary hover:bg-hj-bg transition-colors no-underline border-t border-hj-border';
          all.innerHTML = '🔍 「'+hjEsc(q)+'」の全件検索結果を見る →';
          searchResults.appendChild(all);
        }
        hjSearchOpen();
      })
      .catch(function(){ hjSearchClose(); });
  }

  function hjEsc(str){
    return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* お気に入り件数バッジ */
  (function(){
    function updateFavBadge(){
      var badge = document.getElementById('hj-fav-count');
      if(!badge) return;
      try {
        var favs = JSON.parse(localStorage.getItem('hj_favs') || '[]');
        if(favs.length > 0){
          badge.textContent = favs.length;
          badge.classList.remove('hidden');
        } else {
          badge.classList.add('hidden');
        }
      } catch(e){}
    }
    updateFavBadge();
    window.addEventListener('storage', updateFavBadge);
  })();
})();
</script>
