import { SubtitleSegment, SubtitleStyleConfig } from './types';

export class SubtitleFileExporter {
  private static formatSRTTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  }

  private static formatASSTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const centis = Math.floor((seconds % 1) * 100);
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`;
  }

  static generateSRT(subtitles: SubtitleSegment[]): string {
    return subtitles
      .map((seg, idx) => {
        const start = this.formatSRTTime(seg.start);
        const end = this.formatSRTTime(seg.end);
        return `${idx + 1}\n${start} --> ${end}\n${seg.text}\n`;
      })
      .join('\n');
  }

  static generateASS(subtitles: SubtitleSegment[], config: SubtitleStyleConfig): string {
    const font = config.fontFamily || 'Montserrat';
    const size = config.fontSize || 22;

    const header = `[Script Info]
Title: ViralClipper AI Pro Export
ScriptType: v4.00+
WrapStyle: 0
PlayResX: 384
PlayResY: 683

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${font},${size},&H00FFFFFF,&H0000FFFF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,3,2,2,30,30,80,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    const events = subtitles.map((seg) => {
      const s = this.formatASSTime(seg.start);
      const e = this.formatASSTime(seg.end);
      return `Dialogue: 0,${s},${e},Default,,0,0,0,,${seg.text.toUpperCase()}`;
    });

    return header + events.join('\n');
  }

  static downloadBlob(content: string, filename: string, mimeType: string): void {
    if (typeof window === 'undefined') return;
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
