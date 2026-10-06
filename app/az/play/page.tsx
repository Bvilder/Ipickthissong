'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import SongTile from '@/components/SongTile';
import { useAzStore } from '@/store/useAzStore';
import { useMounted } from '@/lib/useMounted';

export default function AzPlay() {
  const router = useRouter();
  const mounted = useMounted();
  const { letters, groups, index, picks, finished, pick, skip } = useAzStore();

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
  const candidates = groups[letter] ?? [];
  const progress = (Object.keys(picks).length / letters.length) * 100;

  return (
    <main className="grain relative mx-auto min-h-screen max-w-[430px] overflow-hidden px-5 py-7 safe-bottom">
      <i className="aurora -left-20 top-10 h-48 w-48 bg-fuchsia-500" />

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
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-white/20 bg-gradient-to-br from-fuchsia-500/30 to-cyan-400/20 text-5xl font-black shadow-xl">
            {letter}
          </div>
          <div className="pb-1">
            <p className="text-[10px] font-bold tracking-[.25em] text-cyan-200">LETTER {letter}</p>
            <h1 className="mt-1.5 text-2xl font-black leading-tight">这一格留哪首？</h1>
            <p className="mt-1 text-xs text-white/50">
              {candidates.length} 首选 1 首 · 已填 {Object.keys(picks).length} 格
            </p>
          </div>
        </div>

        <motion.div
          key={letter}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 space-y-2"
        >
          {candidates.map((song, i) => (
            <SongTile key={song.id} song={song} index={i} onClick={() => pick(song)} />
          ))}
        </motion.div>

        <button onClick={skip} className="mt-5 w-full text-xs text-white/35">
          这格我不要，跳过 →
        </button>
      </div>
    </main>
  );
}
