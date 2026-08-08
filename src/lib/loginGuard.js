import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

/** พยายามผิดได้กี่ครั้งต่ออีเมล ก่อนโดนล็อก */
export const MAX_ATTEMPTS_EMAIL = 5;
/** พยายามผิดได้กี่ครั้งต่อ IP (กันยิงหลายอีเมลจากเครื่องเดียว) */
export const MAX_ATTEMPTS_IP = 15;
/** ช่วงเวลาที่นับย้อนหลัง (นาที) — ครบเวลาแล้วนับใหม่ */
export const WINDOW_MINUTES = 15;

function windowStart() {
  return new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
}

/**
 * ตรวจว่าอีเมล/IP นี้ยังล็อกอินได้อยู่ไหม
 * @returns {Promise<{ok: boolean, reason?: string, retryAfterMin?: number}>}
 */
export async function checkLoginAllowed(email, ip) {
  const supabase = createAdminClient();
  const since = windowStart();
  const key = String(email || '').trim().toLowerCase();

  const [byEmail, byIp] = await Promise.all([
    supabase
      .from('login_attempts')
      .select('created_at')
      .eq('email', key)
      .eq('ok', false)
      .gte('created_at', since)
      .order('created_at', { ascending: false }),
    ip
      ? supabase
          .from('login_attempts')
          .select('created_at')
          .eq('ip', ip)
          .eq('ok', false)
          .gte('created_at', since)
      : Promise.resolve({ data: [] }),
  ]);

  const emailFails = byEmail.data?.length ?? 0;
  const ipFails = byIp.data?.length ?? 0;

  if (emailFails >= MAX_ATTEMPTS_EMAIL) {
    // นับเวลาปลดล็อกจากครั้งที่ผิด "ล่าสุด" — ยิ่งพยายามยิ่งต้องรอนานขึ้น
    const last = new Date(byEmail.data[0].created_at).getTime();
    const retryAfterMin = Math.max(
      1,
      Math.ceil((last + WINDOW_MINUTES * 60_000 - Date.now()) / 60_000)
    );
    return {
      ok: false,
      reason: `ใส่รหัสผ่านผิดเกิน ${MAX_ATTEMPTS_EMAIL} ครั้ง บัญชีนี้ถูกล็อกชั่วคราว กรุณารออีก ${retryAfterMin} นาที`,
      retryAfterMin,
    };
  }

  if (ipFails >= MAX_ATTEMPTS_IP) {
    return {
      ok: false,
      reason: `มีการพยายามล็อกอินผิดพลาดจำนวนมากจากเครือข่ายนี้ กรุณารอ ${WINDOW_MINUTES} นาที`,
      retryAfterMin: WINDOW_MINUTES,
    };
  }

  return { ok: true };
}

/** จำนวนครั้งที่ผิดติดต่อกัน เอาไว้บอกผู้ใช้ว่าเหลืออีกกี่ครั้ง */
export async function remainingAttempts(email) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('login_attempts')
    .select('id')
    .eq('email', String(email || '').trim().toLowerCase())
    .eq('ok', false)
    .gte('created_at', windowStart());
  return Math.max(0, MAX_ATTEMPTS_EMAIL - (data?.length ?? 0));
}

/** บันทึกผลการพยายามล็อกอิน; สำเร็จแล้วล้างประวัติที่ผิดของอีเมลนั้นทิ้ง */
export async function recordAttempt(email, ip, ok) {
  const supabase = createAdminClient();
  const key = String(email || '').trim().toLowerCase();

  try {
    await supabase.from('login_attempts').insert({ email: key, ip: ip || '', ok });
    if (ok) {
      await supabase
        .from('login_attempts')
        .delete()
        .eq('email', key)
        .eq('ok', false);
    }
  } catch (err) {
    console.error('[loginGuard] บันทึกความพยายามล็อกอินไม่สำเร็จ:', err?.message || err);
  }
}
