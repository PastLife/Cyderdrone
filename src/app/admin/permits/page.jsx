'use client';

import { useEffect, useState } from 'react';
import StatusBadge from '@/components/StatusBadge';
import ZoneMap from '@/components/ZoneMap';
import { assessRisk } from '@/lib/zones';

const FILTERS = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'pending', label: 'รอตรวจสอบ' },
  { value: 'approved', label: 'อนุมัติแล้ว' },
  { value: 'rejected', label: 'ไม่อนุมัติ' },
];

export default function AdminPermitsPage() {
  const [permits, setPermits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [openId, setOpenId] = useState(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    const res = await fetch('/api/permits');
    const data = await res.json();
    setPermits(data.permits);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function decide(id, status) {
    setError('');
    if (status === 'rejected' && !note.trim()) {
      setError('กรอกเหตุผลก่อนกดไม่อนุมัติ');
      return;
    }
    const res = await fetch(`/api/permits/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'บันทึกไม่สำเร็จ');
      return;
    }
    setPermits((list) => list.map((p) => (p.id === id ? data.permit : p)));
    setOpenId(null);
    setNote('');
  }

  const visible = permits.filter((p) => filter === 'all' || p.status === filter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
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
        <span className="font-mono text-[11px] text-muted">{visible.length} รายการ</span>
      </div>

      {loading && <p className="py-10 text-center text-sm text-muted">กำลังโหลดข้อมูล…</p>}

      {!loading && visible.length === 0 && (
        <p className="glass py-12 text-center text-sm text-muted">
          ไม่มีคำขอในเงื่อนไขนี้ ลองเปลี่ยนตัวกรองด้านบน
        </p>
      )}

      <ul className="space-y-3">
        {visible.map((p) => {
          const risk = assessRisk({ lat: p.lat, lng: p.lng }, p.radiusM / 1000);
          const open = openId === p.id;
          return (
            <li key={p.id} className="glass overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  setOpenId(open ? null : p.id);
                  setNote(p.note || '');
                  setError('');
                }}
                className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 text-left hover:bg-white/[0.02]"
              >
                <span className="font-mono text-xs text-cyan">{p.id}</span>
                <span className="text-[14px] text-ink">{p.pilotName}</span>
                <span className="text-[13px] text-muted">
                  {p.droneBrand} {p.droneModel}
                </span>
                <span className="ml-auto font-mono text-[11px] text-muted">
                  {p.startAt.replace('T', ' ')}
                </span>
                <StatusBadge status={p.status} />
              </button>

              {open && (
                <div className="grid gap-5 border-t border-line/70 px-5 py-5 lg:grid-cols-[1fr_1fr]">
                  <div className="space-y-3 text-sm">
                    <Row label="ซีเรียล" value={p.serial} mono />
                    <Row label="น้ำหนัก" value={`${p.weightG} กรัม`} mono />
                    <Row label="ใบอนุญาต" value={p.licenseNo || '—'} mono />
                    <Row label="บัตร ปชช." value={p.idLast4 ? `••••••••• ${p.idLast4}` : '—'} mono />
                    <Row
                      label="ช่วงเวลา"
                      value={`${p.startAt.replace('T', ' ')} → ${p.endAt.replace('T', ' ')}`}
                      mono
                    />
                    <Row label="วัตถุประสงค์" value={p.purpose} />
                    <Row label="รัศมี" value={`${p.radiusM} เมตร`} mono />

                    {risk && (
                      <p
                        className={`rounded-lg border px-3 py-2.5 text-[13px] ${
                          risk.level === 'clear'
                            ? 'border-lime/40 bg-lime/10 text-lime'
                            : risk.level === 'caution'
                              ? 'border-cyan/40 bg-cyan/10 text-cyan'
                              : 'border-coral/45 bg-coral/10 text-coral'
                        }`}
                      >
                        ผลตรวจอัตโนมัติ: {risk.title} — {risk.detail}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <ZoneMap
                      point={{ lat: p.lat, lng: p.lng }}
                      radiusM={p.radiusM}
                      height="h-[200px]"
                    />

                    <div>
                      <label className="label" htmlFor={`note-${p.id}`}>
                        เงื่อนไขเพิ่มเติม หรือเหตุผลที่ไม่อนุมัติ
                      </label>
                      <textarea
                        id={`note-${p.id}`}
                        rows={3}
                        className="field resize-none"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="เช่น ห้ามบินสูงเกิน 90 เมตร และต้องอยู่ในระยะสายตา"
                      />
                    </div>

                    {error && <p className="text-[13px] text-coral">{error}</p>}

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => decide(p.id, 'approved')}
                        className="btn flex-1 bg-lime text-base hover:bg-lime/85"
                      >
                        อนุมัติ
                      </button>
                      <button
                        type="button"
                        onClick={() => decide(p.id, 'rejected')}
                        className="btn-alert flex-1"
                      >
                        ไม่อนุมัติ
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Row({ label, value, mono = false }) {
  return (
    <div className="flex gap-4 border-b border-line/50 pb-2.5">
      <span className="w-28 shrink-0 text-muted">{label}</span>
      <span className={`text-ink ${mono ? 'font-mono text-[13px]' : ''}`}>{value}</span>
    </div>
  );
}
