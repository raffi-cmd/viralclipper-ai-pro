import { SourceAdapter, SourceValidationResult, MediaAccessResult } from './types';
import { SourceMetadata } from '../types';

export class YouTubeAdapter implements SourceAdapter {
  category = 'youtube' as const;

  extractId(url: string): string | null {
    if (typeof url !== 'string') return null;
    const clean = url.trim();
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = clean.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  }

  canHandle(input: string | File): boolean {
    if (typeof input !== 'string') return false;
    return /youtube\.com|youtu\.be/i.test(input) || !!this.extractId(input);
  }

  validate(input: string | File): SourceValidationResult {
    if (typeof input !== 'string') {
      return { isValid: false, category: 'youtube', errorMessage: 'Tautan YouTube harus berupa teks URL.' };
    }
    const id = this.extractId(input);
    if (!id) {
      return {
        isValid: false,
        category: 'youtube',
        errorMessage: 'URL YouTube tidak valid. Format yang didukung: https://www.youtube.com/watch?v=... atau https://youtu.be/...',
      };
    }
    return {
      isValid: true,
      category: 'youtube',
      normalizedIdentifier: id,
    };
  }

  async getMetadata(input: string | File): Promise<SourceMetadata> {
    const url = typeof input === 'string' ? input.trim() : '';
    const id = this.extractId(url) || 'dQw4w9WgXcQ';
    let title = 'YouTube Video';
    let author = 'YouTube Creator';
    let thumb = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    let durationSec = 600; // 10 menit baseline fallback

    try {
      const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.title) title = data.title;
        if (data.author_name) author = data.author_name;
        if (data.thumbnail_url) thumb = data.thumbnail_url;
      }
    } catch {
      // Offline / fallback mode
    }

    return {
      category: 'youtube',
      title,
      author,
      thumbnailUrl: thumb,
      durationSec,
      canExtractDirectBytes: false,
      accessNotice:
        'YouTube melarang pengunduhan raw video binary via browser langsung tanpa server. Untuk memotong klip fisik MP4: upload file video langsung atau hubungkan backend FFmpeg di Settings.',
    };
  }

  async getMediaAccess(input: string | File, backendUrl?: string): Promise<MediaAccessResult> {
    const url = typeof input === 'string' ? input.trim() : '';
    const id = this.extractId(url);
    const embedUrl = id ? `https://www.youtube.com/embed/${id}` : undefined;

    if (backendUrl) {
      return {
        canExtractDirectBytes: true,
        sourceEmbedUrl: embedUrl,
      };
    }

    return {
      canExtractDirectBytes: false,
      sourceEmbedUrl: embedUrl,
      warningNotice:
        'Browser tidak memiliki akses langsung ke stream binary YouTube karena CORS & DRM. Preview embed tersedia untuk referensi analisis.',
    };
  }
}
