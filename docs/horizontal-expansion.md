# 横展開ガイド - 同構成・別ジャンルサイト作成手順

このドキュメントは、補助金ナビ（hojyokin-wp）と同じ構成・デザインを使い、
ジャンルを変えた新しいディレクトリ＋pSEOサイトを作るための手順書です。

---

## 構成概要（横展開元: 補助金ナビ）

```
ジャンル例: 補助金 → 助成金 / 医療機器 / 不動産 / 転職エージェント / SaaSツール 等
```

### サイト構造
- **ディレクトリ部分**: カスタム投稿タイプ（CPT）でエントリを管理
- **pSEO記事部分**: 通常投稿（posts）でロングテール記事を量産
- **タクソノミー**: 種別・業種・目的など3軸で分類
- **検索**: Ajax リアルタイムサジェスト
- **お気に入り**: localStorage ベースのクライアントサイドお気に入り

---

## 横展開の手順

### Step 1: LocalWPで新サイトを作成

1. LocalWP で新サイトを作成（PHP 8.2、Nginx）
2. WordPress インストール完了後、以下のプラグインを有効化:
   - Bricks Builder + NextBricks
   - SEOPress Pro
   - Application Passwords（REST API認証用）
3. hojyokin-wp の `app/public/wp-content/mu-plugins/` を新サイトにコピー
4. hojyokin-wp の `app/public/wp-content/plugins/hojyokin-assets/` をコピー

### Step 2: ファイルのリネーム・置換

以下のファイルで **`hj`・`hojyokin`・`subsidies`** を新ジャンルのプレフィックスに一括置換する。

| 旧（補助金） | 新（例: 医療機器 `mk`） |
|---|---|
| `hojyokin-cpt.php` | `medinavi-cpt.php` |
| `hojyokin-article-widgets.php` | `medinavi-article-widgets.php` |
| `hojyokin-assets/` | `medinavi-assets/` |
| prefix `hj_` | prefix `mk_` |
| CPT slug `subsidies` | CPT slug `devices` |
| ajax action `hjnavi_search` | ajax action `mknavi_search` |
| function prefix `hjnavi_` | function prefix `mknavi_` |

**置換が必要なファイル:**
- `mu-plugins/hojyokin-cpt.php` （全体）
- `mu-plugins/hojyokin-article-widgets.php` （全体）
- `mu-plugins/hojyokin-templates/*.php` （全ファイル）
- `plugins/hojyokin-assets/hojyokin-assets.php`
- `assets/css/tailwind.css`（クラス名 `hj-*`）
- `tailwind.config.js`（パス）

### Step 3: CPT・タクソノミー・メタフィールドの変更

`{prefix}-cpt.php` を編集して、ジャンルに合ったフィールドを定義する。

#### 補助金の場合（参考）
```php
// メタフィールド例
'hj_amount_max'   // 上限額（万円整数）
'hj_amount_rate'  // 補助率
'hj_deadline'     // 申請締切
'hj_status'       // ステータス
'hj_agency'       // 実施機関
'hj_region'       // 対象地域
```

#### 新ジャンルの場合（転職エージェント例）
```php
// メタフィールド例
'ta_annual_income'   // 平均年収アップ率
'ta_job_count'       // 求人数（整数）
'ta_speciality'      // 得意業種
'ta_support_type'    // サポート種別
'ta_fee'             // 手数料（無料/有料）
'ta_response_time'   // 返答スピード
```

> ⚠️ **REST API登録必須**: `register_rest_field()` または CPT登録時の `meta` 引数で
> `'show_in_rest' => true` を設定しないと、REST API経由で保存できない（サイレント無視）。

### Step 4: カラーテーマの変更

`assets/css/tailwind.css` の CSS変数を変更:

```css
/* 補助金ナビ（グリーン系） */
--hj-primary: #1A6B3C;
--hj-bg: #F0F7F2;
--hj-hero: #DCF0E4;
--hj-border: #D1E7D9;

/* 変更例: 医療（ブルー系） */
--mk-primary: #1A4B8C;
--mk-bg: #F0F4FF;
--mk-hero: #DCE8FF;
--mk-border: #D1DCFF;
```

Tailwind設定（`tailwind.config.js`）も合わせてクラス名を更新する。

### Step 5: テンプレートのコンテンツ変更

各テンプレートの「補助金」「hj_」等の参照箇所を変更する。

| テンプレート | 主な変更箇所 |
|---|---|
| `front-page.php` | ヒーロー文言、検索プレースホルダー、セクション名 |
| `single-{cpt}.php` | 詳細テーブルのフィールドラベル、サイドバー内容 |
| `archive-{cpt}.php` | フィルター項目、カード表示フィールド |
| `single-post.php` | 関連エントリのセクション名 |
| `parts/header.php` | サイト名、ナビゲーション |
| `parts/footer.php` | フッターテキスト |

### Step 6: wp-config.php の設定

新サイトの `wp-config.php` 先頭に追加:

```php
// 環境自動判定（ドメイン名を新サイトのものに変更）
if ( isset( $_SERVER['HTTP_HOST'] ) && strpos( $_SERVER['HTTP_HOST'], '新ドメイン.jp' ) !== false ) {
    define( 'WP_HOME',    'https://新ドメイン.jp' );
    define( 'WP_SITEURL', 'https://新ドメイン.jp' );
} else {
    define( 'WP_HOME',    'http://localhost:XXXXX' );
    define( 'WP_SITEURL', 'http://localhost:XXXXX' );
}
```

### Step 7: データ登録スクリプトの作成

`scripts/register-{genre}-bulk1.mjs` を作成する。

#### スクリプトのテンプレート

```js
import fetch from 'node-fetch';

const BASE = 'http://localhost:XXXXX';
const AUTH = 'Basic ' + Buffer.from('admin:アプリパスワード').toString('base64');
const CPT  = 'devices'; // 新CPTのスラッグ

async function post(title, field1, field2, ...) {
  const r = await fetch(`${BASE}/wp-json/wp/v2/${CPT}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: AUTH },
    body: JSON.stringify({
      title,
      status: 'publish',
      content: '...',
      meta: {
        mk_field1: field1,  // ← 必ずREST API登録済みのフィールド名を使う
        mk_field2: field2,
      }
    }),
  });
  const j = await r.json();
  if (j.id) console.log(`OK [${j.id}]: ${title}`);
  else console.error(`ERR: ${title}`, JSON.stringify(j).slice(0, 120));
}

// エントリ登録
await post('エントリ名1', 'value1', 'value2');
await post('エントリ名2', 'value1', 'value2');
```

#### 実行
```bash
node scripts/register-{genre}-bulk1.mjs
```

### Step 8: 投稿日ランダム化

コンテンツ登録後、全投稿の日付を自然に見せるため `randomize-dates-v2.mjs` を実行:

```bash
# BASE URLとCPT名を変更して実行
node scripts/randomize-dates-v2.mjs
```

> ⚠️ **注意**: 未来日付はWordPressが自動的に `future`（非公開）にする。
> `randomize-dates-v2.mjs` は「昨日まで」の日付のみ設定するので安全。

---

## チェックリスト

### ファイル準備
- [ ] mu-plugins をコピー・リネーム
- [ ] hojyokin-assets プラグインをコピー・リネーム
- [ ] tailwind.css をコピー・CSS変数更新
- [ ] tailwind.config.js のパス更新

### CPT/タクソノミー設定
- [ ] CPTスラッグ・ラベルを変更
- [ ] タクソノミーを新ジャンルに合わせて設計
- [ ] メタフィールドを `register_rest_field()` で REST API に登録
- [ ] パーマリンクをフラッシュ（`wp rewrite flush`）

### テンプレート
- [ ] `front-page.php` のヒーロー・セクション文言を変更
- [ ] `single-{cpt}.php` の詳細テーブルをフィールドに合わせて変更
- [ ] `archive-{cpt}.php` のフィルター・カードを変更
- [ ] カード金額相当フィールドの赤文字表示（`style="color:#dc2626;"`）
- [ ] `parts/header.php` のサイト名・ナビを変更
- [ ] お気に入りボタン（`hj-fav-btn` → `{prefix}-fav-btn`）のJS更新

### CSS/デザイン
- [ ] カラー変数を新テーマカラーに変更
- [ ] Tailwindをリビルド
- [ ] `subsidy-card__amount` 等のクラス名を更新

### WordPress設定
- [ ] wp-config.php に環境自動判定を追加
- [ ] Application Passwords を発行（REST API用）
- [ ] パーマリンク設定を「投稿名」に変更

### コンテンツ
- [ ] データ登録スクリプトを作成・実行（最低100件）
- [ ] タクソノミータームを事前登録
- [ ] 投稿日ランダム化スクリプトを実行
- [ ] future ステータスの投稿がないか確認

### 本番環境
- [ ] Cloudflare Tunnel または本番サーバーにデプロイ
- [ ] wp-config.php のドメイン設定を確認
- [ ] SEOPress のサイトマップを有効化

---

## 横展開元サイト一覧

| サイト名 | ジャンル | ローカルURL | 本番URL | GitHub |
|---|---|---|---|---|
| 補助金ナビ | 補助金・助成金 | localhost:10010 | https://fessel.jp | tomotech1/hojyokin-wp |
| vtuber-wp | VTuber | localhost:10011 | - | - |

---

## よくある落とし穴

### メタフィールドが保存されない
REST APIでメタを更新しようとしても保存されない場合、フィールドが `register_rest_field()` または
`register_post_meta()` で登録されていない。**サイレント無視**される点に注意。

```php
// hojyokin-cpt.php の例（show_in_rest: true が必須）
register_post_meta( 'subsidies', 'hj_amount_max', [
    'type'         => 'integer',
    'single'       => true,
    'show_in_rest' => true,  // ← これがないとREST APIから保存できない
] );
```

### 未来日付で投稿が非公開になる
`post_date` が現在時刻より未来の場合、WordPressは自動的に `post_status = 'future'`（非公開）にする。
→ `randomize-dates-v2.mjs` は昨日以前の日付のみ使用しているので安全。
→ 問題が起きた場合は `fix-future-posts.mjs` で修正。

### WordPressのURL設定が変わってしまう
Cloudflare TunnelなどでURLが変わると、DBの `siteurl`/`home` オプションが書き換わる。
→ `wp-config.php` の `define('WP_HOME', ...)` で上書きすれば常に正しいURLになる。

### Tailwind のクラスが効かない
- `text-white/8` のような非標準opacity値はコンパイルされない → `style="color:rgba(255,255,255,0.08)"` を使う
- `tailwind.config.js` の content パスに PHP ファイルが含まれているか確認
- ビルド後に `output.css` が更新されているか確認

### `position:sticky` が効かない
親要素に `overflow: hidden` があると `sticky` が無効になる。
サイドバー等は `<aside>` 要素自体に `style="position:sticky;top:1.5rem;align-self:start;"` を設定する。
