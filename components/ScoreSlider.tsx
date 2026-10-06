'use client';

import { scoreLabel } from '@/lib/co';

/** Pitchfork 风格的 10 分制滑杆 */
export default function ScoreSlider({
  value,
  onChange,
  compact = false,
}: {
  value: number;
  onChange: (v: number) => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={10}
          step={0.1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/15 accent-fuchsia-400"
        />
        <span className="w-9 shrink-0 text-right text-sm font-black tabular-nums text-fuchsia-100">
          {value.toFixed(1)}
        </span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-end justify-between">
        <span className="text-5xl font-black leading-none tabular-nums text-white">
          {value.toFixed(1)}
        </span>
        <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-bold text-fuchsia-100">
          {scoreLabel(value)}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={0.1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-4 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-fuchsia-400"
      />
      <div className="mt-1.5 flex justify-between text-[9px] text-white/30">
        <span>0</span>
        <span>5</span>
        <span>10</span>
      </div>
    </div>
  );
}
