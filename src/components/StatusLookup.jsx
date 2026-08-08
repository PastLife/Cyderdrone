'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import ZoneMap from '@/components/ZoneMap';

export default function StatusLookup() {
  const params = useSearchParams();
  const [code, setCode] = useState(params.get('id') || '');
  const [state, setState] = useState({ status: 'idle' });

  async function lookup(id) {
    const trimmed = id.trim().toUpperCase();
    if (!trimmed) return;
    setState({ status: 'loading' });

    const kind = trimmed.startsWith('RPT') ? 'reports' : 'permits';
    const res = await fetch(`/api/${kind}/${trimmed}`);
    if (!res.ok) {
      setState({ status: 'notfound' });
      return;
    }
    const data = await res.json();
    setState({ status: 'found', kind, item: data.permit || data.report });
  }

  useEffect(() => {
    const initial = params.get('id');
    if (initial) lookup(initial);
    // ค้นหาครั้งแรกจากรหัสที่ส่งมาทาง URL เท่านั้น
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const item = state.item;

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          lookup(code);
        }}
        className="mt-7 flex gap-3"
      >
        <input
          className="field font-mono uppercase"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="PMT-XXXXXX หรือ RPT-XXXXXX"
          aria-label="รหัสคำขอหรือรหัสแจ้งเหตุ"
        />
        <button type="submit" className="btn-primary shrink-0">
          ค้นหา
        </button>
      </form>

      {state.status === 'loading' && <p className="mt-6 text-sm text-muted">กำลังค้นหา…</p>}

      {state.status === 'notfound' && (
        <p className="mt-6 rounded-lg border border-coral/45 bg-coral/10 px-4 py-3 text-sm text-coral">
          ไม่พบรหัสนี้ในระบบ ตรวจดูอีกครั้งว่าพิมพ์ครบทุกตัวอักษร
        </p>
      )}

      {state.status === 'found' && item && (
        <article className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_1fr]">
          <div className="glass p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-lg text-cyan">{item.id}</span>
              <StatusBadge status={item.status} />
            </div>

            <dl className="mt-6 space-y-3 text-sm">
              {state.kind === 'permits' ? (
                <>
                  <Row label="นักบิน" value={item.pilotName} />
                  <Row label="โดรน" value={`${item.droneBrand} ${item.droneModel}`} />
                  <Row label="ซีเรียล" value={item.serial} mono />
                  <Row
                    label="ช่วงเวลาบิน"
                    value={`${item.startAt.replace('T', ' ')} → ${item.endAt.replace('T', ' ')}`}
                    mono
                  />
                  <Row label="วัตถุประสงค์" value={item.purpose} />
                  <Row label="รัศมีที่ขอ" value={`${item.radiusM} เมตร`} mono />
                </>
              ) : (
                <>
                  <Row label="เวลาที่พบ" value={item.seenAt.replace('T', ' ')} mono />
                  <Row label="ทิศทางการบิน" value={item.direction} />
                  <Row label="ลักษณะโดรน" value={`${item.droneColor || '-'} · ${item.droneSize}`} />
                  <Row label="พฤติกรรม" value={item.behavior || '-'} />
                  <Row label="ไฟล์แนบ" value={item.media || 'ไม่มี'} mono />
                </>
              )}
            </dl>

            {item.note && (
              <div className="mt-6 rounded-lg border border-line bg-base/60 px-4 py-3">
                <p className="eyebrow mb-1.5">หมายเหตุจากเจ้าหน้าที่</p>
                <p className="text-[13px] leading-relaxed text-ink">{item.note}</p>
              </div>
            )}
          </div>

          <div className="glass p-3">
            <p className="eyebrow mb-3 px-1">ตำแหน่งบนแผนที่</p>
            <ZoneMap
              point={{ lat: item.lat, lng: item.lng }}
              radiusM={item.radiusM || 0}
              height="h-[300px]"
            />
          </div>
        </article>
      )}
    </>
  );
}

function Row({ label, value, mono = false }) {
  return (
    <div className="flex gap-4 border-b border-line/60 pb-3 last:border-0">
      <dt className="w-32 shrink-0 text-muted">{label}</dt>
      <dd className={`text-ink ${mono ? 'font-mono text-[13px]' : ''}`}>{value}</dd>
    </div>
  );
}
