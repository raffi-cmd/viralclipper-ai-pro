export type AIProvider = 
  | 'google' 
  | 'openai' 
  | 'anthropic' 
  | 'openrouter' 
  | 'deepseek' 
  | 'custom';

export type SubtitlePreset = 'hormozi' | 'minimalist' | 'neon';

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
  baseUrl?: string;
  modelName?: string;
}

export interface VideoProcessRequest {
  url: string;
  targetDuration: 30 | 60 | 120 | 300; // in seconds
  preset: SubtitlePreset;
  hookTitle?: string;
  watermarkText?: string;
  settings: AISettings;
}

export interface SubtitleWord {
  word: string;
  start: number; // in seconds
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

export interface AIAnalysisResult {
  hookStart: number; // in seconds
  hookEnd: number;
  reasoning: string;
  detectedLanguage: string;
  subtitles: SubtitleSegment[];
  copywriting: {
    hookHeadline: string;
    caption: string;
    hashtags: string[];
  };
}

export interface SSEMessage {
  step: 'downloading' | 'analyzing' | 'transcribing' | 'rendering' | 'completed' | 'error';
  progress: number; // 0 - 100
  message: string;
  data?: {
    videoUrl?: string;
    analysis?: AIAnalysisResult;
    duration?: number;
  };
}
