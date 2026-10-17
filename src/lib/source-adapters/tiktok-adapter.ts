import { SourceAdapter, SourceValidationResult, MediaAccessResult } from './types';
import { SourceMetadata } from '../types';
import { ThumbnailEngine } from '../thumbnail-generator/thumbnail-engine';

export class TikTokAdapter implements SourceAdapter {
  category = 'tiktok' as const;

  canHandle(input: string | File): boolean {
    if (typeof input !== 'string') return false;
    return /tiktok\.com/i.test(input);
  }

  validate(input: string | File): SourceValidationResult {
    if (typeof input !== 'string') {
      return { isValid: false, category: 'tiktok', errorMessage: 'Tautan TikTok harus berupa URL.' };
    }
    const clean = input.trim();
    if (!/tiktok\.com/i.test(clean)) {
      return {
        isValid: false,
        category: 'tiktok',
        errorMessage: 'Format tautan TikTok tidak dikenali. Gunakan tautan video seperti https://www.tiktok.com/@user/video/... atau https://vt.tiktok.com/...',
      };
    }
    return {
      isValid: true,
      category: 'tiktok',
      normalizedIdentifier: clean,
    };
  }

  async getMetadata(input: string | File): Promise<SourceMetadata> {
    const url = typeof input === 'string' ? input.trim() : '';
    let title = 'TikTok Viral Video';
    let author = 'TikTok Creator';
    let thumb = '';
    let durationSec = 180; // 3 menit estimasi default TikTok

    try {
      // Timeout after 3 seconds so application never hangs
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.title) title = data.title;
        if (data.author_name) author = data.author_name;
        if (data.thumbnail_url) thumb = data.thumbnail_url;
      }
    } catch {
      // Graceful fallback to avoid spinning
      const urlParts = url.split('/');
      const slug = urlParts[urlParts.length - 1] || 'video';
      title = `TikTok Clip (${slug.slice(0, 20)})`;
    }

    if (!thumb) {
      const topic = ThumbnailEngine.detectTopic(title);
      thumb = ThumbnailEngine.getTopicFallbackImage(topic);
    }

    return {
      category: 'tiktok',
      title,
      author,
      thumbnailUrl: thumb,
      durationSec,
      canExtractDirectBytes: false,
      accessNotice:
        'Video TikTok terdeteksi! Klip dapat dipratinjau di Studio Player dan dirender langsung ke video MP4.',
    };
  }

  async getMediaAccess(input: string | File, backendUrl?: string): Promise<MediaAccessResult> {
    const url = typeof input === 'string' ? input.trim() : '';
    const videoMatch = url.match(/video\/(\d+)/i);
    const embedUrl = videoMatch ? `https://www.tiktok.com/embed/v2/${videoMatch[1]}` : undefined;

    return {
      canExtractDirectBytes: !!backendUrl,
      sourceEmbedUrl: embedUrl,
      warningNotice: !backendUrl
        ? 'Pratinjau interaktif aktif. Anda dapat memutar klip, melihat animasi teks karaoke, dan merender video MP4 langsung di browser.'
        : undefined,
    };
  }
}
