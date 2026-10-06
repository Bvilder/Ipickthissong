'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import SongCard from '@/components/SongCard';
import { useAzStore } from '@/store/useAzStore';
import { useMounted } from '@/lib/useMounted';

export default function AzPlay() {
  const router = useRouter();
  const mounted = useMounted();
  const { letters, index, queue, match, picks, finished, choose, claim, bye } = useAzStore();

  useEffect(() => {
    if (finished) router.replace('/az/result');
  }, [finished, router]);

  // 组内为奇数时，落单的那首自动轮空晋级
  useEffect(() => {
    if (finished || queue.length <= 1) return;
    if (match < queue.length && !queue[match + 1]) bye();
  }, [finished, queue, match, bye]);

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
  const a = queue[match];
  const b = queue[match + 1];
  const progress = (index / letters.length) * 100;

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
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/20 bg-gradient-to-br from-fuchsia-500/30 to-cyan-400/20 text-5xl font-black shadow-xl">
            {letter}
          </div>
          <div className="pb-1">
            <p className="text-[10px] font-bold tracking-[.25em] text-cyan-200">LETTER {letter}</p>
            <h1 className="mt-1.5 text-2xl font-black leading-tight">
              {queue.length === 1 ? '这一格只有一首' : '这一格你更爱哪首？'}
            </h1>
            <p className="mt-1 text-xs text-white/50">
              本格共 {queue.length} 首 · 已填 {Object.keys(picks).length} 格
            </p>
          </div>
        </div>

        {queue.length === 1 ? (
          <motion.div
            key={`claim-${letter}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-7"
          >
            <SongCard song={queue[0]} onClick={claim} index={0} />
            <button
              onClick={claim}
              className="mt-4 w-full rounded-2xl bg-white py-4 font-bold text-slate-900 shadow-xl shadow-white/10"
            >
              就是它，填进 {letter} 格 →
            </button>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${letter}-${a?.id}-${b?.id}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mt-7 space-y-3"
            >
              {a && <SongCard song={a} onClick={() => choose(a)} index={0} />}
              {a && b && (
                <div className="flex items-center gap-3 py-1">
                  <i className="h-px flex-1 bg-white/10" />
                  <span className="text-[10px] font-black tracking-[.3em] text-white/30">OR</span>
                  <i className="h-px flex-1 bg-white/10" />
                </div>
              )}
              {b && <SongCard song={b} onClick={() => choose(b)} index={1} />}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </main>
  );
}
