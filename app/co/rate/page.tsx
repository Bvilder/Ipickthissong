'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import AlbumCover from '@/components/AlbumCover';
import ScoreSlider from '@/components/ScoreSlider';
import { useCoStore } from '@/store/useCoStore';
import { useMounted } from '@/lib/useMounted';
import { artistName } from '@/lib/musicProvider';
import { scoreLabel } from '@/lib/co';

/** 专辑分揭晓：数字滚动动画 */
function RevealScore({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => v.toFixed(1));

  useEffect(() => {
    const controls = animate(mv, value, { duration: 1.4, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [mv, value]);

  return (
    <motion.span className="text-7xl font-black leading-none tabular-nums text-white">
      {text}
    </motion.span>
  );
}

export default function CoRate() {
  const router = useRouter();
  const mounted = useMounted();
  const { songs, album, artistId, scores, comment, setSongScore, setComment, finish } = useCoStore();

  const [step, setStep] = useState<'tracks' | 'reveal'>('tracks');

  const avg = useMemo(
    () => (scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0),
    [scores]
  );
  const bestIndex = useMemo(() => (scores.length ? scores.indexOf(Math.max(...scores)) : -1), [scores]);
  const worstIndex = useMemo(() => (scores.length ? scores.indexOf(Math.min(...scores)) : -1), [scores]);

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
    <main className="grain relative mx-auto min-h-screen max-w-[430px] overflow-hidden px-6 py-8 safe-bottom">
      <i className="aurora -left-24 top-16 h-48 w-48 bg-violet-500" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <Link href="/co" className="text-xs text-white/45">
            ← 换专辑
          </Link>
          <span className="text-[11px] text-white/45">
            {step === 'tracks' ? `已评 ${scores.filter((s) => s > 0).length}/${songs.length}` : '揭晓'}
          </span>
        </div>

        <div className="mt-7 flex items-center gap-4">
          <AlbumCover song={cover} size="lg" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-[.22em] text-fuchsia-200">
              {artistName(artistId)} · {cover.year}
            </p>
            <h1 className="mt-2 text-[26px] font-black leading-tight">{album}</h1>
            <p className="mt-1.5 text-xs text-white/50">{songs.length} 首曲目</p>
          </div>
        </div>

        {step === 'tracks' ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
            <p className="text-[10px] font-bold tracking-[.22em] text-white/40">TRACK BY TRACK</p>
            <h2 className="mt-2 text-lg font-black">逐首打分，专辑分会自己算出来</h2>

            <div className="mt-6 space-y-3">
              {songs.map((song, i) => (
                <div
                  key={song.id}
                  className={`rounded-2xl border p-3.5 transition ${
                    i === bestIndex
                      ? 'border-fuchsia-300/45 bg-fuchsia-400/[.08]'
                      : 'border-white/10 bg-white/[.04]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-4 shrink-0 text-center text-[10px] font-black text-white/30">
                      {i + 1}
                    </span>
                    <AlbumCover song={song} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-white">
                      {song.title}
                    </span>
                    {i === bestIndex && (
                      <span className="shrink-0 rounded-full bg-fuchsia-300/20 px-2 py-0.5 text-[9px] font-bold text-fuchsia-100">
                        最高
                      </span>
                    )}
                  </div>
                  <div className="mt-3 pl-7">
                    <ScoreSlider value={scores[i] ?? 7} onChange={(v) => setSongScore(i, v)} compact />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
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
              onClick={() => {
                finish();
                setStep('reveal');
              }}
              className="relative mt-6 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 py-4 font-bold shadow-xl shadow-fuchsia-950/40 active:scale-[.99]"
            >
              <span className="relative">算算这张专辑多少分 →</span>
              <i className="shine absolute inset-0" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 text-center"
          >
            <p className="text-[10px] font-bold tracking-[.22em] text-fuchsia-200">ALBUM SCORE</p>
            <div className="mt-6 flex items-center justify-center">
              <RevealScore value={avg} />
            </div>
            <p className="mt-3 text-sm font-bold text-fuchsia-100">{scoreLabel(avg)}</p>
            <p className="mt-2 text-xs text-white/45">
              由 {songs.length} 首曲目平均得出
            </p>

            <div className="mt-8 space-y-2.5 text-left">
              <div className="flex items-center justify-between rounded-xl bg-white/[.05] px-4 py-3">
                <span className="text-xs text-white/50">最高分曲目</span>
                <span className="text-sm font-bold text-white">{songs[bestIndex]?.title}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white/[.05] px-4 py-3">
                <span className="text-xs text-white/50">最低分曲目</span>
                <span className="text-sm font-bold text-white">{songs[worstIndex]?.title}</span>
              </div>
            </div>

            <button
              onClick={() => router.push('/co/result')}
              className="relative mt-8 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 py-4 font-bold shadow-xl shadow-fuchsia-950/40 active:scale-[.99]"
            >
              <span className="relative">查看完整评分卡 →</span>
              <i className="shine absolute inset-0" />
            </button>

            <button onClick={() => setStep('tracks')} className="mt-3 w-full text-xs text-white/35">
              ← 回去改分数
            </button>
          </motion.div>
        )}
      </div>
    </main>
  );
}
