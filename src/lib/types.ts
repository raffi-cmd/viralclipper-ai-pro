export type AIProvider = 
  | 'google' 
  | 'openai' 
  | 'anthropic' 
  | 'openrouter' 
  | 'deepseek' 
  | 'custom';

export type SubtitlePreset = 'hormozi' | 'minimalist' | 'neon' | 'custom';
export type SubtitleFont = 'Montserrat' | 'Impact' | 'Inter' | 'Arial Black' | 'Comic Sans MS';

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
  baseUrl?: string;
  modelName?: string;
}

export interface SubtitleWord {
  word: string;
  start: number; // in seconds relative to clip
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

export interface ViralClip {
  rank: number; // 1 to 5
  viralScore: number; // e.g. 98, 95, 91
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
}

export interface AIAnalysisResult {
  totalClipsFound: number;
  clips: ViralClip[];
  selectedClipIndex: number;
}

export interface SSEMessage {
  step: 'downloading' | 'analyzing' | 'transcribing' | 'rendering' | 'completed' | 'error';
  progress: number;
  message: string;
  data?: {
    analysis?: AIAnalysisResult;
  };
}
