import { ImageStyle, LPSection, LPTone } from './types';

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