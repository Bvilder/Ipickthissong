'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import AlbumCover from '@/components/AlbumCover';
import ArtistSelector from '@/components/ArtistSelector';
import { getPopularSongs, DEFAULT_ARTIST } from '@/lib/musicProvider';
import { useGameStore } from '@/store/useGameStore';

const TARGET = 32;

export default function Select() {
  const router = useRouter();
  const start = useGameStore((s) => s.start);
  const [artistId, setArtistId] = useState(DEFAULT_ARTIST);
  const songs = useMemo(() => getPopularSongs(artistId), [artistId]);

  const [selected, setSelected] = useState<string[]>(() => songs.slice(0, TARGET).map((s) => s.id));
  const [hint, setHint] = useState('');

  // 换歌手 = 换曲库，重选一次
  const switchArtist = (id: string) => {
    setArtistId(id);
    setSelected(getPopularSongs(id).slice(0, TARGET).map((s) => s.id));
    setHint('');
  };

  useEffect(() => {
    if (!hint) return;
    const t = setTimeout(() => setHint(''), 2200);
    return () => clearTimeout(t);
  }, [hint]);

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((x) => x !== id));
      return;
    }
    if (selected.length < TARGET) {
      setSelected([...selected, id]);
      return;
    }
    // 已选满：自动替换掉最早选中的一首，保证每次点击都有反馈
    const removed = songs.find((s) => s.id === selected[0]);
    setSelected([...selected.slice(1), id]);
    setHint(`已满 32 首，替换掉最早选的《${removed?.title ?? ''}》`);
  };

  const randomize = () =>
    setSelected([...songs].sort(() => Math.random() - 0.5).slice(0, TARGET).map((s) => s.id));

  const clearAll = () => setSelected([]);
  const fillTop = () => setSelected(songs.slice(0, TARGET).map((s) => s.id));

  const begin = () => {
    if (selected.length !== TARGET) return;
    const picked = songs.filter((s) => selected.includes(s.id));
    start(picked);
    router.push('/play');
  };

  return (
    <main className="grain relative mx-auto min-h-screen max-w-[430px] overflow-hidden px-5 py-8 safe-bottom">
      <i className="aurora -left-24 -top-24 h-56 w-56 bg-violet-600" />

      <div className="relative">
        <Link href="/" className="text-xs text-white/45">
          ← 返回玩法选择
        </Link>

        <h1 className="mt-5 text-3xl font-black leading-tight">选择你的 32 强</h1>
        <p className="mt-2 text-sm leading-6 text-white/55">
          从曲库里挑出 32 首进入淘汰赛。越靠前的歌越主流，会影响你最后的「冷门挖掘」分数。
        </p>

        <div className="mt-5">
          <ArtistSelector value={artistId} onChange={switchArtist} />
        </div>

        <section className="mt-6 rounded-[1.8rem] border border-white/12 bg-white/[.055] p-5 shadow-2xl shadow-black/20 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-[.2em] text-cyan-200">YOUR STARTING 32</p>
              <p className="mt-1 text-xs text-white/50">
                已选 <b className="text-white">{selected.length}</b> / {TARGET} 首
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={randomize}
                className="rounded-xl border border-fuchsia-200/25 bg-fuchsia-500/80 px-3 py-2 text-xs font-bold shadow-lg shadow-fuchsia-900/30"
              >
                随机换一批
              </button>
              <button
                onClick={selected.length ? clearAll : fillTop}
                className="rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-xs text-white/70"
              >
                {selected.length ? '清空' : '恢复默认'}
              </button>
            </div>
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 to-cyan-300"
              animate={{ width: `${(selected.length / TARGET) * 100}%` }}
            />
          </div>

          <div className="mt-5 space-y-2">
            {songs.map((song, i) => {
              const on = selected.includes(song.id);
              return (
                <button
                  onClick={() => toggle(song.id)}
                  key={song.id}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition ${
                    on
                      ? 'border-fuchsia-300/60 bg-fuchsia-400/12 shadow-sm shadow-fuchsia-800/20'
                      : 'border-white/8 bg-black/10'
                  }`}
                >
                  <span className="w-4 shrink-0 text-center text-[10px] font-black text-white/25">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <AlbumCover song={song} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm font-bold ${on ? 'text-white' : 'text-white/45'}`}>
                      {song.title}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-white/35">
                      {song.album} · {song.year}
                    </span>
                  </span>
                  <span className={`shrink-0 text-sm ${on ? 'text-fuchsia-200' : 'text-white/15'}`}>
                    {on ? '✓' : '＋'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <button
          disabled={selected.length !== TARGET}
          onClick={begin}
          className="relative mt-5 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 py-4 font-bold shadow-xl shadow-fuchsia-950/40 transition active:scale-[.99] disabled:opacity-30"
        >
          <span className="relative">
            {selected.length === TARGET
              ? '开启我的 32 强淘汰赛'
              : `还需选择 ${TARGET - selected.length} 首`}{' '}
            <b className="ml-1">→</b>
          </span>
          <i className="shine absolute inset-0" />
        </button>

        {hint && (
          <p className="mt-3 text-center text-xs text-fuchsia-200">{hint}</p>
        )}
      </div>
    </main>
  );
}
