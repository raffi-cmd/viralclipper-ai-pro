import { SourceAdapter, SourceValidationResult, MediaAccessResult } from './types';
import { YouTubeAdapter } from './youtube-adapter';
import { TikTokAdapter } from './tiktok-adapter';
import { InstagramAdapter } from './instagram-adapter';
import { LocalAdapter } from './local-adapter';
import { SourceCategory, SourceMetadata } from '../types';

export class SourceAdapterRegistry {
  private static adapters: SourceAdapter[] = [
    new LocalAdapter(),
    new YouTubeAdapter(),
    new TikTokAdapter(),
    new InstagramAdapter(),
  ];

  static findAdapter(input: string | File): SourceAdapter | null {
    for (const adapter of this.adapters) {
      if (adapter.canHandle(input)) {
        return adapter;
      }
    }
    return null;
  }

  static validate(input: string | File): SourceValidationResult {
    const adapter = this.findAdapter(input);
    if (!adapter) {
      return {
        isValid: false,
        category: 'youtube',
        errorMessage: 'Sumber tidak dikenali. Masukkan URL YouTube, TikTok, Instagram Reel, atau unggah video lokal.',
      };
    }
    return adapter.validate(input);
  }

  static async getMetadata(input: string | File): Promise<SourceMetadata> {
    const adapter = this.findAdapter(input);
    if (!adapter) {
      throw new Error('Adapter tidak ditemukan untuk sumber ini.');
    }
    return adapter.getMetadata(input);
  }

  static async getMediaAccess(input: string | File, backendUrl?: string): Promise<MediaAccessResult> {
    const adapter = this.findAdapter(input);
    if (!adapter) {
      throw new Error('Adapter tidak ditemukan untuk sumber ini.');
    }
    return adapter.getMediaAccess(input, backendUrl);
  }
}

export * from './types';
export * from './youtube-adapter';
export * from './tiktok-adapter';
export * from './instagram-adapter';
export * from './local-adapter';
