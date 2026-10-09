'use client';

import { DNA_CODE, musicDna } from '@/lib/ai';
import type { Dimension } from '@/lib/types';

const GENE_BAR: Record<string, string> = {
  旋律偏好: 'from-fuchsia-400 to-pink-500',
  节奏敏感: 'from-cyan-400 to-sky-500',
  情绪深度: 'from-rose-400 to-red-500',
  怀旧倾向: 'from-amber-400 to-orange-500',
  冷门挖掘: 'from-violet-400 to-purple-500',
  副歌执念: 'from-emerald-400 to-teal-500',
};

/**
 * 音乐 DNA 可视化：把 6 维人格画成一组「基因测序」柱状图，
 * 并配一句 AI 解读。纯展示组件，不依赖音频。
 */
export default function MusicDna({ dimensions }: { dimensions: Dimension[] }) {
  const { sequence, reading } = musicDna(dimensions);

  return (
    <div>
      {/* 基因序列 */}
      <p className="break-all font-mono text-[11px] tracking-tight text-fuchsia-100/80">{sequence}</p>

      {/* 基因柱状图 */}
      <div className="mt-4 flex items-end gap-2">
        {dimensions.map((d) => {
          const code = DNA_CODE[d.name] ?? d.name.slice(0, 1);
          return (
            <div key={d.name} className="flex min-w-0 flex-1 flex-col items-center">
              <div className="flex h-16 w-full items-end overflow-hidden rounded-lg bg-white/5">
                <div
                  className={`w-full rounded-t-lg bg-gradient-to-t ${GENE_BAR[d.name] ?? 'from-white/40 to-white/70'}`}
                  style={{ height: `${d.score}%` }}
                />
              </div>
              <span className="mt-1.5 text-sm font-black tabular-nums text-white">{d.score}</span>
              <span className="text-[8px] font-mono tracking-wider text-white/40">{code}</span>
              <span className="text-[9px] leading-3 text-white/55">{d.name}</span>
            </div>
          );
        })}
      </div>

      {/* AI 解读 */}
      <p className="mt-4 text-xs leading-6 text-white/60">{reading}</p>
    </div>
  );
}
