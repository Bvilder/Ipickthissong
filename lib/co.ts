import type { CoPerson, CoResult, CoRoomPayload, Song } from './types';
import { decodeJson, encodeJson } from './base64';

/**
 * 好友共创：多人对同一批歌评分，算默契度与分歧曲目
 *
 * 无后端实现：房间数据编码在链接里接力传递，
 * A 评完 → 链接带上 A → B 打开评完 → 链接带上 A+B → C …
 */

export const RATING_STEPS = [
  { score: 5, emoji: '🔁', label: '单曲循环' },
  { score: 4, emoji: '💜', label: '很喜欢' },
  { score: 3, emoji: '🙂', label: '还不错' },
  { score: 2, emoji: '😐', label: '一般' },
  { score: 1, emoji: '🙈', label: '不想听' },
] as const;

export const CO_COUNT = 12;

export function encodeRoom(payload: CoRoomPayload): string {
  return encodeJson(payload);
}

export function decodeRoom(code: string | null | undefined): CoRoomPayload | null {
  const data = decodeJson<CoRoomPayload>(code);
  if (!data || data.v !== 1) return null;
  if (!Array.isArray(data.songs) || !Array.isArray(data.people)) return null;
  if (data.songs.length === 0) return null;
  return data;
}

/** 从曲库里抽一批歌（尽量跨年代，避免全是同一张专辑） */
export function pickSongs(songs: Song[], count = CO_COUNT): Song[] {
  if (songs.length <= count) return [...songs];
  const step = songs.length / count;
  const picked: Song[] = [];
  for (let i = 0; i < count; i++) picked.push(songs[Math.floor(i * step)]);
  return picked;
}

const levelOf = (score: number) => {
  if (score >= 88) return '灵魂共振';
  if (score >= 74) return '高度同频';
  if (score >= 60) return '求同存异';
  if (score >= 45) return '各听各的';
  return '平行宇宙';
};

/** 核心算法 */
export function analyze(songs: Song[], people: CoPerson[]): CoResult {
  const count = songs.length;

  // 每首歌的分数分布
  const stats = songs.map((song, i) => {
    const scores = people.map((p) => p.s[i] ?? 3).filter((s) => s > 0);
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const max = scores.length ? Math.max(...scores) : 0;
    const min = scores.length ? Math.min(...scores) : 0;
    return { songId: song.id, avg, spread: max - min, max, min, title: song.title };
  });

  const ranking = [...stats].sort((a, b) => b.avg - a.avg).map((s) => ({
    songId: s.songId,
    avg: Math.round(s.avg * 10) / 10,
    spread: s.spread,
  }));

  // 共鸣：所有人都给了 4 分以上
  const resonance = stats.filter((s) => s.min >= 4 && people.length > 1).map((s) => s.songId);

  // 分歧最大：极差最大的那首，同时找出最爱的和最不爱的
  let gap = stats[0];
  for (const s of stats) if (s.spread > gap.spread) gap = s;
  let biggestGap: CoResult['biggestGap'];
  if (people.length > 1 && gap && gap.spread > 0) {
    const high = people.find((p) => (p.s[songs.findIndex((x) => x.id === gap.songId)] ?? 0) === gap.max);
    const low = people.find((p) => (p.s[songs.findIndex((x) => x.id === gap.songId)] ?? 0) === gap.min);
    biggestGap = {
      songId: gap.songId,
      spread: gap.spread,
      high: high?.n ?? '有人',
      low: low?.n ?? '有人',
    };
  }

  // 默契度：所有人对所有歌的平均分歧
  let harmony: number | undefined;
  let level: string | undefined;
  if (people.length > 1) {
    let total = 0;
    let slots = 0;
    for (const s of stats) {
      total += s.spread;
      slots += 1;
    }
    const avgSpread = slots ? total / slots : 0; // 0-4
    harmony = Math.max(0, Math.min(100, Math.round(100 - (avgSpread / 4) * 100)));
    level = levelOf(harmony);
  }

  // 每个人的定位
  const overall = people.map((p) => {
    const scores = p.s.slice(0, count).filter((s) => s > 0);
    return { name: p.n, avg: scores.reduce((a, b) => a + b, 0) / Math.max(scores.length, 1) };
  });
  const groupAvg = overall.reduce((a, b) => a + b.avg, 0) / Math.max(overall.length, 1);

  const roles = overall.map((o) => {
    const me = people.find((p) => p.n === o.name)!;
    // 与他人平均的偏离度
    let deviation = 0;
    for (let i = 0; i < count; i++) {
      const others = people.filter((p) => p.n !== o.name).map((p) => p.s[i] ?? 3);
      if (!others.length) continue;
      const otherAvg = others.reduce((a, b) => a + b, 0) / others.length;
      deviation += Math.abs((me.s[i] ?? 3) - otherAvg);
    }
    deviation = deviation / Math.max(count, 1);

    const role =
      people.length === 1
        ? '第一个打分的人'
        : deviation >= 1.4
          ? '独行侠'
          : o.avg >= groupAvg + 0.4
            ? '气氛组组长'
            : o.avg <= groupAvg - 0.4
              ? '毒舌评委'
              : '团队调和剂';

    return { name: o.name, role, avg: Math.round(o.avg * 10) / 10 };
  });

  return { harmony, level, ranking, resonance, biggestGap, roles };
}
