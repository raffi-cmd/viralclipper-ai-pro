import { SourceAdapter, SourceValidationResult, MediaAccessResult } from './types';
import { SourceMetadata } from '../types';

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
    let thumb = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=800&q=80';
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

    return {
      category: 'tiktok',
      title,
      author,
      thumbnailUrl: thumb,
      durationSec,
      canExtractDirectBytes: false,
      accessNotice:
        'TikTok membatasi akses unduh stream video langsung di lingkungan browser. Untuk memotong klip video MP4 secara utuh: unggah video lokal secara langsung atau aktifkan backend server FFmpeg.',
    };
  }

  async getMediaAccess(input: string | File, backendUrl?: string): Promise<MediaAccessResult> {
    if (backendUrl) {
      return {
        canExtractDirectBytes: true,
      };
    }

    return {
      canExtractDirectBytes: false,
      warningNotice:
        'Akses streaming binary TikTok tidak tersedia langsung dari browser client tanpa server proxy. Gunakan Upload Video Lokal untuk perenderan instan 100% di browser.',
    };
  }
}
