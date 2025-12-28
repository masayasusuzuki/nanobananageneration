export enum ImageStyle {
  REALISTIC = 'Realistic Photography',
  CINEMATIC = 'Cinematic Movie Scene',
  ANIME = 'Anime / Manga Style',
  DIGITAL_ART = 'Digital Art / Concept Art',
  OIL_PAINTING = 'Classic Oil Painting',
  CYBERPUNK = 'Cyberpunk / Neon',
  STUDIO_HEADSHOT = 'Professional Studio Headshot',
  FANTASY = 'High Fantasy RPG',
}

// LP Generator Types
export enum LPSection {
  HERO = 'hero',
  FEATURES = 'features',
  PROBLEM = 'problem',
  SOLUTION = 'solution',
  BEFORE_AFTER = 'before_after',
  TESTIMONIALS = 'testimonials',
  CTA = 'cta',
  ABOUT = 'about',
  PHILOSOPHY = 'philosophy',
  PRICING = 'pricing',
  FAQ = 'faq',
  FOOTER = 'footer',
  OTHER = 'other',
}

export enum LPTone {
  PROFESSIONAL = 'professional',
  CASUAL = 'casual',
  LUXURY = 'luxury',
  PLAYFUL = 'playful',
  MINIMAL = 'minimal',
  BOLD = 'bold',
}

export enum LPAspectRatio {
  WIDE = '16:9',
  STANDARD = '4:3',
  VERTICAL = '9:16',
}

// Style Change Types
export enum StyleChangeType {
  ANIME = 'anime',
  CG = 'cg',
  HAND_DRAWN = 'hand_drawn',
  WHITEBOARD = 'whiteboard',
  REALISTIC = 'realistic',
  WATERCOLOR = 'watercolor',
  PIXEL_ART = 'pixel_art',
  OIL_PAINTING = 'oil_painting',
}

export enum StyleChangeAspectRatio {
  ORIGINAL = 'original',
  WIDE = '16:9',
  STANDARD = '4:3',
  SQUARE = '1:1',
  VERTICAL = '9:16',
  PORTRAIT = '3:4',
}

// Image Generation Types
export enum ImageGenAspectRatio {
  WIDE = '16:9',
  STANDARD = '4:3',
  SQUARE = '1:1',
  VERTICAL = '9:16',
  PORTRAIT = '3:4',
}

// Portrait Generator Aspect Ratio
export enum PortraitAspectRatio {
  WIDE = '16:9',
  STANDARD = '4:3',
  SQUARE = '1:1',
  VERTICAL = '9:16',
  PORTRAIT = '3:4',
}

// Image Editor Aspect Ratio
export enum ImageEditorAspectRatio {
  ORIGINAL = 'original',
  WIDE = '16:9',
  STANDARD = '4:3',
  SQUARE = '1:1',
  VERTICAL = '9:16',
  PORTRAIT = '3:4',
}

export interface LPGenerationState {
  isLoading: boolean;
  resultImage: string | null;
  error: string | null;
}

export interface GenerationState {
  isLoading: boolean;
  resultImage: string | null;
  error: string | null;
}

export interface UploadedFile {
  file: File;
  previewUrl: string;
  base64: string;
}

// Slide Generator Types
export enum SlidePageType {
  TITLE = 'title',
  CONTENT = 'content',
}

export enum SlideWorkflowPhase {
  TEMPLATE_GENERATION = 'template_generation',
  TEMPLATE_SELECTION = 'template_selection',
  PAGE_SETUP = 'page_setup',
  GENERATION = 'generation',
  EDITING = 'editing',
}

export enum SlideGenerationMode {
  ALL_AT_ONCE = 'all_at_once',
  ONE_BY_ONE = 'one_by_one',
}

export enum SlideAspectRatio {
  WIDE = '16:9',
  STANDARD = '4:3',
}

export interface SlideTemplate {
  id: string;
  titleImageBase64: string;
  contentImageBase64: string;
  description: string;
}

export interface SlidePage {
  id: string;
  pageNumber: number;
  pageType: SlidePageType;
  title: string;
  content: string;
  generatedImage: string | null;
  isGenerating: boolean;
  error: string | null;
}

export interface SlideGenerationState {
  isLoading: boolean;
  error: string | null;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}
