import { requireOfficer } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { AUDIT_ACTIONS } from '@/lib/audit';

export const metadata = { title: 'ประวัติการใช้งาน — ระบบเจ้าหน้าที่' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

/** สีของแถวตามความสำคัญ — เรื่องความปลอดภัยให้เด่นกว่างานประจำวัน */
function toneOf(action) {
  if (action === 'auth.login_failed' || action === 'auth.locked') return 'text-coral';
  if (action.startsWith('officer.')) return 'text-lime';
  return 'text-ink';
}

function fmt(ts) {
  return new Date(ts).toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });
}

function FilterChip({ current, value, label }) {
  const active = current === value;
  return (
    <a
      href={value ? `/admin/audit?action=${value}` : '/admin/audit'}
      className={`rounded-full border px-3 py-1.5 text-[12px] transition ${
        active
          ? 'border-cyan/60 bg-cyan/10 text-cyan'
          : 'border-line text-muted hover:border-cyan/40 hover:text-ink'
      }`}
    >
      {label}
    </a>
  );
}

export default async function AuditPage({ searchParams }) {
  await requireOfficer('/admin/audit');

  const page = Math.max(1, Number(searchParams?.page) || 1);
  const filter = String(searchParams?.action || '');

  const admin = createAdminClient();
  let query = admin
    .from('audit_logs')
    .select('id, actor_email, action, target_type, target_id, detail, ip, created_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (filter) query = query.eq('action', filter);

  const { data: logs, count } = await query;
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow mb-1">ประวัติการใช้งาน</p>
        <p className="text-[13px] text-muted">
          บันทึกแบบเพิ่มอย่างเดียว แก้ไขหรือลบผ่านหน้าเว็บไม่ได้ — ทั้งหมด{' '}
          {total.toLocaleString('th-TH')} รายการ
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <FilterChip current={filter} value="" label="ทั้งหมด" />
        {Object.entries(AUDIT_ACTIONS).map(([value, label]) => (
          <FilterChip key={value} current={filter} value={value} label={label} />
        ))}
      </div>

      <div className="glass overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line/70 text-[12px] text-muted">
            <tr>
              <th className="px-5 py-3 font-normal">เวลา</th>
              <th className="px-5 py-3 font-normal">ผู้ใช้</th>
              <th className="px-5 py-3 font-normal">การกระทำ</th>
              <th className="px-5 py-3 font-normal">เป้าหมาย</th>
              <th className="px-5 py-3 font-normal">IP</th>
            </tr>
          </thead>
          <tbody>
            {(logs ?? []).map((log) => (
              <tr key={log.id} className="border-b border-line/40 last:border-0">
                <td className="whitespace-nowrap px-5 py-3 font-mono text-[12px] text-muted">
                  {fmt(log.created_at)}
                </td>
                <td className="px-5 py-3 font-mono text-[12px] text-muted">
                  {log.actor_email || '—'}
                </td>
                <td className={`px-5 py-3 ${toneOf(log.action)}`}>
                  {AUDIT_ACTIONS[log.action] || log.action}
                  {log.detail?.reason && (
                    <span className="ml-2 text-[12px] text-muted">({log.detail.reason})</span>
                  )}
                </td>
                <td className="px-5 py-3 font-mono text-[12px] text-muted">
                  {log.target_id || '—'}
                </td>
                <td className="px-5 py-3 font-mono text-[12px] text-muted">{log.ip || '—'}</td>
              </tr>
            ))}
            {!logs?.length && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-[13px] text-muted">
                  ยังไม่มีรายการ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-[13px] text-muted">
          <span className="font-mono text-[12px]">
            หน้า {page} / {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`/admin/audit?page=${page - 1}${filter ? `&action=${filter}` : ''}`}
                className="btn-ghost px-3 py-1.5 text-[12px]"
              >
                ก่อนหน้า
              </a>
            )}
            {page < pages && (
              <a
                href={`/admin/audit?page=${page + 1}${filter ? `&action=${filter}` : ''}`}
                className="btn-ghost px-3 py-1.5 text-[12px]"
              >
                ถัดไป
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
