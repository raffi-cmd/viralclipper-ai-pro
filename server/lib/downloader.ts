import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';

const execPromise = util.promisify(exec);

export interface VideoMetadata {
  width: number;
  height: number;
  duration: number;
  isLandscape: boolean;
}

export class VideoDownloader {
  private outputDir: string;

  constructor(outputDir: string) {
    this.outputDir = outputDir;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }

  /**
   * Mengunduh video menggunakan yt-dlp dengan resolusi terbaik maksimal 1080p
   */
  async download(url: string, jobId: string): Promise<{ videoPath: string; audioPath: string }> {
    const rawVideoPath = path.join(this.outputDir, `${jobId}_source.mp4`);
    const audioPath = path.join(this.outputDir, `${jobId}_audio.mp3`);

    // 1. Download video terbaik dengan kompatibilitas mp4
    const downloadCmd = `yt-dlp -f "bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4]/best" --recode-video mp4 -o "${rawVideoPath}" "${url}"`;
    await execPromise(downloadCmd);

    // 2. Ekstrak audio 128kbps mono untuk efisiensi token & processing AI
    const extractAudioCmd = `ffmpeg -y -i "${rawVideoPath}" -vn -ar 16000 -ac 1 -ab 128k -f mp3 "${audioPath}"`;
    await execPromise(extractAudioCmd);

    return { videoPath: rawVideoPath, audioPath };
  }

  /**
   * Mengambil metadata video via ffprobe
   */
  async getMetadata(filePath: string): Promise<VideoMetadata> {
    const probeCmd = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration -of json "${filePath}"`;
    const { stdout } = await execPromise(probeCmd);
    const data = JSON.parse(stdout);
    const stream = data.streams[0];

    const width = parseInt(stream.width, 10);
    const height = parseInt(stream.height, 10);
    const duration = parseFloat(stream.duration || '0');

    return {
      width,
      height,
      duration,
      isLandscape: width > height,
    };
  }
}
