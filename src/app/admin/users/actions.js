'use server';

import { revalidatePath } from 'next/cache';

import { requireOfficer } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/audit';
import { missingEnv, SETUP_HINT } from '@/lib/config';

/** เพิ่มเจ้าหน้าที่ใหม่ — สร้าง auth user + แถวใน officers ให้ครบในทีเดียว */
export async function createOfficer(_prevState, formData) {
  const me = await requireOfficer('/admin/users');

  const email = String(formData.get('email') || '').trim().toLowerCase();
  const fullName = String(formData.get('full_name') || '').trim();
  const position = String(formData.get('position') || '').trim();
  const password = String(formData.get('password') || '');

  if (!email || !fullName) {
    return { error: 'กรุณากรอกอีเมลและชื่อ-นามสกุล' };
  }
  if (password.length < 12) {
    return { error: 'รหัสผ่านต้องยาวอย่างน้อย 12 ตัวอักษร' };
  }

  const missing = missingEnv();
  if (missing.length) {
    return { error: `ระบบยังตั้งค่าไม่ครบ (ขาด ${missing.join(', ')}) — ${SETUP_HINT}` };
  }

  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    return {
      error: /already/i.test(error.message)
        ? 'อีเมลนี้มีบัญชีอยู่แล้ว'
        : `สร้างบัญชีไม่สำเร็จ: ${error.message}`,
    };
  }

  const { error: insertError } = await admin.from('officers').insert({
    id: data.user.id,
    email,
    full_name: fullName,
    position,
    active: true,
  });

  if (insertError) {
    // สร้าง auth user ไปแล้วแต่แถว officers ล้ม — ลบทิ้งไม่ให้มีบัญชีค้างที่ล็อกอินได้แต่ไม่มีสิทธิ์
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: `บันทึกข้อมูลเจ้าหน้าที่ไม่สำเร็จ: ${insertError.message}` };
  }

  await logAudit({
    actorId: me.id,
    actorEmail: me.email,
    action: 'officer.create',
    targetType: 'officer',
    targetId: data.user.id,
    detail: { email, full_name: fullName, position },
  });

  revalidatePath('/admin/users');
  return { ok: `เพิ่มเจ้าหน้าที่ ${fullName} เรียบร้อย` };
}

/** เปิด/ปิดใช้งานบัญชีเจ้าหน้าที่ */
export async function setOfficerActive(formData) {
  const me = await requireOfficer('/admin/users');

  const id = String(formData.get('id') || '');
  const active = String(formData.get('active')) === 'true';

  // กันเจ้าหน้าที่ปิดบัญชีตัวเองจนล็อกตัวเองออกจากระบบ
  if (id === me.id) return;

  const admin = createAdminClient();
  const { data: target } = await admin
    .from('officers')
    .select('email, full_name')
    .eq('id', id)
    .maybeSingle();

  await admin.from('officers').update({ active }).eq('id', id);

  // ปิดใช้งานแล้วต้องเตะ session ที่ค้างอยู่ออกด้วย ไม่งั้นยังใช้งานต่อได้จนกว่า token หมดอายุ
  if (!active) {
    await admin.auth.admin.signOut(id, 'global').catch(() => {});
  }

  await logAudit({
    actorId: me.id,
    actorEmail: me.email,
    action: active ? 'officer.enable' : 'officer.disable',
    targetType: 'officer',
    targetId: id,
    detail: { email: target?.email || '', full_name: target?.full_name || '' },
  });

  revalidatePath('/admin/users');
}

/** ส่งอีเมลลิงก์ตั้งรหัสผ่านใหม่ให้เจ้าหน้าที่ */
export async function resetOfficerPassword(formData) {
  const me = await requireOfficer('/admin/users');
  const email = String(formData.get('email') || '').trim().toLowerCase();
  if (!email) return;

  const admin = createAdminClient();
  await admin.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/login`,
  });

  await logAudit({
    actorId: me.id,
    actorEmail: me.email,
    action: 'officer.reset_password',
    targetType: 'officer',
    targetId: email,
  });

  revalidatePath('/admin/users');
}
