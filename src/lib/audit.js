import 'server-only';

import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';

/** ชนิดเหตุการณ์ที่บันทึก พร้อมคำอธิบายภาษาไทยสำหรับแสดงผล */
export const AUDIT_ACTIONS = {
  'auth.login': 'ล็อกอินสำเร็จ',
  'auth.login_failed': 'ล็อกอินไม่สำเร็จ',
  'auth.locked': 'ถูกล็อกชั่วคราว (พยายามผิดหลายครั้ง)',
  'auth.logout': 'ล็อกเอาท์',
  'permit.approve': 'อนุมัติคำขอบิน',
  'permit.reject': 'ไม่อนุมัติคำขอบิน',
  'report.update': 'เปลี่ยนสถานะเบาะแส',
  'report.export': 'ส่งออกข้อมูลเบาะแส',
  'officer.create': 'เพิ่มเจ้าหน้าที่',
  'officer.disable': 'ปิดใช้งานเจ้าหน้าที่',
  'officer.enable': 'เปิดใช้งานเจ้าหน้าที่',
  'officer.reset_password': 'ส่งลิงก์ตั้งรหัสผ่านใหม่',
};

/** ดึง IP จริงจาก header ของ proxy (Vercel / Cloudflare / nginx) */
export function clientIp() {
  const h = headers();
  const fwd = h.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return h.get('x-real-ip') || h.get('cf-connecting-ip') || '';
}

export function clientUserAgent() {
  return (headers().get('user-agent') || '').slice(0, 300);
}

/**
 * เขียน audit log — ตารางเป็น append-only เขียนผ่าน service role เท่านั้น
 *
 * ตั้งใจให้ "ไม่มีวันโยน error" เพราะการบันทึกล็อกล้มเหลว
 * ไม่ควรทำให้การอนุมัติคำขอของเจ้าหน้าที่พังตามไปด้วย
 */
export async function logAudit({
  actorId = null,
  actorEmail = '',
  action,
  targetType = '',
  targetId = '',
  detail = {},
}) {
  try {
    const supabase = createAdminClient();
    await supabase.from('audit_logs').insert({
      actor_id: actorId,
      actor_email: actorEmail,
      action,
      target_type: targetType,
      target_id: String(targetId || ''),
      detail,
      ip: clientIp(),
      user_agent: clientUserAgent(),
    });
  } catch (err) {
    console.error('[audit] บันทึกล็อกไม่สำเร็จ:', err?.message || err);
  }
}
