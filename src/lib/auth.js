import 'server-only';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * คืนข้อมูลเจ้าหน้าที่ที่ล็อกอินอยู่ หรือ null ถ้ายังไม่ล็อกอิน / ถูกปิดใช้งาน
 *
 * ใช้ getUser() ไม่ใช่ getSession() — getUser() ยิงไปตรวจกับเซิร์ฟเวอร์ Supabase จริง
 * ส่วน getSession() อ่านจากคุกกี้เฉย ๆ ซึ่งปลอมได้ ห้ามใช้ตัดสินสิทธิ์
 */
export async function getOfficer() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: officer } = await supabase
    .from('officers')
    .select('id, email, full_name, position, active, last_login_at')
    .eq('id', user.id)
    .maybeSingle();

  if (!officer || !officer.active) return null;
  return officer;
}

/**
 * บังคับว่าต้องเป็นเจ้าหน้าที่ที่ใช้งานอยู่ ไม่งั้นเด้งไปหน้า /login
 * @param {string} nextPath เส้นทางที่จะพากลับมาหลังล็อกอินสำเร็จ
 */
export async function requireOfficer(nextPath = '/admin') {
  const officer = await getOfficer();
  if (!officer) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return officer;
}
