/** @type {import('tailwindcss').Config} */
module.exports = {
  // ============================================================
  // コンテンツパス: Bricks テーマ + プロジェクト内テンプレート
  // ============================================================
  content: [
    './app/public/wp-content/themes/bricks/**/*.php',
    './app/public/wp-content/themes/bricks/**/*.js',
    './theme/**/*.php',
    './theme/**/*.html',
    './app/public/wp-content/mu-plugins/*.php',
    './app/public/wp-content/mu-plugins/hojyokin-templates/**/*.php',
    './app/public/wp-content/plugins/nextbricks/**/*.php',
  ],

  theme: {
    extend: {
      colors: {
        // 補助金ナビ カラーパレット（グリーン系）
        hj: {
          // ページ背景（薄緑）
          bg:          '#F0F7F2',
          // ヒーローセクション背景
          hero:        '#DCF0E4',
          // プライマリ（ダークグリーン）
          primary:     '#1A6B3C',
          'primary-h': '#155830',
          // セカンダリ（ブルー）
          secondary:   '#1A56DB',
          // アクセント（アンバー - CTAボタン）
          accent:      '#F59E0B',
          'accent-h':  '#D97706',
          // テキスト
          dark:        '#111827',
          muted:       '#6B7280',
          light:       '#9CA3AF',
          // ボーダー
          border:      '#D1E7D9',
          'border-d':  '#B2D4BE',
          // カード背景
          card:        '#FFFFFF',
          // トップバー背景
          topbar:      '#1A6B3C',
          // スターカラー
          star:        '#F59E0B',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', '"Inter"', 'ui-sans-serif', 'sans-serif'],
      },
      maxWidth: {
        'site': '1200px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,.08), 0 1px 2px -1px rgba(0,0,0,.08)',
        'card-hover': '0 4px 6px -1px rgba(0,0,0,.10), 0 2px 4px -2px rgba(0,0,0,.10)',
      },
    },
  },

  plugins: [
    require('C:/Users/apple/Local Sites/vtuber-wp/node_modules/@tailwindcss/typography'),
    require('C:/Users/apple/Local Sites/vtuber-wp/node_modules/daisyui'),
  ],

  daisyui: {
    themes: [
      {
        // 補助金ナビ ライトテーマ（グリーン系）
        hjnavi: {
          'primary':          '#1A6B3C',
          'primary-content':  '#ffffff',
          'secondary':        '#1A56DB',
          'secondary-content':'#ffffff',
          'accent':           '#F59E0B',
          'accent-content':   '#ffffff',
          'neutral':          '#374151',
          'neutral-content':  '#ffffff',
          'base-100':         '#F0F7F2',
          'base-200':         '#DCF0E4',
          'base-300':         '#B2D4BE',
          'base-content':     '#111827',
          'info':             '#1A56DB',
          'success':          '#1A6B3C',
          'warning':          '#F59E0B',
          'error':            '#EF4444',
        },
      },
    ],
    darkTheme: false,
    base: true,
    styled: true,
    utils: true,
    logs: false,
  },
};
