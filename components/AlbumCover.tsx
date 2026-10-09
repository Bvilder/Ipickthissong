'use client';

import type { Song } from '@/lib/types';
import { ARTISTS } from '@/lib/musicProvider';

/**
 * 专辑封面
 *
 * 优先级：
 * 1. data/covers.json 里配置的文件名 / URL（真实封面，接入官方曲库后自动生效）
 * 2. 程序化生成的封面图形（明确是一张设计图，不是伪造的封面）
 *
 * 不含任何第三方版权图片，不缓存 / 分发任何素材。
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

const SIZES = { sm: 40, md: 64, lg: 112 } as const;

function hashOf(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const shortOf = (artist: string) => ARTISTS.find((a) => a.name === artist)?.short ?? 'MUSIC';
const clip = (t: string, n: number) => (t.length > n ? `${t.slice(0, n)}…` : t);

function Artwork({ variant, album, artist }: { variant: number; album: string; artist: string }) {
  const seed = hashOf(album);

  return (
    <>
      {/* 唱片 */}
      {variant === 0 && (
        <>
          <circle cx="50" cy="52" r="34" fill="rgba(255,255,255,.14)" />
          <circle cx="50" cy="52" r="24" fill="none" stroke="rgba(0,0,0,.18)" strokeWidth="1" />
          <circle cx="50" cy="52" r="16" fill="none" stroke="rgba(0,0,0,.14)" strokeWidth="1" />
          <circle cx="50" cy="52" r="6" fill="rgba(0,0,0,.28)" />
          <circle cx="50" cy="52" r="1.8" fill="rgba(255,255,255,.7)" />
        </>
      )}

      {/* 声波 */}
      {variant === 1 && (
        <>
          {Array.from({ length: 11 }).map((_, i) => {
            const h = 12 + ((seed >> i) % 9) * 5;
            return (
              <rect
                key={i}
                x={9 + i * 7.6}
                y={72 - h / 2}
                width="3.4"
                height={h}
                rx="1.7"
                fill="rgba(255,255,255,.32)"
              />
            );
          })}
        </>
      )}

      {/* 斜切 */}
      {variant === 2 && (
        <>
          <path d="M0 66 L100 26 L100 100 L0 100 Z" fill="rgba(0,0,0,.2)" />
          <path d="M0 82 L100 46 L100 66 L0 100 Z" fill="rgba(255,255,255,.16)" />
        </>
      )}

      {/* 波纹 */}
      {variant === 3 && (
        <>
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              d={`M-10 ${70 + i * 9} Q 50 ${42 + i * 9} 110 ${70 + i * 9}`}
              fill="none"
              stroke="rgba(255,255,255,.22)"
              strokeWidth="1.4"
            />
          ))}
          <circle cx="50" cy="30" r="12" fill="rgba(255,255,255,.28)" />
        </>
      )}

      {/* 点阵 */}
      {variant === 4 && (
        <>
          {Array.from({ length: 30 }).map((_, i) => (
            <circle
              key={i}
              cx={13 + (i % 6) * 15}
              cy={13 + Math.floor(i / 6) * 16}
              r={1.6 + ((seed >> i) % 3) * 0.9}
              fill="rgba(255,255,255,.26)"
            />
          ))}
          <rect x="0" y="68" width="100" height="32" fill="rgba(0,0,0,.24)" />
        </>
      )}

      {/* 方框构成 */}
      {variant === 5 && (
        <>
          <rect x="14" y="14" width="72" height="72" fill="none" stroke="rgba(255,255,255,.38)" strokeWidth="1.2" />
          <rect x="26" y="26" width="48" height="48" fill="rgba(255,255,255,.12)" />
          <line x1="14" y1="14" x2="86" y2="86" stroke="rgba(255,255,255,.24)" strokeWidth="1" />
        </>
      )}

      {/* 信息层 */}
      <rect x="0" y="0" width="100" height="100" fill="rgba(0,0,0,.1)" />
      <text x="7" y="13" fontSize="7.5" fontWeight="800" fill="rgba(255,255,255,.85)">
        {clip(shortOf(artist), 8)}
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

  // 真实封面（data/covers.json 配置后自动生效）
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

  // 同一张专辑共用一张图形
  const seed = hashOf(song.album);
  const [a, b] = PALETTES[seed % PALETTES.length];
  const variant = Math.floor(seed / 7) % 6;

  return (
    <div
      aria-label={`${song.album} 封面`}
      style={{ width: px, height: px }}
      className="relative shrink-0 overflow-hidden rounded-lg shadow-lg shadow-black/35"
    >
      <svg viewBox="0 0 100 100" className="block h-full w-full">
        <defs>
          <linearGradient id={`cv${seed}${px}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={a} />
            <stop offset="100%" stopColor={b} />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill={`url(#cv${seed}${px})`} />
        <Artwork variant={variant} album={song.album} artist={song.artist} />
      </svg>
      <i className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-white/15" />
    </div>
  );
}
