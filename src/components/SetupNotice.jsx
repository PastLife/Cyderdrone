import { SETUP_HINT } from '@/lib/config';

/** แผงบอกว่ายังตั้งค่า env ไม่ครบ — บอกชื่อตัวแปรที่ขาด ไม่โชว์ค่า */
export default function SetupNotice({ missing = [], what = 'หน้านี้' }) {
  return (
    <div className="glass border-coral/40 p-6">
      <p className="eyebrow mb-2 text-coral">ตั้งค่าไม่ครบ</p>
      <h2 className="text-lg font-light text-ink">ยังใช้งาน{what}ไม่ได้</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">
        ระบบขาดค่า Environment Variables ต่อไปนี้:
      </p>
      <ul className="mt-3 space-y-1.5">
        {missing.map((k) => (
          <li key={k} className="font-mono text-[12px] text-coral">
            {k}
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t border-line/60 pt-3 text-[12px] leading-relaxed text-muted">
        {SETUP_HINT}
        <br />
        ค่าทั้งหมดหาได้ที่ Supabase Dashboard → Project Settings → API
      </p>
    </div>
  );
}
