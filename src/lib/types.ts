export type AIProvider = 
  | 'google' 
  | 'openai' 
  | 'anthropic' 
  | 'openrouter' 
  | 'deepseek' 
  | 'custom';

export type SubtitlePreset = 'hormozi' | 'neon' | 'minimalist' | 'card' | 'comic';
export type SubtitleFont = 'Montserrat' | 'Impact' | 'Inter' | 'Arial Black' | 'Comic Sans MS' | 'Bebas Neue';
export type AspectRatio = '9:16' | '1:1' | '16:9';

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
  baseUrl?: string;
  modelName?: string;
}

export interface SubtitleWord {
  word: string;
  start: number; // seconds relative to clip
  end: number;
  emoji?: string;
}

export interface SubtitleSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  words: SubtitleWord[];
}

export interface SubtitleStyleConfig {
  fontFamily: SubtitleFont;
  fontSize: number;
  textColor: string;
  highlightColor: string;
  preset: SubtitlePreset;
  boxStyle: 'pill' | 'card' | 'glow' | 'minimal';
  position: 'bottom' | 'middle' | 'top';
  letterSpacing: string;
  uppercase: boolean;
}

export interface BrandingConfig {
  showHookBanner: boolean;
  hookBannerText: string;
  showWatermark: boolean;
  watermarkText: string;
  watermarkPosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export interface ViralClip {
  id: string;
  rank: number;
  viralScore: number;
  title: string;
  hookHeadline: string;
  reasonWhyViral: string;
  startSec: number;
  endSec: number;
  durationSec: number;
  subtitles: SubtitleSegment[];
  copywriting: {
    hookHeadline: string;
    caption: string;
    hashtags: string[];
  };
  isSelected?: boolean;
}

export interface VideoProject {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  sourceType: 'youtube' | 'local';
  sourceUrl?: string;
  localVideoUrl?: string;
  youtubeId?: string;
  thumbnailUrl: string;
  totalDurationSec: number;
  clipLength: 30 | 60 | 90;
  highlightFocus: 'emotional' | 'engagement' | 'curiosity';
  clips: ViralClip[];
  selectedClipId: string;
  styleConfig: SubtitleStyleConfig;
  brandingConfig: BrandingConfig;
}

export interface BackendJobStatus {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  resultUrl?: string;
  error?: string;
}
