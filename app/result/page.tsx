'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import RadarChart from '@/components/RadarChart';
import BracketChart from '@/components/BracketChart';
import { useGameStore } from '@/store/useGameStore';
import { useMounted } from '@/lib/useMounted';
import { encodeChallenge, choicesToPicks } from '@/lib/challenge';
import { generatePersonality } from '@/lib/personality';
import type { ChallengePayload, PersonalityResult } from '@/lib/types';

export default function Result() {
  const router = useRouter();
  const mounted = useMounted();
  const { winner, reset, songs, choices, challenge, artist } = useGameStore();
  const artistLabel = artist || '未知歌手';

  const [data, setData] = useState<PersonalityResult | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!winner || !songs.length) return;
    let alive = true;

    const local = generatePersonality({ artist: artistLabel, songs, choices, winnerId: winner.id });

    fetch('/api/generate-personality', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artist: artistLabel,
        songs: songs.map((s) => s.id),
        choices,
        winnerId: winner.id,
      }),
    })
      .then((r) => r.json())
      .then((res: PersonalityResult) => {
        if (alive && res?.dimensions?.length) setData(res);
      })
      .catch(() => {
        if (alive) setData(local);
      });

    return () => {
      alive = false;
    };
  }, [winner, songs, choices]);

  const share = useCallback(async () => {
    const el = document.getElementById('share-card');
    if (!el) return;
    setBusy(true);
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      await new Promise((r) => setTimeout(r, 150));
      const url = await toPng(el, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#120a24',
      });
      setShareUrl(url);
    } catch {
      setToast('导出失败，可以直接长按下方卡片保存');
    } finally {
      setBusy(false);
    }
  }, []);

  const copyChallenge = useCallback(async () => {
    if (!winner) return;
    const payload: ChallengePayload = {
      v: 1,
      artist: artistLabel,
      songs: songs.map((s) => s.id),
      picks: choicesToPicks(songs, choices),
      winner: songs.findIndex((s) => s.id === winner.id),
      tags: data?.tags ?? [],
    };
    const link = `${location.origin}/?c=${encodeChallenge(payload)}`;
    try {
      await navigator.clipboard.writeText(link);
      setToast('挑战链接已复制，发给朋友一起选');
    } catch {
      const input = document.createElement('textarea');
      input.value = link;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
      setToast('挑战链接已复制，发给朋友一起选');
    }
  }, [winner, songs, choices, data]);

  if (!mounted) return <main className="min-h-screen" />;

  if (!winner) {
    return (
      <main className="mx-auto min-h-screen max-w-[430px] p-6">
        <div className="mt-32 text-center">
          <p className="text-fuchsia-200">还没有你的结果</p>
          <p className="mt-3 text-sm text-white/55">先完成一局 32 强淘汰赛，才能生成人格卡。</p>
          <Link
            href="/select"
            className="mt-7 inline-block rounded-2xl bg-white px-6 py-3 font-bold text-slate-900"
          >
            去选歌
          </Link>
        </div>
      </main>
    );
  }

  const result = data ?? generatePersonality({ artist: artistLabel, songs, choices, winnerId: winner.id });
  const maxDim = [...result.dimensions].sort((a, b) => b.score - a.score)[0];

  return (
    <main className="mx-auto min-h-screen max-w-[430px] px-5 py-8 safe-bottom">
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-x-5 top-5 z-50 mx-auto max-w-[400px] rounded-2xl border border-white/15 bg-slate-900/95 px-4 py-3 text-center text-sm shadow-xl"
          onClick={() => setToast('')}
        >
          {toast}
        </motion.div>
      )}

      <p className="text-xs tracking-[.3em] text-fuchsia-200">YOUR MUSIC PERSONA</p>

      {/* 分享卡：导出图片时截取这一块 */}
      <div
        id="share-card"
        className="mt-5 rounded-[2rem] bg-gradient-to-br from-fuchsia-700 via-violet-800 to-slate-950 p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-white/65">你的{artistLabel}冠军单曲</p>
            <h1 className="mt-2 text-4xl font-black leading-tight">{winner.title}</h1>
            <p className="mt-2 text-white/65">
              {winner.album} · {winner.year} 年
              {winner.cover ? ' · 翻唱/现场版' : ''}
            </p>
          </div>
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] text-white/70">
            {result.source === 'llm' ? 'AI 生成' : '人格引擎'}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {result.tags.map((t) => (
            <span className="rounded-full bg-white/15 px-3 py-1 text-sm" key={t}>
              #{t}
            </span>
          ))}
        </div>

        <p className="mt-6 border-l-2 border-fuchsia-200 pl-4 leading-7 text-white/85">{result.verdict}</p>

        <div className="mt-6">
          <RadarChart dimensions={result.dimensions} />
        </div>

        <p className="mt-6 text-center text-xs tracking-widest text-white/45">我选这首歌 · MUSIC PERSONA</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          onClick={share}
          disabled={busy}
          className="rounded-2xl bg-white py-4 font-bold text-slate-900 disabled:opacity-60"
        >
          {busy ? '正在生成…' : '导出人格卡'}
        </button>
        <button onClick={copyChallenge} className="rounded-2xl border border-white/20 py-4 font-bold">
          复制挑战链接
        </button>
      </div>

      {challenge && (
        <Link
          href={`/challenge?c=${challenge}`}
          className="mt-3 block rounded-2xl border border-cyan-200/30 bg-cyan-300/10 py-4 text-center font-bold text-cyan-100"
        >
          查看我与 TA 的默契度 →
        </Link>
      )}

      {result.highlights.length > 0 && (
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs tracking-[.2em] text-fuchsia-200">YOUR 31 CHOICES</p>
          <h2 className="mt-2 text-xl font-black">这局里属于你的瞬间</h2>
          <ul className="mt-4 space-y-3">
            {result.highlights.map((h) => (
              <li key={h} className="flex gap-2 text-sm leading-6 text-white/70">
                <span className="text-fuchsia-200">·</span>
                {h}
              </li>
            ))}
          </ul>
          {maxDim && (
            <p className="mt-4 rounded-xl bg-black/15 p-3 text-xs leading-6 text-white/55">
              最高维度：<b className="text-fuchsia-100">{maxDim.name}</b> —— {maxDim.desc}
            </p>
          )}
        </section>
      )}

      {result.reasons.length > 0 && (
        <section className="mt-6 rounded-3xl border border-fuchsia-200/20 bg-fuchsia-400/[.07] p-5">
          <div className="flex items-center gap-2">
            <span className="text-sm">🔍</span>
            <p className="text-xs tracking-[.2em] text-fuchsia-200">WHY THIS SCORE</p>
          </div>
          <h2 className="mt-2 text-xl font-black">AI 为什么这么判</h2>
          <div className="mt-4 space-y-3">
            {result.reasons.map((r) => (
              <div key={r.dimension} className="rounded-xl bg-black/20 p-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-white">{r.dimension}</span>
                  <span className="text-base font-black text-fuchsia-100">{r.score}</span>
                </div>
                <p className="mt-1 text-xs leading-6 text-white/55">{r.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] leading-5 text-white/30">
            分数由你的 31 次选择实时计算，每一次「留下 / 送走」都会改变结果。
          </p>
        </section>
      )}

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
        <p className="text-xs tracking-[.2em] text-fuchsia-200">CHAMPION STORY</p>
        <h2 className="mt-2 text-2xl font-bold">关于《{winner.title}》</h2>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-black/15 p-3">
            <dt className="text-white/40">发行年份</dt>
            <dd className="mt-1">{winner.year} 年</dd>
          </div>
          <div className="rounded-xl bg-black/15 p-3">
            <dt className="text-white/40">收录专辑</dt>
            <dd className="mt-1 truncate">{winner.album}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm leading-7 text-white/70">
          {winner.story ||
            `这首歌在${artistLabel}的作品谱系里留下了独特的情绪坐标。它被不同的人听见，也在不同的时刻成为各自的答案。`}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {winner.links?.map((x) => (
            <a
              key={x.label}
              href={x.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/15 p-3 text-center text-xs text-fuchsia-100"
            >
              {x.label} ↗
            </a>
          ))}
        </div>
      </section>

      <div className="mt-8">
        <BracketChart songs={songs} choices={choices} winner={winner} />
      </div>

      <button
        onClick={() => {
          reset();
          router.push('/select');
        }}
        className="mt-5 w-full text-sm text-white/55"
      >
        再玩一次
      </button>

      <Link href="/challenge" className="mt-3 block text-center text-sm text-fuchsia-200">
        查看好友挑战说明 →
      </Link>

      {shareUrl && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/85 p-6"
          onClick={() => setShareUrl(null)}
        >
          <p className="text-sm text-white/70">长按图片保存到相册</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shareUrl} alt="我的音乐人格卡" className="w-full max-w-[320px] rounded-2xl shadow-2xl" />
          <p className="text-xs text-white/40">点击任意处关闭</p>
        </div>
      )}
    </main>
  );
}
