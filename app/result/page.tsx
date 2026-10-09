'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import RadarChart from '@/components/RadarChart';
import BracketChart from '@/components/BracketChart';
import MusicDna from '@/components/MusicDna';
import AlbumCover from '@/components/AlbumCover';
import PlayMore from '@/components/PlayMore';
import { useGameStore } from '@/store/useGameStore';
import { useMounted } from '@/lib/useMounted';
import { encodeChallenge, choicesToPicks } from '@/lib/challenge';
import { generatePersonality } from '@/lib/personality';
import { personaIdentity, personaReport, recommendNext } from '@/lib/ai';
import { getAllSongs } from '@/lib/musicProvider';
import { idsOfTags } from '@/lib/personas';
import { useProfileStore } from '@/store/useProfileStore';
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
  }, [winner, songs, choices, artistLabel]);

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
  }, [winner, songs, choices, data, artistLabel]);

  const result = useMemo(() => {
    if (!winner) return null;
    return data ?? generatePersonality({ artist: artistLabel, songs, choices, winnerId: winner.id });
  }, [data, winner, artistLabel, songs, choices]);

  const unlock = useProfileStore((s) => s.unlock);
  const markBracket = useProfileStore((s) => s.markBracket);

  useEffect(() => {
    if (!result) return;
    unlock(idsOfTags(result.tags));
    markBracket();
  }, [result, unlock, markBracket]);

  if (!mounted) return <main className="min-h-screen" />;

  if (!winner || !result) {
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

  const maxDim = [...result.dimensions].sort((a, b) => b.score - a.score)[0];
  const identity = personaIdentity(result);

  const mvUrl = `https://y.qq.com/portal/search.html#page=1&searchid=1&remoteplace=txt.yqq.top&t=mv&w=${encodeURIComponent(
    `${artistLabel} ${winner.title}`
  )}`;
  const liveUrl = `https://y.qq.com/portal/search.html#page=1&searchid=1&remoteplace=txt.yqq.top&t=video&w=${encodeURIComponent(
    `${artistLabel} ${winner.title} 现场`
  )}`;

  const report = useMemo(
    () => (result && winner ? personaReport({ artist: artistLabel, champion: winner, result }) : ''),
    [result, winner, artistLabel]
  );
  const library = useMemo(() => getAllSongs().filter((s) => s.artist === artistLabel), [artistLabel]);
  const recs = useMemo(
    () => (result ? recommendNext({ library, pickedIds: songs.map((s) => s.id), result }) : []),
    [library, songs, result]
  );

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
        className="mt-5 overflow-hidden rounded-[2rem] bg-gradient-to-br from-fuchsia-700 via-violet-800 to-slate-950 shadow-2xl"
      >
        {/* 人格识别头 */}
        <div className="relative px-6 pb-2 pt-8">
          <div className="pointer-events-none absolute -top-16 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-fuchsia-400/30 blur-3xl" />

          <div className="relative text-center">
            <div className="flex items-center justify-center gap-2 text-[10px] tracking-[.3em] text-fuchsia-200/80">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
              AI 人格识别完成
            </div>

            <div className="mx-auto mt-5 flex h-24 w-24 items-center justify-center rounded-[1.75rem] border border-white/15 bg-white/10 text-5xl shadow-inner">
              {identity.icon}
            </div>

            <h1 className="mt-5 bg-gradient-to-r from-amber-100 via-fuchsia-100 to-cyan-200 bg-clip-text text-[2.6rem] font-black leading-tight text-transparent">
              {identity.name}
            </h1>
            {identity.sub && (
              <p className="mt-1 text-lg font-bold text-white/70">× {identity.sub}</p>
            )}

            <p className="mt-3 font-mono text-[10px] tracking-[.25em] text-white/45">
              {identity.en.toUpperCase()} · {identity.id}
            </p>

            <p className="mt-4 text-base text-white/90">「{identity.slogan}」</p>
          </div>
        </div>

        {/* 分隔线 */}
        <div className="mx-6 my-6 h-px bg-white/10" />

        {/* 冠军 + 标签 + 判词 + 雷达图 */}
        <div className="px-6 pb-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-white/55">你的{artistLabel}冠军单曲</p>
              <h2 className="mt-1 text-2xl font-black leading-tight">{winner.title}</h2>
              <p className="mt-1 text-xs text-white/60">
                {winner.album} · {winner.year} 年
                {winner.cover ? ' · 翻唱/现场版' : ''}
              </p>
            </div>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] text-white/70">
              {result.source === 'llm' ? 'AI 生成' : '人格引擎'}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {result.tags.map((t) => (
              <span className="rounded-full bg-white/15 px-3 py-1 text-sm" key={t}>
                #{t}
              </span>
            ))}
          </div>

          <p className="mt-5 border-l-2 border-fuchsia-200 pl-4 leading-7 text-white/85">{result.verdict}</p>

          <div className="mt-6">
            <RadarChart dimensions={result.dimensions} />
          </div>

          <p className="mt-6 text-center text-xs tracking-widest text-white/45">我选这首歌 · MUSIC PERSONA</p>
        </div>
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

      <section className="mt-6 rounded-3xl border border-white/10 bg-gradient-to-br from-fuchsia-500/[.08] to-cyan-500/[.06] p-5">
        <div className="flex items-center gap-2">
          <span className="text-sm">🧬</span>
          <p className="text-xs tracking-[.2em] text-fuchsia-200">MUSIC DNA</p>
        </div>
        <h2 className="mt-2 text-xl font-black">AI 解码你的音乐基因</h2>
        <div className="mt-4">
          <MusicDna dimensions={result.dimensions} />
        </div>
      </section>

      {report && (
        <section className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2">
            <span className="text-sm">🤖</span>
            <p className="text-xs tracking-[.2em] text-cyan-200">AI PERSONA REPORT</p>
            <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[9px] text-white/50">
              {result.source === 'llm' ? '混元生成' : '人格引擎'}
            </span>
          </div>
          <h2 className="mt-2 text-xl font-black">AI 人格报告</h2>
          <p className="mt-3 text-sm leading-7 text-white/75">{report}</p>
        </section>
      )}

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

      <section className="mt-6 rounded-3xl border border-amber-200/25 bg-gradient-to-br from-amber-400/12 to-rose-500/10 p-5">
        <p className="text-xs tracking-[.2em] text-amber-100">REBELLION</p>
        <div className="mt-3 flex items-end gap-3">
          <span className="text-6xl font-black leading-none tabular-nums text-white">
            {result.rebellion}
          </span>
          <span className="pb-1.5 text-sm text-white/60">% 反叛度</span>
        </div>
        <p className="mt-3 text-xs leading-6 text-white/60">
          {result.rebellion >= 70
            ? '你经常站在大众对面。热门榜单对你没什么约束力。'
            : result.rebellion >= 45
              ? '你一半跟随、一半反骨，听得懂流行，也留得住冷门。'
              : '你的选择和大多数听众高度一致——你是那个会被榜单代表的人。'}
        </p>
      </section>

      {result.hesitation && (
        <section className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs tracking-[.2em] text-cyan-200">HESITATION</p>
          <h2 className="mt-2 text-xl font-black">你犹豫最久的一次</h2>
          <p className="mt-3 text-sm leading-7 text-white/70">
            在《{result.hesitation.winner}》和《{result.hesitation.loser}》之间，你停了{' '}
            <b className="text-fuchsia-100">{result.hesitation.seconds} 秒</b>
            ——全场最艰难的一次决定。
          </p>
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

      <section className="mt-6 rounded-3xl border border-cyan-200/20 bg-cyan-300/[.06] p-5">
        <div className="flex items-center gap-2">
          <span className="text-sm">🎬</span>
          <p className="text-xs tracking-[.2em] text-cyan-200">WATCH ON QQ MUSIC</p>
        </div>
        <h2 className="mt-2 text-xl font-black">光听还不够</h2>
        <p className="mt-2 text-sm leading-7 text-white/70">
          冠军《{winner.title}》画面感很强，AI 建议你顺便看看它的
          <b className="text-cyan-100"> MV </b>或<b className="text-cyan-100"> 舞台现场</b>。
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <a
            href={mvUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-white/15 py-3 text-center text-sm font-bold text-cyan-100"
          >
            看 MV ↗
          </a>
          <a
            href={liveUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-white/15 py-3 text-center text-sm font-bold text-cyan-100"
          >
            看舞台 ↗
          </a>
        </div>
      </section>

      {recs.length > 0 && (
        <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2">
            <span className="text-sm">🎧</span>
            <p className="text-xs tracking-[.2em] text-fuchsia-200">AI NEXT UP</p>
          </div>
          <h2 className="mt-2 text-xl font-black">AI 为你续杯</h2>
          <p className="mt-1 text-xs text-white/45">按你的人格，这些歌大概率会击中你</p>
          <div className="mt-4 space-y-2">
            {recs.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-xl bg-black/15 p-2.5">
                <AlbumCover song={s} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white/85">{s.title}</p>
                  <p className="truncate text-[10px] text-white/40">
                    {s.album} · {s.year}
                  </p>
                </div>
                <span className="shrink-0 max-w-[40%] truncate text-[10px] text-fuchsia-200/80">
                  {s.tags.slice(0, 2).join(' · ')}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

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

      <PlayMore active="bracket" />

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
