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
