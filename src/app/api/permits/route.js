import { NextResponse } from 'next/server';
import { db, makeId } from '@/lib/db';
import { assessRisk } from '@/lib/zones';
import { getOfficer } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  // รายการคำขอมีชื่อ-นามสกุล เลขใบอนุญาต และพิกัดของผู้ยื่น — เปิดให้เฉพาะเจ้าหน้าที่
  const officer = await getOfficer();
  if (!officer) {
    return NextResponse.json({ error: 'ต้องเข้าสู่ระบบเจ้าหน้าที่ก่อน' }, { status: 401 });
  }

  const permits = [...db.permits].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ permits });
}

export async function POST(request) {
  const body = await request.json();

  const required = ['pilotName', 'droneBrand', 'droneModel', 'serial', 'startAt', 'endAt', 'purpose'];
  const missing = required.filter((k) => !body[k]);
  if (missing.length) {
    return NextResponse.json(
      { error: 'กรอกข้อมูลไม่ครบ', fields: missing },
      { status: 400 }
    );
  }
  if (typeof body.lat !== 'number' || typeof body.lng !== 'number') {
    return NextResponse.json({ error: 'ยังไม่ได้ปักหมุดพิกัดการบิน' }, { status: 400 });
  }

  const risk = assessRisk({ lat: body.lat, lng: body.lng }, (body.radiusM || 0) / 1000);
  if (risk.level === 'blocked') {
    return NextResponse.json({ error: risk.detail }, { status: 422 });
  }

  const permit = {
    id: makeId('PMT'),
    pilotName: body.pilotName,
    licenseNo: body.licenseNo || '',
    idLast4: String(body.nationalId || '').slice(-4),
    droneBrand: body.droneBrand,
    droneModel: body.droneModel,
    serial: body.serial,
    weightG: Number(body.weightG) || 0,
    startAt: body.startAt,
    endAt: body.endAt,
    purpose: body.purpose,
    lat: body.lat,
    lng: body.lng,
    radiusM: Number(body.radiusM) || 200,
    status: 'pending',
    note: '',
    createdAt: new Date().toISOString(),
  };

  db.permits.push(permit);
  return NextResponse.json({ permit }, { status: 201 });
}
