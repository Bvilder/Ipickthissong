'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TOTAL_PERSONAS } from '@/lib/personas';

/**
 * 人格档案：跨模式累积，是「再玩一局」的理由
 */
type ProfileState = {
  /** 已解锁的人格 id */
  unlocked: string[];
  bracket: number;
  az: number;
  co: number;

  unlock: (ids: string[]) => void;
  markBracket: () => void;
  markAz: () => void;
  markCo: () => void;
  reset: () => void;
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      unlocked: [],
      bracket: 0,
      az: 0,
      co: 0,

      unlock: (ids) => {
        const merged = Array.from(new Set([...get().unlocked, ...ids]));
        set({ unlocked: merged });
      },
      markBracket: () => set({ bracket: get().bracket + 1 }),
      markAz: () => set({ az: get().az + 1 }),
      markCo: () => set({ co: get().co + 1 }),
      reset: () => set({ unlocked: [], bracket: 0, az: 0, co: 0 }),
    }),
    { name: 'i-choose-this-song-profile', version: 1 }
  )
);

export const completionOf = (unlocked: number) =>
  Math.round((unlocked / TOTAL_PERSONAS) * 100);
