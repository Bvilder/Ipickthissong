'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Song } from '@/lib/types';
import type { AlbumVote } from '@/lib/co';

/**
 * 专辑共创评分
 * 只打分曲目，专辑总分由曲目平均自动得出。
 */
type State = {
  artistId: string;
  album: string;
  songs: Song[];
  name: string;
  /** 每首曲目分 0-10 */
  scores: number[];
  comment: string;
  done: boolean;
  people: AlbumVote[];

  setup: (input: {
    artistId: string;
    album: string;
    songs: Song[];
    name: string;
    people?: AlbumVote[];
  }) => void;
  setSongScore: (index: number, v: number) => void;
  setComment: (v: string) => void;
  finish: () => void;
  reset: () => void;
};

const initial = {
  artistId: 'gem',
  album: '',
  songs: [] as Song[],
  name: '',
  scores: [] as number[],
  comment: '',
  done: false,
  people: [] as AlbumVote[],
};

export const useCoStore = create<State>()(
  persist(
    (set, get) => ({
      ...initial,

      setup: ({ artistId, album, songs, name, people = [] }) =>
        set({
          artistId,
          album,
          songs,
          name,
          people,
          scores: new Array(songs.length).fill(7),
          comment: '',
          done: false,
        }),

      setSongScore: (index, v) => {
        const scores = [...get().scores];
        scores[index] = v;
        set({ scores });
      },
      setComment: (v) => set({ comment: v.slice(0, 60) }),
      finish: () => set({ done: true }),
      reset: () => set({ ...initial }),
    }),
    {
      name: 'i-choose-this-song-co',
      version: 5,
      migrate: () => ({ ...initial }),
    }
  )
);
