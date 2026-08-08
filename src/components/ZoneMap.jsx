'use client';

import { useRef } from 'react';
import {
  MAP_W,
  MAP_H,
  NO_FLY_ZONES,
  latLngToXY,
  xyToLatLng,
  kmToPx,
} from '@/lib/zones';

// เส้นแม่น้ำเจ้าพระยาแบบย่อ ใช้เป็นจุดอ้างอิงสายตาบนแผนที่
const RIVER = [
  [13.96, 100.505],
  [13.9, 100.5],
  [13.85, 100.515],
  [13.8, 100.5],
  [13.77, 100.51],
  [13.74, 100.49],
  [13.71, 100.5],
  [13.68, 100.53],
  [13.63, 100.57],
  [13.58, 100.58],
];

const MARKER_STYLES = {
  permit: { fill: '#00FF87', label: 'คำขอบิน' },
  report: { fill: '#FF2A6D', label: 'เบาะแส' },
};

export default function ZoneMap({
  point = null,
  radiusM = 0,
  onPick = null,
  markers = [],
  sweep = false,
  height = 'h-[380px]',
}) {
  const svgRef = useRef(null);

  function handleClick(event) {
    if (!onPick || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * MAP_W;
    const y = ((event.clientY - rect.top) / rect.height) * MAP_H;
    onPick(xyToLatLng(x, y));
  }

  const riverPath = RIVER.map(([lat, lng], i) => {
    const { x, y } = latLngToXY(lat, lng);
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const selected = point ? latLngToXY(point.lat, point.lng) : null;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${MAP_W} ${MAP_H}`}
      onClick={handleClick}
      role="img"
      aria-label="แผนที่เขตการบินโดรน"
      className={`w-full ${height} rounded-xl border border-line bg-[#080B11] ${
        onPick ? 'cursor-crosshair' : ''
      }`}
    >
      <defs>
        <pattern id="mapgrid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M50 0H0V50" fill="none" stroke="#00F0FF" strokeOpacity="0.07" strokeWidth="1" />
        </pattern>
        <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
          <stop offset="60%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
        <linearGradient id="sweepFade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#00F0FF" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width={MAP_W} height={MAP_H} fill="#080B11" />
      <rect width={MAP_W} height={MAP_H} fill="url(#mapgrid)" />

      {/* พื้นที่บินได้ */}
      <rect
        x="8"
        y="8"
        width={MAP_W - 16}
        height={MAP_H - 16}
        fill="#00FF87"
        fillOpacity="0.035"
        stroke="#00FF87"
        strokeOpacity="0.2"
        strokeDasharray="6 6"
      />

      <path d={riverPath} fill="none" stroke="#1E4A5C" strokeWidth="10" strokeLinecap="round" />
      <path d={riverPath} fill="none" stroke="#2B6F86" strokeWidth="3" strokeLinecap="round" />

      {sweep && (
        <g transform={`translate(${MAP_W / 2} ${MAP_H / 2})`} className="animate-sweep">
          <path
            d={`M0,0 L${MAP_W},0 A${MAP_W},${MAP_W} 0 0 0 ${MAP_W * 0.93},${-MAP_W * 0.36} Z`}
            fill="url(#sweepFade)"
          />
        </g>
      )}

      {/* เขตห้ามบิน */}
      {NO_FLY_ZONES.map((zone) => {
        const { x, y } = latLngToXY(zone.lat, zone.lng);
        const r = kmToPx(zone.radiusKm);
        return (
          <g key={zone.id}>
            <circle cx={x} cy={y} r={r} fill="#FF2A6D" fillOpacity="0.09" />
            <circle
              cx={x}
              cy={y}
              r={r}
              fill="none"
              stroke="#FF2A6D"
              strokeOpacity="0.55"
              strokeWidth="1.5"
              strokeDasharray="5 5"
            />
            <circle cx={x} cy={y} r="3" fill="#FF2A6D" />
            <text
              x={x}
              y={y - 8}
              textAnchor="middle"
              fill="#FF7CA3"
              fontSize="15"
              fontFamily="var(--font-kanit), sans-serif"
            >
              {zone.name}
            </text>
          </g>
        );
      })}

      {/* หมุดข้อมูลที่มีอยู่แล้ว */}
      {markers.map((m, i) => {
        const { x, y } = latLngToXY(m.lat, m.lng);
        const style = MARKER_STYLES[m.kind] || MARKER_STYLES.permit;
        return (
          <g key={m.id || i}>
            <circle cx={x} cy={y} r="12" fill={style.fill} fillOpacity="0.15" />
            <circle cx={x} cy={y} r="4.5" fill={style.fill} />
          </g>
        );
      })}

      {/* หมุดที่ผู้ใช้เลือก */}
      {selected && (
        <g>
          {radiusM > 0 && (
            <circle
              cx={selected.x}
              cy={selected.y}
              r={kmToPx(radiusM / 1000)}
              fill="#00F0FF"
              fillOpacity="0.12"
              stroke="#00F0FF"
              strokeOpacity="0.7"
            />
          )}
          <line
            x1={selected.x - 16}
            y1={selected.y}
            x2={selected.x + 16}
            y2={selected.y}
            stroke="#00F0FF"
            strokeWidth="1.5"
          />
          <line
            x1={selected.x}
            y1={selected.y - 16}
            x2={selected.x}
            y2={selected.y + 16}
            stroke="#00F0FF"
            strokeWidth="1.5"
          />
          <circle cx={selected.x} cy={selected.y} r="5" fill="#00F0FF" />
        </g>
      )}

      <rect width={MAP_W} height={MAP_H} fill="url(#vignette)" pointerEvents="none" />
    </svg>
  );
}
