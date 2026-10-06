'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

type Props = {
  emoji: string;
  eyebrow: string;
  title: string;
  desc: string;
  href?: string;
  soon?: boolean;
  highlight?: boolean;
};

export default function ModeCard({ emoji, eyebrow, title, desc, href, soon, highlight }: Props) {
  const inner = (
    <>
      <div className="flex items-start justify-between">
        <span className="text-2xl">{emoji}</span>
        {highlight && (
          <span className="rounded-full bg-fuchsia-400/20 px-2 py-0.5 text-[10px] font-bold text-fuchsia-100">
            可玩
          </span>
        )}
      </div>
      <p className="mt-4 text-[10px] font-bold tracking-[.2em] text-white/40">{eyebrow}</p>
      <h3 className="mt-1 text-lg font-black text-white">{title}</h3>
      <p className="mt-1.5 text-xs leading-5 text-white/50">{desc}</p>
      {soon && <p className="mt-3 text-[11px] font-bold text-white/30">即将上线</p>}
    </>
  );

  const cls = `block rounded-[1.5rem] border p-4 transition ${
    highlight
      ? 'border-fuchsia-300/40 bg-gradient-to-br from-fuchsia-500/20 via-violet-500/10 to-cyan-400/10 shadow-lg shadow-fuchsia-950/30'
      : 'border-white/10 bg-white/[.035]'
  }`;

  if (!href) {
    return <div className={cls}>{inner}</div>;
  }

  return (
    <motion.div whileTap={{ scale: 0.98 }}>
      <Link href={href} className={cls}>
        {inner}
      </Link>
    </motion.div>
  );
}
