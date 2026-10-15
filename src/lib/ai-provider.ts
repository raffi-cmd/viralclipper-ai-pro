import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { AISettings, AIAnalysisResult } from './types';

export class UnifiedAIClient {
  private settings: AISettings;

  constructor(settings: AISettings) {
    this.settings = settings;
  }

  async analyzeAndTranscribe(
    _audioPath: string,
    targetDurationSec: number,
    totalDurationSec: number
  ): Promise<AIAnalysisResult> {
    const prompt = `
Anda adalah AI Video Editor & Social Media Strategist Viral kelas dunia.
Tugas Anda:
1. Tentukan rentang waktu TERBAIK dengan HOOK terkuat sepanjang sekitar ${targetDurationSec} detik (durasi total: ${totalDurationSec.toFixed(0)} detik).
2. Transkripsikan segmen tersebut kata demi kata dan TERJEMAHKAN ke Bahasa Indonesia kasual yang padat & menarik.
3. Berikan timestamp presisi untuk setiap kata (start & end dlm detik).
4. Suntikkan emoji yang relevan pada kata kunci (misal: "uang" -> "💰", "api" -> "🔥", "sukses" -> "🚀").
5. Buat caption interaktif + 7 hashtag viral Indonesia.

KEMBALIKAN HANYA JSON VALID DENGAN SKEMA:
{
  "hookStart": 0,
  "hookEnd": ${targetDurationSec},
  "reasoning": "string",
  "detectedLanguage": "id",
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
      return this.analyzeWithGemini(prompt);
    } else {
      return this.analyzeWithOpenAICompatible(prompt);
    }
  }

  private async analyzeWithGemini(prompt: string): Promise<AIAnalysisResult> {
    const genAI = new GoogleGenerativeAI(this.settings.apiKey);
    const model = genAI.getGenerativeModel({
      model: this.settings.modelName || 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text() || '{}';
    return JSON.parse(responseText) as AIAnalysisResult;
  }

  private async analyzeWithOpenAICompatible(prompt: string): Promise<AIAnalysisResult> {
    const client = new OpenAI({
      apiKey: this.settings.apiKey,
      baseURL: this.settings.baseUrl || undefined,
      dangerouslyAllowBrowser: true,
    });

    const model = this.settings.modelName || (this.settings.provider === 'deepseek' ? 'deepseek-chat' : 'gpt-4o-mini');

    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an elite video editor and viral hook specialist. Always output strictly valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content || '{}';
    return JSON.parse(content) as AIAnalysisResult;
  }
}
