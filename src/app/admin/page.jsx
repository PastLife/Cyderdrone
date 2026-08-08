import Link from 'next/link';
import { db } from '@/lib/db';
import ZoneMap from '@/components/ZoneMap';
import StatusBadge from '@/components/StatusBadge';

export const dynamic = 'force-dynamic';

function last7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    days.push({
      key: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
    });
  }
  return days;
}

export default function AdminOverview() {
  const days = last7Days().map((d) => ({
    ...d,
    permits: db.permits.filter((p) => p.createdAt.slice(0, 10) === d.key).length,
    reports: db.reports.filter((r) => r.createdAt.slice(0, 10) === d.key).length,
  }));

  const max = Math.max(1, ...days.map((d) => Math.max(d.permits, d.reports)));

  const cards = [
    { label: 'รอตรวจสอบ', value: db.permits.filter((p) => p.status === 'pending').length, tone: 'text-cyan' },
    { label: 'อนุมัติแล้ว', value: db.permits.filter((p) => p.status === 'approved').length, tone: 'text-lime' },
    { label: 'เบาะแสเรื่องใหม่', value: db.reports.filter((r) => r.status === 'new').length, tone: 'text-coral' },
    { label: 'กำลังตรวจสอบ', value: db.reports.filter((r) => r.status === 'investigating').length, tone: 'text-ink' },
  ];

  const urgent = db.reports
    .filter((r) => r.status === 'new' || r.status === 'investigating')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-surface px-5 py-5">
            <p className={`font-mono text-3xl ${c.tone}`}>{c.value}</p>
            <p className="mt-1 text-xs text-muted">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <section className="glass p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm text-ink">ปริมาณเรื่องเข้า 7 วันล่าสุด</h2>
            <div className="flex gap-4 text-[11px] text-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-cyan" />คำขอบิน
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-coral" />เบาะแส
              </span>
            </div>
          </div>

          <div className="flex h-44 items-end gap-3">
            {days.map((d) => (
              <div key={d.key} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-full w-full items-end justify-center gap-1">
                  <div
                    className="w-1/2 rounded-t bg-cyan/70"
                    style={{ height: `${(d.permits / max) * 100}%` }}
                    title={`คำขอบิน ${d.permits}`}
                  />
                  <div
                    className="w-1/2 rounded-t bg-coral/70"
                    style={{ height: `${(d.reports / max) * 100}%` }}
                    title={`เบาะแส ${d.reports}`}
                  />
                </div>
                <span className="font-mono text-[10px] text-muted">{d.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="glass p-4">
          <h2 className="mb-3 px-1 text-sm text-ink">แผนที่รวมเหตุ</h2>
          <ZoneMap
            markers={[
              ...db.permits.map((p) => ({ id: p.id, lat: p.lat, lng: p.lng, kind: 'permit' })),
              ...db.reports.map((r) => ({ id: r.id, lat: r.lat, lng: r.lng, kind: 'report' })),
            ]}
            height="h-[220px]"
          />
        </section>
      </div>

      <section className="glass p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm text-ink">เบาะแสที่ยังค้างอยู่</h2>
          <Link href="/admin/reports" className="text-xs text-cyan hover:underline">
            ดูทั้งหมด
          </Link>
        </div>

        {urgent.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">ไม่มีเรื่องค้าง ทุกเคสถูกปิดแล้ว</p>
        ) : (
          <ul className="divide-y divide-line/60">
            {urgent.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <span className="font-mono text-xs text-cyan">{r.id}</span>
                <span className="flex-1 text-[13px] text-ink">{r.behavior || 'ไม่ระบุรายละเอียด'}</span>
                <span className="font-mono text-[11px] text-muted">
                  {r.lat.toFixed(3)}, {r.lng.toFixed(3)}
                </span>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
