/**
 * Client-Side Video Exporter menggunakan HTML5 Canvas & MediaRecorder API.
 * Menghasilkan file video nyata (.webm / .mp4) langsung dari browser tanpa server!
 */
export class ClientVideoExporter {
  static async recordAndDownloadClip({
    thumbnailUrl,
    title,
    durationSec,
    hookText,
    subtitleText,
    watermarkText,
    fontFamily = 'Montserrat',
    highlightColor = '#39FF14',
    onProgress,
  }: {
    thumbnailUrl: string;
    title: string;
    durationSec: number;
    hookText: string;
    subtitleText: string;
    watermarkText: string;
    fontFamily?: string;
    highlightColor?: string;
    onProgress?: (percent: number, msg: string) => void;
  }): Promise<void> {
    if (onProgress) onProgress(10, 'Menyiapkan canvas 9:16 portrait...');

    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 1280; // 9:16 Portrait HD
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context tidak tersedia');

    // Load background image with CORS fallback
    let imgLoaded = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise<void>((resolve) => {
      img.onload = () => {
        imgLoaded = true;
        resolve();
      };
      img.onerror = () => {
        // Fallback: continue without throwing
        imgLoaded = false;
        resolve();
      };
      img.src = thumbnailUrl;
      // timeout after 2s if image hangs
      setTimeout(() => resolve(), 2000);
    });

    if (onProgress) onProgress(30, 'Menginisialisasi encoder video browser...');

    // Determine supported mime type
    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/mp4';
    }

    let stream: MediaStream;
    try {
      stream = canvas.captureStream(30);
    } catch {
      // If canvas is tainted by CORS, redraw with gradient background
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      stream = canvas.captureStream(30);
    }

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
      videoBitsPerSecond: 2500000,
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    return new Promise((resolve, reject) => {
      mediaRecorder.onstop = () => {
        if (onProgress) onProgress(100, 'Video selesai dibuat! Mengunduh berkas...');
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cleanName = title.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 35);
        a.download = `${cleanName}_9x16.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        resolve();
      };

      mediaRecorder.onerror = (err) => {
        reject(err);
      };

      mediaRecorder.start();

      let elapsed = 0;
      const totalFrames = 30; // 3 detik simulasi render
      let currentFrame = 0;

      const interval = setInterval(() => {
        currentFrame++;
        elapsed += 0.1;

        if (onProgress) {
          const pct = Math.min(95, 30 + Math.floor((currentFrame / totalFrames) * 65));
          onProgress(pct, `Merender frame ${currentFrame}/${totalFrames}...`);
        }

        // 1. Clear background
        ctx.fillStyle = '#0a0b0e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Render Background (Image or Gradient fallback)
        try {
          if (imgLoaded && img.naturalWidth > 0) {
            ctx.save();
            ctx.filter = 'blur(24px) brightness(0.5)';
            ctx.drawImage(img, -60, -60, canvas.width + 120, canvas.height + 120);
            ctx.restore();

            // Center Video preview
            const fgH = (canvas.width * 9) / 16;
            const fgY = (canvas.height - fgH) / 2;
            ctx.drawImage(img, 0, fgY, canvas.width, fgH);
          } else {
            // Elegant gradient
            const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
            grad.addColorStop(0, '#1e1b4b');
            grad.addColorStop(0.5, '#0f172a');
            grad.addColorStop(1, '#020617');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
        } catch {
          // CORS safety fallback
          ctx.fillStyle = '#090a0f';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // 3. Top Hook Banner
        ctx.save();
        ctx.fillStyle = '#dc2626';
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(40, 100, canvas.width - 80, 80, 20);
          ctx.fill();
        } else {
          ctx.fillRect(40, 100, canvas.width - 80, 80);
        }
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold 28px ${fontFamily}, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(`🚨 ${(hookText || 'TONTON SAMPAI SELESAI!').toUpperCase().slice(0, 36)}`, canvas.width / 2, 150);
        ctx.restore();

        // 4. Subtitle Pill Karaoke
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(40, canvas.height - 280, canvas.width - 80, 110, 28);
          ctx.fill();
        } else {
          ctx.fillRect(40, canvas.height - 280, canvas.width - 80, 110);
        }

        ctx.fillStyle = highlightColor;
        ctx.font = `900 32px ${fontFamily}, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText((subtitleText || hookText).toUpperCase().slice(0, 32), canvas.width / 2, canvas.height - 215);
        ctx.restore();

        // 5. Watermark
        if (watermarkText) {
          ctx.save();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.font = 'bold 20px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(`@${watermarkText}`, canvas.width - 50, canvas.height - 60);
          ctx.restore();
        }

        if (currentFrame >= totalFrames) {
          clearInterval(interval);
          mediaRecorder.stop();
        }
      }, 100);
    });
  }
}
