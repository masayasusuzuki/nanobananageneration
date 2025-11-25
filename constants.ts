import { ImageStyle } from './types';

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