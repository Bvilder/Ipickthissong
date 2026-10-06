'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Song, CoPerson } from '@/lib/types';

/**
 * 好友共创状态：对同一批歌逐首打分
 */
type State = {
  artistId: string;
  songs: Song[];
  name: string;
  scores: number[];
  index: number;
  done: boolean;
  /** 房间里已经打过分的其他人 */
  people: CoPerson[];

  setup: (input: { artistId: string; songs: Song[]; name: string; people?: CoPerson[] }) => void;
  rate: (score: number) => void;
  back: () => void;
  reset: () => void;
};

export const useCoStore = create<State>()(
  persist(
    (set, get) => ({
      artistId: 'gem',
      songs: [],
      name: '',
      scores: [],
      index: 0,
      done: false,
      people: [],

      setup: ({ artistId, songs, name, people = [] }) =>
        set({
          artistId,
          songs,
          name,
          people,
          scores: new Array(songs.length).fill(0),
          index: 0,
          done: false,
        }),

      rate: (score) => {
        const s = get();
        const scores = [...s.scores];
        scores[s.index] = score;
        const nextIndex = s.index + 1;
        set({
          scores,
          index: nextIndex,
          done: nextIndex >= s.songs.length,
        });
      },

      back: () => {
        const s = get();
        if (s.index <= 0) return;
        const scores = [...s.scores];
        scores[s.index - 1] = 0;
        set({ index: s.index - 1, scores, done: false });
      },

      reset: () =>
        set({ artistId: 'gem', songs: [], name: '', scores: [], index: 0, done: false, people: [] }),
    }),
    { name: 'i-choose-this-song-co' }
  )
);
