'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { motion } from 'framer-motion';
import ModeCard from '@/components/ModeCard';
import { ARTISTS } from '@/lib/musicProvider';
import { TOTAL_PERSONAS } from '@/lib/personas';
import { useProfileStore, completionOf } from '@/store/useProfileStore';
import { useMounted } from '@/lib/useMounted';

function HomeInner() {
  const router = useRouter();
  const params = useSearchParams();
  const code = params.get('c');
  const mounted = useMounted();
  const unlocked = useProfileStore((s) => s.unlocked);

  return (
    <main className="grain relative mx-auto min-h-screen max-w-[430px] overflow-hidden px-5 py-8 safe-bottom">
      <i className="aurora -left-24 -top-20 h-64 w-64 bg-fuchsia-600" />
      <i className="aurora aurora-two -right-28 top-48 h-60 w-60 bg-cyan-600" />

      <div className="relative">
        <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold tracking-[.3em] text-fuchsia-200">MUSIC PERSONA</p>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-white/55">
              VOL. 01
            </span>
          </div>
          <h1 className="mt-5 text-5xl font-black leading-[.96] tracking-tight">
            我选
            <br />
            <span className="bg-gradient-to-r from-fuchsia-300 via-pink-200 to-cyan-200 bg-clip-text text-transparent">
              这首歌
            </span>
          </h1>
          <p className="mt-5 max-w-[280px] text-sm leading-6 text-white/60">
            不是测评，是一次只属于你的音乐淘汰赛。31 次二选一之后，你会看见自己的音乐人格。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {ARTISTS.filter((a) => a.available).map((a) => (
              <span
                key={a.id}
                className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-[11px] text-white/65"
              >
                {a.name} 曲库已上线
              </span>
            ))}
          </div>
        </motion.header>

        {mounted && (
          <Link
            href="/profile"
            className="mt-6 flex items-center gap-4 rounded-2xl border border-white/12 bg-white/[.045] p-4 transition hover:border-fuchsia-300/40"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold tracking-[.2em] text-fuchsia-200">MY PERSONA</p>
              <p className="mt-1.5 text-sm font-bold text-white">
                已解锁 {unlocked.length} / {TOTAL_PERSONAS} 种音乐人格
              </p>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 to-cyan-300 transition-all duration-700"
                  style={{ width: `${completionOf(unlocked.length)}%` }}
                />
              </div>
            </div>
            <span className="shrink-0 text-lg font-black text-fuchsia-200">
              {completionOf(unlocked.length)}%
            </span>
          </Link>
        )}

        {code && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => router.push(`/challenge?c=${code}`)}
            className="mt-7 flex w-full items-center gap-3 rounded-2xl border border-cyan-200/30 bg-cyan-300/10 p-4 text-left"
          >
            <span className="text-2xl">⚔️</span>
            <span className="flex-1">
              <b className="block text-sm text-white">有人向你发起挑战</b>
              <small className="text-[11px] text-white/55">同一批歌，看你们能有多默契 →</small>
            </span>
          </motion.button>
        )}

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mt-9"
        >
          <p className="mb-3 text-[11px] font-bold tracking-[.2em] text-white/40">选择你的玩法</p>
          <div className="space-y-3">
            <ModeCard
              emoji="🏆"
              eyebrow="BRACKET 32"
              title="32 强淘汰赛"
              desc="从 32 首里两两对决，31 次选择后决出你最爱的那一首，并生成音乐人格卡。"
              href="/select"
              highlight
            />
            <div className="grid grid-cols-2 gap-3">
              <ModeCard
                emoji="A–Z"
                eyebrow="A TO Z"
                title="A-Z 挑战"
                desc="导入歌单，每个字母选一首最爱，拼成你的音乐字母表。"
                href="/az"
                highlight
              />
              <ModeCard
                emoji="✦"
                eyebrow="CO-CREATE"
                title="好友共创"
                desc="给一张专辑打分：总分 + 逐首细评，再和好友比默契。"
                href="/co"
                highlight
              />
            </div>
          </div>
        </motion.section>

        <p className="mt-8 rounded-2xl border border-white/8 bg-black/15 px-4 py-3 text-[11px] leading-5 text-white/40">
          全程只使用歌曲元数据（歌名、专辑、年份、流派、标签），不播放、不下载、不缓存任何音频；收听请跳转 QQ 音乐官方平台。
        </p>

        <Link
          className="mt-7 block text-center text-xs text-white/35 underline"
          href="/about"
        >
          关于与合规说明
        </Link>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<main className="min-h-screen" />}>
      <HomeInner />
    </Suspense>
  );
}
