import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const outputsDir = path.join(process.cwd(), 'public', 'outputs');
  const ONE_HOUR_MS = 60 * 60 * 1000;
  const now = Date.now();
  let deletedCount = 0;

  try {
    if (fs.existsSync(outputsDir)) {
      const files = fs.readdirSync(outputsDir);
      for (const file of files) {
        if (file === '.gitkeep') continue;
        const filePath = path.join(outputsDir, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > ONE_HOUR_MS) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Pembersihan selesai. ${deletedCount} file lama dihapus.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
