'use client';

import type { Song } from '@/lib/types';
import { ARTISTS } from '@/lib/musicProvider';

/**
 * 专辑封面
 *
 * 演示阶段用「程序化生成的封面艺术」：配色与构图由专辑名确定性派生，
 * 不含任何第三方版权图片，也不缓存 / 分发任何素材。
 * 接入官方曲库后，只要 song.coverUrl 有值就会自动换成真实封面。
 */

const PALETTES: [string, string][] = [
  ['#f472b6', '#6d28d9'],
  ['#38bdf8', '#4338ca'],
  ['#fbbf24', '#be123c'],
  ['#34d399', '#0369a1'],
  ['#c084fc', '#db2777'],
  ['#fb923c', '#7e22ce'],
  ['#22d3ee', '#6d28d9'],
  ['#fde047', '#0f766e'],
  ['#f87171', '#1e1b4b'],
  ['#a3e635', '#065f46'],
];

const SIZES = {
  sm: 40,
  md: 64,
  lg: 112,
} as const;

function hashOf(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const shortOf = (artist: string) => ARTISTS.find((a) => a.name === artist)?.short ?? 'MUSIC';

const clip = (text: string, n: number) => (text.length > n ? `${text.slice(0, n)}…` : text);

/** 6 套构图模板 */
function Artwork({
  variant,
  a,
  b,
  album,
  title,
  size,
}: {
  variant: number;
  a: string;
  b: string;
  album: string;
  title: string;
  size: number;
}) {
  const gid = `g${variant}${size}`;
  const initial = album.trim().charAt(0) || title.trim().charAt(0) || '♪';

  return (
    <>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={a} />
          <stop offset="100%" stopColor={b} />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#${gid})`} />

      {variant === 0 && (
        <>
          <text x="8" y="86" fontSize="52" fontWeight="900" fill="rgba(255,255,255,.9)">
            {initial}
          </text>
          <circle cx="76" cy="26" r="14" fill="rgba(255,255,255,.18)" />
        </>
      )}
      {variant === 1 && (
        <>
          <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="1" />
          <circle cx="50" cy="50" r="28" fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="1" />
          <circle cx="50" cy="50" r="18" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1" />
          <circle cx="50" cy="50" r="7" fill="rgba(255,255,255,.5)" />
          <circle cx="50" cy="50" r="2.2" fill={b} />
        </>
      )}
      {variant === 2 && (
        <>
          <path d="M0 62 L100 22 L100 100 L0 100 Z" fill="rgba(0,0,0,.18)" />
          <path d="M0 78 L100 42 L100 62 L0 96 Z" fill="rgba(255,255,255,.14)" />
        </>
      )}
      {variant === 3 && (
        <>
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              d={`M-10 ${72 + i * 9} Q 50 ${44 + i * 9} 110 ${72 + i * 9}`}
              fill="none"
              stroke="rgba(255,255,255,.2)"
              strokeWidth="1.4"
            />
          ))}
          <circle cx="50" cy="34" r="13" fill="rgba(255,255,255,.3)" />
        </>
      )}
      {variant === 4 && (
        <>
          {Array.from({ length: 36 }).map((_, i) => (
            <circle
              key={i}
              cx={12 + (i % 6) * 15.5}
              cy={14 + Math.floor(i / 6) * 15.5}
              r={2 + (i % 3)}
              fill="rgba(255,255,255,.22)"
            />
          ))}
          <rect x="0" y="70" width="100" height="30" fill="rgba(0,0,0,.22)" />
        </>
      )}
      {variant === 5 && (
        <>
          <rect x="8" y="8" width="84" height="84" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="1.5" />
          <text x="50" y="62" fontSize="40" fontWeight="900" textAnchor="middle" fill="rgba(255,255,255,.92)">
            {initial}
          </text>
        </>
      )}

      {/* 统一的信息层 */}
      <rect x="0" y="0" width="100" height="100" fill="rgba(0,0,0,.12)" />
      <text x="7" y="13" fontSize="7.5" fontWeight="800" fill="rgba(255,255,255,.85)">
        {clip(shortOf(title), 8)}
      </text>
      <text x="7" y="92" fontSize="7" fontWeight="700" fill="rgba(255,255,255,.8)">
        {clip(album, 9)}
      </text>
    </>
  );
}

export default function AlbumCover({
  song,
  size = 'md',
}: {
  song: Song;
  size?: 'sm' | 'md' | 'lg';
}) {
  const px = SIZES[size];
  // 同一张专辑共用一张封面（与真实专辑一致）
  const seed = hashOf(song.album);
  const [a, b] = PALETTES[seed % PALETTES.length];
  const variant = Math.floor(seed / 7) % 6;

  // 接入官方曲库后，这里会拿到真实封面地址
  if (song.coverUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={song.coverUrl}
        alt={`${song.album} 封面`}
        style={{ width: px, height: px }}
        className="shrink-0 rounded-lg object-cover shadow-lg shadow-black/35"
      />
    );
  }

  return (
    <div
      aria-label={`${song.album} 封面`}
      style={{ width: px, height: px }}
      className="relative shrink-0 overflow-hidden rounded-lg shadow-lg shadow-black/35"
    >
      <svg viewBox="0 0 100 100" className="block h-full w-full">
        <Artwork variant={variant} a={a} b={b} album={song.album} title={song.artist} size={px} />
      </svg>
      <i className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-white/15" />
    </div>
  );
}
