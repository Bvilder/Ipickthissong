import type { Song } from './types';
import { getSongsByArtist } from './musicProvider';

/** 从曲库里聚合出专辑（单曲不参与聚合） */
export type Album = {
  name: string;
  artist: string;
  year: number;
  songs: Song[];
};

const EXCLUDED = new Set(['单曲']);

export function getAlbums(artistId: string): Album[] {
  const map = new Map<string, Album>();

  for (const song of getSongsByArtist(artistId)) {
    if (EXCLUDED.has(song.album)) continue;
    const cur = map.get(song.album);
    if (cur) {
      cur.songs.push(song);
      cur.year = Math.min(cur.year, song.year);
    } else {
      map.set(song.album, { name: song.album, artist: song.artist, year: song.year, songs: [song] });
    }
  }

  // 只有一首的「专辑」不做评分，避免逐首打分体验过短
  return [...map.values()].filter((a) => a.songs.length >= 2).sort((a, b) => a.year - b.year);
}

export function findAlbum(artistId: string, name: string): Album | undefined {
  return getAlbums(artistId).find((a) => a.name === name);
}
