'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import AlbumCover from '@/components/AlbumCover';
import { useAzStore } from '@/store/useAzStore';
import { useMounted } from '@/lib/useMounted';
import { artistName } from '@/lib/musicProvider';
import type { Song } from '@/lib/types';

export default function AzPlay() {
  const router = useRouter();
  const mounted = useMounted();
  const { letters, groups, index, picks, artistId, finished, pick, skip } = useAzStore();

  useEffect(() => {
    if (finished) router.replace('/az/result');
  }, [finished, router]);

  if (!mounted) return <main className="min-h-screen" />;

  if (!letters.length) {
    return (
      <main className="mx-auto min-h-screen max-w-[430px] p-6">
        <div className="mt-32 text-center">
          <p className="text-cyan-200">还没有开始 A-Z 挑战</p>
          <Link href="/az" className="mt-6 inline-block rounded-2xl bg-white px-6 py-3 font-bold text-slate-900">
            去导入歌单
          </Link>
        </div>
      </main>
    );
  }

  const letter = letters[index];
  const candidates: Song[] = groups[letter] ?? [];
  const filled = Object.keys(picks).length;
  const progress = (filled / letters.length) * 100;

  return (
    <main className="grain relative mx-auto min-h-screen max-w-[430px] overflow-hidden px-5 py-7 safe-bottom">
      <i className="aurora -left-20 top-10 h-48 w-48 bg-fuchsia-500" />

      {/* 巨大的字母水印 */}
      <span className="pointer-events-none absolute -right-6 top-24 select-none text-[190px] font-black leading-none text-white/[.045]">
        {letter}
      </span>

      <div className="relative">
        <div className="flex items-center justify-between text-sm">
          <Link href="/az" className="text-xs text-white/45">
            ← 字母表
          </Link>
          <span className="text-xs text-white/50">
            {String(index + 1).padStart(2, '0')} / {String(letters.length).padStart(2, '0')} 格
          </span>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-fuchsia-400"
            animate={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-7 flex items-end gap-4">
          <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-[1.6rem] border border-white/25 bg-gradient-to-br from-fuchsia-500/40 to-cyan-400/25 text-[46px] font-black leading-none shadow-2xl">
            {letter}
          </div>
          <div className="pb-1.5">
            <p className="text-[10px] font-bold tracking-[.25em] text-cyan-200">
              {artistName(artistId)} · LETTER {letter}
            </p>
            <h1 className="mt-1.5 text-2xl font-black leading-tight">这一格留哪首？</h1>
            <p className="mt-1 text-xs text-white/50">
              {candidates.length} 首选 1 首 · 已填 {filled} 格
            </p>
          </div>
        </div>

        <motion.div
          key={letter}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="mt-6 space-y-2.5"
        >
          {candidates.map((song, i) => (
            <motion.button
              key={song.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.35) }}
              onClick={() => pick(song)}
              className="group flex w-full items-center gap-3.5 rounded-[1.4rem] border border-white/12 bg-white/[.055] p-3 text-left transition active:scale-[.98] hover:border-fuchsia-300/60"
            >
              <AlbumCover song={song} size="md" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base font-black leading-tight text-white">
                  {song.title}
                </span>
                <span className="mt-1 block truncate text-[11px] text-white/45">
                  {song.album} · {song.year}
                </span>
                <span className="mt-2 flex gap-1.5">
                  {song.tags.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-white/10 bg-white/8 px-2 py-0.5 text-[10px] text-white/65"
                    >
                      {t}
                    </span>
                  ))}
                </span>
              </span>
              <span className="shrink-0 text-xs font-bold text-fuchsia-200 transition group-hover:translate-x-0.5">
                选它 →
              </span>
            </motion.button>
          ))}
        </motion.div>

        <button onClick={skip} className="mt-5 w-full text-xs text-white/35">
          这格我不要，跳过 →
        </button>
      </div>
    </main>
  );
}
