'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { motion } from 'framer-motion';
import ArtistSelector from '@/components/ArtistSelector';
import AlbumCover from '@/components/AlbumCover';
import { useCoStore } from '@/store/useCoStore';
import { useMounted } from '@/lib/useMounted';
import { getSongsByIds, getSongsByArtist, artistName, DEFAULT_ARTIST } from '@/lib/musicProvider';
import { CO_COUNT, decodeRoom, pickSongs } from '@/lib/co';

function CoHomeInner() {
  const router = useRouter();
  const mounted = useMounted();
  const params = useSearchParams();
  const code = params.get('c');
  const room = useMemo(() => decodeRoom(code), [code]);
  const setup = useCoStore((s) => s.setup);

  const [artistId, setArtistId] = useState(DEFAULT_ARTIST);
  const [name, setName] = useState('');
  const [seed, setSeed] = useState(0);

  const pool = useMemo(() => {
    const all = getSongsByArtist(artistId);
    return pickSongs(all, CO_COUNT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistId, seed]);

  if (!mounted) return <main className="min-h-screen" />;

  const goRate = () => {
    const songs = room ? getSongsByIds(room.songs) : pool;
    const finalName = name.trim() || `听众${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
    setup({
      artistId: room?.artistId ?? artistId,
      songs,
      name: finalName,
      people: room?.people ?? [],
    });
    router.push('/co/rate');
  };

  // 被邀请加入
  if (room) {
    const songs = getSongsByIds(room.songs);
    return (
      <main className="grain relative mx-auto min-h-screen max-w-[430px] overflow-hidden px-5 py-8 safe-bottom">
        <i className="aurora -left-24 top-10 h-56 w-56 bg-cyan-600" />
        <div className="relative">
          <Link href="/" className="text-xs text-white/45">
            ← 返回首页
          </Link>
          <p className="mt-8 text-[11px] font-bold tracking-[.25em] text-cyan-200">CO-CREATE</p>
          <h1 className="mt-2 text-4xl font-black leading-tight">有人邀请你共创歌单</h1>
          <p className="mt-4 text-sm leading-7 text-white/60">
            同一批 {songs.length} 首歌，各自打完分，系统会算出你们的默契度、共同主题曲，以及吵得最凶的那一首。
          </p>

          <section className="mt-6 rounded-[1.8rem] border border-white/12 bg-white/[.055] p-5">
            <p className="text-[10px] font-bold tracking-[.2em] text-fuchsia-200">ALREADY IN</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {room.people.map((p, i) => (
                <span key={`${p.n}-${i}`} className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80">
                  {p.n} 已打分
                </span>
              ))}
            </div>
            <div className="mt-5 space-y-1.5">
              {songs.slice(0, 4).map((s) => (
                <div key={s.id} className="flex items-center gap-2 text-xs text-white/50">
                  <AlbumCover song={s} size="sm" />
                  <span className="truncate">{s.title}</span>
                </div>
              ))}
              {songs.length > 4 && <p className="pt-1 text-[11px] text-white/30">…共 {songs.length} 首</p>}
            </div>
          </section>

          <div className="mt-6">
            <p className="mb-2 text-[10px] font-bold tracking-[.2em] text-white/40">你的昵称</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={8}
              placeholder="留空随机分配"
              className="w-full rounded-2xl border border-white/12 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-fuchsia-300/50"
            />
          </div>

          <button
            onClick={goRate}
            className="relative mt-5 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-violet-500 py-4 font-bold shadow-xl shadow-fuchsia-950/40 active:scale-[.99]"
          >
            <span className="relative">加入并打分 →</span>
            <i className="shine absolute inset-0" />
          </button>
        </div>
      </main>
    );
  }

  // 自己发起
  return (
    <main className="grain relative mx-auto min-h-screen max-w-[430px] overflow-hidden px-5 py-8 safe-bottom">
      <i className="aurora -left-24 -top-16 h-56 w-56 bg-fuchsia-600" />
      <div className="relative">
        <Link href="/" className="text-xs text-white/45">
          ← 返回首页
        </Link>
        <p className="mt-8 text-[11px] font-bold tracking-[.25em] text-fuchsia-200">CO-CREATE</p>
        <h1 className="mt-2 text-4xl font-black leading-tight">好友共创歌单</h1>
        <p className="mt-3 text-sm leading-6 text-white/60">
          选一批歌，每个人各自打分。链接接力传递，最后算出你们的默契度。
        </p>

        <div className="mt-6">
          <p className="mb-2 text-[10px] font-bold tracking-[.2em] text-white/40">选择歌手</p>
          <ArtistSelector value={artistId} onChange={setArtistId} />
        </div>

        <div className="mt-4">
          <p className="mb-2 text-[10px] font-bold tracking-[.2em] text-white/40">你的昵称</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={8}
            placeholder="留空随机分配"
            className="w-full rounded-2xl border border-white/12 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-fuchsia-300/50"
          />
        </div>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 rounded-[1.8rem] border border-white/12 bg-white/[.055] p-5"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-[.2em] text-cyan-200">SHARED TRACKS</p>
              <h2 className="mt-1 text-lg font-black">
                {artistName(artistId)} · {pool.length} 首
              </h2>
            </div>
            <button
              onClick={() => setSeed((s) => s + 1)}
              className="shrink-0 rounded-xl border border-fuchsia-200/25 bg-fuchsia-500/80 px-3 py-2 text-xs font-bold"
            >
              换一批
            </button>
          </div>
          <div className="mt-4 space-y-1.5">
            {pool.map((s) => (
              <div key={s.id} className="flex items-center gap-2 text-xs text-white/55">
                <AlbumCover song={s} size="sm" />
                <span className="truncate">{s.title}</span>
                <span className="ml-auto shrink-0 text-[10px] text-white/30">{s.year}</span>
              </div>
            ))}
          </div>
        </motion.section>

        <button
          onClick={goRate}
          className="relative mt-5 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 py-4 font-bold shadow-xl shadow-fuchsia-950/40 active:scale-[.99]"
        >
          <span className="relative">开始打分 ({CO_COUNT} 首) →</span>
          <i className="shine absolute inset-0" />
        </button>

        <p className="mt-4 rounded-2xl border border-white/8 bg-black/15 px-4 py-3 text-[11px] leading-5 text-white/40">
          房间数据编码在链接里接力传递，不使用服务器存储；只共享歌曲 id 与评分，不含音频。
        </p>
      </div>
    </main>
  );
}

export default function CoHome() {
  return (
    <Suspense fallback={<main className="min-h-screen" />}>
      <CoHomeInner />
    </Suspense>
  );
}
