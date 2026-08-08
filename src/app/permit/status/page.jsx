import { Suspense } from 'react';
import StatusLookup from '@/components/StatusLookup';

export const metadata = { title: 'ติดตามสถานะ — CyberDrone Platform' };

export default function StatusPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <p className="eyebrow mb-2">ติดตามเรื่อง</p>
      <h1 className="text-3xl font-light text-ink">ตรวจสอบสถานะด้วยรหัส</h1>
      <p className="mt-2 max-w-lg text-sm text-muted">
        ใส่รหัสคำขออนุญาต (ขึ้นต้น PMT) หรือรหัสแจ้งเบาะแส (ขึ้นต้น RPT) ที่ได้รับตอนส่งเรื่อง
      </p>

      <Suspense fallback={<p className="mt-7 text-sm text-muted">กำลังโหลด…</p>}>
        <StatusLookup />
      </Suspense>
    </div>
  );
}
