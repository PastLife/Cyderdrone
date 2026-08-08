import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getOfficer } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const permit = db.permits.find((p) => p.id === params.id);
  if (!permit) return NextResponse.json({ error: 'ไม่พบคำขอนี้' }, { status: 404 });
  return NextResponse.json({ permit });
}

export async function PATCH(request, { params }) {
  // การตัดสินคำขอเป็นอำนาจของเจ้าหน้าที่ — ต้องมี session เสมอ
  const officer = await getOfficer();
  if (!officer) {
    return NextResponse.json({ error: 'ต้องเข้าสู่ระบบเจ้าหน้าที่ก่อน' }, { status: 401 });
  }

  const permit = db.permits.find((p) => p.id === params.id);
  if (!permit) return NextResponse.json({ error: 'ไม่พบคำขอนี้' }, { status: 404 });

  const { status, note } = await request.json();
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'สถานะไม่ถูกต้อง' }, { status: 400 });
  }
  if (status === 'rejected' && !note?.trim()) {
    return NextResponse.json({ error: 'ต้องระบุเหตุผลที่ไม่อนุมัติ' }, { status: 400 });
  }

  const before = permit.status;
  permit.status = status;
  permit.note = note || '';
  permit.decidedAt = new Date().toISOString();
  permit.decidedBy = officer.email;

  if (status !== before) {
    await logAudit({
      actorId: officer.id,
      actorEmail: officer.email,
      action: status === 'approved' ? 'permit.approve' : 'permit.reject',
      targetType: 'permit',
      targetId: permit.id,
      detail: { from: before, to: status, note: note || '', pilot: permit.pilotName },
    });
  }

  return NextResponse.json({ permit });
}
