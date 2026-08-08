'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createOfficer } from './actions';

/** สุ่มรหัสผ่านชั่วคราวให้เจ้าหน้าที่ใหม่ ใช้ crypto ของเบราว์เซอร์ */
function randomPassword(len = 16) {
  const alphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
  const bytes = new Uint32Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? 'กำลังเพิ่ม…' : 'เพิ่มเจ้าหน้าที่'}
    </button>
  );
}

export default function NewOfficerForm() {
  const [state, formAction] = useFormState(createOfficer, {});
  const [password, setPassword] = useState('');

  return (
    <form action={formAction} className="glass space-y-4 p-5">
      <div>
        <p className="eyebrow mb-1">เพิ่มผู้ใช้งาน</p>
        <p className="text-[13px] text-muted">
          ระบบไม่เปิดให้สมัครเอง เจ้าหน้าที่ต้องถูกเพิ่มจากหน้านี้เท่านั้น
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="full_name">ชื่อ-นามสกุล</label>
          <input id="full_name" name="full_name" required className="field" />
        </div>
        <div>
          <label className="label" htmlFor="position">ตำแหน่ง / สังกัด</label>
          <input
            id="position"
            name="position"
            placeholder="เจ้าพนักงานปฏิบัติการ"
            className="field"
          />
        </div>
        <div>
          <label className="label" htmlFor="new_email">อีเมล</label>
          <input
            id="new_email"
            name="email"
            type="email"
            required
            className="field font-mono"
          />
        </div>
        <div>
          <label className="label" htmlFor="new_password">
            รหัสผ่านเริ่มต้น (อย่างน้อย 12 ตัว)
          </label>
          <div className="flex gap-2">
            <input
              id="new_password"
              name="password"
              required
              minLength={12}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field font-mono"
            />
            <button
              type="button"
              onClick={() => setPassword(randomPassword())}
              className="btn-ghost shrink-0 px-3 py-2 text-[13px]"
            >
              สุ่ม
            </button>
          </div>
        </div>
      </div>

      {state?.error && (
        <p
          role="alert"
          className="rounded-lg border border-coral/40 bg-coral/10 px-3 py-2.5 text-[13px] text-coral"
        >
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p
          role="status"
          className="rounded-lg border border-cyan/40 bg-cyan/10 px-3 py-2.5 text-[13px] text-cyan"
        >
          {state.ok} — คัดลอกรหัสผ่านส่งให้เจ้าตัวก่อนออกจากหน้านี้
          แล้วให้เขาเปลี่ยนรหัสทันทีที่เข้าใช้ครั้งแรก
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
