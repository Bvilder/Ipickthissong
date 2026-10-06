'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Song } from '@/lib/types';
import type { AlbumVote } from '@/lib/co';

/**
 * 专辑共创评分状态
 */
type State = {
  artistId: string;
  album: string;
  songs: Song[];
  name: string;
  /** 专辑总分 0-10 */
  albumScore: number;
  /** 每首曲目分 0-10 */
  scores: number[];
  comment: string;
  done: boolean;
  /** 房间里已经打过分的其他人 */
  people: AlbumVote[];

  setup: (input: {
    artistId: string;
    album: string;
    songs: Song[];
    name: string;
    people?: AlbumVote[];
  }) => void;
  setAlbumScore: (v: number) => void;
  setSongScore: (index: number, v: number) => void;
  setComment: (v: string) => void;
  finish: () => void;
  reset: () => void;
};

export const useCoStore = create<State>()(
  persist(
    (set, get) => ({
      artistId: 'gem',
      album: '',
      songs: [],
      name: '',
      albumScore: 7,
      scores: [],
      comment: '',
      done: false,
      people: [],

      setup: ({ artistId, album, songs, name, people = [] }) =>
        set({
          artistId,
          album,
          songs,
          name,
          people,
          albumScore: 7,
          scores: new Array(songs.length).fill(7),
          comment: '',
          done: false,
        }),

      setAlbumScore: (v) => set({ albumScore: v }),
      setSongScore: (index, v) => {
        const scores = [...get().scores];
        scores[index] = v;
        set({ scores });
      },
      setComment: (v) => set({ comment: v.slice(0, 60) }),
      finish: () => set({ done: true }),

      reset: () =>
        set({
          artistId: 'gem',
          album: '',
          songs: [],
          name: '',
          albumScore: 7,
          scores: [],
          comment: '',
          done: false,
          people: [],
        }),
    }),
    {
      name: 'i-choose-this-song-co',
      version: 4,
      migrate: () => ({
        artistId: 'gem',
        album: '',
        songs: [],
        name: '',
        albumScore: 7,
        scores: [],
        comment: '',
        done: false,
        people: [],
      }),
    }
  )
);
