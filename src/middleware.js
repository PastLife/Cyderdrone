import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * ทำสองอย่าง:
 * 1. รีเฟรช session ของ Supabase ทุก request (ไม่งั้น token หมดอายุแล้วเจ้าหน้าที่หลุดกลางทาง)
 * 2. กันไม่ให้คนที่ยังไม่ล็อกอินเข้า /admin — เด้งไป /login พร้อมจำหน้าเดิมไว้
 *
 * middleware เช็กแค่ว่า "ล็อกอินหรือยัง" เท่านั้น
 * ส่วนการเช็กว่าเป็นเจ้าหน้าที่ที่ยังใช้งานอยู่ไหม ทำใน layout + RLS อีกชั้น
 *
 * หลักสำคัญ: middleware ตัวนี้ครอบทุกเส้นทาง ถ้ามันโยน error ทั้งเว็บจะ 500 หมด
 * รวมถึงหน้าแจ้งเบาะแสที่ประชาชนต้องใช้ จึงต้อง "ล้มแบบไม่ลากคนอื่นลงไปด้วย":
 * มีปัญหาเมื่อไหร่ให้ปิดเฉพาะ /admin แล้วปล่อยหน้าสาธารณะทำงานต่อ
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** ปิดทางเข้า /admin พร้อมบอกสาเหตุ ส่วนหน้าอื่นปล่อยผ่าน */
function lockAdminOnly(request, reason) {
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next({ request });
  }
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = `?error=${reason}`;
  return NextResponse.redirect(url);
}

export async function middleware(request) {
  const { pathname, search } = request.nextUrl;

  // ยังไม่ได้ตั้ง env — เกิดบ่อยตอน deploy ครั้งแรก
  // ถ้าปล่อยให้ createServerClient ทำงานต่อมันจะ throw แล้วทั้งเว็บ 500
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error(
      '[middleware] ไม่พบ NEXT_PUBLIC_SUPABASE_URL หรือ NEXT_PUBLIC_SUPABASE_ANON_KEY — ' +
        'ปิดเฉพาะ /admin ไว้ก่อน หน้าสาธารณะยังใช้งานได้'
    );
    return lockAdminOnly(request, 'config');
  }

  let response = NextResponse.next({ request });
  let user = null;

  try {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const result = await supabase.auth.getUser();
    user = result.data?.user ?? null;
  } catch (err) {
    // Supabase ล่ม / เน็ตมีปัญหา — ไม่รู้ว่าใครเป็นใคร จึงถือว่ายังไม่ล็อกอิน
    console.error('[middleware] ตรวจ session ไม่สำเร็จ:', err?.message || err);
    return lockAdminOnly(request, 'unavailable');
  }

  if (!user && pathname.startsWith('/admin')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  // ล็อกอินแล้วไม่ต้องเห็นหน้า login อีก
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/admin';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * ทุกเส้นทาง ยกเว้นไฟล์สแตติกและรูปภาพ
     * (ต้องครอบคลุมหน้าทั่วไปด้วย เพื่อให้ token ถูกรีเฟรชสม่ำเสมอ)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
