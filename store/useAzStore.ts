'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Song, Choice } from '@/lib/types';
import { groupByLetter } from '@/lib/az';

/**
 * A-Z 挑战状态机
 *
 * 每个字母一屏：直接列出该字母下的所有歌，选一首就进下一格。
 * 被淘汰的其他歌会记成 Choice，供人格引擎使用。
 */

type State = {
  library: Song[];
  letters: string[];
  groups: Record<string, Song[]>;
  index: number;
  /** letter -> songId */
  picks: Record<string, string>;
  choices: Choice[];
  finished: boolean;

  start: (library: Song[]) => void;
  /** 选定当前字母的一首歌 */
  pick: (song: Song) => void;
  /** 这一格留空 */
  skip: () => void;
  reset: () => void;
};

export const useAzStore = create<State>()(
  persist(
    (set, get) => ({
      library: [],
      letters: [],
      groups: {},
      index: 0,
      picks: {},
      choices: [],
      finished: false,

      start: (library) => {
        const { letters, groups } = groupByLetter(library);
        set({
          library,
          letters,
          groups,
          index: 0,
          picks: {},
          choices: [],
          finished: letters.length === 0,
        });
      },

      pick: (song) => {
        const s = get();
        const letter = s.letters[s.index];
        if (!letter) return;

        const candidates = s.groups[letter] ?? [];
        const choices: Choice[] = [...s.choices];
        const now = Date.now();
        for (const other of candidates) {
          if (other.id === song.id) continue;
          choices.push({ round: 1, winnerId: song.id, loserId: other.id, timestamp: now });
        }

        advance(set, get, { ...s.picks, [letter]: song.id }, choices);
      },

      skip: () => {
        const s = get();
        advance(set, get, s.picks, s.choices);
      },

      reset: () =>
        set({ library: [], letters: [], groups: {}, index: 0, picks: {}, choices: [], finished: false }),
    }),
    {
      name: 'i-choose-this-song-az',
      version: 2,
      // 旧版状态（逐对淘汰）直接丢弃，避免残留数据导致异常
      migrate: () => ({ library: [], letters: [], groups: {}, index: 0, picks: {}, choices: [], finished: false }),
    }
  )
);

type Setter = (partial: Partial<State>) => void;
type Getter = () => State;

function advance(set: Setter, get: Getter, picks: Record<string, string>, choices: Choice[]) {
  const s = get();
  const nextIndex = s.index + 1;
  if (nextIndex >= s.letters.length) {
    set({ picks, choices, finished: true });
    return;
  }
  set({ picks, choices, index: nextIndex });
}
