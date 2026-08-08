'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAudit, clientIp } from '@/lib/audit';
import { checkLoginAllowed, recordAttempt, remainingAttempts } from '@/lib/loginGuard';
import { missingEnv, SETUP_HINT } from '@/lib/config';

/** ข้อความเดียวใช้กับทุกกรณีที่ล็อกอินไม่ผ่าน — ไม่บอกใบ้ว่าอีเมลมีอยู่จริงไหม */
const GENERIC_ERROR = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';

function safeNext(value) {
  // กัน open redirect: รับเฉพาะ path ภายในที่ขึ้นต้นด้วย /admin
  const next = String(value || '');
  return next.startsWith('/admin') ? next : '/admin';
}

export async function login(_prevState, formData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  const next = safeNext(formData.get('next'));
  const ip = clientIp();

  if (!email || !password) {
    return { error: 'กรุณากรอกอีเมลและรหัสผ่าน' };
  }

  // 0) ตั้งค่าครบไหม — ถ้าขาดต้องบอกให้ชัด ไม่ใช่ปล่อยให้แอปโยน exception ใส่หน้าผู้ใช้
  //    ที่นี่เลือก "ล็อกไว้ก่อน" แทนการปล่อยผ่าน เพราะถ้าไม่มี service role key
  //    ระบบจะนับการล็อกอินผิดไม่ได้และเขียน audit log ไม่ได้
  //    ซึ่งเป็นสองอย่างที่ระบบราชการขาดไม่ได้
  const missing = missingEnv();
  if (missing.length) {
    console.error('[login] ตั้งค่า env ไม่ครบ:', missing.join(', '));
    return {
      error: `ระบบยังตั้งค่าไม่ครบ (ขาด ${missing.join(', ')}) — ${SETUP_HINT}`,
      locked: true,
    };
  }

  // 1) โดนล็อกอยู่หรือเปล่า
  let gate;
  try {
    gate = await checkLoginAllowed(email, ip);
  } catch (err) {
    console.error('[login] ตรวจ rate limit ไม่สำเร็จ:', err?.message || err);
    return { error: 'ตอนนี้ระบบขัดข้อง กรุณาลองใหม่อีกครั้งในอีกสักครู่' };
  }
  if (!gate.ok) {
    await logAudit({ actorEmail: email, action: 'auth.locked', detail: { ip } });
    return { error: gate.reason, locked: true };
  }

  // 2) ตรวจรหัสผ่านกับ Supabase Auth
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data?.user) {
    await recordAttempt(email, ip, false);
    await logAudit({
      actorEmail: email,
      action: 'auth.login_failed',
      detail: { reason: error?.message || 'unknown' },
    });
    const left = await remainingAttempts(email);
    return {
      error:
        left > 0 && left <= 2
          ? `${GENERIC_ERROR} (เหลืออีก ${left} ครั้งก่อนถูกล็อกชั่วคราว)`
          : GENERIC_ERROR,
    };
  }

  // 3) รหัสผ่านถูก แต่ต้องเป็นเจ้าหน้าที่ที่ยังใช้งานอยู่ด้วย
  //    ใช้ admin client เพราะ officers ถูก RLS คุมด้วย is_active_officer()
  //    ซึ่งบัญชีที่โดนปิดใช้งานจะอ่านแถวตัวเองไม่เจอ
  const admin = createAdminClient();
  const { data: officer } = await admin
    .from('officers')
    .select('id, full_name, active')
    .eq('id', data.user.id)
    .maybeSingle();

  if (!officer || !officer.active) {
    await supabase.auth.signOut();
    await recordAttempt(email, ip, false);
    await logAudit({
      actorId: data.user.id,
      actorEmail: email,
      action: 'auth.login_failed',
      detail: { reason: officer ? 'บัญชีถูกปิดใช้งาน' : 'ไม่มีสิทธิ์เจ้าหน้าที่' },
    });
    return {
      error: officer
        ? 'บัญชีนี้ถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ'
        : 'บัญชีนี้ไม่มีสิทธิ์เข้าระบบเจ้าหน้าที่',
    };
  }

  // 4) ผ่านหมด
  await recordAttempt(email, ip, true);
  await admin
    .from('officers')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', data.user.id);
  await logAudit({
    actorId: data.user.id,
    actorEmail: email,
    action: 'auth.login',
  });

  revalidatePath('/admin', 'layout');
  redirect(next);
}

export async function logout() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await logAudit({
      actorId: user.id,
      actorEmail: user.email || '',
      action: 'auth.logout',
    });
  }

  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
