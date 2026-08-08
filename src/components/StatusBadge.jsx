const MAP = {
  pending: { text: 'รอตรวจสอบ', cls: 'border-cyan/40 text-cyan bg-cyan/10' },
  approved: { text: 'อนุมัติแล้ว', cls: 'border-lime/40 text-lime bg-lime/10' },
  rejected: { text: 'ไม่อนุมัติ', cls: 'border-coral/40 text-coral bg-coral/10' },
  new: { text: 'เรื่องใหม่', cls: 'border-coral/40 text-coral bg-coral/10' },
  investigating: { text: 'กำลังตรวจสอบ', cls: 'border-cyan/40 text-cyan bg-cyan/10' },
  resolved: { text: 'ดำเนินการแล้ว', cls: 'border-lime/40 text-lime bg-lime/10' },
  false_alarm: { text: 'ไม่พบเหตุ', cls: 'border-line text-muted bg-white/5' },
};

export function statusText(status) {
  return MAP[status]?.text || status;
}

export default function StatusBadge({ status }) {
  const s = MAP[status] || { text: status, cls: 'border-line text-muted' };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs whitespace-nowrap ${s.cls}`}
    >
      {s.text}
    </span>
  );
}
