import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const permit = db.permits.find((p) => p.id === params.id);
  if (!permit) return NextResponse.json({ error: 'ไม่พบคำขอนี้' }, { status: 404 });
  return NextResponse.json({ permit });
}

export async function PATCH(request, { params }) {
  const permit = db.permits.find((p) => p.id === params.id);
  if (!permit) return NextResponse.json({ error: 'ไม่พบคำขอนี้' }, { status: 404 });

  const { status, note } = await request.json();
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'สถานะไม่ถูกต้อง' }, { status: 400 });
  }
  if (status === 'rejected' && !note?.trim()) {
    return NextResponse.json({ error: 'ต้องระบุเหตุผลที่ไม่อนุมัติ' }, { status: 400 });
  }

  permit.status = status;
  permit.note = note || '';
  permit.decidedAt = new Date().toISOString();
  return NextResponse.json({ permit });
}
