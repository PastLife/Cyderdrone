import { requireOfficer } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import NewOfficerForm from './NewOfficerForm';
import { setOfficerActive, resetOfficerPassword } from './actions';

export const metadata = { title: 'ผู้ใช้งาน — ระบบเจ้าหน้าที่' };
export const dynamic = 'force-dynamic';

function fmt(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default async function UsersPage() {
  const me = await requireOfficer('/admin/users');

  const admin = createAdminClient();
  const { data: officers } = await admin
    .from('officers')
    .select('id, email, full_name, position, active, created_at, last_login_at')
    .order('created_at', { ascending: true });

  return (
    <div className="space-y-7">
      <NewOfficerForm />

      <div className="glass overflow-hidden">
        <div className="border-b border-line/70 px-5 py-4">
          <p className="eyebrow mb-1">รายชื่อเจ้าหน้าที่</p>
          <p className="text-[13px] text-muted">
            ทั้งหมด {officers?.length ?? 0} คน — ปิดใช้งานแล้วจะถูกเตะออกจากระบบทันที
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line/70 text-[12px] text-muted">
              <tr>
                <th className="px-5 py-3 font-normal">เจ้าหน้าที่</th>
                <th className="px-5 py-3 font-normal">เข้าใช้ล่าสุด</th>
                <th className="px-5 py-3 font-normal">สถานะ</th>
                <th className="px-5 py-3 text-right font-normal">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {(officers ?? []).map((o) => {
                const isMe = o.id === me.id;
                return (
                  <tr key={o.id} className="border-b border-line/40 last:border-0">
                    <td className="px-5 py-3.5">
                      <p className="text-ink">
                        {o.full_name || '—'}
                        {isMe && (
                          <span className="ml-2 font-mono text-[11px] text-cyan">(คุณ)</span>
                        )}
                      </p>
                      <p className="font-mono text-[12px] text-muted">{o.email}</p>
                      {o.position && <p className="text-[12px] text-muted">{o.position}</p>}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[12px] text-muted">
                      {fmt(o.last_login_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 font-mono text-[11px] ${
                          o.active ? 'bg-cyan/10 text-cyan' : 'bg-coral/10 text-coral'
                        }`}
                      >
                        {o.active ? 'ใช้งานอยู่' : 'ปิดใช้งาน'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-2">
                        <form action={resetOfficerPassword}>
                          <input type="hidden" name="email" value={o.email} />
                          <button className="btn-ghost px-3 py-1.5 text-[12px]">
                            ส่งลิงก์ตั้งรหัสใหม่
                          </button>
                        </form>
                        <form action={setOfficerActive}>
                          <input type="hidden" name="id" value={o.id} />
                          <input type="hidden" name="active" value={String(!o.active)} />
                          <button
                            disabled={isMe}
                            title={isMe ? 'ปิดบัญชีตัวเองไม่ได้' : undefined}
                            className="btn-ghost px-3 py-1.5 text-[12px]"
                          >
                            {o.active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
