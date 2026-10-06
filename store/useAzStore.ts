'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Song, Choice } from '@/lib/types';
import { groupByLetter, roundsOf } from '@/lib/az';

/**
 * A-Z 挑战状态机
 *
 * 逐个字母推进：组内有多首就打小组淘汰赛，只有一首就直接认领。
 * 全部字母走完 = 你的 A-Z 音乐字母表完成。
 */

type State = {
  library: Song[];
  letters: string[];
  groups: Record<string, Song[]>;
  totalMatches: number;

  index: number;
  queue: Song[];
  next: Song[];
  match: number;

  /** letter -> songId */
  picks: Record<string, string>;
  choices: Choice[];
  finished: boolean;

  start: (library: Song[]) => void;
  choose: (song: Song) => void;
  /** 组内只剩一首时的认领 */
  claim: () => void;
  /** 轮空自动晋级 */
  bye: () => void;
  reset: () => void;
};

const emptyGroupState = () => ({ queue: [] as Song[], next: [] as Song[], match: 0 });

export const useAzStore = create<State>()(
  persist(
    (set, get) => ({
      library: [],
      letters: [],
      groups: {},
      totalMatches: 0,
      index: 0,
      queue: [],
      next: [],
      match: 0,
      picks: {},
      choices: [],
      finished: false,

      start: (library) => {
        const { letters, groups, totalMatches } = groupByLetter(library);
        const first = letters[0];
        set({
          library,
          letters,
          groups,
          totalMatches,
          index: 0,
          queue: first ? groups[first] : [],
          next: [],
          match: 0,
          picks: {},
          choices: [],
          finished: !first,
        });
      },

      choose: (winner) => {
        const s = get();
        const pair = s.queue.slice(s.match, s.match + 2);
        const loser = pair.find((x) => x.id !== winner.id);
        if (!loser) return;

        const letter = s.letters[s.index];
        const choices = [
          ...s.choices,
          {
            round: roundsOf(s.queue.length),
            winnerId: winner.id,
            loserId: loser.id,
            timestamp: Date.now(),
          },
        ];

        const next = [...s.next, winner];
        const end = s.match + 2 >= s.queue.length;

        if (end) {
          // 奇数时最后一位轮空，直接晋级
          for (let i = s.match + 2; i < s.queue.length; i++) next.push(s.queue[i]);
        }

        if (end && next.length === 1) {
          commit(set, get, letter, next[0].id, choices);
          return;
        }
        if (end) {
          set({ choices, queue: next, next: [], match: 0 });
          return;
        }
        set({ choices, next, match: s.match + 2 });
      },

      claim: () => {
        const s = get();
        const only = s.queue[0];
        if (!only || s.queue.length !== 1) return;
        const letter = s.letters[s.index];
        commit(set, get, letter, only.id, s.choices);
      },

      bye: () => {
        const s = get();
        if (s.match >= s.queue.length) return;
        const song = s.queue[s.match];
        const next = [...s.next, song];
        const end = s.match + 1 >= s.queue.length;
        const letter = s.letters[s.index];

        if (end && next.length === 1) {
          commit(set, get, letter, song.id, s.choices);
          return;
        }
        if (end) {
          set({ queue: next, next: [], match: 0 });
          return;
        }
        set({ next, match: s.match + 1 });
      },

      reset: () =>
        set({
          library: [],
          letters: [],
          groups: {},
          totalMatches: 0,
          index: 0,
          picks: {},
          choices: [],
          finished: false,
          ...emptyGroupState(),
        }),
    }),
    { name: 'i-choose-this-song-az' }
  )
);

type Setter = (partial: Partial<State>) => void;
type Getter = () => State;

/** 当前字母决出后：写入 picks，并推进到下一个字母 */
function commit(set: Setter, get: Getter, letter: string, songId: string, choices: Choice[]) {
  const s = get();
  const picks = { ...s.picks, [letter]: songId };
  const nextIndex = s.index + 1;

  if (nextIndex >= s.letters.length) {
    set({ picks, choices, finished: true, ...emptyGroupState() });
    return;
  }

  const nextLetter = s.letters[nextIndex];
  set({
    picks,
    choices,
    index: nextIndex,
    queue: s.groups[nextLetter] ?? [],
    next: [],
    match: 0,
  });
}
