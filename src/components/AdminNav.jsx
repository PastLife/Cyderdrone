'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/admin', label: 'ภาพรวม' },
  { href: '/admin/permits', label: 'คำขออนุญาต' },
  { href: '/admin/reports', label: 'เบาะแสโดรน' },
  { href: '/admin/users', label: 'ผู้ใช้งาน' },
  { href: '/admin/audit', label: 'ประวัติการใช้งาน' },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-line/70 pb-px">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm transition ${
              active
                ? 'border-b-2 border-cyan text-cyan'
                : 'border-b-2 border-transparent text-muted hover:text-ink'
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
