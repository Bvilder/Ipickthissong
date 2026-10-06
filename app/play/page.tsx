'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import SongCard from '@/components/SongCard';
import { useGameStore } from '@/store/useGameStore';
import { useMounted } from '@/lib/useMounted';
import { commentOnChoice } from '@/lib/ai';

const intro = [
  { eyebrow: '第一章 · 聆听本能', title: '32 首歌，只有 16 首能留下', copy: '别犹豫太久，第一反应最诚实。', button: '开始第一轮' },
  { eyebrow: '第二章 · 心动筛选', title: '留下来的，都是你的心头好', copy: '现在开始 16 进 8，每一局都更难选。', button: '继续对决' },
  { eyebrow: '第三章 · 情绪浓缩', title: '你的歌单正在收紧', copy: '8 进 4，听见熟悉前奏时，选那个让你起鸡皮疙瘩的。', button: '进入八强赛' },
  { eyebrow: '第四章 · 半决赛', title: '四首歌，四种心事', copy: '4 进 2。冠军候选即将诞生。', button: '进入半决赛' },
  { eyebrow: '最终章 · 冠军诞生', title: '你最爱的歌：', copy: '最后一次选择。它会成为你此刻的音乐人格冠军。', button: '决出冠军' },
];

const NAMES = ['32 进 16', '16 进 8', '8 进 4', '4 进 2', '2 进 1'];

export default function Play() {
  const r = useRouter();
  const mounted = useMounted();
  const { queue, songs, match, round, choose, winner, announcement, continueRound, challenge, choices } =
    useGameStore();

  useEffect(() => {
    if (!winner) return;
    r.replace(challenge ? `/challenge?c=${challenge}` : '/result');
  }, [winner, r, challenge]);

  // 防御层 4：万一赛程里出现落单或重复配对，自动推进，绝不卡死
  // 注意：所有 hook 必须写在任何提前 return 之前
  useEffect(() => {
    if (!mounted || announcement) return;
    const x = queue[match];
    const y = queue[match + 1];
    if (!x) return;
    if (!y || x.id === y.id) choose(x);
  }, [mounted, announcement, queue, match, choose]);

  if (!mounted) return <main className="grain min-h-screen" />;

  const a = queue[match];
  const b = queue[match + 1];

  if (!a || !b) {
    return (
      <main className="grain min-h-screen p-6">
        <div className="mx-auto mt-32 max-w-xs text-center">
          <p className="text-fuchsia-200">比赛尚未开始</p>
          <p className="mt-3 text-sm text-white/55">请从首页选择 32 首歌后开启赛程。</p>
          <button
            onClick={() => r.push('/select')}
            className="mt-7 rounded-2xl bg-white px-6 py-3 font-bold text-slate-900"
          >
            返回选歌
          </button>
        </div>
      </main>
    );
  }

  if (announcement) {
    const text = intro[round - 1] || intro[4];
    return (
      <main className="grain relative mx-auto flex min-h-screen max-w-[430px] flex-col justify-center overflow-hidden px-7 text-center">
        <i className="aurora left-[-70px] top-[10%] h-48 w-48 bg-fuchsia-500" />
        <i className="aurora aurora-two bottom-[10%] right-[-70px] h-52 w-52 bg-cyan-500" />
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          className="relative"
        >
          <p className="text-[11px] font-bold tracking-[.28em] text-fuchsia-200">{text.eyebrow}</p>
          <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-3xl border border-white/20 bg-white/10 text-3xl shadow-xl">
            {round === 5 ? '🏆' : '✦'}
          </div>
          <h1 className="mt-7 text-4xl font-black leading-tight tracking-tight">{text.title}</h1>
          <p className="mx-auto mt-5 max-w-xs leading-7 text-white/60">{text.copy}</p>
          <div className="mt-10 text-xs font-medium tracking-wide text-white/35">
            本轮共 {queue.length / 2} 场对决
          </div>
          <button
            onClick={continueRound}
            className="mt-5 w-full rounded-2xl bg-white py-4 font-bold text-slate-900 shadow-xl shadow-white/10"
          >
            {text.button} <span className="ml-1">→</span>
          </button>
        </motion.div>
      </main>
    );
  }

  const count = Math.floor(match / 2) + 1;

  // 8 强之后，AI 开始对每一次选择做即时点评
  const showComment = round >= 3;
  const last = choices[choices.length - 1];
  const lastWinner = last ? songs.find((s) => s.id === last.winnerId) : undefined;
  const lastLoser = last ? songs.find((s) => s.id === last.loserId) : undefined;
  const comment =
    showComment && last && lastWinner && lastLoser
      ? commentOnChoice(lastWinner, lastLoser, last.round)
      : '';

  return (
    <main className="grain mx-auto min-h-screen max-w-[430px] px-5 py-7 safe-bottom">
      <div className="flex items-center justify-between text-sm">
        <span className="rounded-full border border-fuchsia-300/20 bg-fuchsia-400/10 px-3 py-1.5 text-xs font-bold text-fuchsia-100">
          {NAMES[round - 1]}
        </span>
        <span className="text-xs text-white/50">
          MATCH {String(count).padStart(2, '0')} / {String(queue.length / 2).padStart(2, '0')}
        </span>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 to-cyan-300"
          animate={{ width: `${((count - 1) / (queue.length / 2)) * 100}%` }}
        />
      </div>

      <div className="mt-8">
        <p className="text-[10px] font-bold tracking-[.25em] text-white/40">NO WRONG ANSWERS</p>
        <h1 className="mt-2 text-2xl font-black">这一局，你更爱哪首？</h1>
        <p className="mt-2 text-sm text-white/50">凭第一反应选。选择一旦落下，比赛继续。</p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${a.id}-${b.id}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="mt-7 space-y-3"
        >
          <SongCard song={a} onClick={() => choose(a)} index={0} />
          <div className="flex items-center gap-3 py-1">
            <i className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] font-black tracking-[.3em] text-white/30">OR</span>
            <i className="h-px flex-1 bg-white/10" />
          </div>
          <SongCard song={b} onClick={() => choose(b)} index={1} />
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {comment && (
          <motion.div
            key={comment}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-5 flex gap-2.5 rounded-2xl border border-fuchsia-200/25 bg-fuchsia-400/10 p-3.5"
          >
            <span className="text-sm leading-none">✨</span>
            <div>
              <p className="text-[9px] font-bold tracking-[.2em] text-fuchsia-200">AI 实时解读</p>
              <p className="mt-1 text-xs leading-6 text-white/80">{comment}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
