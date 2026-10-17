export type ThumbnailTheme =
  | 'automotive'
  | 'cinematic'
  | 'gaming'
  | 'podcast'
  | 'educational'
  | 'minimal'
  | 'high_energy';

export type ThumbnailAspectRatio = '9:16' | '16:9' | '1:1';

export interface ThumbnailCandidateFrame {
  id: string;
  label: string;
  timestampSec: number;
  imageUrl: string;
}

export interface ThumbnailConfig {
  titleText: string;
  theme: ThumbnailTheme;
  aspectRatio: ThumbnailAspectRatio;
  selectedFrameUrl: string;
  textPosition: 'top' | 'center' | 'bottom';
  accentColor: string;
  showBadge: boolean;
  badgeText: string;
}

export interface GeneratedThumbnailAlternative {
  id: string;
  theme: ThumbnailTheme;
  titleText: string;
  previewUrl: string;
  frameTimestampSec: number;
}

export class ThumbnailEngine {
  /**
   * Detects the dominant video topic based on title and keywords
   */
  static detectTopic(title: string): ThumbnailTheme {
    const lower = title.toLowerCase();

    if (/mobil|motor|balap|otomotif|car|drift|vehicle|bmw|ferrari|toyota|honda|engine|speed/i.test(lower)) {
      return 'automotive';
    }
    if (/game|gaming|gameplay|gta|minecraft|roblox|valorant|mobile legends|esport|streamer/i.test(lower)) {
      return 'gaming';
    }
    if (/podcast|wawancara|bicara|interview|ngobrol|curhat|cerita|bincang/i.test(lower)) {
      return 'podcast';
    }
    if (/tutorial|belajar|cara|edukasi|tips|trik|panduan|kursus|penjelasan|ilmiah/i.test(lower)) {
      return 'educational';
    }
    if (/film|cinematic|drama|suasana|alam|desa|pemandangan|vlog/i.test(lower)) {
      return 'cinematic';
    }
    return 'high_energy';
  }

  /**
   * Generates frame snapshot URLs for a specific clip
   */
  static async extractClipFrames({
    videoElement,
    youtubeId,
    startSec,
    durationSec,
    fallbackImage,
    topic,
    clipIndex = 0,
  }: {
    videoElement?: HTMLVideoElement | null;
    youtubeId?: string | null;
    startSec: number;
    durationSec: number;
    fallbackImage?: string;
    topic?: ThumbnailTheme;
    clipIndex?: number;
  }): Promise<ThumbnailCandidateFrame[]> {
    const t1 = Math.round(startSec + Math.min(2, durationSec * 0.15));
    const t2 = Math.round(startSec + durationSec * 0.5);
    const t3 = Math.round(startSec + durationSec * 0.85);

    // 1. If we have a local video element with media access, capture real canvas frames!
    if (videoElement && videoElement.readyState >= 1) {
      try {
        const frames = await this.captureVideoCanvasFrames(videoElement, [t1, t2, t3]);
        if (frames.length > 0) return frames;
      } catch (err) {
        console.warn('Canvas frame extraction fallback:', err);
      }
    }

    // 2. If YouTube source, use YouTube's frame snapshots (1.jpg, 2.jpg, 3.jpg)
    if (youtubeId) {
      // YouTube only exposes 1.jpg, 2.jpg, 3.jpg. For clip 4 & 5, pair with distinct topic images
      const ytImg1 = `https://img.youtube.com/vi/${youtubeId}/1.jpg`;
      const ytImg2 = `https://img.youtube.com/vi/${youtubeId}/2.jpg`;
      const ytImg3 = `https://img.youtube.com/vi/${youtubeId}/3.jpg`;
      const topicAlt = this.getTopicFallbackImage(topic || 'high_energy', clipIndex);

      const chosenImg = clipIndex === 0 ? ytImg1 : clipIndex === 1 ? ytImg2 : clipIndex === 2 ? ytImg3 : topicAlt;

      return [
        {
          id: 'frame_1',
          label: `Awal Klip (${Math.floor(t1 / 60)}:${String(t1 % 60).padStart(2, '0')})`,
          timestampSec: t1,
          imageUrl: chosenImg,
        },
        {
          id: 'frame_2',
          label: `Klimaks Tengah (${Math.floor(t2 / 60)}:${String(t2 % 60).padStart(2, '0')})`,
          timestampSec: t2,
          imageUrl: ytImg2,
        },
        {
          id: 'frame_3',
          label: `Resolusi Akhir (${Math.floor(t3 / 60)}:${String(t3 % 60).padStart(2, '0')})`,
          timestampSec: t3,
          imageUrl: ytImg3,
        },
      ];
    }

    // 3. Topic-appropriate fallback (NEVER generic social media logos!)
    const topicFallbackUrl = this.getTopicFallbackImage(topic || 'high_energy', clipIndex);
    const baseImg = topicFallbackUrl;

    return [
      { id: 'frame_1', label: 'Frame Pembuka', timestampSec: t1, imageUrl: this.getTopicFallbackImage(topic || 'high_energy', clipIndex * 3) },
      { id: 'frame_2', label: 'Frame Aksi', timestampSec: t2, imageUrl: this.getTopicFallbackImage(topic || 'high_energy', clipIndex * 3 + 1) },
      { id: 'frame_3', label: 'Frame Penutup', timestampSec: t3, imageUrl: this.getTopicFallbackImage(topic || 'high_energy', clipIndex * 3 + 2) },
    ];
  }

  /**
   * Captures actual video frames from an HTML5 video element using an offscreen canvas
   */
  private static async captureVideoCanvasFrames(
    video: HTMLVideoElement,
    timestamps: number[]
  ): Promise<ThumbnailCandidateFrame[]> {
    const results: ThumbnailCandidateFrame[] = [];
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return results;

    const originalTime = video.currentTime;
    const wasPlaying = !video.paused;
    if (wasPlaying) video.pause();

    for (let i = 0; i < timestamps.length; i++) {
      const ts = timestamps[i];
      try {
        await new Promise<void>((resolve) => {
          const onSeeked = () => {
            video.removeEventListener('seeked', onSeeked);
            resolve();
          };
          video.addEventListener('seeked', onSeeked);
          video.currentTime = ts;
          setTimeout(resolve, 800); // timeout protection
        });

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

        results.push({
          id: `frame_${i + 1}`,
          label: i === 0 ? 'Frame Pembuka' : i === 1 ? 'Frame Utama' : 'Frame Penutup',
          timestampSec: ts,
          imageUrl: dataUrl,
        });
      } catch (e) {
        console.warn(`Failed capturing frame at ${ts}:`, e);
      }
    }

    video.currentTime = originalTime;
    return results;
  }

  /**
   * Topic-specific high-resolution photography collections (NOT generic app icons!)
   */
  private static readonly TOPIC_IMAGE_POOLS: Record<ThumbnailTheme, string[]> = {
    automotive: [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80', // Porsche in motion
      'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80', // Supercar drift
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80', // Sports car track
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80', // Chevrolet Corvette action
      'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=800&q=80', // Night street racer
      'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80', // Engine rev / exhaust
    ],
    gaming: [
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80', // Esports Arena
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80', // Gaming setup RGB
      'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80', // Controller action
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80', // Retro arcade gaming
      'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=800&q=80', // High-tier gaming PC
      'https://images.unsplash.com/photo-1612287232258-a550d5e1654b?auto=format&fit=crop&w=800&q=80', // Cyberpunk streamer zone
    ],
    podcast: [
      'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80', // Studio Microphone
      'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=800&q=80', // Radio broadcast mic
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80', // Two people deep talk
      'https://images.unsplash.com/photo-1576267423445-b2e0074d68a4?auto=format&fit=crop&w=800&q=80', // Host speaking interview
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80', // Audio production studio
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80', // Podcast soundboard
    ],
    educational: [
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80', // Study Desk & Notes
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80', // Tech tutorial screen
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80', // Classroom brainstorm
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80', // Coding tutorial diagram
      'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80', // Laptop development
      'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80', // Science experiment
    ],
    cinematic: [
      'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=800&q=80', // Cinematic Dark Horizon
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80', // Dramatic neon street
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80', // Epic mountain mist
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80', // Moody twilight scene
      'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=800&q=80', // Cinematic landscape reflection
      'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80', // City skyline night glow
    ],
    high_energy: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80', // Tech glow
      'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80', // Laser lightning
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80', // Festival high energy
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80', // Neon party vibe
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80', // Sound studio
      'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=800&q=80', // Concert stage
    ],
    minimal: [
      'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80', // Minimal desk
      'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80', // Laptop workspace
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80', // Modern interior office
      'https://images.unsplash.com/photo-1507842229452-774d6c4d775a?auto=format&fit=crop&w=800&q=80', // Clean architectural lines
      'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80', // Pure subtle tones
      'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=800&q=80', // Minimal light geometry
    ]
  };

  /**
   * Topic-specific high-resolution photography (NOT generic app icons!)
   */
  static getTopicFallbackImage(theme: ThumbnailTheme, index = 0): string {
    const pool = this.TOPIC_IMAGE_POOLS[theme] || this.TOPIC_IMAGE_POOLS.high_energy;
    return pool[index % pool.length];
  }

  /**
   * Renders a finalized composite thumbnail onto an HTML5 canvas and returns a high-res data URL
   */
  static async renderCompositeThumbnail(config: ThumbnailConfig): Promise<string> {
    const canvas = document.createElement('canvas');

    if (config.aspectRatio === '9:16') {
      canvas.width = 720;
      canvas.height = 1280;
    } else if (config.aspectRatio === '16:9') {
      canvas.width = 1280;
      canvas.height = 720;
    } else {
      canvas.width = 1080;
      canvas.height = 1080;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context tidak tersedia.');

    // Load background frame image
    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve(); // continue on error with gradient
      img.src = config.selectedFrameUrl;
      setTimeout(resolve, 2500);
    });

    // 1. Draw Background Image or Fallback Gradient
    if (img.complete && img.naturalWidth > 0) {
      if (config.aspectRatio === '9:16') {
        // Blurred backdrop + centered subject
        ctx.save();
        ctx.filter = 'blur(26px) brightness(0.4)';
        ctx.drawImage(img, -40, -40, canvas.width + 80, canvas.height + 80);
        ctx.restore();

        const aspect = img.naturalWidth / img.naturalHeight;
        const fgH = canvas.width / aspect;
        const fgY = (canvas.height - fgH) / 2;
        ctx.drawImage(img, 0, fgY, canvas.width, fgH);
      } else {
        // Cover aspect
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    } else {
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 2. Cinematic Vignette & Bottom/Top Gradient for Maximum Text Readability
    const overlayGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (config.textPosition === 'bottom') {
      overlayGrad.addColorStop(0, 'rgba(0,0,0,0.1)');
      overlayGrad.addColorStop(0.6, 'rgba(0,0,0,0.4)');
      overlayGrad.addColorStop(1, 'rgba(0,0,0,0.92)');
    } else if (config.textPosition === 'top') {
      overlayGrad.addColorStop(0, 'rgba(0,0,0,0.92)');
      overlayGrad.addColorStop(0.4, 'rgba(0,0,0,0.4)');
      overlayGrad.addColorStop(1, 'rgba(0,0,0,0.1)');
    } else {
      overlayGrad.addColorStop(0, 'rgba(0,0,0,0.4)');
      overlayGrad.addColorStop(0.5, 'rgba(0,0,0,0.85)');
      overlayGrad.addColorStop(1, 'rgba(0,0,0,0.4)');
    }
    ctx.fillStyle = overlayGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3. Theme-Specific Graphic Badges
    if (config.showBadge && config.badgeText) {
      ctx.save();
      const badgeY = config.textPosition === 'top' ? 90 : canvas.height - 290;
      let badgeColor = config.accentColor || '#39FF14';

      if (config.theme === 'automotive') {
        badgeColor = '#FF3B30'; // Racing Red
      } else if (config.theme === 'gaming') {
        badgeColor = '#00FFFF'; // Cyber Cyan
      }

      ctx.fillStyle = badgeColor;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(canvas.width / 2 - 130, badgeY, 260, 48, 12);
        ctx.fill();
      } else {
        ctx.fillRect(canvas.width / 2 - 130, badgeY, 260, 48);
      }

      ctx.fillStyle = '#000000';
      ctx.font = '900 20px Montserrat, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(config.badgeText.toUpperCase().slice(0, 24), canvas.width / 2, badgeY + 24);
      ctx.restore();
    }

    // 4. Punchy Headline Typography (3 to 7 Words Max)
    ctx.save();
    const textWords = (config.titleText || 'SOROTAN TERBAIK').toUpperCase().split(' ');
    const punchyText = textWords.slice(0, 7).join(' ');

    const textY =
      config.textPosition === 'top'
        ? 210
        : config.textPosition === 'center'
        ? canvas.height / 2
        : canvas.height - 180;

    // Dark readable pill / card behind text
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    const cardW = canvas.width - 80;
    const cardH = 120;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(40, textY - cardH / 2, cardW, cardH, 24);
      ctx.fill();
    } else {
      ctx.fillRect(40, textY - cardH / 2, cardW, cardH);
    }

    // Headline Text with outline shadow
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 36px Montserrat, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;

    ctx.fillText(punchyText, canvas.width / 2, textY);
    ctx.restore();

    return canvas.toDataURL('image/jpeg', 0.92);
  }

  /**
   * Generates 3 unique design alternatives with distinct frames and layouts
   */
  static async generateThreeAlternatives({
    titleText,
    frames,
    theme,
    aspectRatio = '9:16',
  }: {
    titleText: string;
    frames: ThumbnailCandidateFrame[];
    theme: ThumbnailTheme;
    aspectRatio?: ThumbnailAspectRatio;
  }): Promise<GeneratedThumbnailAlternative[]> {
    const f1 = frames[0]?.imageUrl || this.getTopicFallbackImage(theme);
    const f2 = frames[1]?.imageUrl || frames[0]?.imageUrl || this.getTopicFallbackImage(theme);
    const f3 = frames[2]?.imageUrl || frames[1]?.imageUrl || this.getTopicFallbackImage(theme);

    const alt1Url = await this.renderCompositeThumbnail({
      titleText,
      theme,
      aspectRatio,
      selectedFrameUrl: f1,
      textPosition: 'bottom',
      accentColor: '#FFD700',
      showBadge: true,
      badgeText: '🔥 WAJIB NONTON',
    });

    const alt2Url = await this.renderCompositeThumbnail({
      titleText,
      theme,
      aspectRatio,
      selectedFrameUrl: f2,
      textPosition: 'top',
      accentColor: '#39FF14',
      showBadge: true,
      badgeText: '🚨 KLIMAKS AKSI',
    });

    const alt3Url = await this.renderCompositeThumbnail({
      titleText,
      theme,
      aspectRatio,
      selectedFrameUrl: f3,
      textPosition: 'center',
      accentColor: '#00FFFF',
      showBadge: false,
      badgeText: '',
    });

    return [
      {
        id: 'alt_1',
        theme,
        titleText,
        previewUrl: alt1Url,
        frameTimestampSec: frames[0]?.timestampSec || 0,
      },
      {
        id: 'alt_2',
        theme,
        titleText,
        previewUrl: alt2Url,
        frameTimestampSec: frames[1]?.timestampSec || 0,
      },
      {
        id: 'alt_3',
        theme,
        titleText,
        previewUrl: alt3Url,
        frameTimestampSec: frames[2]?.timestampSec || 0,
      },
    ];
  }
}
