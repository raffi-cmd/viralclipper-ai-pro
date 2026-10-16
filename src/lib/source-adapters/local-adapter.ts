import { SourceAdapter, SourceValidationResult, MediaAccessResult } from './types';
import { SourceMetadata } from '../types';

export class LocalAdapter implements SourceAdapter {
  category = 'local' as const;
  private static MAX_SIZE_BYTES = 500 * 1024 * 1024; // 500MB

  canHandle(input: string | File): boolean {
    return input instanceof File;
  }

  validate(input: string | File): SourceValidationResult {
    if (!(input instanceof File)) {
      return { isValid: false, category: 'local', errorMessage: 'Berkas lokal tidak valid.' };
    }

    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
    const isExtValid = /\.(mp4|webm|mov|mkv)$/i.test(input.name);

    if (!validTypes.includes(input.type) && !isExtValid) {
      return {
        isValid: false,
        category: 'local',
        errorMessage: `Format berkas "${input.name}" tidak didukung. Harap gunakan format MP4, WebM, atau MOV.`,
      };
    }

    if (input.size > LocalAdapter.MAX_SIZE_BYTES) {
      return {
        isValid: false,
        category: 'local',
        errorMessage: `Ukuran berkas (${(input.size / (1024 * 1024)).toFixed(1)}MB) melebihi batas 500MB browser.`,
      };
    }

    return {
      isValid: true,
      category: 'local',
      normalizedIdentifier: input.name,
    };
  }

  async getMetadata(input: string | File): Promise<SourceMetadata> {
    if (!(input instanceof File)) {
      throw new Error('Input harus berupa File video.');
    }

    const objectUrl = URL.createObjectURL(input);

    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = objectUrl;

      video.onloadedmetadata = () => {
        const durationSec = Math.floor(video.duration) || 60;
        const width = video.videoWidth || 1920;
        const height = video.videoHeight || 1080;

        // Capture snapshot from first second for real thumbnail
        video.currentTime = Math.min(1, durationSec / 2);
      };

      video.onseeked = () => {
        let thumbUrl = '';
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 480;
          canvas.height = 270;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            thumbUrl = canvas.toDataURL('image/jpeg', 0.85);
          }
        } catch {
          thumbUrl = 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=800&q=80';
        }

        URL.revokeObjectURL(objectUrl);
        resolve({
          category: 'local',
          title: input.name.replace(/\.[^/.]+$/, ''),
          author: 'Local File',
          thumbnailUrl: thumbUrl,
          durationSec: Math.floor(video.duration) || 60,
          width: video.videoWidth,
          height: video.videoHeight,
          canExtractDirectBytes: true,
          accessNotice: 'Akses penuh media bytes tersedia langsung di browser untuk pemrosesan akurat.',
        });
      };

      video.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({
          category: 'local',
          title: input.name.replace(/\.[^/.]+$/, ''),
          author: 'Local File',
          thumbnailUrl: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=800&q=80',
          durationSec: 120,
          canExtractDirectBytes: true,
        });
      };
    });
  }

  async getMediaAccess(input: string | File): Promise<MediaAccessResult> {
    if (!(input instanceof File)) {
      throw new Error('Input harus berupa File video.');
    }
    const blobUrl = URL.createObjectURL(input);
    return {
      canExtractDirectBytes: true,
      mediaFileOrBlob: input,
      mediaStreamUrl: blobUrl,
    };
  }
}
