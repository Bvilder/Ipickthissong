'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import AlbumCover from '@/components/AlbumCover';
import { useCoStore } from '@/store/useCoStore';
import { useMounted } from '@/lib/useMounted';
import { analyzeAlbum, encodeRoom, scoreLabel } from '@/lib/co';
import { reviewAlbum } from '@/lib/ai';
import { artistName } from '@/lib/musicProvider';
import type { AlbumVote } from '@/lib/co';
import type { Song } from '@/lib/types';

export default function CoResult() {
  const router = useRouter();
  const mounted = useMounted();
  const { songs, album, artistId, name, albumScore, scores, comment, people, reset } = useCoStore();

  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');

  const me: AlbumVote = useMemo(
    () => ({ n: name || '我', a: albumScore, s: scores, c: comment }),
    [name, albumScore, scores, comment]
  );
  const all = useMemo(() => [...people.filter((p) => p.n !== me.n), me], [people, me]);
  const result = useMemo(() => analyzeAlbum(songs, all), [songs, all]);

  const songById = useMemo(() => new Map(songs.map((s) => [s.id, s])), [songs]);
  const cover: Song | undefined = songs[0];

  const myVote = result.votes.find((v) => v.name === me.n);
  const aiReview = useMemo(
    () =>
      reviewAlbum({
        album,
        artist: artistName(artistId),
        year: cover?.year ?? 0,
        score: albumScore,
        best: myVote?.best,
        worst: myVote?.worst,
        trackCount: songs.length,
      }),
    [album, artistId, cover, albumScore, myVote, songs.length]
  );

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
      album,
      songs: songs.map((s) => s.id),
      people: all,
    })}`;
    try {
      await navigator.clipboard.writeText(link);
      setToast(all.length > 1 ? '接力链接已复制，转发给下一个人' : '邀请链接已复制，发给好友打分');
    } catch {
      const input = document.createElement('textarea');
      input.value = link;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
      setToast('链接已复制，发给好友打分');
    }
  }, [artistId, album, songs, all]);

  if (!mounted) return <main className="min-h-screen" />;

  if (!songs.length) {
    return (
      <main className="mx-auto min-h-screen max-w-[430px] p-6">
        <div className="mt-32 text-center">
          <p className="text-fuchsia-200">还没有你的评分</p>
          <Link href="/co" className="mt-6 inline-block rounded-2xl bg-white px-6 py-3 font-bold text-slate-900">
            去选专辑
          </Link>
        </div>
      </main>
    );
  }

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

      <p className="text-xs tracking-[.3em] text-fuchsia-200">ALBUM REVIEW</p>

      {/* 分享卡 */}
      <div
        id="co-share-card"
        className="mt-5 rounded-[2rem] bg-gradient-to-br from-violet-700 via-fuchsia-800 to-slate-950 p-6 shadow-2xl"
      >
        <div className="flex items-start gap-4">
          {cover && <AlbumCover song={cover} size="lg" />}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold tracking-[.2em] text-white/50">
              {artistName(artistId)} · {cover?.year}
            </p>
            <h1 className="mt-1.5 text-2xl font-black leading-tight">{album}</h1>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-5xl font-black leading-none tabular-nums text-white">
                {albumScore.toFixed(1)}
              </span>
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold text-fuchsia-100">
                {scoreLabel(albumScore)}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-white/55">{me.n} 的评分</p>
          </div>
        </div>

        {result.harmony !== undefined ? (
          <div className="mt-5 rounded-2xl bg-white/10 p-4 text-center">
            <div className="text-4xl font-black leading-none text-transparent bg-gradient-to-r from-fuchsia-200 via-pink-100 to-cyan-200 bg-clip-text">
              {result.harmony}
            </div>
            <p className="mt-1.5 text-sm font-black text-white">{result.level}</p>
            <p className="mt-1 text-[10px] text-white/50">{all.length} 人评分 · 平均 {result.avgAlbum}</p>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl bg-white/10 p-4 text-center text-xs text-white/65">
            等好友加入后，这里会出现你们的默契度
          </div>
        )}

        {myVote && (
          <div className="mt-4 space-y-1.5 text-[11px] text-white/70">
            {myVote.best && <p>最佳曲目 · {myVote.best}</p>}
            {myVote.worst && <p>最弱曲目 · {myVote.worst}</p>}
          </div>
        )}

        <p className="mt-5 border-l-2 border-fuchsia-200 pl-3 text-[11px] leading-6 text-white/80">
          {aiReview}
        </p>

        <p className="mt-5 text-center text-xs tracking-widest text-white/45">我选这首歌 · ALBUM REVIEW</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          onClick={share}
          disabled={busy}
          className="rounded-2xl bg-white py-4 font-bold text-slate-900 disabled:opacity-60"
        >
          {busy ? '正在生成…' : '导出评分卡'}
        </button>
        <button onClick={copyLink} className="rounded-2xl border border-white/20 py-4 font-bold">
          {all.length > 1 ? '复制接力链接' : '邀请好友打分'}
        </button>
      </div>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center gap-2">
          <span className="text-sm">🤖</span>
          <p className="text-xs tracking-[.2em] text-fuchsia-200">AI 乐评</p>
        </div>
        <p className="mt-3 text-sm leading-7 text-white/80">{aiReview}</p>
      </section>

      {result.biggestGap && (
        <section className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs tracking-[.2em] text-fuchsia-200">BIGGEST GAP</p>
          <h2 className="mt-2 text-xl font-black">吵得最凶的一首</h2>
          <div className="mt-3 flex items-center gap-3">
            {songById.get(result.biggestGap.songId) && (
              <AlbumCover song={songById.get(result.biggestGap.songId)!} size="md" />
            )}
            <div className="min-w-0">
              <p className="truncate text-lg font-black">
                {songById.get(result.biggestGap.songId)?.title}
              </p>
              <p className="mt-1 text-xs leading-6 text-white/60">
                {result.biggestGap.high} 给了高分，{result.biggestGap.low} 完全不买账（差{' '}
                {result.biggestGap.spread.toFixed(1)} 分）
              </p>
            </div>
          </div>
        </section>
      )}

      {result.mostAgreed && (
        <section className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs tracking-[.2em] text-cyan-200">MOST AGREED</p>
          <h2 className="mt-2 text-xl font-black">难得一致的一首</h2>
          <p className="mt-2 text-sm text-white/70">
            《{songById.get(result.mostAgreed.songId)?.title}》· 平均 {result.mostAgreed.avg} 分
          </p>
        </section>
      )}

      <section className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
        <p className="text-xs tracking-[.2em] text-cyan-200">TRACK SCORES</p>
        <h2 className="mt-2 text-xl font-black">逐首成绩单</h2>
        <div className="mt-4 space-y-2">
          {result.tracks.map((t) => {
            const song = songById.get(t.songId);
            if (!song) return null;
            return (
              <div key={t.songId} className="rounded-xl bg-black/15 p-3">
                <div className="flex items-center gap-2">
                  <AlbumCover song={song} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm text-white/80">{song.title}</span>
                  <span className="shrink-0 text-sm font-black text-cyan-100">{t.avg.toFixed(1)}</span>
                </div>
                {all.length > 1 && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[9px] text-white/30">分歧</span>
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-rose-400"
                        style={{ width: `${(t.spread / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-white/30">{t.spread.toFixed(1)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
        <p className="text-xs tracking-[.2em] text-fuchsia-200">REVIEWERS</p>
        <h2 className="mt-2 text-xl font-black">每个人的结论</h2>
        <div className="mt-3 space-y-2">
          {result.votes.map((v) => (
            <div key={v.name} className="rounded-xl bg-black/15 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">{v.name}</span>
                <span className="text-lg font-black text-fuchsia-100">{v.album.toFixed(1)}</span>
              </div>
              <p className="mt-1 text-[10px] leading-5 text-white/45">
                曲目均分 {v.avg} · 最佳《{v.best}》· 最弱《{v.worst}》
              </p>
              {v.comment && <p className="mt-2 text-xs leading-6 text-white/70">「{v.comment}」</p>}
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
        再评一张专辑
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
          <img src={shareUrl} alt="我的专辑评分卡" className="w-full max-w-[320px] rounded-2xl shadow-2xl" />
          <p className="text-xs text-white/40">点击任意处关闭</p>
        </div>
      )}
    </main>
  );
}
