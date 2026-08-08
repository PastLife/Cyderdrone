'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { login } from './actions';

function SubmitButton({ disabled }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending || disabled}>
      {pending ? 'กำลังตรวจสอบ…' : 'เข้าสู่ระบบ'}
    </button>
  );
}

export default function LoginForm({ next }) {
  const [state, formAction] = useFormState(login, {});

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />

      <div>
        <label className="label" htmlFor="email">
          อีเมลราชการ
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          autoFocus
          placeholder="officer@agency.go.th"
          className="field font-mono"
        />
      </div>

      <div>
        <label className="label" htmlFor="password">
          รหัสผ่าน
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="field font-mono"
        />
      </div>

      {state?.error && (
        <p
          role="alert"
          aria-live="assertive"
          className="rounded-lg border border-coral/40 bg-coral/10 px-3 py-2.5 text-[13px] text-coral"
        >
          {state.error}
        </p>
      )}

      <SubmitButton disabled={state?.locked} />
    </form>
  );
}
