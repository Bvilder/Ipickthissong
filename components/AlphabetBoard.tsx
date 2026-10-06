'use client';

import type { Song } from '@/lib/types';
import { LETTERS } from '@/lib/pinyin';

/**
 * A-Z 字母表：每个字母一格，已选出歌的格子点亮。
 */
export default function AlphabetBoard({
  picks,
  songs,
  counts,
  compact = false,
}: {
  picks: Record<string, string>;
  songs: Song[];
  /** 每个字母下的歌曲数（未开始时用于预览） */
  counts?: Record<string, number>;
  compact?: boolean;
}) {
  const byId = new Map(songs.map((s) => [s.id, s]));

  return (
    <div className={`grid grid-cols-6 gap-1.5 ${compact ? 'gap-1' : ''}`}>
      {LETTERS.map((letter) => {
        const picked = picks[letter] ? byId.get(picks[letter]) : undefined;
        const count = counts?.[letter] ?? 0;
        const has = picked || count > 0;

        return (
          <div
            key={letter}
            className={`flex flex-col justify-between rounded-lg border px-1 py-1.5 text-center transition ${
              picked
                ? 'border-fuchsia-200/60 bg-gradient-to-br from-fuchsia-500/35 to-violet-600/25 shadow-sm shadow-fuchsia-900/30'
                : has
                  ? 'border-cyan-200/30 bg-white/[.08]'
                  : 'border-white/8 bg-white/[.02]'
            } ${compact ? 'min-h-[52px]' : 'min-h-[64px]'}`}
          >
            <span
              className={`text-sm font-black leading-none ${
                picked ? 'text-white' : has ? 'text-cyan-100/80' : 'text-white/18'
              }`}
            >
              {letter}
            </span>
            {picked ? (
              <span className="mt-1 line-clamp-2 text-[8px] font-bold leading-[1.15] text-white/85">
                {picked.title}
              </span>
            ) : (
              <span className={`mt-1 text-[8px] leading-[1.15] ${has ? 'text-white/35' : 'text-white/12'}`}>
                {has ? `${count} 首` : '—'}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
