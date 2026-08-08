import Link from 'next/link';
import LoginForm from './LoginForm';
import { missingEnv, SETUP_HINT } from '@/lib/config';

export const metadata = { title: 'เข้าสู่ระบบเจ้าหน้าที่ — CyberDrone Platform' };

// หน้านี้ต้องอ่านค่า env ตอนรันจริงเสมอ ห้าม prerender ไปเป็นหน้านิ่ง
export const dynamic = 'force-dynamic';

export default function LoginPage({ searchParams }) {
  /*
   * เดิมแบนเนอร์นี้อ่านจาก ?error=config ที่ middleware แปะมา
   * ปัญหาคือพารามิเตอร์ค้างอยู่ใน URL ต่อให้แก้ env แล้วก็ยังขึ้นเตือนอยู่ดี
   * จึงเปลี่ยนมาเช็กสถานะจริงตอนเรนเดอร์ — แก้ถูกเมื่อไหร่แบนเนอร์หายเอง
   */
  const missing = missingEnv();
  const setupError = missing.length
    ? `ระบบยังตั้งค่าไม่ครบ ขาด ${missing.join(', ')} — ${SETUP_HINT}`
    : searchParams?.error === 'unavailable'
      ? 'ตอนนี้ติดต่อระบบยืนยันตัวตนไม่ได้ กรุณาลองใหม่อีกครั้งในอีกสักครู่'
      : null;

  const next =
    typeof searchParams?.next === 'string' && searchParams.next.startsWith('/admin')
      ? searchParams.next
      : '/admin';

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="glass p-7">
        <p className="eyebrow mb-2">ระบบหลังบ้าน</p>
        <h1 className="text-2xl font-light text-ink">เข้าสู่ระบบเจ้าหน้าที่</h1>
        <p className="mb-6 mt-1.5 text-[13px] text-muted">
          เฉพาะเจ้าหน้าที่ที่ได้รับสิทธิ์ การเข้าใช้งานทุกครั้งถูกบันทึกไว้
        </p>

        {setupError && (
          <p
            role="alert"
            className="mb-4 rounded-lg border border-coral/40 bg-coral/10 px-3 py-2.5 text-[13px] text-coral"
          >
            {setupError}
          </p>
        )}

        <LoginForm next={next} />

        <p className="mt-6 border-t border-line/60 pt-4 text-[12px] leading-relaxed text-muted">
          ลืมรหัสผ่าน หรือยังไม่มีบัญชี? ติดต่อผู้ดูแลระบบของหน่วยงานเพื่อขอสิทธิ์
          ระบบนี้ไม่เปิดให้สมัครเอง
        </p>
      </div>

      <Link
        href="/"
        className="mt-5 text-center text-[13px] text-muted transition hover:text-cyan"
      >
        ← กลับหน้าแรก
      </Link>
    </div>
  );
}
