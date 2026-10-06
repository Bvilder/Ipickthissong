'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import AlbumCover from '@/components/AlbumCover';
import RatingScale from '@/components/RatingScale';
import { useCoStore } from '@/store/useCoStore';
import { useMounted } from '@/lib/useMounted';

export default function CoRate() {
  const router = useRouter();
  const mounted = useMounted();
  const { songs, index, scores, done, rate, back } = useCoStore();

  useEffect(() => {
    if (done) router.replace('/co/result');
  }, [done, router]);

  if (!mounted) return <main className="min-h-screen" />;

  if (!songs.length) {
    return (
      <main className="mx-auto min-h-screen max-w-[430px] p-6">
        <div className="mt-32 text-center">
          <p className="text-fuchsia-200">还没有开始共创</p>
          <Link href="/co" className="mt-6 inline-block rounded-2xl bg-white px-6 py-3 font-bold text-slate-900">
            去选歌
          </Link>
        </div>
      </main>
    );
  }

  const song = songs[index];
  if (!song) return <main className="min-h-screen" />;

  const progress = ((index + (scores[index] ? 1 : 0)) / songs.length) * 100;

  return (
    <main className="grain relative mx-auto min-h-screen max-w-[430px] overflow-hidden px-5 py-7 safe-bottom">
      <i className="aurora -left-20 top-16 h-48 w-48 bg-violet-500" />

      <div className="relative">
        <div className="flex items-center justify-between text-sm">
          <Link href="/co" className="text-xs text-white/45">
            ← 共创
          </Link>
          <span className="text-xs text-white/50">
            {String(index + 1).padStart(2, '0')} / {String(songs.length).padStart(2, '0')}
          </span>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 to-cyan-300"
            animate={{ width: `${progress}%` }}
          />
        </div>

        <motion.div
          key={song.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex items-center gap-4"
        >
          <AlbumCover song={song} size="lg" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-[.25em] text-fuchsia-200">HOW MUCH?</p>
            <h1 className="mt-1.5 text-3xl font-black leading-tight">{song.title}</h1>
            <p className="mt-1.5 truncate text-xs text-white/50">
              {song.artist} · {song.album} · {song.year}
            </p>
          </div>
        </motion.div>

        <div className="mt-7">
          <RatingScale onPick={rate} />
        </div>

        {index > 0 && (
          <button onClick={back} className="mt-5 w-full text-xs text-white/35">
            ← 上一首
          </button>
        )}
      </div>
    </main>
  );
}
