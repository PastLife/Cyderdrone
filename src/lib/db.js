/**
 * ฐานข้อมูลจำลองเก็บในหน่วยความจำ (สำหรับต้นแบบเท่านั้น)
 * เวลาต่อยอดจริง ให้เปลี่ยนไฟล์นี้เป็น query ไปยัง PostgreSQL + PostGIS
 * โดยที่ route handler ใน src/app/api/* ไม่ต้องแก้เลย
 */

const g = globalThis;

function daysAgo(n) {
  return new Date(Date.now() - n * 86400000).toISOString();
}

function seed() {
  return {
    permits: [
      {
        id: 'PMT-2A7F41',
        pilotName: 'ธนกฤต วงศ์อนันต์',
        licenseNo: 'CAAT-2023-08841',
        idLast4: '4471',
        droneBrand: 'DJI',
        droneModel: 'Mavic 3 Enterprise',
        serial: '1581F5FJC24AK0080PQ',
        weightG: 920,
        startAt: '2026-08-12T07:00',
        endAt: '2026-08-12T11:00',
        purpose: 'ถ่ายภาพสำรวจไซต์งานก่อสร้าง อาคาร B',
        lat: 13.7212,
        lng: 100.5601,
        radiusM: 400,
        status: 'pending',
        note: '',
        createdAt: daysAgo(1),
      },
      {
        id: 'PMT-9C0D18',
        pilotName: 'ศิรประภา เจริญพงษ์',
        licenseNo: 'CAAT-2024-01277',
        idLast4: '1029',
        droneBrand: 'Autel',
        droneModel: 'EVO II Pro',
        serial: 'AE2P-77120934',
        weightG: 1191,
        startAt: '2026-08-09T16:30',
        endAt: '2026-08-09T18:00',
        purpose: 'ถ่ายทำสารคดีริมแม่น้ำเจ้าพระยา',
        lat: 13.7605,
        lng: 100.4988,
        radiusM: 250,
        status: 'rejected',
        note: 'พิกัดอยู่ในระยะ 3 กม. จากเขตพระราชฐาน กรุณาเลื่อนจุดบินออกไปทางทิศตะวันออก',
        createdAt: daysAgo(3),
      },
      {
        id: 'PMT-53BE60',
        pilotName: 'ณัฐดนัย พูลสวัสดิ์',
        licenseNo: 'CAAT-2022-05590',
        idLast4: '8863',
        droneBrand: 'DJI',
        droneModel: 'Air 3',
        serial: '3XKDH2400A9911',
        weightG: 720,
        startAt: '2026-08-15T06:00',
        endAt: '2026-08-15T09:00',
        purpose: 'สำรวจพื้นที่เกษตรเพื่อทำแผนที่แปลงปลูก',
        lat: 13.8412,
        lng: 100.4402,
        radiusM: 800,
        status: 'approved',
        note: 'อนุมัติ — ห้ามบินสูงเกิน 90 เมตร และต้องอยู่ในระยะสายตาตลอดเวลา',
        createdAt: daysAgo(5),
      },
      {
        id: 'PMT-1F8842',
        pilotName: 'กันตพงศ์ อินทรีย์',
        licenseNo: 'CAAT-2025-00312',
        idLast4: '5510',
        droneBrand: 'Skydio',
        droneModel: 'X10',
        serial: 'SKX10-2025-4471',
        weightG: 2100,
        startAt: '2026-08-11T09:00',
        endAt: '2026-08-11T12:00',
        purpose: 'ตรวจสอบโครงสร้างสะพานร่วมกับหน่วยงานท้องถิ่น',
        lat: 13.6702,
        lng: 100.6011,
        radiusM: 300,
        status: 'pending',
        note: '',
        createdAt: daysAgo(0),
      },
    ],
    reports: [
      {
        id: 'RPT-77C1A9',
        seenAt: '2026-08-07T21:14',
        lat: 13.9011,
        lng: 100.6003,
        direction: 'ทิศเหนือ',
        droneColor: 'ขาว',
        droneSize: 'medium',
        behavior: 'บินวนเหนือลานจอดรถประมาณ 10 นาที ไม่มีไฟนำร่อง',
        anonymous: true,
        reporterName: '',
        contact: '',
        media: 'IMG_2214.jpg',
        status: 'investigating',
        createdAt: daysAgo(1),
      },
      {
        id: 'RPT-30E5B2',
        seenAt: '2026-08-06T05:40',
        lat: 13.7482,
        lng: 100.4931,
        direction: 'ทิศตะวันตก',
        droneColor: 'ดำ',
        droneSize: 'small',
        behavior: 'บินต่ำผ่านหลังคาอาคารแล้วหายไปทางแม่น้ำ',
        anonymous: false,
        reporterName: 'พิมพ์ชนก ตั้งมั่น',
        contact: '08x-xxx-4412',
        media: 'clip_0540.mp4',
        status: 'new',
        createdAt: daysAgo(2),
      },
      {
        id: 'RPT-9B44D0',
        seenAt: '2026-08-03T19:02',
        lat: 13.6955,
        lng: 100.7488,
        direction: 'ทิศตะวันออกเฉียงใต้',
        droneColor: 'เทา',
        droneSize: 'large',
        behavior: 'พบใกล้แนวร่อนลงของเครื่องบิน',
        anonymous: false,
        reporterName: 'เจ้าหน้าที่รักษาความปลอดภัยอาคาร C',
        contact: 'security@example.co.th',
        media: 'IMG_1180.jpg',
        status: 'resolved',
        createdAt: daysAgo(5),
      },
      {
        id: 'RPT-C21055',
        seenAt: '2026-08-02T13:20',
        lat: 13.8203,
        lng: 100.5402,
        direction: 'ไม่แน่ใจ',
        droneColor: 'ขาว',
        droneSize: 'small',
        behavior: 'เห็นวัตถุลอยนิ่ง สุดท้ายเป็นว่าวของเด็กในหมู่บ้าน',
        anonymous: true,
        reporterName: '',
        contact: '',
        media: '',
        status: 'false_alarm',
        createdAt: daysAgo(6),
      },
    ],
  };
}

if (!g.__cyberdrone) g.__cyberdrone = seed();

export const db = g.__cyberdrone;

export function makeId(prefix) {
  const hex = Math.random().toString(16).slice(2, 8).toUpperCase();
  return `${prefix}-${hex}`;
}
