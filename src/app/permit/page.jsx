'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import ZoneMap from '@/components/ZoneMap';
import { assessRisk } from '@/lib/zones';

const RISK_STYLE = {
  clear: 'border-lime/40 bg-lime/10 text-lime',
  caution: 'border-cyan/40 bg-cyan/10 text-cyan',
  blocked: 'border-coral/45 bg-coral/10 text-coral',
};

const EMPTY = {
  pilotName: '',
  nationalId: '',
  licenseNo: '',
  droneBrand: '',
  droneModel: '',
  serial: '',
  weightG: '',
  startAt: '',
  endAt: '',
  purpose: '',
  radiusM: 300,
};

export default function PermitPage() {
  const [form, setForm] = useState(EMPTY);
  const [point, setPoint] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const risk = useMemo(
    () => assessRisk(point, Number(form.radiusM || 0) / 1000),
    [point, form.radiusM]
  );

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');

    if (!point) {
      setError('ยังไม่ได้ปักหมุดจุดบิน — กดบนแผนที่เพื่อเลือกตำแหน่ง');
      return;
    }
    if (risk?.level === 'blocked') {
      setError(risk.detail);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/permits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          weightG: Number(form.weightG),
          radiusM: Number(form.radiusM),
          lat: point.lat,
          lng: point.lng,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'ส่งคำขอไม่สำเร็จ ลองใหม่อีกครั้ง');
        return;
      }
      setResult(data.permit);
    } catch {
      setError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองใหม่อีกครั้ง');
    } finally {
      setSaving(false);
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="eyebrow mb-3 text-lime">ส่งคำขอเรียบร้อย</p>
        <h1 className="text-2xl font-light text-ink">คำขอเข้าคิวรอตรวจสอบแล้ว</h1>
        <p className="mt-3 text-sm text-muted">เก็บรหัสนี้ไว้ใช้ติดตามสถานะ</p>
        <p className="mt-5 rounded-xl border border-cyan/40 bg-cyan/10 px-4 py-4 font-mono text-2xl text-cyan">
          {result.id}
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <Link href={`/permit/status?id=${result.id}`} className="btn-primary">
            ดูสถานะคำขอ
          </Link>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              setResult(null);
              setForm(EMPTY);
              setPoint(null);
            }}
          >
            ยื่นคำขอใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="eyebrow mb-2">แบบฟอร์มคำขอ</p>
      <h1 className="text-3xl font-light text-ink">ขออนุญาตบินโดรน</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        กรอกข้อมูลนักบิน ตัวโดรน และช่วงเวลาบิน จากนั้นปักหมุดจุดบินบนแผนที่ทางขวา
      </p>

      <form onSubmit={submit} className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-6">
          <fieldset className="glass p-5">
            <legend className="eyebrow px-1">ข้อมูลนักบิน</legend>
            <div className="mt-3 space-y-4">
              <div>
                <label className="label" htmlFor="pilotName">ชื่อ-นามสกุล</label>
                <input
                  id="pilotName"
                  className="field"
                  value={form.pilotName}
                  onChange={(e) => update('pilotName', e.target.value)}
                  placeholder="เช่น ธนกฤต วงศ์อนันต์"
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="licenseNo">เลขใบอนุญาตนักบิน</label>
                  <input
                    id="licenseNo"
                    className="field font-mono"
                    value={form.licenseNo}
                    onChange={(e) => update('licenseNo', e.target.value)}
                    placeholder="CAAT-2025-00000"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="nationalId">เลขบัตรประชาชน</label>
                  <input
                    id="nationalId"
                    className="field font-mono"
                    inputMode="numeric"
                    maxLength={13}
                    value={form.nationalId}
                    onChange={(e) => update('nationalId', e.target.value.replace(/\D/g, ''))}
                    placeholder="13 หลัก"
                  />
                  <p className="mt-1.5 text-[11px] text-muted/80">
                    ระบบเก็บเฉพาะ 4 หลักท้ายไว้ยืนยันตัวตน ไม่เก็บเลขเต็ม
                  </p>
                </div>
              </div>
            </div>
          </fieldset>

          <fieldset className="glass p-5">
            <legend className="eyebrow px-1">ข้อมูลโดรน</legend>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="droneBrand">ยี่ห้อ</label>
                <input
                  id="droneBrand"
                  className="field"
                  value={form.droneBrand}
                  onChange={(e) => update('droneBrand', e.target.value)}
                  placeholder="DJI"
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="droneModel">รุ่น</label>
                <input
                  id="droneModel"
                  className="field"
                  value={form.droneModel}
                  onChange={(e) => update('droneModel', e.target.value)}
                  placeholder="Mavic 3"
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="serial">หมายเลขซีเรียล</label>
                <input
                  id="serial"
                  className="field font-mono"
                  value={form.serial}
                  onChange={(e) => update('serial', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="weightG">น้ำหนัก (กรัม)</label>
                <input
                  id="weightG"
                  type="number"
                  min="0"
                  className="field font-mono"
                  value={form.weightG}
                  onChange={(e) => update('weightG', e.target.value)}
                  placeholder="900"
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="glass p-5">
            <legend className="eyebrow px-1">รายละเอียดการบิน</legend>
            <div className="mt-3 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="startAt">เริ่มบิน</label>
                  <input
                    id="startAt"
                    type="datetime-local"
                    className="field font-mono"
                    value={form.startAt}
                    onChange={(e) => update('startAt', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label" htmlFor="endAt">สิ้นสุด</label>
                  <input
                    id="endAt"
                    type="datetime-local"
                    className="field font-mono"
                    value={form.endAt}
                    onChange={(e) => update('endAt', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="purpose">วัตถุประสงค์</label>
                <textarea
                  id="purpose"
                  rows={3}
                  className="field resize-none"
                  value={form.purpose}
                  onChange={(e) => update('purpose', e.target.value)}
                  placeholder="เช่น ถ่ายภาพสำรวจไซต์งานก่อสร้าง"
                  required
                />
              </div>
            </div>
          </fieldset>
        </div>

        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="glass p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="eyebrow">ปักหมุดจุดบิน</span>
              <span className="font-mono text-[11px] text-muted">
                {point
                  ? `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`
                  : 'ยังไม่เลือกพิกัด'}
              </span>
            </div>

            <ZoneMap
              point={point}
              radiusM={Number(form.radiusM)}
              onPick={setPoint}
              height="h-[300px]"
            />

            <div className="mt-4">
              <label className="label" htmlFor="radiusM">
                รัศมีการบิน · <span className="font-mono text-ink">{form.radiusM} ม.</span>
              </label>
              <input
                id="radiusM"
                type="range"
                min="50"
                max="2000"
                step="50"
                value={form.radiusM}
                onChange={(e) => update('radiusM', e.target.value)}
                className="w-full accent-[#00F0FF]"
              />
            </div>

            {risk && (
              <div className={`mt-4 rounded-lg border px-3.5 py-3 text-sm ${RISK_STYLE[risk.level]}`}>
                <p className="font-medium">{risk.title}</p>
                <p className="mt-1 text-[13px] leading-relaxed opacity-90">{risk.detail}</p>
              </div>
            )}
            {!point && (
              <p className="mt-4 rounded-lg border border-line bg-base/60 px-3.5 py-3 text-[13px] text-muted">
                กดบนแผนที่เพื่อเลือกจุดที่จะบิน ระบบจะตรวจเขตห้ามบินให้ทันที
              </p>
            )}
          </div>

          {error && (
            <p className="rounded-lg border border-coral/45 bg-coral/10 px-3.5 py-3 text-sm text-coral">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={saving || risk?.level === 'blocked'}
          >
            {saving ? 'กำลังส่งคำขอ…' : 'ส่งคำขออนุญาต'}
          </button>
          <p className="text-[11px] leading-relaxed text-muted">
            การส่งคำขอถือว่ายินยอมให้เจ้าหน้าที่ใช้ข้อมูลเพื่อพิจารณาอนุญาตตามวัตถุประสงค์นี้เท่านั้น
          </p>
        </div>
      </form>
    </div>
  );
}
