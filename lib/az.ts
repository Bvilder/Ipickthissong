import type { Song } from './types';
import { LETTERS, letterOf } from './pinyin';

/**
 * A-Z 挑战：把歌单按歌名首字母分组
 */

export type AzGroups = {
  /** 有歌的字母，按 A-Z + # 顺序 */
  letters: string[];
  groups: Record<string, Song[]>;
  /** 每个字母的歌曲数 */
  counts: Record<string, number>;
  /** 需要用户做决定的场次（组内歌曲数 - 1） */
  totalMatches: number;
};

export function groupByLetter(songs: Song[]): AzGroups {
  const groups: Record<string, Song[]> = {};
  for (const letter of LETTERS) groups[letter] = [];

  for (const song of songs) {
    const letter = letterOf(song.title, song.letter);
    groups[letter] = groups[letter] ?? [];
    groups[letter].push(song);
  }

  const letters = LETTERS.filter((l) => groups[l].length > 0);
  const counts: Record<string, number> = {};
  let totalMatches = 0;
  for (const l of letters) {
    counts[l] = groups[l].length;
    totalMatches += Math.max(0, groups[l].length - 1);
  }

  return { letters, groups, counts, totalMatches };
}

export const letterLabel = (letter: string) => (letter === '#' ? '#' : letter);

/** 组内需要几轮（用于展示与权重） */
export const roundsOf = (count: number) => Math.max(1, Math.ceil(Math.log2(Math.max(count, 2))));
