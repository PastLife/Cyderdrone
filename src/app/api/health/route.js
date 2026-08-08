import { NextResponse } from 'next/server';
import { missingEnv } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * ตรวจสุขภาพระบบแบบเร็ว ๆ ตอน deploy
 * บอกแค่ว่าตัวแปรไหน "ตั้งแล้ว/ยังไม่ตั้ง" ไม่คืนค่าจริงออกไป
 */
export async function GET() {
  const missing = missingEnv();
  return NextResponse.json(
    {
      ok: missing.length === 0,
      missingEnv: missing,
      hint: missing.length
        ? 'ตั้งค่าที่ Vercel → Settings → Environment Variables แล้ว Redeploy'
        : 'ตั้งค่าครบแล้ว',
    },
    { status: missing.length ? 503 : 200 }
  );
}
