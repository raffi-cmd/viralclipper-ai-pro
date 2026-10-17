import { SourceAdapter, SourceValidationResult, MediaAccessResult } from './types';
import { SourceMetadata } from '../types';
import { ThumbnailEngine } from '../thumbnail-generator/thumbnail-engine';

export class InstagramAdapter implements SourceAdapter {
  category = 'instagram' as const;

  canHandle(input: string | File): boolean {
    if (typeof input !== 'string') return false;
    return /instagram\.com\/(reel|reels|p|tv|share)/i.test(input);
  }

  validate(input: string | File): SourceValidationResult {
    if (typeof input !== 'string') {
      return { isValid: false, category: 'instagram', errorMessage: 'Tautan Instagram harus berupa URL teks.' };
    }
    const clean = input.trim();
    if (!/instagram\.com\/(?:reel|reels|p|tv|share)\/([a-zA-Z0-9_-]+)/i.test(clean)) {
      return {
        isValid: false,
        category: 'instagram',
        errorMessage: 'URL Instagram tidak valid. Gunakan format seperti https://www.instagram.com/reel/... atau https://www.instagram.com/p/...',
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
    const match = url.match(/instagram\.com\/(?:reel|reels|p|tv|share)\/([a-zA-Z0-9_-]+)/i);
    const shortcode = match ? match[1] : 'reel';
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
        'Instagram Reel terdeteksi! Klip dapat dipratinjau di Studio Player dan dirender ke video MP4 langsung dari browser.',
    };
  }

  async getMediaAccess(input: string | File, backendUrl?: string): Promise<MediaAccessResult> {
    const url = typeof input === 'string' ? input.trim() : '';
    const match = url.match(/instagram\.com\/(?:reel|reels|p|tv|share)\/([a-zA-Z0-9_-]+)/i);
    const shortcode = match ? match[1] : '';
    const embedUrl = shortcode ? `https://www.instagram.com/reel/${shortcode}/embed` : undefined;

    return {
      canExtractDirectBytes: !!backendUrl,
      sourceEmbedUrl: embedUrl,
      warningNotice: !backendUrl
        ? 'Pratinjau interaktif aktif. Anda dapat memutar klip, melihat animasi teks karaoke, dan merender video MP4 langsung di browser.'
        : undefined,
    };
  }
}
