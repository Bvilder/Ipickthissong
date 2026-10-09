'use client';

import Link from 'next/link';
import { useProfileStore, completionOf } from '@/store/useProfileStore';
import { PERSONAS, TOTAL_PERSONAS } from '@/lib/personas';
import { useMounted } from '@/lib/useMounted';

export default function Profile() {
  const mounted = useMounted();
  const { unlocked, bracket, az, co } = useProfileStore();

  if (!mounted) return <main className="min-h-screen" />;

  const completion = completionOf(unlocked.length);
  const set = new Set(unlocked);

  return (
    <main className="grain relative mx-auto min-h-screen max-w-[430px] overflow-hidden px-6 py-8 safe-bottom">
      <i className="aurora -left-24 -top-16 h-56 w-56 bg-fuchsia-600" />

      <div className="relative">
        <Link href="/" className="text-xs text-white/45">
          ← 返回首页
        </Link>

        <p className="mt-8 text-[11px] font-bold tracking-[.25em] text-fuchsia-200">MY PERSONA</p>
        <h1 className="mt-2 text-4xl font-black leading-tight">人格图鉴</h1>

        <section className="mt-6 rounded-[1.75rem] border border-white/12 bg-white/[.055] p-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-white/55">已解锁</p>
              <p className="mt-1 text-4xl font-black leading-none">
                {unlocked.length}
                <span className="ml-1 text-lg text-white/35">/ {TOTAL_PERSONAS}</span>
              </p>
            </div>
            <span className="rounded-full bg-fuchsia-400/15 px-3 py-1.5 text-sm font-bold text-fuchsia-100">
              {completion}%
            </span>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 via-violet-400 to-cyan-300 transition-all duration-700"
              style={{ width: `${completion}%` }}
            />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-black/20 p-3">
              <div className="text-lg font-black text-white">{bracket}</div>
              <div className="mt-0.5 text-[10px] text-white/45">32 强</div>
            </div>
            <div className="rounded-xl bg-black/20 p-3">
              <div className="text-lg font-black text-white">{az}</div>
              <div className="mt-0.5 text-[10px] text-white/45">A-Z</div>
            </div>
            <div className="rounded-xl bg-black/20 p-3">
              <div className="text-lg font-black text-white">{co}</div>
              <div className="mt-0.5 text-[10px] text-white/45">专辑评分</div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid grid-cols-2 gap-2.5">
          {PERSONAS.map((p) => {
            const on = set.has(p.id);
            return (
              <div
                key={p.id}
                className={`rounded-2xl border p-3.5 ${
                  on
                    ? 'border-fuchsia-300/45 bg-gradient-to-br from-fuchsia-500/20 to-violet-600/15'
                    : 'border-white/8 bg-white/[.02]'
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <span className={`text-sm font-black ${on ? 'text-white' : 'text-white/25'}`}>
                    {on ? p.name : '？？？'}
                  </span>
                  {p.rare && (
                    <span
                      className={`shrink-0 text-[9px] font-bold ${on ? 'text-amber-200' : 'text-white/12'}`}
                    >
                      稀有
                    </span>
                  )}
                </div>
                <p className={`mt-1.5 text-[10px] leading-4 ${on ? 'text-white/55' : 'text-white/15'}`}>
                  {on ? p.desc : '尚未解锁'}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-7 space-y-2.5">
          <Link
            href="/select"
            className="block rounded-2xl border border-white/12 bg-white/[.04] px-4 py-3.5 text-sm font-bold"
          >
            再玩一次 32 强 →
          </Link>
          <Link
            href="/az"
            className="block rounded-2xl border border-white/12 bg-white/[.04] px-4 py-3.5 text-sm font-bold"
          >
            去填 A-Z 字母表 →
          </Link>
          <Link
            href="/co"
            className="block rounded-2xl border border-white/12 bg-white/[.04] px-4 py-3.5 text-sm font-bold"
          >
            评一张专辑 →
          </Link>
        </div>
      </div>
    </main>
  );
}
