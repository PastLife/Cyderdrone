import 'server-only';

import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client แบบ service role — ข้าม RLS ทั้งหมด
 *
 * ⚠️ ใช้ได้เฉพาะฝั่งเซิร์ฟเวอร์เท่านั้น ห้าม import เข้าไฟล์ที่มี 'use client'
 * ใช้สำหรับงานที่ผู้ใช้ทั่วไปทำไม่ได้: สร้าง/ปิดบัญชีเจ้าหน้าที่,
 * เขียน audit log, และนับความพยายามล็อกอินที่ล้มเหลว (ตอนนั้นยังไม่มี session)
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      'ไม่พบ SUPABASE_SERVICE_ROLE_KEY — ตั้งค่าในไฟล์ .env.local ก่อน (ดู .env.example)'
    );
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
