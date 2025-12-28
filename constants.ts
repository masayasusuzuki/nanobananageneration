import { ImageStyle, LPSection, LPTone, LPAspectRatio, StyleChangeType, StyleChangeAspectRatio, ImageGenAspectRatio, SlidePageType, SlideAspectRatio, SlideGenerationMode } from './types';

export const STYLE_OPTIONS = [
  { id: ImageStyle.REALISTIC, label: 'リアル / 写真', description: '写実的な写真品質' },
  { id: ImageStyle.CINEMATIC, label: 'シネマティック', description: '映画のようなドラマチックな照明と構図' },
  { id: ImageStyle.ANIME, label: 'アニメ / 漫画', description: '日本のアニメ・漫画スタイル' },
  { id: ImageStyle.DIGITAL_ART, label: 'デジタルアート', description: 'クリアで美しいデジタルイラスト' },
  { id: ImageStyle.OIL_PAINTING, label: '油絵', description: 'クラシックな筆致とテクスチャ' },
  { id: ImageStyle.CYBERPUNK, label: 'サイバーパンク', description: '近未来的なネオンの美学' },
  { id: ImageStyle.FANTASY, label: 'ファンタジー', description: '魔法的で幻想的な世界観' },
  { id: ImageStyle.STUDIO_HEADSHOT, label: 'スタジオ撮影', description: 'プロフェッショナルなポートレート照明' },
];

export const MODEL_NAME = 'gemini-3-pro-image-preview';

// LP Section Options
export const LP_SECTION_OPTIONS = [
  { id: LPSection.HERO, label: 'ヒーローセクション', description: 'ファーストビュー・メインビジュアル' },
  { id: LPSection.PROBLEM, label: '課題提示', description: 'ユーザーの悩み・課題を提示' },
  { id: LPSection.SOLUTION, label: '解決', description: '課題に対するソリューション提示' },
  { id: LPSection.BEFORE_AFTER, label: 'ビフォーアフター', description: '導入前後の変化を視覚化' },
  { id: LPSection.FEATURES, label: '特徴・機能紹介', description: '商品・サービスの特徴を紹介' },
  { id: LPSection.TESTIMONIALS, label: 'お客様の声', description: 'レビュー・testimonial' },
  { id: LPSection.CTA, label: 'CTA（行動喚起）', description: '申し込み・購入ボタンエリア' },
  { id: LPSection.ABOUT, label: '会社・サービス紹介', description: 'About Us セクション' },
  { id: LPSection.PHILOSOPHY, label: '理念', description: 'ミッション・ビジョン・バリュー' },
  { id: LPSection.PRICING, label: '料金プラン', description: '価格表・プラン比較' },
  { id: LPSection.FAQ, label: 'FAQ', description: 'よくある質問' },
  { id: LPSection.FOOTER, label: 'フッター', description: '連絡先・リンク集' },
  { id: LPSection.OTHER, label: 'その他', description: '自由なセクション' },
];

// LP Tone/Style Options
export const LP_TONE_OPTIONS = [
  { id: LPTone.PROFESSIONAL, label: 'プロフェッショナル', description: '信頼感・ビジネス向け' },
  { id: LPTone.CASUAL, label: 'カジュアル', description: '親しみやすく軽やかな雰囲気' },
  { id: LPTone.LUXURY, label: 'ラグジュアリー', description: '高級感・プレミアム' },
  { id: LPTone.PLAYFUL, label: 'ポップ・遊び心', description: 'カラフルで楽しい印象' },
  { id: LPTone.MINIMAL, label: 'ミニマル', description: 'シンプルで洗練された' },
  { id: LPTone.BOLD, label: 'ボールド', description: '大胆でインパクト重視' },
];

// LP Aspect Ratio Options
export const LP_ASPECT_RATIO_OPTIONS = [
  { id: LPAspectRatio.WIDE, label: 'ワイド (16:9)', description: 'ヒーロー・ファーストビュー向け' },
  { id: LPAspectRatio.STANDARD, label: 'スタンダード (4:3)', description: '汎用的なセクション向け' },
  { id: LPAspectRatio.VERTICAL, label: '縦長 (9:16)', description: 'スマホLP・縦スクロール向け' },
];

// Style Change Options
export const STYLE_CHANGE_OPTIONS = [
  { id: StyleChangeType.ANIME, label: 'アニメ風', description: '日本のアニメスタイルに変換' },
  { id: StyleChangeType.CG, label: 'CG風', description: '3DCGのようなレンダリング風に変換' },
  { id: StyleChangeType.HAND_DRAWN, label: '手書きイラスト風', description: '手描きのイラストタッチに変換' },
  { id: StyleChangeType.WHITEBOARD, label: 'ホワイトボード風', description: 'ホワイトボードに描いたようなスケッチ風' },
  { id: StyleChangeType.REALISTIC, label: '実写風', description: 'フォトリアリスティックな写真風に変換' },
  { id: StyleChangeType.WATERCOLOR, label: '水彩画風', description: '水彩絵の具で描いたような柔らかいタッチ' },
  { id: StyleChangeType.PIXEL_ART, label: 'ピクセルアート風', description: 'レトロゲーム風のドット絵に変換' },
  { id: StyleChangeType.OIL_PAINTING, label: '油絵風', description: 'クラシックな油絵の質感に変換' },
];

// Style Change Aspect Ratio Options
export const STYLE_CHANGE_ASPECT_RATIO_OPTIONS = [
  { id: StyleChangeAspectRatio.ORIGINAL, label: 'オリジナル', description: '元画像のアスペクト比を維持' },
  { id: StyleChangeAspectRatio.WIDE, label: 'ワイド (16:9)', description: '横長のワイドフォーマット' },
  { id: StyleChangeAspectRatio.STANDARD, label: 'スタンダード (4:3)', description: '標準的な横長フォーマット' },
  { id: StyleChangeAspectRatio.SQUARE, label: '正方形 (1:1)', description: 'SNS投稿に最適' },
  { id: StyleChangeAspectRatio.VERTICAL, label: '縦長 (9:16)', description: 'スマホ向け縦長フォーマット' },
  { id: StyleChangeAspectRatio.PORTRAIT, label: 'ポートレート (3:4)', description: 'ポートレート向け縦長' },
];

// Image Generation Aspect Ratio Options
export const IMAGE_GEN_ASPECT_RATIO_OPTIONS = [
  { id: ImageGenAspectRatio.WIDE, label: 'ワイド (16:9)', description: '横長のワイドフォーマット' },
  { id: ImageGenAspectRatio.STANDARD, label: 'スタンダード (4:3)', description: '標準的な横長フォーマット' },
  { id: ImageGenAspectRatio.SQUARE, label: '正方形 (1:1)', description: 'SNS投稿に最適' },
  { id: ImageGenAspectRatio.VERTICAL, label: '縦長 (9:16)', description: 'スマホ向け縦長フォーマット' },
  { id: ImageGenAspectRatio.PORTRAIT, label: 'ポートレート (3:4)', description: 'ポートレート向け縦長' },
];

// Slide Generator Options
export const SLIDE_PAGE_TYPE_OPTIONS = [
  { id: SlidePageType.TITLE, label: 'タイトルスライド', description: '大きなコピーを表示するタイトルページ' },
  { id: SlidePageType.CONTENT, label: 'コンテンツスライド', description: '情報を整理して表示するコンテンツページ' },
];

export const SLIDE_ASPECT_RATIO_OPTIONS = [
  { id: SlideAspectRatio.WIDE, label: 'ワイド (16:9)', description: '標準的なプレゼンテーション向け' },
  { id: SlideAspectRatio.STANDARD, label: 'スタンダード (4:3)', description: 'クラシックなプレゼンテーション向け' },
];

export const SLIDE_GENERATION_MODE_OPTIONS = [
  { id: SlideGenerationMode.ALL_AT_ONCE, label: '一括生成', description: 'すべてのスライドを一度に生成' },
  { id: SlideGenerationMode.ONE_BY_ONE, label: '1ページずつ生成', description: '確認しながら順番に生成' },
];

export const SLIDE_LIMITS = {
  MAX_INITIAL_PAGES: 10,
  PAGES_PER_BATCH: 5,
  MAX_TOTAL_PAGES: 50,
  TEMPLATE_COUNT: 3,
};