# 🚀 ViralClipper AI Pro

**ViralClipper AI Pro** adalah aplikasi web otomatisasi video bertenaga AI untuk memotong klip video (YouTube, TikTok, Instagram), mendeteksi momen viral (Hook) tertinggi, mentranskripsikan & menerjemahkan ke Bahasa Indonesia secara presisi, melakukan auto-editing retensi tinggi (dual-layer 9:16 portrait, subtle camera zoom, karaoke-style subtitles, emoji injection), serta menghasilkan copywriting siap upload (caption + hashtag viral).

---

## ✨ Fitur Utama

- 🌐 **Multi-LLM & Custom Gateway Support**: Kompatibel dengan Google Gemini (`@google/genai`), OpenAI, Anthropic Claude, OpenRouter, DeepSeek, atau endpoint Cloudflare AI Gateway kustom.
- 📱 **Dual-Layer 9:16 Canvas**: Mengubah video landscape 16:9 menjadi video vertikal 9:16 tanpa gepeng (Background Gaussian Blur tebal + Foreground center-fit).
- 🧠 **AI Viral Hook Detection**: Menemukan segmen video paling emosional dan berpotensi viral sesuai target durasi pilihan (30 detik, 1 menit, 2 menit, 5 menit).
- 🇮🇩 **Auto Indonesian Translation & Subtitle**: Transkripsi kata demi kata (*word-level timestamps*) yang diterjemahkan ke Bahasa Indonesia kasual ala konten kreator.
- ⚡ **Word-by-Word Active Highlighting (Alex Hormozi Style)**: Subtitle animasi dengan efek penyorotan kata aktif berwarna hijau stabilo, huruf tebal, dan outline hitam kontras.
- 💰 **Auto-Emoji Injector**: Menyisipkan emoji kontekstual secara otomatis pada kata kunci subtitle (contoh: "uang" -> 💰).
- 🎥 **Dynamic Subtle Motion (Anti-Kaku)**: Efek pergerakan zoom kamera perlahan setiap 3-4 detik menggunakan FFmpeg Complex Filter agar video visual tidak statis.
- 🏷️ **Hook Overlay & Watermark**: Menampilkan teks banner provokatif di 3 detik pertama serta username watermark dengan opasitas 70%.
- ✍️ **1-Click Social Media Copywriting**: Otomatis menghasilkan headline, caption interaktif, dan 7+ hashtag viral yang bisa disalin dalam satu kali klik.
- 📡 **Real-time SSE Status Streaming**: Pembaruan progress live (0-100%) menggunakan Server-Sent Events tanpa polling.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router, TypeScript, React 18)
- **Styling**: Tailwind CSS, Lucide Icons, Framer Motion
- **Video Processing**: `ffmpeg`, `ffprobe`, `yt-dlp`
- **AI Core**: `@google/genai`, `openai` SDK

---

## 📋 Prasyarat Sistem

Pastikan mesin atau server Anda telah menginstal:
1. **Node.js** (v18+ atau v20+)
2. **FFmpeg & FFprobe**:
   - Ubuntu/Debian: `sudo apt update && sudo apt install -y ffmpeg`
   - MacOS: `brew install ffmpeg`
   - Windows: `winget install Gyan.FFmpeg` atau `choco install ffmpeg`
3. **yt-dlp**:
   - `sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && sudo chmod a+rx /usr/local/bin/yt-dlp`
   - Atau via pip: `pip install yt-dlp`

---

## 🚀 Panduan Menjalankan Secara Lokal

1. **Clone repository:**
   ```bash
   git clone https://github.com/raffi-cmd/viralclipper-ai-pro.git
   cd viralclipper-ai-pro
   ```

2. **Instal dependensi:**
   ```bash
   npm install
   ```

3. **Jalankan server pengembangan:**
   ```bash
   npm run dev
   ```

4. Buka browser di [http://localhost:3000](http://localhost:3000).

5. Klik tombol **Engine Settings** di pojok kanan atas untuk memasukkan API Key AI Anda (Google Gemini, OpenAI, atau custom gateway).

---

## 📜 Lisensi
MIT License - Bebas digunakan dan dikembangkan untuk keperluan komersial maupun pribadi.
