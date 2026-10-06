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
};

export function groupByLetter(songs: Song[]): AzGroups {
  const groups: Record<string, Song[]> = {};
  for (const letter of LETTERS) groups[letter] = [];

  const seen = new Set<string>();
  for (const song of songs) {
    // 防御：同一首歌绝不重复进入分组，否则会出现「两首一样的歌」
    if (seen.has(song.id)) continue;
    seen.add(song.id);

    const letter = letterOf(song.title, song.letter);
    groups[letter] = groups[letter] ?? [];
    groups[letter].push(song);
  }

  const letters = LETTERS.filter((l) => groups[l].length > 0);
  const counts: Record<string, number> = {};
  for (const l of letters) counts[l] = groups[l].length;

  return { letters, groups, counts };
}

export const letterLabel = (letter: string) => (letter === '#' ? '#' : letter);
