import { SourceAdapter, SourceValidationResult, MediaAccessResult } from './types';
import { SourceMetadata } from '../types';
import { ThumbnailEngine } from '../thumbnail-generator/thumbnail-engine';

export class InstagramAdapter implements SourceAdapter {
  category = 'instagram' as const;

  canHandle(input: string | File): boolean {
    if (typeof input !== 'string') return false;
    return /instagram\.com\/(reel|p|tv)\//i.test(input);
  }

  validate(input: string | File): SourceValidationResult {
    if (typeof input !== 'string') {
      return { isValid: false, category: 'instagram', errorMessage: 'Tautan Instagram harus berupa URL teks.' };
    }
    const clean = input.trim();
    if (!/instagram\.com\/(reel|p|tv)\//i.test(clean)) {
      return {
        isValid: false,
        category: 'instagram',
        errorMessage: 'URL Instagram tidak valid. Gunakan format seperti https://www.instagram.com/reel/...',
      };
    }
    return {
      isValid: true,
      category: 'instagram',
      normalizedIdentifier: clean,
    };
  }

  async getMetadata(input: string | File): Promise<SourceMetadata> {
    const url = typeof input === 'string' ? input.trim() : '';
    const match = url.match(/instagram\.com\/(reel|p)\/([a-zA-Z0-9_-]+)/);
    const shortcode = match ? match[2] : 'reel';
    const title = `Instagram Reel (${shortcode})`;
    const topic = ThumbnailEngine.detectTopic(title);
    const thumb = ThumbnailEngine.getTopicFallbackImage(topic);

    return {
      category: 'instagram',
      title,
      author: 'Instagram Creator',
      thumbnailUrl: thumb,
      durationSec: 90,
      canExtractDirectBytes: false,
      accessNotice:
        'Instagram Reels menerapkan otentikasi ketat dan memblokir cross-origin media scraping di browser. Gunakan upload file video langsung untuk pemrosesan akurat.',
    };
  }

  async getMediaAccess(_input: string | File, backendUrl?: string): Promise<MediaAccessResult> {
    if (backendUrl) {
      return { canExtractDirectBytes: true };
    }
    return {
      canExtractDirectBytes: false,
      warningNotice:
        'Meta/Instagram membatasi akses video eksternal. Silakan unduh video lalu unggah langsung menggunakan fitur Upload Video Lokal.',
    };
  }
}
