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

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}
