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
        const picks = (options?.ordered ? [...songs] : shuffle(songs)).slice(0, 32);
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
        const loser = pair.find((x) => x.id !== winner.id);
        if (!loser) return;

        const choices: Choice[] = [
          ...s.choices,
          { round: s.round, winnerId: winner.id, loserId: loser.id, timestamp: Date.now() },
        ];
        const next = [...s.next, winner];
        const end = s.match + 2 >= s.queue.length;

        // 最后一场：冠军诞生
        if (end && next.length === 1) {
          set({ choices, winner, queue: next, next: [], match: 0 });
          return;
        }
        // 本轮结束：进入下一轮并播放章节过场
        if (end) {
          set({ queue: next, next: [], match: 0, round: s.round + 1, choices, announcement: true });
          return;
        }
        set({ next, match: s.match + 2, choices });
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
    { name: 'i-choose-this-song-session' }
  )
);
