<?php
/**
 * 補助金now - page-favorites.php
 * お気に入りリスト（localStorage から IDs を取得し REST API で表示）
 */
if ( ! defined( 'ABSPATH' ) ) exit;
include __DIR__ . '/parts/header.php';
?>

<nav class="breadcrumb bg-hj-bg">
  <a href="<?php echo esc_url( home_url( '/' ) ); ?>">ホーム</a>
  <span class="bc-sep">/</span>
  <span class="bc-current">お気に入りリスト</span>
</nav>

<div class="max-w-site mx-auto px-5 py-10">

  <!-- ページヘッダー -->
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center gap-3">
      <span class="text-2xl">❤️</span>
      <div>
        <h1 class="text-xl font-black text-hj-text">お気に入りリスト</h1>
        <p class="text-xs text-hj-muted mt-0.5">保存した補助金をまとめて確認できます</p>
      </div>
    </div>
    <button id="fav-clear-all"
            class="text-xs text-red-500 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors hidden">
      すべて削除
    </button>
  </div>

  <!-- ローディング -->
  <div id="fav-loading" class="flex flex-col items-center justify-center py-20 gap-3">
    <div class="w-10 h-10 border-4 border-hj-primary border-t-transparent rounded-full animate-spin"></div>
    <p class="text-sm text-hj-muted">読み込み中...</p>
  </div>

  <!-- 空状態 -->
  <div id="fav-empty" class="hidden">
    <div class="flex flex-col items-center justify-center py-24 gap-4">
      <div class="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-4xl">🤍</div>
      <div class="text-center">
        <p class="font-bold text-hj-text text-base mb-1">お気に入りがまだありません</p>
        <p class="text-sm text-hj-muted">補助金詳細ページの ❤️ ボタンで保存できます</p>
      </div>
      <a href="<?php echo esc_url( home_url( '/subsidies/' ) ); ?>"
         class="mt-2 inline-flex items-center gap-2 bg-hj-primary text-white text-sm font-bold px-5 py-2.5 rounded-xl no-underline hover:opacity-90 transition-opacity">
        💰 補助金一覧を見る
      </a>
    </div>
  </div>

  <!-- 件数 -->
  <p id="fav-count" class="text-sm text-hj-muted mb-4 hidden"><span id="fav-num">0</span> 件保存中</p>

  <!-- カードグリッド -->
  <div id="fav-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 hidden"></div>

  <!-- 比較バー（2件以上選択時） -->
  <div id="fav-compare-bar"
       class="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-hj-primary shadow-2xl z-50 px-4 py-3 hidden">
    <div class="max-w-site mx-auto flex items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <span class="text-sm font-bold text-hj-primary"><span id="compare-num">0</span> 件選択中</span>
        <span class="text-xs text-hj-muted hidden sm:inline">（最大3件まで比較できます）</span>
      </div>
      <div class="flex gap-2">
        <button id="compare-clear" class="text-xs border border-hj-border rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
          選択解除
        </button>
        <button id="compare-btn"
                class="text-xs bg-hj-primary text-white font-bold rounded-lg px-4 py-1.5 hover:opacity-90 transition-opacity disabled:opacity-40"
                disabled>
          比較する →
        </button>
      </div>
    </div>
  </div>

  <!-- 比較モーダル -->
  <div id="compare-modal"
       class="fixed inset-0 bg-black/50 z-[300] hidden items-start justify-center overflow-y-auto py-10 px-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-5xl">
      <div class="flex items-center justify-between px-6 py-4 border-b border-hj-border">
        <h2 class="font-black text-lg text-hj-text">補助金を比較</h2>
        <button id="compare-modal-close"
                class="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-hj-muted">
          ✕
        </button>
      </div>
      <div id="compare-table-wrap" class="overflow-x-auto p-4"></div>
    </div>
  </div>

</div>

<script>
(function(){
  var STORAGE_KEY = 'hj_favs';
  var REST_URL    = '<?php echo esc_js( rest_url( 'wp/v2/subsidies' ) ); ?>';

  var loading     = document.getElementById('fav-loading');
  var emptyEl     = document.getElementById('fav-empty');
  var grid        = document.getElementById('fav-grid');
  var countEl     = document.getElementById('fav-count');
  var numEl       = document.getElementById('fav-num');
  var clearAllBtn = document.getElementById('fav-clear-all');

  var compareBar  = document.getElementById('fav-compare-bar');
  var compareNum  = document.getElementById('compare-num');
  var compareBtn  = document.getElementById('compare-btn');
  var compareClear= document.getElementById('compare-clear');
  var compareModal= document.getElementById('compare-modal');
  var compareTableWrap = document.getElementById('compare-table-wrap');
  var compareModalClose = document.getElementById('compare-modal-close');

  var selectedIds = [];

  /* ---------- localStorage helpers ---------- */
  function getFavs(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch(e){ return []; }
  }
  function saveFavs(arr){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }
  function removeFav(id){
    var arr = getFavs().filter(function(x){ return x != id; });
    saveFavs(arr);
  }

  /* ---------- render ---------- */
  function statusColor(s){
    if(s==='募集中') return '#1A6B3C';
    if(s==='予定') return '#1A56DB';
    return '#9CA3AF';
  }

  function renderCard(item){
    var meta      = item.meta || {};
    var status    = meta.hj_status || '';
    var deadline  = meta.hj_deadline || '';
    var amountRaw = meta.hj_amount_max || 0;
    var agency    = meta.hj_agency || '';
    var title     = item.title && item.title.rendered ? item.title.rendered : '（タイトル不明）';
    var url       = item.link || '#';
    var id        = item.id;

    // 金額フォーマット（万円単位）
    var amount = '—';
    if(amountRaw){
      var n = parseInt(amountRaw,10);
      if(n >= 10000){
        var o = n/10000;
        amount = (o===Math.floor(o)?o:o.toFixed(1)) + '億円';
      } else {
        amount = n.toLocaleString() + '万円';
      }
    }

    var sColor = statusColor(status);
    var isSelected = selectedIds.indexOf(id) !== -1;

    var card = document.createElement('div');
    card.className = 'subsidy-card relative group';
    card.dataset.id = id;
    card.innerHTML =
      '<div class="absolute top-3 right-3 flex gap-1.5">'
      + '<button class="fav-compare-chk w-7 h-7 rounded-lg border-2 flex items-center justify-center text-xs font-black transition-all '
      + (isSelected ? 'bg-hj-primary border-hj-primary text-white' : 'border-gray-200 text-gray-400 bg-white hover:border-hj-primary')
      + '" data-id="'+id+'" title="比較に追加">'
      + (isSelected ? '✓' : '+')
      + '</button>'
      + '<button class="fav-remove-btn w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-sm transition-colors" data-id="'+id+'" title="お気に入りから削除">❤️</button>'
      + '</div>'
      + (status ? '<span style="font-size:11px;font-weight:700;color:'+sColor+';background:'+sColor+'18;padding:2px 8px;border-radius:99px;">'+escHtml(status)+'</span>' : '')
      + '<a href="'+url+'" class="block no-underline">'
      + '<h3 class="subsidy-card__name mt-2 pr-16">'+escHtml(title)+'</h3>'
      + '<div class="mt-2 flex items-center gap-2">'
      + '<span style="font-size:11px;color:#6B7280;">最大</span>'
      + '<span class="subsidy-card__amount">'+escHtml(amount)+'</span>'
      + '</div>'
      + (agency ? '<p style="font-size:11px;color:#9CA3AF;margin-top:4px;">'+escHtml(agency)+'</p>' : '')
      + (deadline ? '<p style="font-size:11px;color:#DC2626;margin-top:6px;font-weight:600;">🗓 締切: '+escHtml(deadline)+'</p>' : '')
      + '</a>';

    // 削除ボタン
    card.querySelector('.fav-remove-btn').addEventListener('click', function(){
      var rid = parseInt(this.dataset.id, 10);
      removeFav(rid);
      card.style.transition = 'opacity 0.3s';
      card.style.opacity = '0';
      setTimeout(function(){ card.remove(); checkEmpty(); }, 300);
      // 比較からも外す
      selectedIds = selectedIds.filter(function(x){ return x !== rid; });
      updateCompareBar();
    });

    // 比較チェック
    card.querySelector('.fav-compare-chk').addEventListener('click', function(){
      var cid = parseInt(this.dataset.id, 10);
      var idx = selectedIds.indexOf(cid);
      if(idx === -1){
        if(selectedIds.length >= 3){ alert('比較は最大3件までです'); return; }
        selectedIds.push(cid);
        this.classList.add('bg-hj-primary','border-hj-primary','text-white');
        this.classList.remove('border-gray-200','text-gray-400');
        this.textContent = '✓';
      } else {
        selectedIds.splice(idx,1);
        this.classList.remove('bg-hj-primary','border-hj-primary','text-white');
        this.classList.add('border-gray-200','text-gray-400');
        this.textContent = '+';
      }
      updateCompareBar();
    });

    return card;
  }

  function checkEmpty(){
    var ids = getFavs();
    if(!grid.children.length || ids.length === 0){
      grid.classList.add('hidden');
      countEl.classList.add('hidden');
      clearAllBtn.classList.add('hidden');
      emptyEl.classList.remove('hidden');
    } else {
      numEl.textContent = ids.length;
    }
  }

  function updateCompareBar(){
    compareNum.textContent = selectedIds.length;
    if(selectedIds.length >= 2){
      compareBar.classList.remove('hidden');
      compareBtn.disabled = false;
    } else if(selectedIds.length === 1){
      compareBar.classList.remove('hidden');
      compareBtn.disabled = true;
    } else {
      compareBar.classList.add('hidden');
    }
  }

  /* ---------- compare modal ---------- */
  function openCompareModal(){
    var items = allItems.filter(function(it){ return selectedIds.indexOf(it.id) !== -1; });
    if(!items.length) return;

    var rows = [
      {label:'補助金名', fn: function(m){ return '<a href="'+m.link+'" class="text-hj-primary underline text-sm">'+escHtml((m.title&&m.title.rendered)||'—')+'</a>'; }},
      {label:'ステータス', fn: function(m){ var s=m.meta&&m.meta.hj_status||'—'; return '<span style="font-weight:700;color:'+statusColor(s)+'">'+escHtml(s)+'</span>'; }},
      {label:'最大補助額', fn: function(m){ var n=parseInt((m.meta&&m.meta.hj_amount_max)||0,10); if(!n) return '—'; return n>=10000?(n/10000).toFixed(n%10000===0?0:1)+'億円':n.toLocaleString()+'万円'; }},
      {label:'申請締切', fn: function(m){ return escHtml((m.meta&&m.meta.hj_deadline)||'—'); }},
      {label:'対象者', fn: function(m){ return escHtml((m.meta&&m.meta.hj_target)||'—'); }},
      {label:'実施機関', fn: function(m){ return escHtml((m.meta&&m.meta.hj_agency)||'—'); }},
    ];

    var html = '<table style="width:100%;border-collapse:collapse;font-size:13px;">';
    rows.forEach(function(row){
      html += '<tr style="border-bottom:1px solid #f0f0f0;">';
      html += '<td style="padding:10px 12px;font-weight:700;color:#6B7280;white-space:nowrap;background:#fafafa;width:90px;">'+escHtml(row.label)+'</td>';
      items.forEach(function(item){
        html += '<td style="padding:10px 12px;vertical-align:top;">'+row.fn(item)+'</td>';
      });
      html += '</tr>';
    });
    html += '</table>';

    compareTableWrap.innerHTML = html;
    compareModal.classList.remove('hidden');
    compareModal.style.display = 'flex';
  }

  compareBtn && compareBtn.addEventListener('click', openCompareModal);
  compareClear && compareClear.addEventListener('click', function(){
    selectedIds = [];
    updateCompareBar();
    // チェックボタン状態リセット
    document.querySelectorAll('.fav-compare-chk').forEach(function(btn){
      btn.classList.remove('bg-hj-primary','border-hj-primary','text-white');
      btn.classList.add('border-gray-200','text-gray-400');
      btn.textContent = '+';
    });
  });
  compareModalClose && compareModalClose.addEventListener('click', function(){
    compareModal.classList.add('hidden');
    compareModal.style.display = 'none';
  });
  compareModal && compareModal.addEventListener('click', function(e){
    if(e.target === compareModal){ compareModal.classList.add('hidden'); compareModal.style.display='none'; }
  });

  clearAllBtn && clearAllBtn.addEventListener('click', function(){
    if(!confirm('お気に入りをすべて削除しますか？')) return;
    saveFavs([]);
    grid.innerHTML = '';
    checkEmpty();
    selectedIds = [];
    updateCompareBar();
  });

  /* ---------- fetch ---------- */
  var allItems = [];

  function loadFavorites(){
    var ids = getFavs();
    if(!ids || ids.length === 0){
      loading.classList.add('hidden');
      emptyEl.classList.remove('hidden');
      return;
    }

    // REST APIで一括取得
    fetch(REST_URL + '?include=' + ids.join(',') + '&per_page=100&_fields=id,title,link,meta')
      .then(function(r){ return r.json(); })
      .then(function(items){
        loading.classList.add('hidden');
        if(!items || items.length === 0){
          emptyEl.classList.remove('hidden');
          return;
        }
        allItems = items;
        // localStorage の並び順に合わせる
        items.sort(function(a,b){
          return ids.indexOf(a.id) - ids.indexOf(b.id);
        });
        items.forEach(function(item){
          grid.appendChild(renderCard(item));
        });
        grid.classList.remove('hidden');
        countEl.classList.remove('hidden');
        clearAllBtn.classList.remove('hidden');
        numEl.textContent = items.length;
      })
      .catch(function(){
        loading.classList.add('hidden');
        emptyEl.classList.remove('hidden');
      });
  }

  function escHtml(str){
    return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  loadFavorites();
})();
</script>

<?php include __DIR__ . '/parts/footer.php'; ?>
