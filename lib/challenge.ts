import type { ChallengePayload, Choice, Matchup, Song } from './types';
import { decodeJson, encodeJson } from './base64';

/**
 * 好友挑战：编码 / 解码 / 对比
 * 链接里带的是「整局赛程」，不依赖后端存储，刷新和转发都不会失效。
 */

export function encodeChallenge(payload: ChallengePayload): string {
  return encodeJson(payload);
}

export function decodeChallenge(code: string | null | undefined): ChallengePayload | null {
  const data = decodeJson<ChallengePayload>(code);
  if (!data || data.v !== 1) return null;
  if (!Array.isArray(data.songs) || !Array.isArray(data.picks)) return null;
  if (data.songs.length !== 32 || data.picks.length !== 31) return null;
  return data;
}

/** 把选择记录转成 picks（每场胜者在歌曲数组中的下标） */
export function choicesToPicks(songs: Song[], choices: Choice[]): number[] {
  const index = new Map(songs.map((s, i) => [s.id, i]));
  return choices.map((c) => index.get(c.winnerId) ?? -1);
}

/** 由 picks 反向还原成 Choice 列表（用于给好友算人格） */
export function picksToChoices(songs: Song[], picks: number[]): Choice[] {
  const out: Choice[] = [];
  let queue = songs.map((_, i) => i);
  let round = 1;
  let p = 0;
  while (queue.length > 1 && p < picks.length) {
    const next: number[] = [];
    for (let i = 0; i < queue.length; i += 2) {
      const a = queue[i];
      const b = queue[i + 1];
      const w = picks[p++];
      if (w !== a && w !== b) return out;
      const loser = w === a ? b : a;
      out.push({ round, winnerId: songs[w].id, loserId: songs[loser].id, timestamp: 0 });
      next.push(w);
    }
    queue = next;
    round += 1;
  }
  return out;
}

/** 每首歌活到第几轮：1 = 首轮出局，6 = 冠军 */
export function survivalMap(songs: Song[], picks: number[]): Map<string, number> {
  const depth = new Map<string, number>();
  let queue = songs.map((_, i) => i);
  let round = 1;
  let p = 0;
  while (queue.length > 1 && p < picks.length) {
    const next: number[] = [];
    for (let i = 0; i < queue.length; i += 2) {
      const a = queue[i];
      const b = queue[i + 1];
      const w = picks[p++];
      if (w !== a && w !== b) return depth;
      const loser = w === a ? b : a;
      depth.set(songs[loser].id, round);
      depth.set(songs[w].id, round + 1);
      next.push(w);
    }
    queue = next;
    round += 1;
  }
  if (queue.length === 1) depth.set(songs[queue[0]].id, 6);
  return depth;
}

const jaccard = (a: Set<string>, b: Set<string>) => {
  if (a.size === 0 && b.size === 0) return 1;
  const inter = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);
  return union.size === 0 ? 0 : inter.size / union.size;
};

const levelOf = (score: number) => {
  if (score >= 85) return '灵魂共振';
  if (score >= 70) return '高度同频';
  if (score >= 55) return '半个知己';
  if (score >= 40) return '求同存异';
  return '平行宇宙';
};

/** 计算两人的默契度 */
export function compareRuns(songs: Song[], a: number[], b: number[]): Matchup {
  const da = survivalMap(songs, a);
  const db = survivalMap(songs, b);

  const semiA = new Set([...da].filter(([, d]) => d >= 4).map(([id]) => id));
  const semiB = new Set([...db].filter(([, d]) => d >= 4).map(([id]) => id));
  const eightA = new Set([...da].filter(([, d]) => d >= 3).map(([id]) => id));
  const eightB = new Set([...db].filter(([, d]) => d >= 3).map(([id]) => id));

  const championA = [...da].find(([, d]) => d === 6)?.[0];
  const championB = [...db].find(([, d]) => d === 6)?.[0];
  const championSame = Boolean(championA) && championA === championB;

  let gapSum = 0;
  let biggestGap: { songId: string; gap: number } | undefined;
  for (const song of songs) {
    const x = da.get(song.id) ?? 0;
    const y = db.get(song.id) ?? 0;
    const gap = Math.abs(x - y);
    gapSum += gap;
    if (!biggestGap || gap > biggestGap.gap) biggestGap = { songId: song.id, gap };
  }
  const avgGap = gapSum / Math.max(songs.length, 1);

  const score = Math.round(
    (championSame ? 40 : 0) +
      jaccard(semiA, semiB) * 25 +
      jaccard(eightA, eightB) * 20 +
      Math.max(0, 1 - avgGap / 3) * 15
  );

  return {
    score: Math.max(0, Math.min(100, score)),
    level: levelOf(score),
    championSame,
    sharedSemi: [...semiA].filter((id) => semiB.has(id)),
    biggestGap: biggestGap && biggestGap.gap > 0 ? biggestGap : undefined,
  };
}
