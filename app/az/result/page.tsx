'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import AlphabetBoard from '@/components/AlphabetBoard';
import RadarChart from '@/components/RadarChart';
import PlayMore from '@/components/PlayMore';
import { useAzStore } from '@/store/useAzStore';
import { useMounted } from '@/lib/useMounted';
import { generatePersonality } from '@/lib/personality';
import { interpretAlphabet, personaIdentity } from '@/lib/ai';
import { idsOfTags } from '@/lib/personas';
import { useProfileStore } from '@/store/useProfileStore';
import type { PersonalityResult } from '@/lib/types';

export default function AzResult() {
  const router = useRouter();
  const mounted = useMounted();
  const { picks, choices, library, letters, reset } = useAzStore();
  const artistLabel = library[0]?.artist ?? '未知歌手';

  const [data, setData] = useState<PersonalityResult | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');

  const letterCount = letters.filter((l) => l !== '#').length;

  useEffect(() => {
    if (!library.length || Object.keys(picks).length === 0) return;
    let alive = true;

    fetch('/api/generate-personality', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artist: artistLabel,
        songs: library.map((s) => s.id),
        choices,
        mode: 'az',
        letterCount,
      }),
    })
      .then((r) => r.json())
      .then((res: PersonalityResult) => {
        if (alive && res?.dimensions?.length) setData(res);
      })
      .catch(() => {
        if (alive) setData(null);
      });

    return () => {
      alive = false;
    };
  }, [library, choices, picks, letterCount, artistLabel]);

  const share = useCallback(async () => {
    const el = document.getElementById('az-share-card');
    if (!el) return;
    setBusy(true);
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      await new Promise((r) => setTimeout(r, 150));
      const url = await toPng(el, { pixelRatio: 2, cacheBust: true, backgroundColor: '#120a24' });
      setShareUrl(url);
    } catch {
      setToast('导出失败，可以直接长按下方卡片保存');
    } finally {
      setBusy(false);
    }
  }, []);

  const result = useMemo(
    () =>
      data ??
      generatePersonality({
        artist: artistLabel,
        songs: library,
        choices,
        mode: 'az',
        letterCount,
      }),
    [data, artistLabel, library, choices, letterCount]
  );

  const unlock = useProfileStore((s) => s.unlock);
  const markAz = useProfileStore((s) => s.markAz);

  useEffect(() => {
    if (!result) return;
    unlock(idsOfTags(result.tags));
    markAz();
  }, [result, unlock, markAz]);

  if (!mounted) return <main className="min-h-screen" />;

  if (Object.keys(picks).length === 0 || !result) {
    return (
      <main className="mx-auto min-h-screen max-w-[430px] p-6">
        <div className="mt-32 text-center">
          <p className="text-cyan-200">字母表还是空的</p>
          <p className="mt-3 text-sm text-white/55">先完成一轮 A-Z 挑战，才能生成字母表人格卡。</p>
          <Link href="/az" className="mt-7 inline-block rounded-2xl bg-white px-6 py-3 font-bold text-slate-900">
            去填字母表
          </Link>
        </div>
      </main>
    );
  }

  const { story, badges } = interpretAlphabet(picks, library);
  const identity = personaIdentity(result);
  const pickedSongs = Object.values(picks)
    .map((id) => library.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));
  const years = pickedSongs.map((s) => s.year);
  const yearSpan = years.length ? Math.max(...years) - Math.min(...years) : 0;
  const albums = new Set(pickedSongs.map((s) => s.album)).size;

  return (
    <main className="mx-auto min-h-screen max-w-[430px] px-5 py-8 safe-bottom">
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setToast('')}
          className="fixed inset-x-5 top-5 z-50 mx-auto max-w-[400px] rounded-2xl border border-white/15 bg-slate-900/95 px-4 py-3 text-center text-sm shadow-xl"
        >
          {toast}
        </motion.div>
      )}

      <p className="text-xs tracking-[.3em] text-cyan-200">MY A-Z MUSIC ALPHABET</p>

      {/* 分享卡 */}
      <div
        id="az-share-card"
        className="mt-5 rounded-[2rem] bg-gradient-to-br from-cyan-700 via-violet-800 to-slate-950 p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-sm font-bold text-fuchsia-200">
              <span>{identity.icon}</span>
              <span>{identity.name}</span>
              {identity.sub && <span className="text-white/50">× {identity.sub}</span>}
            </div>
            <h1 className="mt-2 text-3xl font-black leading-tight">我的音乐字母表</h1>
            <p className="mt-1.5 text-sm text-white/65">
              {letterCount} 个字母 · {Object.keys(picks).length} 首歌 · 来自 {library.length} 首歌单
            </p>
          </div>
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] text-white/70">
            A-Z
          </span>
        </div>

        <div className="mt-6">
          <AlphabetBoard picks={picks} songs={library} compact />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {result.tags.map((t) => (
            <span key={t} className="rounded-full bg-white/15 px-3 py-1 text-sm">
              #{t}
            </span>
          ))}
        </div>

        <p className="mt-6 border-l-2 border-cyan-200 pl-4 leading-7 text-white/85">{result.verdict}</p>

        {story && (
          <p className="mt-4 rounded-xl bg-black/20 p-3 text-[11px] leading-6 text-white/70">{story}</p>
        )}

        <div className="mt-6">
          <RadarChart dimensions={result.dimensions} />
        </div>

        <p className="mt-6 text-center text-xs tracking-widest text-white/45">我选这首歌 · A-Z CHALLENGE</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          onClick={share}
          disabled={busy}
          className="rounded-2xl bg-white py-4 font-bold text-slate-900 disabled:opacity-60"
        >
          {busy ? '正在生成…' : '导出字母表'}
        </button>
        <button
          onClick={() => {
            reset();
            router.push('/az');
          }}
          className="rounded-2xl border border-white/20 py-4 font-bold"
        >
          再填一次
        </button>
      </div>

      {badges.length > 0 && (
        <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs tracking-[.2em] text-cyan-200">ACHIEVEMENTS</p>
          <h2 className="mt-2 text-xl font-black">你的字母表成就</h2>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {badges.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-fuchsia-200/25 bg-gradient-to-br from-fuchsia-500/15 to-cyan-400/10 p-3"
              >
                <p className="text-sm font-black text-white">{b.title}</p>
                <p className="mt-1 text-[10px] leading-4 text-white/55">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
        <p className="text-xs tracking-[.2em] text-cyan-200">ALPHABET STATS</p>
        <h2 className="mt-2 text-xl font-black">这张表的形状</h2>
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <div className="rounded-xl bg-black/20 p-3 text-center">
            <div className="text-xl font-black text-fuchsia-100">{letterCount}</div>
            <div className="mt-0.5 text-[10px] text-white/50">字母格</div>
          </div>
          <div className="rounded-xl bg-black/20 p-3 text-center">
            <div className="text-xl font-black text-cyan-100">{yearSpan}</div>
            <div className="mt-0.5 text-[10px] text-white/50">横跨年份</div>
          </div>
          <div className="rounded-xl bg-black/20 p-3 text-center">
            <div className="text-xl font-black text-white">{albums}</div>
            <div className="mt-0.5 text-[10px] text-white/50">来自专辑</div>
          </div>
        </div>
      </section>

      {result.highlights.length > 0 && (
        <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs tracking-[.2em] text-fuchsia-200">ALPHABET INSIGHT</p>
          <h2 className="mt-2 text-xl font-black">填表过程中的你</h2>
          <ul className="mt-4 space-y-3">
            {result.highlights.map((h) => (
              <li key={h} className="flex gap-2 text-sm leading-6 text-white/70">
                <span className="text-cyan-200">·</span>
                {h}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
        <p className="text-xs tracking-[.2em] text-cyan-200">YOUR PICKS</p>
        <h2 className="mt-2 text-xl font-black">每个字母的一首</h2>
        <div className="mt-4 space-y-2">
          {Object.entries(picks).map(([letter, songId]) => {
            const song = library.find((s) => s.id === songId);
            if (!song) return null;
            return (
              <div key={letter} className="flex items-center gap-3 rounded-xl bg-black/15 px-3 py-2">
                <span className="w-5 shrink-0 text-center text-sm font-black text-cyan-100">{letter}</span>
                <span className="flex-1 truncate text-sm text-white/80">{song.title}</span>
                <span className="shrink-0 text-[10px] text-white/35">{song.album}</span>
              </div>
            );
          })}
        </div>
      </section>

      <PlayMore active="az" />

      {shareUrl && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/85 p-6"
          onClick={() => setShareUrl(null)}
        >
          <p className="text-sm text-white/70">长按图片保存到相册</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shareUrl} alt="我的音乐字母表" className="w-full max-w-[320px] rounded-2xl shadow-2xl" />
          <p className="text-xs text-white/40">点击任意处关闭</p>
        </div>
      )}
    </main>
  );
}
