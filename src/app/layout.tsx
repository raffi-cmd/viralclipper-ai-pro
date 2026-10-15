import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ViralClipper AI Pro - AI Video Downloader & Viral High-Retention Editor",
  description: "Otomatisasi klip video viral 9:16 dari YouTube/TikTok dengan transkripsi Bahasa Indonesia, efek subtitle Hormozi, dynamic zoom, dan copywriting siap upload.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased min-h-screen bg-[#09090b] text-[#fafafa]">
        {children}
      </body>
    </html>
  );
}
