import 'server-only';

/**
 * ตรวจว่าตั้งค่า env ครบไหม — ใช้แสดงข้อความที่อ่านรู้เรื่อง
 * แทนที่จะปล่อยให้แอปโยน exception ดิบ ๆ ใส่หน้าผู้ใช้
 */

export const PUBLIC_ENV = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];

export function missingPublicEnv() {
  return PUBLIC_ENV.filter((k) => !process.env[k]);
}

/** service role key จำเป็นสำหรับ audit log, rate limit และการจัดการบัญชี */
export function hasServiceRole() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function missingEnv() {
  const missing = missingPublicEnv();
  if (!hasServiceRole()) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  return missing;
}

export const SETUP_HINT =
  'ตั้งค่าที่ Vercel → Project → Settings → Environment Variables แล้ว Redeploy ใหม่';
