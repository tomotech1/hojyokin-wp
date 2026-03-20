# 補助金ナビ WP - Claude Code コンテキスト

Claude Codeが起動時に読み込むプロジェクトコンテキスト。

---

## プロジェクト概要

**目的**: 補助金に特化したディレクトリ＋pSEO記事量産型WordPressサイト
**サイトURL（ローカル）**: http://localhost:10016
**管理画面**: http://localhost:10016/wp-admin/
**GitHubリポジトリ**: （未設定）

---

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| CMS | WordPress (LocalWP, PHP 8.2) |
| テーマ・ビルダー | Bricks Builder + NextBricks |
| SEO | SEOPress Pro |
| CSS | TailwindCSS + DaisyUI |
| 自動投稿 | n8n (https://n8n.appexx.me) + Gemini Flash 2.5 |
| 設定管理 | Google Sheets |
| バージョン管理 | GitHub |

---

## ディレクトリ構成

```
C:/Users/apple/Local Sites/hojyokin-wp/   ← プロジェクトルート（ここで作業）
├── assets/css/       TailwindCSSソース
├── docs/             設計ドキュメント
├── n8n-workflows/    n8nワークフローJSON
├── scripts/          シェルスクリプト
└── app/public/       ← WordPress本体（.gitignore済み）
    └── wp-content/
        ├── themes/bricks/    アクティブテーマ
        ├── mu-plugins/       カスタムPHP（テーマ非依存）
        └── plugins/          プラグイン
```

**WP本体パス**: `C:/Users/apple/Local Sites/hojyokin-wp/app/public`

---

## カスタム投稿タイプ（CPT）

### subsidies
- **スラッグ**: `/subsidies/{slug}/`
- **アーカイブ**: `/subsidies/`
- REST APIエンドポイント: `/wp-json/wp/v2/subsidies`

### posts（通常投稿 - pSEO記事）
- **スラッグ**: `/blog/{slug}/`
- 記事タイプ: 補助金解説 / 申請方法 / 比較

---

## タクソノミー

| タクソノミー | スラッグ | 階層 | 対象CPT |
|---|---|---|---|
| subsidy_type | /type/ | あり | subsidies |
| subsidy_industry | /industry/ | なし（タグ型） | subsidies |
| subsidy_purpose | /purpose/ | なし（タグ型） | subsidies |

---

## メタフィールド（subsidies CPT）

| フィールドキー | 型 | 説明 |
|---|---|---|
| hj_amount_max | integer | 上限額（円） |
| hj_amount_rate | string | 補助率（例: "2/3"） |
| hj_deadline | string | 申請締切（YYYY-MM-DD） |
| hj_application_period | string | 公募期間テキスト |
| hj_target | string | 対象者（例: "中小企業・個人事業主"） |
| hj_region | string | 対象地域（例: "全国"） |
| hj_agency | string | 実施機関（例: "経済産業省"） |
| hj_status | string | ステータス（"募集中"/"終了"/"予定"） |
| hj_official_url | string | 公式URL |
| hj_application_url | string | 申請URL |
| hj_min_employees | integer | 最小従業員数 |
| hj_max_employees | integer | 最大従業員数 |
| hj_fiscal_year | string | 対象年度（例: "2025年度"） |

---

## WP CLI コマンド集

```bash
# WP CLI エイリアス（LocalWP PHP経由）
PHP_BIN="C:/Users/apple/AppData/Roaming/Local/lightning-services/php-8.2.29+0/bin/win64/php.exe"
WP_PATH="C:/Users/apple/Local Sites/hojyokin-wp/app/public"
WP_CLI="$PHP_BIN wp-cli.phar --path='$WP_PATH' --url=http://localhost:10016 --allow-root"

# CPT確認
$WP_CLI post-type list

# タクソノミー確認
$WP_CLI taxonomy list

# プラグイン一覧
$WP_CLI plugin list

# パーマリンクフラッシュ
$WP_CLI rewrite flush

# 補助金投稿テスト作成
$WP_CLI post create --post_type=subsidies --post_title="テスト補助金" --post_status=draft
```

---

## n8n 接続情報

- **ベースURL**: https://n8n.appexx.me
- **ワークフロー01**: 補助金ディレクトリ投稿（subsidies）
- **ワークフロー02**: pSEO記事投稿（posts）

---

## カラーテーマ

| 変数名 | カラーコード | 用途 |
|---|---|---|
| hj-primary | #1A6B3C | メインカラー（ダークグリーン） |
| hj-secondary | #1A56DB | セカンダリ（ブルー） |
| hj-accent | #F59E0B | CTA・ハイライト（アンバー） |
| hj-bg | #F0F7F2 | ページ背景（薄緑） |
| hj-hero | #DCF0E4 | ヒーロー背景 |
| hj-border | #D1E7D9 | ボーダー |

---

## コーディング規約

- **PHPコメント**: 日本語
- **標準**: WordPress コーディング標準準拠
- **コミットメッセージ**: 日本語OK・prefix付き（`feat:` / `fix:` / `docs:` / `chore:`）
- **インデント**: PHP = タブ、JS/CSS = スペース2
- **セキュリティ**: 入力は必ずサニタイズ（`esc_*`, `sanitize_*`）

---

## 重要ファイルパス

| ファイル | パス |
|---|---|
| CPT・メタ登録 | `app/public/wp-content/mu-plugins/hojyokin-cpt.php` |
| 記事ウィジェット・ショートコード | `app/public/wp-content/mu-plugins/hojyokin-article-widgets.php` |
| TailwindCSSソース | `assets/css/tailwind.css` |
| TailwindCSSビルド | `app/public/wp-content/plugins/hojyokin-assets/output.css` |
| テンプレート（トップ） | `app/public/wp-content/mu-plugins/hojyokin-templates/front-page.php` |
| テンプレート（記事） | `app/public/wp-content/mu-plugins/hojyokin-templates/single-post.php` |
| テンプレート（補助金詳細） | `app/public/wp-content/mu-plugins/hojyokin-templates/single-subsidies.php` |
| テンプレート（補助金一覧） | `app/public/wp-content/mu-plugins/hojyokin-templates/archive-subsidies.php` |
| テンプレート（ヘッダー） | `app/public/wp-content/mu-plugins/hojyokin-templates/parts/header.php` |
| テンプレート（フッター） | `app/public/wp-content/mu-plugins/hojyokin-templates/parts/footer.php` |
| アセットプラグイン | `app/public/wp-content/plugins/hojyokin-assets/hojyokin-assets.php` |

---

## mu-plugins 構成

| ファイル | 役割 |
|---|---|
| `hojyokin-cpt.php` | CPT/タクソノミー/メタ登録、テンプレートルーティング、Ajax検索、スキーマ出力 |
| `hojyokin-article-widgets.php` | 記事用ショートコード（AI要約/ポイント/マーカー/CTA/投票/評価/長所短所）、関連補助金メタボックス |
| `hojyokin-templates/` | 全テンプレートファイル（front-page/single-post/archive等） |

---

## ショートコード一覧

| ショートコード | 用途 |
|---|---|
| `[hj_summary text="..."]` | AI要約ボックス |
| `[hj_point]...[/hj_point]` | ポイントボックス |
| `[hj_marker color="yellow"]...[/hj_marker]` | マーカーハイライト |
| `[hj_infobox type="info" title="..."]...[/hj_infobox]` | 情報ボックス |
| `[hj_cta url="#" text="..." color="green"]` | CTAボタン |
| `[hj_related_subsidies count="4"]` | 関連補助金カード |
| `[hj_poll question="..." options="A,B,C"]` | アンケート（localStorage） |
| `[hj_rating label="..." score="4.5"]` | 星評価 |
| `[hj_pros_cons pros="A,B" cons="C,D"]` | 長所短所 |

---

## 検索サジェスト（Ajax）

- **バックエンド**: `wp_ajax_hjnavi_search` → WP_Query で subsidies を検索
- **フロントエンド**: ヘッダー検索窓 + トップヒーロー検索窓の両方に対応
- 250msデバウンス、ステータス/上限額をドロップダウン表示

---

## Tailwind CSSビルド

```bash
# vtuber-wpのnode_modulesを流用（hojyokin-wpにはnpm installしない）
cd "C:/Users/apple/Local Sites/vtuber-wp"
node_modules/.bin/tailwindcss -i "C:/Users/apple/Local Sites/hojyokin-wp/assets/css/tailwind.css" -o "C:/Users/apple/Local Sites/hojyokin-wp/app/public/wp-content/plugins/hojyokin-assets/output.css" --config "C:/Users/apple/Local Sites/hojyokin-wp/tailwind.config.js" --minify
```

コンテンツパス（`tailwind.config.js`）:
- `app/public/wp-content/mu-plugins/*.php`
- `app/public/wp-content/mu-plugins/hojyokin-templates/**/*.php`
- `app/public/wp-content/themes/bricks/**/*.php`

---

## 横展開メモ

このサイトはvtuber-wpを補助金ディレクトリ用に横展開したもの。

### 変更ポイント
1. CPT: vtubers/vtuber_groups → subsidies
2. タクソノミー: vtuber_genre/vtuber_game → subsidy_type/subsidy_industry/subsidy_purpose
3. メタフィールド: vt_* → hj_*（補助金固有フィールド）
4. カラー: 青紫グラデーション → グリーン系
5. Ajax検索アクション: vtdb_search → hjnavi_search

### 注意点
- `get_the_excerpt()` を `the_content` フィルタ内やショートコード内で呼ぶと無限再帰→代わりに `$post->post_excerpt` を使用
- `hojyokin-article-widgets.php` はメモリ消費注意（`the_content`フィルタ内での重い処理は避ける）
- PHP memory_limit は 512MB以上推奨（`conf/php/php.ini.hbs` で設定）
- `setup_postdata()` でグローバル `$post` が変わらない場合がある→ `get_the_title($id)` のようにID指定で取得
