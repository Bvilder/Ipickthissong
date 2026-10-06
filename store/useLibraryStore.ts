'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getSongsByArtist } from '@/lib/musicProvider';
import type { Song } from '@/lib/types';

/**
 * 「我的歌单」
 *
 * 演示阶段：直接把预置曲库当作用户导入的歌单。
 * 未来接入 QQ 音乐授权后，只需把 importDemo 换成真实的歌单拉取即可。
 */
type LibraryState = {
  songs: Song[];
  importedAt?: string;
  importDemo: () => void;
  reshuffle: () => void;
  clear: () => void;
};

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set) => ({
      songs: [],
      importedAt: undefined,

      importDemo: () =>
        set({ songs: getSongsByArtist(), importedAt: new Date().toISOString() }),

      reshuffle: () =>
        set({ songs: [...getSongsByArtist()].sort(() => Math.random() - 0.5) }),

      clear: () => set({ songs: [], importedAt: undefined }),
    }),
    { name: 'i-choose-this-song-library' }
  )
);
