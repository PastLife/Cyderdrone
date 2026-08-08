import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * Supabase client สำหรับ Server Component / Server Action / Route Handler
 * อ่าน-เขียน session ผ่านคุกกี้ httpOnly
 *
 * หมายเหตุ: การ set คุกกี้ทำได้เฉพาะใน Server Action หรือ Route Handler
 * ใน Server Component จะโยน error ซึ่งเราจับทิ้งได้ เพราะ middleware รีเฟรช session ให้อยู่แล้ว
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // เรียกจาก Server Component — ปล่อยผ่าน middleware จัดการรีเฟรชให้
          }
        },
      },
    }
  );
}
