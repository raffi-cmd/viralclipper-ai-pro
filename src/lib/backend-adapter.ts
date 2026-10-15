import { VideoProject, BackendJobStatus, ViralClip } from './types';

export interface BackendAdapter {
  isAvailable(): Promise<boolean>;
  submitClipJob(project: Partial<VideoProject>): Promise<{ jobId: string }>;
  getJobStatus(jobId: string): Promise<BackendJobStatus>;
  exportRenderedVideo(clipId: string, options: any): Promise<{ downloadUrl: string }>;
}

export class HybridBackendAdapter implements BackendAdapter {
  private backendBaseUrl: string;

  constructor(backendBaseUrl = '') {
    this.backendBaseUrl = backendBaseUrl;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.backendBaseUrl) return false;
    try {
      const res = await fetch(`${this.backendBaseUrl}/health`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  }

  async submitClipJob(project: Partial<VideoProject>): Promise<{ jobId: string }> {
    if (!this.backendBaseUrl) {
      // Browser Client Processing Mode (GitHub Pages)
      return { jobId: `client_${Date.now()}` };
    }
    const res = await fetch(`${this.backendBaseUrl}/api/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    if (!res.ok) throw new Error('Gagal mengirim job ke backend server');
    return res.json();
  }

  async getJobStatus(jobId: string): Promise<BackendJobStatus> {
    if (jobId.startsWith('client_')) {
      return {
        jobId,
        status: 'completed',
        progress: 100,
        message: 'Klip diproses di browser (Client Mode)',
      };
    }
    const res = await fetch(`${this.backendBaseUrl}/api/status/${jobId}`);
    return res.json();
  }

  async exportRenderedVideo(clipId: string, _options: any): Promise<{ downloadUrl: string }> {
    if (!this.backendBaseUrl) {
      throw new Error(
        'Server backend FFmpeg belum terhubung. Di mode GitHub Pages, silakan unduh subtitle (.SRT / .ASS) dan Copywriting, atau jalankan backend server lokal (npm run dev).'
      );
    }
    const res = await fetch(`${this.backendBaseUrl}/api/export/${clipId}`, { method: 'POST' });
    return res.json();
  }
}
