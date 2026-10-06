'use client';

import { motion } from 'framer-motion';
import { RATING_STEPS } from '@/lib/co';

export default function RatingScale({ onPick }: { onPick: (score: number) => void }) {
  return (
    <div className="space-y-2">
      {RATING_STEPS.map((step, i) => (
        <motion.button
          key={step.score}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04 }}
          onClick={() => onPick(step.score)}
          className="flex w-full items-center gap-3 rounded-2xl border border-white/12 bg-white/[.06] px-4 py-3 text-left transition active:scale-[.98] hover:border-fuchsia-300/50"
        >
          <span className="text-xl">{step.emoji}</span>
          <span className="flex-1 text-sm font-bold text-white">{step.label}</span>
          <span className="flex gap-1">
            {[5, 4, 3, 2, 1].map((n) => (
              <i
                key={n}
                className={`h-1.5 w-3 rounded-full ${n <= step.score ? 'bg-fuchsia-300' : 'bg-white/12'}`}
              />
            ))}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
