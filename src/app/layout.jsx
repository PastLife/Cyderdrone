import './globals.css';
import SiteNav from '@/components/SiteNav';

export const metadata = {
  title: 'CyberDrone Platform — ระบบขออนุญาตบินโดรนและแจ้งเบาะแส',
  description:
    'ยื่นขออนุญาตบินโดรน ตรวจสอบเขตห้ามบิน และแจ้งเบาะแสโดรนไม่ทราบที่มา ในที่เดียว',
};

export const viewport = {
  themeColor: '#0B0E14',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <SiteNav />
        <main>{children}</main>
        <footer className="mt-20 border-t border-line/70">
          <div className="mx-auto max-w-6xl px-4 py-8 text-xs text-muted">
            <p className="mb-1">
              ต้นแบบระบบเพื่อการสาธิต — ยังไม่ได้เชื่อมกับระบบออกใบอนุญาตจริงของ CAAT
            </p>
            <p>ข้อมูลส่วนบุคคลที่กรอกจะถูกใช้ตามวัตถุประสงค์การขออนุญาตเท่านั้น (PDPA)</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
