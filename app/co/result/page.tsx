'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import AlbumCover from '@/components/AlbumCover';
import { useCoStore } from '@/store/useCoStore';
import { useMounted } from '@/lib/useMounted';
import { analyze, encodeRoom } from '@/lib/co';
import { artistName } from '@/lib/musicProvider';
import type { CoPerson } from '@/lib/types';

export default function CoResult() {
  const router = useRouter();
  const mounted = useMounted();
  const { songs, name, scores, people, artistId, reset } = useCoStore();

  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');

  const me: CoPerson = useMemo(() => ({ n: name || '我', s: scores }), [name, scores]);
  // 同名视为同一个人，后打的覆盖先打的
  const all = useMemo(() => [...people.filter((p) => p.n !== me.n), me], [people, me]);
  const result = useMemo(() => analyze(songs, all), [songs, all]);

  const share = useCallback(async () => {
    const el = document.getElementById('co-share-card');
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

  const copyLink = useCallback(async () => {
    const link = `${location.origin}/co?c=${encodeRoom({
      v: 1,
      artistId,
      songs: songs.map((s) => s.id),
      people: all,
    })}`;
    try {
      await navigator.clipboard.writeText(link);
      setToast(all.length > 1 ? '接力链接已复制，转发给下一个人' : '邀请链接已复制，发给朋友打分');
    } catch {
      const input = document.createElement('textarea');
      input.value = link;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
      setToast('链接已复制，发给朋友打分');
    }
  }, [artistId, songs, all]);

  if (!mounted) return <main className="min-h-screen" />;

  if (!songs.length || scores.every((s) => s === 0)) {
    return (
      <main className="mx-auto min-h-screen max-w-[430px] p-6">
        <div className="mt-32 text-center">
          <p className="text-fuchsia-200">还没有你的评分</p>
          <Link href="/co" className="mt-6 inline-block rounded-2xl bg-white px-6 py-3 font-bold text-slate-900">
            去打分
          </Link>
        </div>
      </main>
    );
  }

  const top3 = result.ranking.slice(0, 3);
  const songById = new Map(songs.map((s) => [s.id, s]));
  const artist = artistName(artistId);

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

      <p className="text-xs tracking-[.3em] text-fuchsia-200">CO-CREATE RESULT</p>

      {/* 分享卡 */}
      <div
        id="co-share-card"
        className="mt-5 rounded-[2rem] bg-gradient-to-br from-violet-700 via-fuchsia-800 to-slate-950 p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black leading-tight">我们的共创歌单</h1>
            <p className="mt-1.5 text-sm text-white/65">
              {artist} · {songs.length} 首 · {all.length} 人参与
            </p>
          </div>
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] text-white/70">
            CO
          </span>
        </div>

        {result.harmony !== undefined ? (
          <div className="mt-6 rounded-2xl bg-white/10 p-5 text-center">
            <div className="text-6xl font-black leading-none text-transparent bg-gradient-to-r from-fuchsia-200 via-pink-100 to-cyan-200 bg-clip-text">
              {result.harmony}
            </div>
            <p className="mt-2 text-base font-black text-white">{result.level}</p>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl bg-white/10 p-5 text-center text-sm text-white/70">
            等待好友加入后，这里会出现你们的默契度
          </div>
        )}

        <div className="mt-6 space-y-2">
          <p className="text-[10px] font-bold tracking-[.2em] text-fuchsia-200">TOP 3</p>
          {top3.map((r, i) => {
            const song = songById.get(r.songId);
            if (!song) return null;
            return (
              <div key={r.songId} className="flex items-center gap-2.5 rounded-xl bg-black/15 p-2">
                <span className="w-4 text-center text-sm font-black text-fuchsia-100">{i + 1}</span>
                <AlbumCover song={song} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm text-white/85">{song.title}</span>
                <span className="shrink-0 text-xs font-black text-cyan-100">{r.avg}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {all.map((p, i) => (
            <span key={`${p.n}-${i}`} className="rounded-full bg-white/15 px-3 py-1 text-xs">
              {p.n} · {result.roles[i]?.role ?? ''}
            </span>
          ))}
        </div>

        <p className="mt-6 text-center text-xs tracking-widest text-white/45">我选这首歌 · CO-CREATE</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          onClick={share}
          disabled={busy}
          className="rounded-2xl bg-white py-4 font-bold text-slate-900 disabled:opacity-60"
        >
          {busy ? '正在生成…' : '导出共创卡'}
        </button>
        <button onClick={copyLink} className="rounded-2xl border border-white/20 py-4 font-bold">
          {all.length > 1 ? '复制接力链接' : '邀请好友打分'}
        </button>
      </div>

      {result.biggestGap && (
        <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs tracking-[.2em] text-fuchsia-200">BIGGEST GAP</p>
          <h2 className="mt-2 text-xl font-black">吵得最凶的一首</h2>
          <div className="mt-3 flex items-center gap-3">
            <AlbumCover song={songById.get(result.biggestGap.songId)!} size="md" />
            <div className="min-w-0">
              <p className="truncate text-lg font-black">{songById.get(result.biggestGap.songId)?.title}</p>
              <p className="mt-1 text-xs leading-6 text-white/60">
                {result.biggestGap.high} 给了高分，{result.biggestGap.low} 完全不买账（差 {result.biggestGap.spread} 档）
              </p>
            </div>
          </div>
        </section>
      )}

      {result.resonance.length > 0 && (
        <section className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs tracking-[.2em] text-cyan-200">RESONANCE</p>
          <h2 className="mt-2 text-xl font-black">全员都爱的歌</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {result.resonance.map((id) => (
              <span key={id} className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80">
                {songById.get(id)?.title}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
        <p className="text-xs tracking-[.2em] text-fuchsia-200">FULL RANKING</p>
        <h2 className="mt-2 text-xl font-black">共创榜</h2>
        <div className="mt-4 space-y-2">
          {result.ranking.map((r, i) => {
            const song = songById.get(r.songId);
            if (!song) return null;
            return (
              <div key={r.songId} className="rounded-xl bg-black/15 p-3">
                <div className="flex items-center gap-2">
                  <span className="w-4 text-center text-xs font-black text-white/35">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-white/80">{song.title}</span>
                  <span className="shrink-0 text-sm font-black text-cyan-100">{r.avg}</span>
                </div>
                {all.length > 1 && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[9px] text-white/30">分歧</span>
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-rose-400"
                        style={{ width: `${(r.spread / 4) * 100}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-white/30">{r.spread} 档</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
        <p className="text-xs tracking-[.2em] text-cyan-200">ROLES</p>
        <h2 className="mt-2 text-xl font-black">每个人的定位</h2>
        <div className="mt-3 space-y-2">
          {result.roles.map((r) => (
            <div key={r.name} className="flex items-center justify-between rounded-xl bg-black/15 px-3 py-2">
              <span className="text-sm text-white/80">{r.name}</span>
              <span className="text-xs font-bold text-fuchsia-100">{r.role}</span>
              <span className="w-8 text-right text-xs text-white/40">{r.avg}</span>
            </div>
          ))}
        </div>
      </section>

      <button
        onClick={() => {
          reset();
          router.push('/co');
        }}
        className="mt-6 w-full text-sm text-white/55"
      >
        再开一个共创房间
      </button>

      <Link href="/" className="mt-3 block text-center text-sm text-white/40">
        返回首页
      </Link>

      {shareUrl && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/85 p-6"
          onClick={() => setShareUrl(null)}
        >
          <p className="text-sm text-white/70">长按图片保存到相册</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shareUrl} alt="我们的共创歌单" className="w-full max-w-[320px] rounded-2xl shadow-2xl" />
          <p className="text-xs text-white/40">点击任意处关闭</p>
        </div>
      )}
    </main>
  );
}
