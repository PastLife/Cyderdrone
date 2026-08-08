'use client';

import { useEffect, useState } from 'react';
import StatusBadge, { statusText } from '@/components/StatusBadge';
import ZoneMap from '@/components/ZoneMap';

const FLOW = ['new', 'investigating', 'resolved', 'false_alarm'];

const FILTERS = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'new', label: 'เรื่องใหม่' },
  { value: 'investigating', label: 'กำลังตรวจสอบ' },
  { value: 'resolved', label: 'ดำเนินการแล้ว' },
  { value: 'false_alarm', label: 'ไม่พบเหตุ' },
];

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/reports');
      const data = await res.json();
      setReports(data.reports);
      setSelected(data.reports[0] || null);
      setLoading(false);
    })();
  }, []);

  async function setStatus(id, status) {
    const res = await fetch(`/api/reports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setReports((list) => list.map((r) => (r.id === id ? data.report : r)));
    setSelected(data.report);
  }

  function exportCsv() {
    const head = ['รหัส', 'เวลาที่พบ', 'ละติจูด', 'ลองจิจูด', 'ทิศทาง', 'สี', 'ขนาด', 'สถานะ'];
    const rows = reports.map((r) => [
      r.id,
      r.seenAt,
      r.lat,
      r.lng,
      r.direction,
      r.droneColor,
      r.droneSize,
      statusText(r.status),
    ]);
    const csv = [head, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `drone-reports-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const visible = reports.filter((r) => filter === 'all' || r.status === filter);

  if (loading) return <p className="py-10 text-center text-sm text-muted">กำลังโหลดข้อมูล…</p>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                filter === f.value
                  ? 'border-cyan/50 bg-cyan/10 text-cyan'
                  : 'border-line text-muted hover:text-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={exportCsv} className="btn-ghost px-3 py-1.5 text-xs">
          ส่งออก CSV
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <ul className="space-y-2.5">
          {visible.length === 0 && (
            <li className="glass py-12 text-center text-sm text-muted">
              ไม่มีเรื่องในเงื่อนไขนี้
            </li>
          )}
          {visible.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => setSelected(r)}
                className={`glass block w-full px-4 py-3.5 text-left transition ${
                  selected?.id === r.id ? 'border-cyan/45' : 'hover:border-line'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs text-cyan">{r.id}</span>
                  <StatusBadge status={r.status} />
                </div>
                <p className="mt-1.5 line-clamp-2 text-[13px] text-ink">
                  {r.behavior || 'ไม่ระบุรายละเอียด'}
                </p>
                <p className="mt-1 font-mono text-[11px] text-muted">
                  {r.seenAt.replace('T', ' ')} · {r.lat.toFixed(3)}, {r.lng.toFixed(3)}
                </p>
              </button>
            </li>
          ))}
        </ul>

        {selected && (
          <aside className="glass space-y-4 p-5 lg:sticky lg:top-20 lg:self-start">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-cyan">{selected.id}</span>
              <StatusBadge status={selected.status} />
            </div>

            <div className="rounded-lg border border-line bg-base/60 p-4 text-center">
              {selected.media ? (
                <>
                  <p className="font-mono text-[13px] text-ink">{selected.media}</p>
                  <p className="mt-1 text-[11px] text-muted">
                    ตัวอย่างไฟล์แนบ — ระบบจริงจะแสดงภาพจริงพร้อมซูมได้
                  </p>
                </>
              ) : (
                <p className="text-[13px] text-muted">ผู้แจ้งไม่ได้แนบไฟล์มา</p>
              )}
            </div>

            <ZoneMap point={{ lat: selected.lat, lng: selected.lng }} height="h-[180px]" />

            <dl className="space-y-2.5 text-sm">
              <Row label="เวลาที่พบ" value={selected.seenAt.replace('T', ' ')} mono />
              <Row label="ทิศทาง" value={selected.direction} />
              <Row label="ลักษณะ" value={`${selected.droneColor || '—'} · ${selected.droneSize}`} />
              <Row label="พฤติกรรม" value={selected.behavior || '—'} />
              <Row
                label="ผู้แจ้ง"
                value={selected.anonymous ? 'ไม่เปิดเผยตัวตน' : selected.reporterName || '—'}
              />
              {!selected.anonymous && selected.contact && (
                <Row label="ติดต่อ" value={selected.contact} mono />
              )}
            </dl>

            <div>
              <p className="label">เปลี่ยนสถานะเคส</p>
              <div className="flex flex-wrap gap-2">
                {FLOW.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(selected.id, s)}
                    disabled={selected.status === s}
                    className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                      selected.status === s
                        ? 'border-cyan/50 bg-cyan/10 text-cyan'
                        : 'border-line text-muted hover:border-cyan/40 hover:text-ink'
                    }`}
                  >
                    {statusText(s)}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono = false }) {
  return (
    <div className="flex gap-4 border-b border-line/50 pb-2.5 last:border-0">
      <dt className="w-24 shrink-0 text-muted">{label}</dt>
      <dd className={`text-ink ${mono ? 'font-mono text-[13px]' : ''}`}>{value}</dd>
    </div>
  );
}
