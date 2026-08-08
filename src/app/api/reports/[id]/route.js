import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getOfficer } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const STATUSES = ['new', 'investigating', 'resolved', 'false_alarm'];

export async function GET(_request, { params }) {
  const report = db.reports.find((r) => r.id === params.id);
  if (!report) return NextResponse.json({ error: 'ไม่พบเรื่องแจ้งนี้' }, { status: 404 });
  return NextResponse.json({ report });
}

export async function PATCH(request, { params }) {
  const officer = await getOfficer();
  if (!officer) {
    return NextResponse.json({ error: 'ต้องเข้าสู่ระบบเจ้าหน้าที่ก่อน' }, { status: 401 });
  }

  const report = db.reports.find((r) => r.id === params.id);
  if (!report) return NextResponse.json({ error: 'ไม่พบเรื่องแจ้งนี้' }, { status: 404 });

  const { status } = await request.json();
  if (!STATUSES.includes(status)) {
    return NextResponse.json({ error: 'สถานะไม่ถูกต้อง' }, { status: 400 });
  }

  const before = report.status;
  report.status = status;
  report.updatedAt = new Date().toISOString();
  report.updatedBy = officer.email;

  if (status !== before) {
    await logAudit({
      actorId: officer.id,
      actorEmail: officer.email,
      action: 'report.update',
      targetType: 'report',
      targetId: report.id,
      detail: { from: before, to: status },
    });
  }

  return NextResponse.json({ report });
}
