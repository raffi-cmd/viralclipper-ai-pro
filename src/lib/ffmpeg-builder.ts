import fs from 'fs';
import { exec } from 'child_process';
import util from 'util';
import { SubtitlePreset, SubtitleSegment } from './types';

const execPromise = util.promisify(exec);

export class FFmpegPipelineBuilder {
  /**
   * Konversi detik ke format timestamp ASS (H:MM:SS.cs)
   */
  private static formatASSTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const centis = Math.floor((seconds % 1) * 100);

    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`;
  }

  /**
   * Menghasilkan file subtitle .ass berkemampuan styling tinggi (highlight kata & emoji)
   */
  static generateASSFile(
    subtitles: SubtitleSegment[],
    outputPath: string,
    preset: SubtitlePreset,
    _fontsDir: string
  ): void {
    let styleLine = '';

    if (preset === 'hormozi') {
      // Alex Hormozi: Montserrat Extra-Bold, Font Size 24, Kuning (&H0000FFFF), Outline Hitam tebal 4.5px
      styleLine = `Style: Default,Montserrat,24,&H0000FFFF,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,4.5,2,2,40,40,90,1`;
    } else if (preset === 'minimalist') {
      // Minimalist: Inter Bold, Putih bersih dengan box semi-transparan
      styleLine = `Style: Default,Inter,20,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,3,1.5,0,2,30,30,85,1`;
    } else {
      // Neon Glow: Cyan Neon Text dengan Shadow lebar
      styleLine = `Style: Default,Montserrat,22,&H00FFFF00,&H000000FF,&H00FF00FF,&H00000000,-1,0,0,0,100,100,0,0,1,3,4,2,35,35,85,1`;
    }

    const header = `[Script Info]
Title: ViralClipper Dynamic Subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.601
PlayResX: 384
PlayResY: 683

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
${styleLine}

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    const events: string[] = [];

    subtitles.forEach((seg) => {
      const segStart = seg.start;
      const segEnd = seg.end;

      if (seg.words && seg.words.length > 0) {
        seg.words.forEach((_targetWord, idx) => {
          const currentWord = seg.words[idx];
          const wStart = this.formatASSTime(currentWord.start);
          const wEnd = this.formatASSTime(currentWord.end);

          const styledSentence = seg.words.map((w, wIdx) => {
            const emojiPrefix = w.emoji ? `${w.emoji} ` : '';
            if (wIdx === idx) {
              // Highlight kata aktif: Hijau Stabilo + diperbesar sedikit
              return `{\\c&H0033FF00\\fscx110\\fscy110}${emojiPrefix}${w.word.toUpperCase()}{\\r}`;
            }
            return `${emojiPrefix}${w.word.toUpperCase()}`;
          }).join(' ');

          events.push(`Dialogue: 0,${wStart},${wEnd},Default,,0,0,0,,${styledSentence}`);
        });
      } else {
        const startStr = this.formatASSTime(segStart);
        const endStr = this.formatASSTime(segEnd);
        events.push(`Dialogue: 0,${startStr},${endStr},Default,,0,0,0,,${seg.text.toUpperCase()}`);
      }
    });

    fs.writeFileSync(outputPath, header + events.join('\n'), 'utf-8');
  }

  /**
   * Menjalankan proses FFmpeg Complex Filter Graph
   */
  static async renderVideo({
    inputVideo,
    clipStart,
    clipDuration,
    outputVideo,
    assPath,
    isLandscape,
    hookTitle,
    watermarkText,
  }: {
    inputVideo: string;
    clipStart: number;
    clipDuration: number;
    outputVideo: string;
    assPath: string;
    isLandscape: boolean;
    hookTitle?: string;
    watermarkText?: string;
  }): Promise<void> {
    const escapedAssPath = assPath.replace(/\\/g, '/').replace(/:/g, '\\:');

    let currentFilterTag = '[v_sub]';
    let filterGraph = '';

    if (isLandscape) {
      filterGraph += `[0:v]trim=start=${clipStart}:duration=${clipDuration},setpts=PTS-STARTPTS,split=2[raw_bg][raw_fg];[raw_bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=30[bg];[raw_fg]scale=1080:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2[base_canvas];`;
    } else {
      filterGraph += `[0:v]trim=start=${clipStart}:duration=${clipDuration},setpts=PTS-STARTPTS,scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2[base_canvas];`;
    }

    // Dynamic Subtle Motion (slow zoom cycle)
    filterGraph += `[base_canvas]scale=w='1080*(1+0.04*sin(2*PI*t/4))':h='1920*(1+0.04*sin(2*PI*t/4))':eval=frame,crop=1080:1920[v_motion];`;

    let currentOut = 'v_motion';
    if (hookTitle && hookTitle.trim().length > 0) {
      const sanitizedHook = hookTitle.replace(/'/g, '').replace(/:/g, '\\:');
      filterGraph += `[${currentOut}]drawbox=x=60:y=180:w=960:h=120:color=red@0.9:t=fill:enable='between(t,0,3)',drawtext=text='${sanitizedHook}':x=(w-text_w)/2:y=220:fontsize=46:fontcolor=white:enable='between(t,0,3)'[v_hook];`;
      currentOut = 'v_hook';
    }

    if (watermarkText && watermarkText.trim().length > 0) {
      const sanitizedWatermark = watermarkText.replace(/'/g, '');
      filterGraph += `[${currentOut}]drawtext=text='@${sanitizedWatermark}':x=w-tw-50:y=h-th-70:fontsize=28:fontcolor=white@0.7[v_wm];`;
      currentOut = 'v_wm';
    }

    filterGraph += `[${currentOut}]ass='${escapedAssPath}'${currentFilterTag}`;

    const ffmpegCommand = `ffmpeg -y -ss ${clipStart} -t ${clipDuration} -i "${inputVideo}" -filter_complex "${filterGraph}" -map "${currentFilterTag}" -map 0:a? -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 192k -movflags +faststart "${outputVideo}"`;

    await execPromise(ffmpegCommand);
  }
}
