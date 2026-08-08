import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const STATUSES = ['new', 'investigating', 'resolved', 'false_alarm'];

export async function GET(_request, { params }) {
  const report = db.reports.find((r) => r.id === params.id);
  if (!report) return NextResponse.json({ error: 'ไม่พบเรื่องแจ้งนี้' }, { status: 404 });
  return NextResponse.json({ report });
}

export async function PATCH(request, { params }) {
  const report = db.reports.find((r) => r.id === params.id);
  if (!report) return NextResponse.json({ error: 'ไม่พบเรื่องแจ้งนี้' }, { status: 404 });

  const { status } = await request.json();
  if (!STATUSES.includes(status)) {
    return NextResponse.json({ error: 'สถานะไม่ถูกต้อง' }, { status: 400 });
  }

  report.status = status;
  report.updatedAt = new Date().toISOString();
  return NextResponse.json({ report });
}
