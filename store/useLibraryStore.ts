'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getSongsByArtist, DEFAULT_ARTIST } from '@/lib/musicProvider';
import type { Song } from '@/lib/types';

/**
 * 「我的歌单」
 *
 * 演示阶段：直接把某位歌手的预置曲库当作用户导入的歌单。
 * 未来接入 QQ 音乐授权后，只需把 importDemo 换成真实的歌单拉取即可。
 */
type LibraryState = {
  artistId: string;
  songs: Song[];
  importedAt?: string;
  importDemo: (artistId?: string) => void;
  clear: () => void;
};

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      artistId: DEFAULT_ARTIST,
      songs: [],
      importedAt: undefined,

      importDemo: (artistId) => {
        const id = artistId ?? get().artistId ?? DEFAULT_ARTIST;
        set({ artistId: id, songs: getSongsByArtist(id), importedAt: new Date().toISOString() });
      },

      clear: () => set({ songs: [], importedAt: undefined }),
    }),
    {
      name: 'i-choose-this-song-library',
      version: 3,
      // 旧版曲库结构不同，升级时清空，重新导入
      migrate: () => ({ artistId: DEFAULT_ARTIST, songs: [], importedAt: undefined }),
    }
  )
);
