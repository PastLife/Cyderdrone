import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * ทำสองอย่าง:
 * 1. รีเฟรช session ของ Supabase ทุก request (ไม่งั้น token หมดอายุแล้วเจ้าหน้าที่หลุดกลางทาง)
 * 2. กันไม่ให้คนที่ยังไม่ล็อกอินเข้า /admin — เด้งไป /login พร้อมจำหน้าเดิมไว้
 *
 * middleware เช็กแค่ว่า "ล็อกอินหรือยัง" เท่านั้น
 * ส่วนการเช็กว่าเป็นเจ้าหน้าที่ที่ยังใช้งานอยู่ไหม ทำใน layout + RLS อีกชั้น
 */
export async function middleware(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
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
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

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
