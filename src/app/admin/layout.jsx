import AdminNav from '@/components/AdminNav';
import OfficerBar from '@/components/OfficerBar';
import { requireOfficer } from '@/lib/auth';

export const metadata = { title: 'ระบบเจ้าหน้าที่ — CyberDrone Platform' };

// หน้าเจ้าหน้าที่ต้องสดเสมอ ห้าม cache ข้ามผู้ใช้
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }) {
  // ด่านที่สอง ต่อจาก middleware — ตรงนี้เช็กถึงขั้นว่ายังเป็นเจ้าหน้าที่ที่ active อยู่ไหม
  const officer = await requireOfficer();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-6">
        <p className="eyebrow mb-2">ระบบหลังบ้าน</p>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-light text-ink">ศูนย์ควบคุมเจ้าหน้าที่</h1>
            <p className="mt-1.5 text-[13px] text-muted">
              ทุกการอนุมัติและเปลี่ยนสถานะถูกบันทึกลงประวัติการใช้งาน
            </p>
          </div>
          <OfficerBar officer={officer} />
        </div>
      </header>
      <AdminNav />
      <div className="pt-7">{children}</div>
    </div>
  );
}
