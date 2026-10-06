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
import { getSongsByIds, artistName, DEFAULT_ARTIST } from '@/lib/musicProvider';
import { getAlbums } from '@/lib/albums';
import { decodeRoom } from '@/lib/co';
import type { AlbumVote } from '@/lib/co';
import type { Song } from '@/lib/types';

function CoHomeInner() {
  const router = useRouter();
  const mounted = useMounted();
  const params = useSearchParams();
  const code = params.get('c');
  const room = useMemo(() => decodeRoom(code), [code]);
  const setup = useCoStore((s) => s.setup);

  const [artistId, setArtistId] = useState(DEFAULT_ARTIST);
  const [name, setName] = useState('');
  const albums = useMemo(() => getAlbums(artistId), [artistId]);

  if (!mounted) return <main className="min-h-screen" />;

  const goRate = (albumName: string, songs: Song[], people: AlbumVote[]) => {
    const finalName = name.trim() || `听众${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
    setup({
      artistId: room?.artistId ?? artistId,
      album: albumName,
      songs,
      name: finalName,
      people: people ?? [],
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
          <p className="mt-8 text-[11px] font-bold tracking-[.25em] text-cyan-200">ALBUM REVIEW</p>
          <h1 className="mt-2 text-4xl font-black leading-tight">有人邀你评这张专辑</h1>
          <p className="mt-4 text-sm leading-7 text-white/60">
            同一张专辑，各自打分。打完就能看到你们的分数差、分歧最大的曲目和默契度。
          </p>

          <section className="mt-6 rounded-[1.8rem] border border-white/12 bg-white/[.055] p-5">
            <div className="flex items-center gap-4">
              {songs[0] && <AlbumCover song={songs[0]} size="lg" />}
              <div className="min-w-0">
                <h2 className="text-2xl font-black leading-tight">{room.album}</h2>
                <p className="mt-1 text-xs text-white/50">
                  {artistName(room.artistId)} · {songs.length} 首
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {room.people.map((p, i) => (
                    <span key={`${p.n}-${i}`} className="rounded-full bg-white/10 px-2.5 py-1 text-[11px]">
                      {p.n} 给了 {p.a.toFixed(1)}
                    </span>
                  ))}
                </div>
              </div>
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
            onClick={() => goRate(room.album, songs, room.people)}
            className="relative mt-5 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-violet-500 py-4 font-bold shadow-xl shadow-fuchsia-950/40 active:scale-[.99]"
          >
            <span className="relative">我也来打分 →</span>
            <i className="shine absolute inset-0" />
          </button>
        </div>
      </main>
    );
  }

  // 自己发起：选专辑
  return (
    <main className="grain relative mx-auto min-h-screen max-w-[430px] overflow-hidden px-5 py-8 safe-bottom">
      <i className="aurora -left-24 -top-16 h-56 w-56 bg-fuchsia-600" />
      <div className="relative">
        <Link href="/" className="text-xs text-white/45">
          ← 返回首页
        </Link>
        <p className="mt-8 text-[11px] font-bold tracking-[.25em] text-fuchsia-200">ALBUM REVIEW</p>
        <h1 className="mt-2 text-4xl font-black leading-tight">给一张专辑打分</h1>
        <p className="mt-3 text-sm leading-6 text-white/60">
          先给整张专辑一个总分，再逐首细评。像乐评人那样，把话说清楚。
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
          className="mt-5"
        >
          <p className="mb-2 text-[10px] font-bold tracking-[.2em] text-cyan-200">
            选择专辑 · {albums.length} 张
          </p>
          <div className="space-y-2.5">
            {albums.map((album) => (
              <button
                key={album.name}
                onClick={() => goRate(album.name, album.songs, [])}
                className="flex w-full items-center gap-3.5 rounded-[1.4rem] border border-white/12 bg-white/[.055] p-3 text-left transition active:scale-[.98] hover:border-fuchsia-300/50"
              >
                <AlbumCover song={album.songs[0]} size="md" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-black leading-tight text-white">
                    {album.name}
                  </span>
                  <span className="mt-1 block text-[11px] text-white/45">
                    {album.year} · {album.songs.length} 首
                  </span>
                </span>
                <span className="shrink-0 text-xs font-bold text-fuchsia-200">评它 →</span>
              </button>
            ))}
          </div>
        </motion.section>

        <p className="mt-5 rounded-2xl border border-white/8 bg-black/15 px-4 py-3 text-[11px] leading-5 text-white/40">
          评分数据编码在链接里接力传递，不使用服务器存储；只共享歌曲 id 与分数，不含音频。
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
