'use client';

import Link from 'next/link';

const MODES = [
  { key: 'bracket', href: '/select', icon: '🏆', title: '32强淘汰赛', desc: '决出冠军单曲' },
  { key: 'az', href: '/az', icon: '🔤', title: 'A-Z 挑战', desc: '拼出音乐字母表' },
  { key: 'co', href: '/co', icon: '🎧', title: '好友共创', desc: '打分看默契' },
];

/**
 * 结果页底部的「继续玩」导航：把三个玩法互相打通，
 * 避免用户玩完一个就不知道去哪。
 */
export default function PlayMore({ active }: { active?: string }) {
  const list = MODES.filter((m) => m.key !== active);

  return (
    <section className="mt-10">
      <p className="text-xs tracking-[.2em] text-fuchsia-200">KEEP PLAYING</p>
      <h2 className="mt-2 text-xl font-black">还想去哪玩</h2>
      <div className={`mt-4 grid gap-2 ${list.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {list.map((m) => (
          <Link
            key={m.key}
            href={m.href}
            className="rounded-2xl border border-white/12 bg-white/5 p-3 text-center transition-colors active:bg-white/10"
          >
            <div className="text-2xl">{m.icon}</div>
            <div className="mt-2 text-xs font-bold text-white">{m.title}</div>
            <div className="mt-0.5 text-[9px] leading-3 text-white/45">{m.desc}</div>
          </Link>
        ))}
      </div>
      <Link
        href="/"
        className="mt-3 block rounded-2xl border border-white/15 py-3 text-center text-sm font-bold text-white/70 transition-colors active:bg-white/10"
      >
        ← 回到首页
      </Link>
    </section>
  );
}
