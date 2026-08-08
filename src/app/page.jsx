import Link from 'next/link';
import { db } from '@/lib/db';
import { NO_FLY_ZONES } from '@/lib/zones';
import ZoneMap from '@/components/ZoneMap';
import CountUp from '@/components/CountUp';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const markers = [
    ...db.permits.map((p) => ({ id: p.id, lat: p.lat, lng: p.lng, kind: 'permit' })),
    ...db.reports.map((r) => ({ id: r.id, lat: r.lat, lng: r.lng, kind: 'report' })),
  ];

  const stats = [
    { label: 'คำขอทั้งหมด', value: db.permits.length, tone: 'text-ink' },
    { label: 'รอตรวจสอบ', value: db.permits.filter((p) => p.status === 'pending').length, tone: 'text-cyan' },
    { label: 'เบาะแสที่รับแจ้ง', value: db.reports.length, tone: 'text-coral' },
    { label: 'เขตห้ามบินในระบบ', value: NO_FLY_ZONES.length, tone: 'text-lime' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="grid gap-8 pt-12 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:pt-16">
        <div>
          <p className="eyebrow mb-4">ศูนย์บริหารจัดการการบินโดรน</p>
          <h1 className="text-4xl font-light leading-tight text-ink sm:text-5xl">
            รู้ก่อนบินว่า
            <br />
            <span className="text-cyan">ตรงนี้บินได้หรือไม่</span>
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">
            ปักหมุดจุดที่จะบิน ระบบจะเทียบกับเขตห้ามบินให้ทันที แล้วยื่นคำขอต่อได้ในหน้าเดียว
            พบโดรนแปลกหน้าเหนือบ้านหรือที่ทำงาน ก็แจ้งได้จากหน้าเดียวกัน
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/permit" className="btn-primary">
              ยื่นขออนุญาตบิน
            </Link>
            <Link href="/report" className="btn-alert">
              แจ้งโดรนต้องสงสัย
            </Link>
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-surface px-4 py-4">
                <dd className={`font-mono text-2xl ${s.tone}`}>
                  <CountUp to={s.value} />
                </dd>
                <dt className="mt-1 text-[11px] leading-tight text-muted">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>

        <div className="glass p-3">
          <div className="mb-3 flex items-center justify-between px-1">
            <span className="eyebrow">แผนที่เขตการบิน</span>
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-lime">
              <span className="h-1.5 w-1.5 rounded-full bg-lime animate-blink" />
              LIVE
            </span>
          </div>
          <ZoneMap markers={markers} sweep height="h-[300px] sm:h-[400px]" />
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 px-1 text-[11px] text-muted">
            <li className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border border-lime/50 bg-lime/20" />
              เขตบินได้
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border border-coral/60 bg-coral/20" />
              เขตห้ามบิน
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-lime" />
              คำขอบิน
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-coral" />
              จุดพบโดรนต้องสงสัย
            </li>
          </ul>
        </div>
      </section>

      <section className="mt-20">
        <p className="eyebrow mb-5">ขั้นตอนการขออนุญาต</p>
        <ol className="grid gap-4 sm:grid-cols-3">
          {[
            {
              n: '01',
              t: 'ปักหมุดและกรอกข้อมูล',
              d: 'เลือกจุดบินบนแผนที่ ระบุรัศมี ข้อมูลโดรน และช่วงเวลาที่จะบิน',
            },
            {
              n: '02',
              t: 'ระบบตรวจเขตห้ามบิน',
              d: 'เทียบพิกัดกับชั้นข้อมูลเขตห้ามบินทันที ถ้าทับเขตจะยื่นไม่ผ่านตั้งแต่ต้น',
            },
            {
              n: '03',
              t: 'เจ้าหน้าที่พิจารณา',
              d: 'ติดตามสถานะด้วยรหัสคำขอ เมื่ออนุมัติจะได้เงื่อนไขการบินแนบมาด้วย',
            },
          ].map((step) => (
            <li key={step.n} className="glass p-5">
              <span className="font-mono text-xs text-cyan">{step.n}</span>
              <h3 className="mt-2 text-[15px] text-ink">{step.t}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{step.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14 glass border-coral/25 p-6">
        <p className="eyebrow mb-2 text-coral/80">พบโดรนไม่ทราบที่มา</p>
        <h2 className="text-xl font-light text-ink">แจ้งได้ทันทีจากหน้างาน</h2>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted">
          แนบภาพหรือคลิป ระบบจะดึงพิกัด GPS จากเครื่องให้อัตโนมัติ
          เลือกแจ้งแบบไม่เปิดเผยตัวตนได้ และจะได้รหัสติดตามเรื่องกลับไปทุกครั้ง
        </p>
        <Link href="/report" className="btn-alert mt-5">
          เริ่มแจ้งเบาะแส
        </Link>
      </section>
    </div>
  );
}
