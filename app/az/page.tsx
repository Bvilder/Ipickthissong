'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import AlphabetBoard from '@/components/AlphabetBoard';
import { useLibraryStore } from '@/store/useLibraryStore';
import { useAzStore } from '@/store/useAzStore';
import { useMounted } from '@/lib/useMounted';
import { groupByLetter } from '@/lib/az';

export default function AzHome() {
  const router = useRouter();
  const mounted = useMounted();

  const library = useLibraryStore((s) => s.songs);
  const importDemo = useLibraryStore((s) => s.importDemo);
  const azStart = useAzStore((s) => s.start);
  const azFinished = useAzStore((s) => s.finished);
  const azPicks = useAzStore((s) => s.picks);

  const grouped = useMemo(() => groupByLetter(library), [library]);

  if (!mounted) return <main className="min-h-screen" />;

  // 还没导入歌单
  if (library.length === 0) {
    return (
      <main className="grain relative mx-auto min-h-screen max-w-[430px] overflow-hidden px-5 py-8 safe-bottom">
        <i className="aurora -left-24 top-10 h-56 w-56 bg-cyan-600" />
        <div className="relative">
          <Link href="/" className="text-xs text-white/45">
            ← 返回首页
          </Link>
          <p className="mt-8 text-[11px] font-bold tracking-[.25em] text-cyan-200">A-Z CHALLENGE</p>
          <h1 className="mt-2 text-4xl font-black leading-tight">先导入你的歌单</h1>
          <p className="mt-4 text-sm leading-7 text-white/60">
            A-Z 挑战从你自己的歌单出题：按歌名首字母分成 26 格，每格一屏列出这个字母下的所有歌，选一首就进下一格，最后拼成你的音乐字母表。
          </p>
          <button
            onClick={importDemo}
            className="mt-8 w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-violet-500 py-4 font-bold shadow-xl shadow-fuchsia-950/40 active:scale-[.99]"
          >
            导入演示歌单 →
          </button>
          <p className="mt-4 rounded-2xl border border-white/8 bg-black/15 px-4 py-3 text-[11px] leading-5 text-white/40">
            演示阶段直接把预置曲库当作「我的歌单」。未来经 QQ 音乐授权后读取真实歌单元数据，不涉及任何音频。
          </p>
        </div>
      </main>
    );
  }

  const pickedCount = Object.keys(azPicks).length;

  const begin = () => {
    azStart(library);
    router.push('/az/play');
  };

  return (
    <main className="grain relative mx-auto min-h-screen max-w-[430px] overflow-hidden px-5 py-8 safe-bottom">
      <i className="aurora -left-24 -top-16 h-56 w-56 bg-fuchsia-600" />
      <i className="aurora aurora-two -right-24 top-56 h-52 w-52 bg-cyan-600" />

      <div className="relative">
        <Link href="/" className="text-xs text-white/45">
          ← 返回首页
        </Link>

        <p className="mt-8 text-[11px] font-bold tracking-[.25em] text-cyan-200">A-Z CHALLENGE</p>
        <h1 className="mt-2 text-4xl font-black leading-tight">你的音乐字母表</h1>
        <p className="mt-3 text-sm leading-6 text-white/60">
          每个字母留下一首最爱，26 格填满，就是此刻的你。
        </p>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-[1.8rem] border border-white/12 bg-white/[.055] p-5 shadow-2xl shadow-black/20 backdrop-blur-sm"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-[.2em] text-fuchsia-200">MY LIBRARY</p>
              <h2 className="mt-1 text-lg font-black">已导入 {library.length} 首</h2>
              <p className="mt-1 text-xs text-white/50">
                覆盖 {grouped.letters.filter((l) => l !== '#').length} 个字母 · 需要填 {grouped.letters.length} 格
              </p>
            </div>
            <button
              onClick={importDemo}
              className="shrink-0 rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-xs text-white/70"
            >
              重新导入
            </button>
          </div>

          <div className="mt-5">
            <AlphabetBoard picks={azPicks} songs={library} counts={grouped.counts} />
          </div>

          <p className="mt-4 rounded-xl border border-white/5 bg-black/15 px-3 py-2 text-[10px] leading-5 text-white/40">
            灰色字母表示歌单里还没有这个字母开头的歌；中文歌按拼音首字母归类。
          </p>
        </motion.section>

        {azFinished && pickedCount > 0 ? (
          <>
            <Link
              href="/az/result"
              className="relative mt-5 block overflow-hidden rounded-2xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 py-4 text-center font-bold shadow-xl shadow-fuchsia-950/40"
            >
              <span className="relative">查看我的字母表 →</span>
              <i className="shine absolute inset-0" />
            </Link>
            <button onClick={begin} className="mt-3 w-full text-xs text-white/40">
              重新填一次字母表
            </button>
          </>
        ) : (
          <button
            onClick={begin}
            className="relative mt-5 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 py-4 font-bold shadow-xl shadow-fuchsia-950/40 active:scale-[.99]"
          >
            <span className="relative">
              {pickedCount > 0 ? `继续填字母表（已完成 ${pickedCount} 格）` : '开始 A-Z 挑战'} <b className="ml-1">→</b>
            </span>
            <i className="shine absolute inset-0" />
          </button>
        )}
      </div>
    </main>
  );
}
