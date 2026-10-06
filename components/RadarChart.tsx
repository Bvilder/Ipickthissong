'use client';

import { motion } from 'framer-motion';
import type { Dimension } from '@/lib/types';

const SIZE = 260;
const CENTER = SIZE / 2;
const RADIUS = 86;
const RINGS = [0.25, 0.5, 0.75, 1];

export default function RadarChart({ dimensions }: { dimensions: Dimension[] }) {
  const list = dimensions.length >= 3 ? dimensions : [];
  if (list.length === 0) return null;

  const count = list.length;
  const point = (index: number, ratio: number) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
    return [CENTER + Math.cos(angle) * RADIUS * ratio, CENTER + Math.sin(angle) * RADIUS * ratio] as const;
  };

  const polygon = list
    .map((d, i) => point(i, Math.max(d.score, 0) / 100).join(','))
    .join(' ');

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full" role="img" aria-label="音乐人格雷达图">
      <defs>
        <linearGradient id="radar-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f0abfc" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#67e8f9" stopOpacity="0.45" />
        </linearGradient>
      </defs>

      {RINGS.map((r) => (
        <polygon
          key={r}
          points={list.map((_, i) => point(i, r).join(',')).join(' ')}
          fill="none"
          stroke="rgba(255,255,255,.14)"
          strokeWidth="1"
        />
      ))}

      {list.map((_, i) => {
        const [x, y] = point(i, 1);
        return <line key={i} x1={CENTER} y1={CENTER} x2={x} y2={y} stroke="rgba(255,255,255,.12)" strokeWidth="1" />;
      })}

      <motion.polygon
        points={polygon}
        fill="url(#radar-fill)"
        stroke="#f5d0fe"
        strokeWidth="2"
        strokeLinejoin="round"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 16 }}
        style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
      />

      {list.map((d, i) => {
        const [x, y] = point(i, Math.max(d.score, 0) / 100);
        return <circle key={d.name} cx={x} cy={y} r="3.5" fill="#fff" />;
      })}

      {list.map((d, i) => {
        const [x, y] = point(i, 1.24);
        const anchor = Math.abs(x - CENTER) < 6 ? 'middle' : x > CENTER ? 'start' : 'end';
        return (
          <g key={`label-${d.name}`}>
            <text x={x} y={y - 2} textAnchor={anchor} className="fill-white/80 text-[11px] font-bold">
              {d.name}
            </text>
            <text x={x} y={y + 11} textAnchor={anchor} className="fill-fuchsia-200 text-[11px] font-black">
              {d.score}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
