export type AIProvider = 
  | 'google' 
  | 'openai' 
  | 'anthropic' 
  | 'openrouter' 
  | 'deepseek' 
  | 'custom';

export type SubtitlePreset = 'hormozi' | 'neon' | 'minimalist' | 'card' | 'comic';
export type SubtitleFont = 'Montserrat' | 'Impact' | 'Inter' | 'Arial Black' | 'Comic Sans MS';
export type SourceCategory = 'youtube' | 'tiktok' | 'instagram' | 'local';
export type SourceType = SourceCategory; // Alias for backward compatibility
export type EditingStyle = 'emotional' | 'high_energy' | 'curiosity';

export type JobStatus = 
  | 'idle' 
  | 'validating' 
  | 'uploading' 
  | 'queued' 
  | 'extracting' 
  | 'transcribing' 
  | 'analyzing' 
  | 'ranking' 
  | 'rendering' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
  baseUrl?: string;
  modelName?: string;
  backendServerUrl?: string; // Optional backend server URL for FFmpeg / yt-dlp processing
}

export interface SubtitleWord {
  word: string;
  start: number; // Seconds relative to clip start (0 = start of clip)
  end: number;
  emoji?: string;
}

export interface SubtitleSegment {
  id: number;
  start: number; // Seconds relative to clip start
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

export interface ScoringBreakdown {
  hookStrength: number;       // 0-100
  narrativeCompleteness: number; // 0-100
  emotionalEngagement: number; // 0-100
  clarityScore: number;       // 0-100
  styleRelevance: number;     // 0-100
}

export interface HighlightCandidate {
  id: string;
  startSec: number;
  endSec: number;
  targetDurationSec: number;
  actualDurationSec: number;
  viralScore: number;
  scoringBreakdown: ScoringBreakdown;
  title: string;
  hookHeadline: string;
  reasonWhyViral: string;
  detectedKeywords: string[];
}

export interface ViralClip {
  id: string;
  rank: number;
  viralScore: number;
  title: string;
  hookHeadline: string;
  reasonWhyViral: string;
  startSec: number;           // Timestamp on original source timeline
  endSec: number;             // Timestamp on original source timeline
  durationSec: number;        // Actual output clip duration (endSec - startSec)
  actualDurationSec?: number; // Verified rendered file duration
  subtitles: SubtitleSegment[]; // Timestamps normalized to [0, durationSec]
  copywriting: {
    hookHeadline: string;
    caption: string;
    hashtags: string[];
  };
  renderedVideoUrl?: string;  // Object URL to actual rendered media file
  renderedVideoBlob?: Blob;   // Raw binary media blob
  customThumbnailUrl?: string; // Custom or frame-extracted thumbnail URL
  isSelected?: boolean;
}

export interface SourceMetadata {
  category: SourceCategory;
  title: string;
  author?: string;
  thumbnailUrl: string;
  durationSec: number;
  width?: number;
  height?: number;
  canExtractDirectBytes: boolean;
  accessNotice?: string;
}

export interface VideoProject {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  sourceCategory: SourceCategory;
  sourceType: SourceCategory;
  sourceUrl?: string;
  localVideoUrl?: string;
  youtubeId?: string;
  thumbnailUrl: string;
  totalDurationSec: number;
  clipLength: 30 | 60 | 90;
  maxClips: number;
  editingStyle: EditingStyle;
  highlightFocus: EditingStyle;
  clips: ViralClip[];
  selectedClipId: string;
  styleConfig: SubtitleStyleConfig;
  brandingConfig: BrandingConfig;
}

export interface ProcessingJob {
  id: string;
  status: JobStatus;
  progress: number; // 0 - 100
  stepDescription: string;
  error?: string;
  canCancel: boolean;
}

export interface AIAnalysisResult {
  hookStart: number;
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

export interface VideoProcessRequest {
  url: string;
  targetDuration: number;
  maxClips: number;
  preset: SubtitlePreset;
  hookTitle?: string;
  watermarkText?: string;
  settings: AISettings;
}

export interface SSEMessage {
  step: 'downloading' | 'analyzing' | 'transcribing' | 'rendering' | 'completed' | 'error';
  progress: number;
  message: string;
  data?: any;
}
