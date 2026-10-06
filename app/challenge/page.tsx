'use client';

import Link from 'next/link';
import { Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import RadarChart from '@/components/RadarChart';
import { useGameStore } from '@/store/useGameStore';
import { useMounted } from '@/lib/useMounted';
import { decodeChallenge, picksToChoices, choicesToPicks, compareRuns } from '@/lib/challenge';
import { generatePersonality } from '@/lib/personality';
import { getSongsByIds } from '@/lib/musicProvider';

function ChallengeInner() {
  const router = useRouter();
  const mounted = useMounted();
  const params = useSearchParams();
  const code = params.get('c');

  const { songs, choices, winner, challenge, start } = useGameStore();

  const payload = useMemo(() => decodeChallenge(code), [code]);
  const theirSongs = useMemo(() => (payload ? getSongsByIds(payload.songs) : []), [payload]);

  const theirPersona = useMemo(() => {
    if (!payload || theirSongs.length !== 32) return null;
    const theirChoices = picksToChoices(theirSongs, payload.picks);
    const champion = theirSongs[payload.winner];
    if (!champion) return null;
    return {
      champion,
      result: generatePersonality({
        artist: payload.artist,
        songs: theirSongs,
        choices: theirChoices,
        winnerId: champion.id,
      }),
    };
  }, [payload, theirSongs]);

  const sameBracket =
    Boolean(payload) && songs.length === 32 && payload?.songs.every((id, i) => songs[i]?.id === id);

  const matchup = useMemo(() => {
    if (!payload || !winner || challenge !== code || !sameBracket) return null;
    return compareRuns(theirSongs, payload.picks, choicesToPicks(songs, choices));
  }, [payload, winner, challenge, code, sameBracket, theirSongs, songs, choices]);

  if (!mounted) return <main className="min-h-screen" />;

  if (!payload || !theirPersona) {
    return (
      <main className="mx-auto min-h-screen max-w-[430px] px-6 py-8">
        <Link href="/" className="text-xs text-white/45">
          ← 返回首页
        </Link>
        <h1 className="mt-10 text-4xl font-black leading-tight">好友挑战</h1>
        <p className="mt-4 text-sm leading-7 text-white/65">
          完成一局 32 强淘汰赛后，点「复制挑战链接」发给朋友。好友打开链接会拿到<b className="text-white">和你完全相同的一批歌和对阵顺序</b>，
          打完之后系统会算出你们的音乐默契度、共同四强，以及分歧最大的那一首。
        </p>
        <div className="mt-7 space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
          <p>· 链接里编码了整局赛程，不依赖服务器存储</p>
          <p>· 只共享歌曲 id 与选择结果，不含任何音频</p>
          <p>· 默契度 = 冠军一致性 + 四强/八强重合度 + 晋级路径差异</p>
        </div>
        <Link
          href="/select"
          className="mt-8 block rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-500 py-4 text-center font-bold shadow-lg shadow-fuchsia-950/40"
        >
          先玩一局，再发起挑战
        </Link>
      </main>
    );
  }

  const accept = () => {
    start(theirSongs, { ordered: true, challenge: code ?? undefined });
    router.push('/play');
  };

  if (!matchup) {
    return (
      <main className="mx-auto min-h-screen max-w-[430px] px-5 py-8 safe-bottom">
        <Link href="/" className="text-xs text-white/45">
          ← 返回首页
        </Link>

        <p className="mt-8 text-[11px] font-bold tracking-[.25em] text-cyan-200">INCOMING CHALLENGE</p>
        <h1 className="mt-2 text-3xl font-black leading-tight">有人向你发起挑战</h1>
        <p className="mt-3 text-sm leading-6 text-white/60">
          同一位歌手、同样的 32 首歌、同样的对阵顺序。打完之后，看看你们有多默契。
        </p>

        <section className="mt-6 rounded-[1.8rem] bg-gradient-to-br from-cyan-700/70 via-violet-800 to-slate-950 p-6 shadow-2xl">
          <p className="text-xs text-white/60">TA 的冠军单曲</p>
          <h2 className="mt-2 text-4xl font-black leading-tight">{theirPersona.champion.title}</h2>
          <p className="mt-1 text-sm text-white/60">
            {theirPersona.champion.album} · {theirPersona.champion.year} 年
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {theirPersona.result.tags.map((t) => (
              <span key={t} className="rounded-full bg-white/15 px-3 py-1 text-xs">
                #{t}
              </span>
            ))}
          </div>
          <p className="mt-5 border-l-2 border-cyan-200 pl-3 text-sm leading-7 text-white/85">
            {theirPersona.result.verdict}
          </p>
          <div className="mt-5">
            <RadarChart dimensions={theirPersona.result.dimensions} />
          </div>
        </section>

        <button
          onClick={accept}
          className="relative mt-5 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-violet-500 py-4 font-bold shadow-xl shadow-fuchsia-950/40 active:scale-[.99]"
        >
          <span className="relative">接受挑战，打同一局 →</span>
          <i className="shine absolute inset-0" />
        </button>

        <button
          onClick={() => {
            start(theirSongs, { ordered: true });
            router.push('/play');
          }}
          className="mt-3 w-full text-xs text-white/40"
        >
          不对比，我自己打这局
        </button>
      </main>
    );
  }

  const gapSong = matchup.biggestGap ? getSongsByIds([matchup.biggestGap.songId])[0] : undefined;

  return (
    <main className="mx-auto min-h-screen max-w-[430px] px-5 py-8 safe-bottom">
      <Link href="/" className="text-xs text-white/45">
        ← 返回首页
      </Link>

      <p className="mt-8 text-[11px] font-bold tracking-[.25em] text-fuchsia-200">MATCH RESULT</p>
      <h1 className="mt-2 text-3xl font-black leading-tight">你们的音乐默契度</h1>

      <motion.section
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 18 }}
        className="mt-6 rounded-[2rem] border border-white/12 bg-gradient-to-br from-fuchsia-700 via-violet-800 to-slate-950 p-7 text-center shadow-2xl"
      >
        <div className="text-7xl font-black leading-none text-transparent bg-gradient-to-r from-fuchsia-200 via-pink-100 to-cyan-200 bg-clip-text">
          {matchup.score}
        </div>
        <p className="mt-3 text-lg font-black text-white">{matchup.level}</p>
        <p className="mt-2 text-xs leading-6 text-white/60">
          {matchup.championSame ? '你们选出了同一首冠军。' : '冠军不同，但路径说明了很多。'}
        </p>
      </motion.section>

      <section className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-[10px] tracking-[.2em] text-white/40">TA 的冠军</p>
          <p className="mt-2 truncate text-lg font-black">{theirPersona.champion.title}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-[10px] tracking-[.2em] text-white/40">你的冠军</p>
          <p className="mt-2 truncate text-lg font-black text-fuchsia-100">{winner?.title ?? '—'}</p>
        </div>
      </section>

      <section className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
        <p className="text-xs tracking-[.2em] text-cyan-200">SHARED SEMI-FINALS</p>
        <h2 className="mt-2 text-lg font-black">共同保留到四强的歌</h2>
        {matchup.sharedSemi.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {getSongsByIds(matchup.sharedSemi).map((s) => (
              <span key={s.id} className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80">
                {s.title}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-white/45">一首都没重合，你们听的是两个世界。</p>
        )}
      </section>

      {gapSong && (
        <section className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs tracking-[.2em] text-fuchsia-200">BIGGEST GAP</p>
          <h2 className="mt-2 text-lg font-black">分歧最大的一首</h2>
          <p className="mt-3 text-sm leading-7 text-white/70">
            <b className="text-white">《{gapSong.title}》</b>
            ：一个人让它走了很远，另一个人很早就放它走了。这是你们最不像的一次。
          </p>
        </section>
      )}

      <button
        onClick={accept}
        className="mt-6 w-full rounded-2xl border border-white/20 py-4 font-bold"
      >
        再打一次这局
      </button>
      <Link href="/select" className="mt-3 block text-center text-xs text-white/40">
        换一批歌重新玩
      </Link>
    </main>
  );
}

export default function Challenge() {
  return (
    <Suspense fallback={<main className="min-h-screen" />}>
      <ChallengeInner />
    </Suspense>
  );
}
