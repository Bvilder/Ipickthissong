'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Song, Choice } from '@/lib/types';

type StartOptions = {
  /** true = 不打乱，直接以传入顺序作为种子序位（好友挑战时使用） */
  ordered?: boolean;
  /** 来自挑战链接的 code */
  challenge?: string;
};

type State = {
  /** 本局歌手名 */
  artist: string;
  songs: Song[];
  queue: Song[];
  next: Song[];
  match: number;
  round: number;
  choices: Choice[];
  winner?: Song;
  announcement: boolean;
  /** 本局是否来自好友挑战 */
  challenge?: string;

  start: (songs: Song[], options?: StartOptions) => void;
  continueRound: () => void;
  choose: (song: Song) => void;
  reset: () => void;
};

const shuffle = <T,>(list: T[]): T[] => {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/** 防御层 1：任何进入赛程的歌曲列表都强制按 id 去重，且必须是 2 的幂 */
function sanitize(list: Song[]): Song[] {
  const seen = new Set<string>();
  const out: Song[] = [];
  for (const s of list) {
    if (!s?.id || seen.has(s.id)) continue;
    seen.add(s.id);
    out.push(s);
  }
  // 32 强赛程要求 2 的幂，否则会出现落单 / 配对错乱
  let size = 32;
  while (size > out.length) size = size / 2;
  return out.slice(0, Math.max(size, 2));
}

export const useGameStore = create<State>()(
  persist(
    (set, get) => ({
      artist: '',
      songs: [],
      queue: [],
      next: [],
      match: 0,
      round: 1,
      choices: [],
      winner: undefined,
      announcement: true,
      challenge: undefined,

      start: (songs, options) => {
        const clean = sanitize(songs);
        const picks = (options?.ordered ? [...clean] : shuffle(clean)).slice(0, clean.length);
        set({
          artist: picks[0]?.artist ?? '',
          songs: picks,
          queue: picks,
          next: [],
          match: 0,
          round: 1,
          choices: [],
          winner: undefined,
          announcement: true,
          challenge: options?.challenge,
        });
      },

      continueRound: () => set({ announcement: false }),

      choose: (winner) => {
        const s = get();
        const pair = s.queue.slice(s.match, s.match + 2);
        if (pair.length === 0) return;

        // 防御层 2：无论发生什么，都必须找出一个对手，绝不静默 return
        let loser = pair.find((x) => x.id !== winner.id);
        if (!loser) {
          // 极端情况（同一首被塞进一个对局）：直接让被点的这首晋级
          loser = pair.find((x) => x !== winner);
        }

        const choices: Choice[] = loser
          ? [
              ...s.choices,
              { round: s.round, winnerId: winner.id, loserId: loser.id, timestamp: Date.now() },
            ]
          : [...s.choices];

        const next = [...s.next, winner];
        const end = s.match + 2 >= s.queue.length;

        // 最后一场：冠军诞生
        if (end && next.length <= 1) {
          set({ choices, winner, queue: next, next: [], match: 0 });
          return;
        }
        // 本轮结束：进入下一轮并播放章节过场
        if (end) {
          set({ queue: next, next: [], match: 0, round: s.round + 1, choices, announcement: true });
          return;
        }
        set({ choices, next, match: s.match + 2 });
      },

      reset: () =>
        set({
          artist: '',
          songs: [],
          queue: [],
          next: [],
          match: 0,
          round: 1,
          choices: [],
          winner: undefined,
          announcement: true,
          challenge: undefined,
        }),
    }),
    {
      name: 'i-choose-this-song-session',
      version: 3,
      // 防御层 3：旧存档（早期曲库含重复条目）一律丢弃
      migrate: () => ({
        artist: '',
        songs: [],
        queue: [],
        next: [],
        match: 0,
        round: 1,
        choices: [],
        winner: undefined,
        announcement: true,
        challenge: undefined,
      }),
    }
  )
);
