'use client';

import { useState } from 'react';
import Link from 'next/link';
import ZoneMap from '@/components/ZoneMap';

const SIZES = [
  { value: 'small', label: 'เล็ก (ต่ำกว่า 30 ซม.)' },
  { value: 'medium', label: 'กลาง (30–60 ซม.)' },
  { value: 'large', label: 'ใหญ่ (เกิน 60 ซม.)' },
  { value: 'unknown', label: 'ไม่แน่ใจ' },
];

const DIRECTIONS = [
  'ทิศเหนือ',
  'ทิศใต้',
  'ทิศตะวันออก',
  'ทิศตะวันตก',
  'ทิศตะวันออกเฉียงใต้',
  'ทิศตะวันตกเฉียงเหนือ',
  'ไม่แน่ใจ',
];

export default function ReportPage() {
  const [point, setPoint] = useState(null);
  const [form, setForm] = useState({
    seenAt: '',
    direction: 'ไม่แน่ใจ',
    droneColor: '',
    droneSize: 'unknown',
    behavior: '',
    anonymous: true,
    reporterName: '',
    contact: '',
  });
  const [fileName, setFileName] = useState('');
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [ticket, setTicket] = useState(null);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError('เบราว์เซอร์นี้ไม่รองรับการดึงพิกัด กดปักหมุดบนแผนที่แทนได้');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPoint({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        setError('');
      },
      () => {
        setLocating(false);
        setError('ดึงพิกัดไม่สำเร็จ กดปักหมุดบนแผนที่แทนได้');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function submit(event) {
    event.preventDefault();
    setError('');

    if (!point) {
      setError('ยังไม่ได้ระบุตำแหน่ง — กดใช้ตำแหน่งปัจจุบัน หรือปักหมุดบนแผนที่');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, lat: point.lat, lng: point.lng, media: fileName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'ส่งเรื่องไม่สำเร็จ ลองใหม่อีกครั้ง');
        return;
      }
      setTicket(data.report.id);
    } catch {
      setError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองใหม่อีกครั้ง');
    } finally {
      setSaving(false);
    }
  }

  if (ticket) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="eyebrow mb-3 text-lime">รับเรื่องแล้ว</p>
        <h1 className="text-2xl font-light text-ink">ส่งเบาะแสถึงเจ้าหน้าที่แล้ว</h1>
        <p className="mt-3 text-sm text-muted">ใช้รหัสนี้ติดตามผลการตรวจสอบ</p>
        <p className="mt-5 rounded-xl border border-coral/40 bg-coral/10 px-4 py-4 font-mono text-2xl text-coral">
          {ticket}
        </p>
        <Link href={`/permit/status?id=${ticket}`} className="btn-primary mt-7">
          ดูสถานะเรื่อง
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="eyebrow mb-2 text-coral/80">แจ้งเหตุ</p>
      <h1 className="text-3xl font-light text-ink">แจ้งโดรนไม่ทราบที่มา</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        กรอกเท่าที่จำได้ก็พอ ข้อมูลสำคัญที่สุดคือตำแหน่งและเวลาที่พบ
      </p>

      <form onSubmit={submit} className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <fieldset className="glass p-5">
            <legend className="eyebrow px-1">สิ่งที่พบ</legend>
            <div className="mt-3 space-y-4">
              <div>
                <label className="label" htmlFor="seenAt">วัน-เวลาที่พบ</label>
                <input
                  id="seenAt"
                  type="datetime-local"
                  className="field font-mono"
                  value={form.seenAt}
                  onChange={(e) => update('seenAt', e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="direction">ทิศทางที่บินไป</label>
                  <select
                    id="direction"
                    className="field"
                    value={form.direction}
                    onChange={(e) => update('direction', e.target.value)}
                  >
                    {DIRECTIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="droneSize">ขนาดโดยประมาณ</label>
                  <select
                    id="droneSize"
                    className="field"
                    value={form.droneSize}
                    onChange={(e) => update('droneSize', e.target.value)}
                  >
                    {SIZES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label" htmlFor="droneColor">สีของโดรน</label>
                <input
                  id="droneColor"
                  className="field"
                  value={form.droneColor}
                  onChange={(e) => update('droneColor', e.target.value)}
                  placeholder="เช่น ขาว, ดำ, เทา"
                />
              </div>
              <div>
                <label className="label" htmlFor="behavior">พฤติกรรมที่สังเกตเห็น</label>
                <textarea
                  id="behavior"
                  rows={3}
                  className="field resize-none"
                  value={form.behavior}
                  onChange={(e) => update('behavior', e.target.value)}
                  placeholder="เช่น บินวนเหนือลานจอดรถ ไม่มีไฟนำร่อง"
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="glass p-5">
            <legend className="eyebrow px-1">ภาพหรือคลิป</legend>
            <label
              htmlFor="media"
              className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-line px-4 py-8 text-center transition hover:border-cyan/50"
            >
              <span className="text-sm text-ink">
                {fileName || 'แตะเพื่อถ่ายภาพ หรือเลือกไฟล์จากเครื่อง'}
              </span>
              <span className="mt-1 text-[11px] text-muted">รองรับ JPG, PNG, MP4 ไม่เกิน 25 MB</span>
              <input
                id="media"
                type="file"
                accept="image/*,video/*"
                capture="environment"
                className="sr-only"
                onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
              />
            </label>
          </fieldset>

          <fieldset className="glass p-5">
            <legend className="eyebrow px-1">ตัวตนผู้แจ้ง</legend>
            <div className="mt-3 space-y-4">
              <label className="flex items-start gap-3 text-sm text-ink">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-[#00F0FF]"
                  checked={form.anonymous}
                  onChange={(e) => update('anonymous', e.target.checked)}
                />
                <span>
                  แจ้งแบบไม่เปิดเผยตัวตน
                  <span className="mt-0.5 block text-[12px] text-muted">
                    เจ้าหน้าที่จะติดต่อกลับไม่ได้ แต่เรื่องยังเข้าระบบตามปกติ
                  </span>
                </span>
              </label>

              {!form.anonymous && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="reporterName">ชื่อผู้แจ้ง</label>
                    <input
                      id="reporterName"
                      className="field"
                      value={form.reporterName}
                      onChange={(e) => update('reporterName', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="contact">เบอร์โทรหรืออีเมล</label>
                    <input
                      id="contact"
                      className="field"
                      value={form.contact}
                      onChange={(e) => update('contact', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </fieldset>
        </div>

        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="glass p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="eyebrow">ตำแหน่งที่พบ</span>
              <span className="font-mono text-[11px] text-muted">
                {point ? `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}` : 'ยังไม่ระบุ'}
              </span>
            </div>

            <button type="button" onClick={useMyLocation} className="btn-ghost mb-3 w-full">
              {locating ? 'กำลังอ่านพิกัด…' : 'ใช้ตำแหน่งปัจจุบัน'}
            </button>

            <ZoneMap point={point} onPick={setPoint} height="h-[280px]" />
            <p className="mt-3 text-[12px] text-muted">หรือกดบนแผนที่เพื่อปักหมุดเอง</p>
          </div>

          {error && (
            <p className="rounded-lg border border-coral/45 bg-coral/10 px-3.5 py-3 text-sm text-coral">
              {error}
            </p>
          )}

          <button type="submit" className="btn-alert w-full" disabled={saving}>
            {saving ? 'กำลังส่งเรื่อง…' : 'ส่งเบาะแส'}
          </button>
          <p className="text-[11px] leading-relaxed text-muted">
            หากเป็นเหตุฉุกเฉินที่มีอันตรายต่อชีวิตหรือทรัพย์สิน โทร 191 ก่อนเสมอ
          </p>
        </div>
      </form>
    </div>
  );
}
