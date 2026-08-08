import { NextResponse } from 'next/server';
import { db, makeId } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const reports = [...db.reports].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ reports });
}

export async function POST(request) {
  const body = await request.json();

  if (typeof body.lat !== 'number' || typeof body.lng !== 'number') {
    return NextResponse.json({ error: 'ยังไม่ได้ระบุตำแหน่งที่พบโดรน' }, { status: 400 });
  }
  if (!body.seenAt) {
    return NextResponse.json({ error: 'กรุณาระบุวัน-เวลาที่พบ' }, { status: 400 });
  }

  const anonymous = Boolean(body.anonymous);
  const report = {
    id: makeId('RPT'),
    seenAt: body.seenAt,
    lat: body.lat,
    lng: body.lng,
    direction: body.direction || 'ไม่แน่ใจ',
    droneColor: body.droneColor || '',
    droneSize: body.droneSize || 'unknown',
    behavior: body.behavior || '',
    anonymous,
    reporterName: anonymous ? '' : body.reporterName || '',
    contact: anonymous ? '' : body.contact || '',
    media: body.media || '',
    status: 'new',
    createdAt: new Date().toISOString(),
  };

  db.reports.push(report);
  return NextResponse.json({ report }, { status: 201 });
}
