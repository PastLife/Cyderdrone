import AdminNav from '@/components/AdminNav';

export const metadata = { title: 'ระบบเจ้าหน้าที่ — CyberDrone Platform' };

export default function AdminLayout({ children }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-6">
        <p className="eyebrow mb-2">ระบบหลังบ้าน</p>
        <h1 className="text-2xl font-light text-ink">ศูนย์ควบคุมเจ้าหน้าที่</h1>
        <p className="mt-1.5 text-[13px] text-muted">
          ต้นแบบยังไม่มีระบบล็อกอิน — ของจริงหน้านี้ต้องอยู่หลัง Authentication และจำกัดสิทธิ์ตามบทบาท
        </p>
      </header>
      <AdminNav />
      <div className="pt-7">{children}</div>
    </div>
  );
}
