'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import AlbumCover from '@/components/AlbumCover';
import ScoreSlider from '@/components/ScoreSlider';
import { useCoStore } from '@/store/useCoStore';
import { useMounted } from '@/lib/useMounted';
import { artistName } from '@/lib/musicProvider';

export default function CoRate() {
  const router = useRouter();
  const mounted = useMounted();
  const { songs, album, artistId, albumScore, scores, comment, setAlbumScore, setSongScore, setComment, finish } =
    useCoStore();

  const [step, setStep] = useState<'album' | 'tracks'>('album');

  const bestIndex = useMemo(
    () => (scores.length ? scores.indexOf(Math.max(...scores)) : -1),
    [scores]
  );

  if (!mounted) return <main className="min-h-screen" />;

  if (!songs.length) {
    return (
      <main className="mx-auto min-h-screen max-w-[430px] p-6">
        <div className="mt-32 text-center">
          <p className="text-fuchsia-200">还没有选择专辑</p>
          <Link href="/co" className="mt-6 inline-block rounded-2xl bg-white px-6 py-3 font-bold text-slate-900">
            去选专辑
          </Link>
        </div>
      </main>
    );
  }

  const cover = songs[0];

  return (
    <main className="grain relative mx-auto min-h-screen max-w-[430px] overflow-hidden px-5 py-7 safe-bottom">
      <i className="aurora -left-20 top-16 h-48 w-48 bg-violet-500" />

      <div className="relative">
        <div className="flex items-center justify-between text-sm">
          <Link href="/co" className="text-xs text-white/45">
            ← 换专辑
          </Link>
          <span className="text-xs text-white/50">{step === 'album' ? '整张专辑' : '逐首细评'}</span>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <AlbumCover song={cover} size="lg" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-[.25em] text-fuchsia-200">
              {artistName(artistId)} · {cover.year}
            </p>
            <h1 className="mt-1.5 text-3xl font-black leading-tight">{album}</h1>
            <p className="mt-1.5 text-xs text-white/50">{songs.length} 首曲目</p>
          </div>
        </div>

        {step === 'album' ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
            <p className="text-[10px] font-bold tracking-[.25em] text-white/40">ALBUM SCORE</p>
            <h2 className="mt-2 text-xl font-black">这张专辑你给几分？</h2>
            <div className="mt-6 rounded-3xl border border-white/12 bg-white/[.06] p-5">
              <ScoreSlider value={albumScore} onChange={setAlbumScore} />
            </div>

            <div className="mt-5">
              <p className="mb-2 text-[10px] font-bold tracking-[.2em] text-white/40">一句话短评（可选）</p>
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={60}
                placeholder="比如：后半张明显松了"
                className="w-full rounded-2xl border border-white/12 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-fuchsia-300/50"
              />
            </div>

            <button
              onClick={() => setStep('tracks')}
              className="relative mt-6 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 py-4 font-bold shadow-xl shadow-fuchsia-950/40 active:scale-[.99]"
            >
              <span className="relative">继续细评 {songs.length} 首 →</span>
              <i className="shine absolute inset-0" />
            </button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-7">
            <p className="text-[10px] font-bold tracking-[.25em] text-white/40">TRACK BY TRACK</p>
            <h2 className="mt-2 text-xl font-black">逐首打分</h2>

            <div className="mt-5 space-y-2.5">
              {songs.map((song, i) => (
                <div
                  key={song.id}
                  className={`rounded-2xl border p-3 transition ${
                    i === bestIndex
                      ? 'border-fuchsia-300/50 bg-fuchsia-400/10'
                      : 'border-white/10 bg-white/[.04]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-4 shrink-0 text-center text-[10px] font-black text-white/30">
                      {i + 1}
                    </span>
                    <AlbumCover song={song} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-white">
                      {song.title}
                    </span>
                    {i === bestIndex && (
                      <span className="shrink-0 rounded-full bg-fuchsia-300/25 px-2 py-0.5 text-[9px] font-bold text-fuchsia-100">
                        最佳
                      </span>
                    )}
                  </div>
                  <div className="mt-2.5 pl-6">
                    <ScoreSlider
                      value={scores[i] ?? 7}
                      onChange={(v) => setSongScore(i, v)}
                      compact
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                finish();
                router.push('/co/result');
              }}
              className="relative mt-6 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 py-4 font-bold shadow-xl shadow-fuchsia-950/40 active:scale-[.99]"
            >
              <span className="relative">完成评分 →</span>
              <i className="shine absolute inset-0" />
            </button>

            <button onClick={() => setStep('album')} className="mt-3 w-full text-xs text-white/35">
              ← 回去改专辑总分
            </button>
          </motion.div>
        )}
      </div>
    </main>
  );
}
