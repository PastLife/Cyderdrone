import { logout } from '@/app/login/actions';

/** แถบแสดงว่าใครกำลังใช้งานอยู่ + ปุ่มออกจากระบบ */
export default function OfficerBar({ officer }) {
  const name = officer.full_name || officer.email;
  const initials = (name || '?').trim().slice(0, 1).toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="grid h-9 w-9 place-items-center rounded-full border border-cyan/40 bg-cyan/10 font-mono text-sm text-cyan"
        >
          {initials}
        </span>
        <div className="leading-tight">
          <p className="text-[13px] text-ink">{name}</p>
          <p className="font-mono text-[11px] text-muted">
            {officer.position || officer.email}
          </p>
        </div>
      </div>

      <form action={logout}>
        <button type="submit" className="btn-ghost px-3 py-2 text-[13px]">
          ออกจากระบบ
        </button>
      </form>
    </div>
  );
}
