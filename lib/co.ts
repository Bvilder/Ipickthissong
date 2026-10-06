import type { Song } from './types';
import { decodeJson, encodeJson } from './base64';

/**
 * 专辑共创评分（Pitchfork 风格）
 *
 * 无后端实现：房间数据编码在链接里接力传递，
 * A 打完 → 链接带上 A → B 打开打完 → 链接带上 A+B → C …
 */

/** 一个人的专辑评分 */
export type AlbumVote = {
  n: string;
  /** 专辑总分 0-10 */
  a: number;
  /** 与 songs 等长的曲目分 0-10 */
  s: number[];
  /** 一句话短评 */
  c?: string;
};

export type AlbumRoomPayload = {
  v: 1;
  artistId: string;
  album: string;
  songs: string[];
  people: AlbumVote[];
};

export const SCORE_TIERS = [
  { min: 9.5, label: '传世之作' },
  { min: 9, label: '杰作' },
  { min: 8, label: '优秀' },
  { min: 7, label: '良好' },
  { min: 6, label: '及格' },
  { min: 4, label: '平庸' },
  { min: 2, label: '令人失望' },
  { min: 0, label: '灾难' },
] as const;

export function scoreLabel(score: number): string {
  return SCORE_TIERS.find((t) => score >= t.min)?.label ?? '';
}

export function encodeRoom(payload: AlbumRoomPayload): string {
  return encodeJson(payload);
}

export function decodeRoom(code: string | null | undefined): AlbumRoomPayload | null {
  const data = decodeJson<AlbumRoomPayload>(code);
  if (!data || data.v !== 1) return null;
  if (!Array.isArray(data.songs) || !Array.isArray(data.people)) return null;
  if (!data.songs.length) return null;
  return data;
}

export type AlbumAnalysis = {
  /** 两人以上的默契度 */
  harmony?: number;
  level?: string;
  /** 专辑平均分 */
  avgAlbum: number;
  /** 曲目按平均分排序 */
  tracks: { songId: string; avg: number; spread: number }[];
  /** 分歧最大的曲目 */
  biggestGap?: { songId: string; spread: number; high: string; low: string };
  /** 最接近的曲目 */
  mostAgreed?: { songId: string; spread: number; avg: number };
  /** 每个人的结论 */
  votes: { name: string; album: number; avg: number; best?: string; worst?: string; comment?: string }[];
};

const levelOf = (h: number) =>
  h >= 88 ? '灵魂共振' : h >= 74 ? '高度同频' : h >= 60 ? '求同存异' : h >= 45 ? '各听各的' : '平行宇宙';

export function analyzeAlbum(songs: Song[], people: AlbumVote[]): AlbumAnalysis {
  const n = songs.length;

  const tracks = songs.map((song, i) => {
    const vals = people.map((p) => p.s[i] ?? 5);
    const avg = vals.reduce((a, b) => a + b, 0) / Math.max(vals.length, 1);
    return {
      songId: song.id,
      avg: Math.round(avg * 10) / 10,
      spread: vals.length > 1 ? Math.max(...vals) - Math.min(...vals) : 0,
      max: Math.max(...vals),
      min: Math.min(...vals),
    };
  });

  const sorted = [...tracks].sort((a, b) => b.avg - a.avg);

  let biggestGap: AlbumAnalysis['biggestGap'];
  let mostAgreed: AlbumAnalysis['mostAgreed'];
  if (people.length > 1) {
    let gap = tracks[0];
    for (const t of tracks) if (t.spread > gap.spread) gap = t;
    if (gap && gap.spread > 0) {
      const high = people.find((p) => p.s[songs.findIndex((x) => x.id === gap.songId)] === gap.max);
      const low = people.find((p) => p.s[songs.findIndex((x) => x.id === gap.songId)] === gap.min);
      biggestGap = { songId: gap.songId, spread: gap.spread, high: high?.n ?? '有人', low: low?.n ?? '有人' };
    }
    const agreed = [...tracks].filter((t) => t.spread <= 1).sort((a, b) => b.avg - a.avg)[0];
    if (agreed) mostAgreed = { songId: agreed.songId, spread: agreed.spread, avg: agreed.avg };
  }

  // 默契度：专辑分差 + 曲目分差综合
  let harmony: number | undefined;
  let level: string | undefined;
  if (people.length > 1) {
    const albumSpread = Math.max(...people.map((p) => p.a)) - Math.min(...people.map((p) => p.a));
    const trackSpread = tracks.reduce((a, t) => a + t.spread, 0) / Math.max(n, 1);
    const penalty = (albumSpread / 10) * 0.4 + (trackSpread / 10) * 0.6;
    harmony = Math.max(0, Math.min(100, Math.round(100 - penalty * 100)));
    level = levelOf(harmony);
  }

  const votes = people.map((p) => {
    const vals = p.s.slice(0, n);
    const maxI = vals.indexOf(Math.max(...vals));
    const minI = vals.indexOf(Math.min(...vals));
    return {
      name: p.n,
      album: p.a,
      avg: Math.round((vals.reduce((a, b) => a + b, 0) / Math.max(vals.length, 1)) * 10) / 10,
      best: songs[maxI]?.title,
      worst: songs[minI]?.title,
      comment: p.c,
    };
  });

  const avgAlbum =
    Math.round((people.reduce((a, p) => a + p.a, 0) / Math.max(people.length, 1)) * 10) / 10;

  return {
    harmony,
    level,
    avgAlbum,
    tracks: sorted.map((t) => ({ songId: t.songId, avg: t.avg, spread: t.spread })),
    biggestGap,
    mostAgreed,
    votes,
  };
}
