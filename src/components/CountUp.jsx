'use client';

import { useEffect, useState } from 'react';

export default function CountUp({ to = 0, duration = 900, className = '' }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setValue(to);
      return;
    }
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      setValue(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, duration]);

  return <span className={className}>{value.toLocaleString('th-TH')}</span>;
}
