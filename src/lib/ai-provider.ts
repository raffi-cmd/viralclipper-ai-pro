import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import fs from 'fs';
import { AISettings, AIAnalysisResult } from './types';

export class UnifiedAIClient {
  private settings: AISettings;

  constructor(settings: AISettings) {
    this.settings = settings;
  }

  /**
   * Menganalisis audio, mencari viral hook, mentranskripsikan ke Bahasa Indonesia,
   * menyuntikkan emoji kontekstual, dan memproduksi copywriting media sosial.
   */
  async analyzeAndTranscribe(
    audioPath: string,
    targetDurationSec: number,
    totalDurationSec: number
  ): Promise<AIAnalysisResult> {
    const prompt = `
Anda adalah AI Video Editor & Social Media Strategist Viral kelas dunia.
Tugas Anda:
1. Dari audio ini, tentukan rentang waktu TERBAIK dengan HOOK terkuat sepanjang sekitar ${targetDurationSec} detik (durasi total audio: ${totalDurationSec.toFixed(0)} detik).
   Hook harus mengandung emosi tinggi, rasa penasaran, atau fakta mengejutkan di detik pertama.
2. Transkripsikan segmen tersebut kata demi kata dan TERJEMAHKAN ke Bahasa Indonesia yang kasual, padat, dan menarik (gaya konten kreator).
3. Berikan timestamp presisi untuk setiap kata (start & end dlm detik).
4. Suntikkan emoji yang relevan pada kata kunci (contoh: "uang" -> "💰", "api" -> "🔥", "sukses" -> "🚀", "kaget" -> "😱").
5. Buat caption interaktif dengan format 3 baris copy + 7 hashtag viral Indonesia (#fyp #trending dll).

KEMBALIKAN HANYA JSON VALID DENGAN SKEMA:
{
  "hookStart": number,
  "hookEnd": number,
  "reasoning": "string",
  "detectedLanguage": "string",
  "subtitles": [
    {
      "id": 1,
      "start": 0.0,
      "end": 2.5,
      "text": "Rahasia besar menghasilkan uang",
      "words": [
        {"word": "Rahasia", "start": 0.0, "end": 0.6, "emoji": "🤫"},
        {"word": "besar", "start": 0.7, "end": 1.1},
        {"word": "menghasilkan", "start": 1.2, "end": 1.8},
        {"word": "uang", "start": 1.9, "end": 2.5, "emoji": "💰"}
      ]
    }
  ],
  "copywriting": {
    "hookHeadline": "string",
    "caption": "string",
    "hashtags": ["#fyp", "#viral"]
  }
}
`;

    if (this.settings.provider === 'google') {
      return this.analyzeWithGemini(audioPath, prompt);
    } else {
      return this.analyzeWithOpenAICompatible(audioPath, prompt);
    }
  }

  private async analyzeWithGemini(audioPath: string, prompt: string): Promise<AIAnalysisResult> {
    const ai = new GoogleGenAI({ apiKey: this.settings.apiKey });
    const model = this.settings.modelName || 'gemini-1.5-flash';

    const audioBuffer = fs.readFileSync(audioPath);
    const audioBase64 = audioBuffer.toString('base64');

    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'audio/mp3',
                data: audioBase64,
              },
            },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    return JSON.parse(responseText) as AIAnalysisResult;
  }

  private async analyzeWithOpenAICompatible(audioPath: string, prompt: string): Promise<AIAnalysisResult> {
    const client = new OpenAI({
      apiKey: this.settings.apiKey,
      baseURL: this.settings.baseUrl || undefined,
    });

    const model = this.settings.modelName || (this.settings.provider === 'deepseek' ? 'deepseek-chat' : 'gpt-4o-mini');

    // Transkripsi audio
    const transcription = await client.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['word'],
    });

    // Kirim ke LLM untuk pemilihan hook, terjemahan Indo, dan subtitle karaoke
    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an elite video editor and viral hook specialist. Always output strictly valid JSON.',
        },
        {
          role: 'user',
          content: `${prompt}\n\nBerikut transkripsi sumber beserta timestamp kata:\n${JSON.stringify(transcription)}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content || '{}';
    return JSON.parse(content) as AIAnalysisResult;
  }
}
