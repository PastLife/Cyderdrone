'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const LINKS = [
  { href: '/permit', label: 'ขออนุญาตบิน' },
  { href: '/report', label: 'แจ้งเบาะแส' },
  { href: '/permit/status', label: 'ติดตามสถานะ' },
  { href: '/admin', label: 'เจ้าหน้าที่' },
];

export default function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-base/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inset-0 rounded-full bg-cyan animate-pulseRing" />
            <span className="relative m-auto h-1.5 w-1.5 rounded-full bg-cyan" />
          </span>
          <span className="font-mono text-sm tracking-[0.2em] text-ink">CYBERDRONE</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const active = pathname === l.href || (l.href !== '/' && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-2 text-sm transition ${
                  active ? 'bg-cyan/10 text-cyan' : 'text-muted hover:text-ink'
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          aria-label="เปิดเมนู"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border border-line px-3 py-1.5 text-sm text-muted md:hidden"
        >
          เมนู
        </button>
      </div>

      {open && (
        <nav className="border-t border-line/70 px-4 py-2 md:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-2 py-2.5 text-sm text-muted hover:text-cyan"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
