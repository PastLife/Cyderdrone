// ขอบเขตแผนที่จำลอง (กรุงเทพฯ และปริมณฑล)
export const BOUNDS = {
  minLat: 13.58,
  maxLat: 13.98,
  minLng: 100.38,
  maxLng: 100.82,
};

// ขนาด viewBox ของแผนที่ SVG
export const MAP_W = 1000;
export const MAP_H = 700;

/**
 * เขตห้ามบิน (ข้อมูลจำลองสำหรับต้นแบบ — ต้องแทนที่ด้วยชั้นข้อมูลจริงจาก CAAT ก่อนใช้งานจริง)
 * radiusKm = รัศมีห้ามบินโดยรอบ
 */
export const NO_FLY_ZONES = [
  { id: 'nfz-dmk', name: 'ท่าอากาศยานดอนเมือง', lat: 13.9126, lng: 100.6068, radiusKm: 9, type: 'airport' },
  { id: 'nfz-bkk', name: 'ท่าอากาศยานสุวรรณภูมิ', lat: 13.69, lng: 100.7501, radiusKm: 9, type: 'airport' },
  { id: 'nfz-palace', name: 'เขตพระราชฐาน', lat: 13.75, lng: 100.4913, radiusKm: 3, type: 'royal' },
  { id: 'nfz-parliament', name: 'อาคารรัฐสภา', lat: 13.8007, lng: 100.5209, radiusKm: 2, type: 'government' },
  { id: 'nfz-govhouse', name: 'ทำเนียบรัฐบาล', lat: 13.7699, lng: 100.5122, radiusKm: 1.5, type: 'government' },
];

export function latLngToXY(lat, lng) {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * MAP_W;
  const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * MAP_H;
  return { x, y };
}

export function xyToLatLng(x, y) {
  const lng = BOUNDS.minLng + (x / MAP_W) * (BOUNDS.maxLng - BOUNDS.minLng);
  const lat = BOUNDS.maxLat - (y / MAP_H) * (BOUNDS.maxLat - BOUNDS.minLat);
  return { lat, lng };
}

/** แปลงระยะทางเป็นกิโลเมตร (สูตร haversine) */
export function distanceKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** รัศมีเขตห้ามบินคิดเป็นพิกเซลบนแผนที่ (ประมาณค่าตามแกนละติจูด) */
export function kmToPx(km) {
  const latSpanKm = (BOUNDS.maxLat - BOUNDS.minLat) * 111;
  return (km / latSpanKm) * MAP_H;
}

/**
 * ประเมินความเสี่ยงของพิกัดที่ผู้ใช้เลือก
 * bufferKm = รัศมีการบินที่ผู้ใช้ขอ
 */
export function assessRisk(point, bufferKm = 0) {
  if (!point) return null;

  let nearest = null;
  const hits = [];

  for (const zone of NO_FLY_ZONES) {
    const d = distanceKm(point, zone);
    const clearance = d - zone.radiusKm - bufferKm;
    if (!nearest || clearance < nearest.clearance) nearest = { zone, distance: d, clearance };
    if (clearance <= 0) hits.push({ zone, distance: d, clearance });
  }

  if (hits.length) {
    return {
      level: 'blocked',
      title: 'อยู่ในเขตห้ามบิน',
      detail: `พิกัดนี้ทับเขตห้ามบิน: ${hits.map((h) => h.zone.name).join(', ')}`,
      nearest,
      hits,
    };
  }

  if (nearest && nearest.clearance < 2) {
    return {
      level: 'caution',
      title: 'ใกล้เขตห้ามบิน',
      detail: `ห่างขอบเขต ${nearest.zone.name} เพียง ${nearest.clearance.toFixed(1)} กม. เจ้าหน้าที่จะตรวจสอบเพิ่มเติม`,
      nearest,
      hits,
    };
  }

  return {
    level: 'clear',
    title: 'บินได้',
    detail: `พ้นเขตห้ามบินที่ใกล้ที่สุด (${nearest.zone.name}) ${nearest.clearance.toFixed(1)} กม.`,
    nearest,
    hits,
  };
}
