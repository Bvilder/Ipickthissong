/**
 * 全局类型定义
 *
 * 说明：本项目只处理「歌曲元数据」，不涉及任何音频文件。
 */

/** 歌曲元数据（不含任何音频地址） */
export type Song = {
  id: string;
  title: string;
  artist: string;
  album: string;
  year: number;
  genre: string[];
  tags: string[];
  /** 是否为翻唱 / 现场演绎版本 */
  cover?: boolean;
  /** 官方封面地址；有值时 AlbumCover 会渲染真实封面，否则用程序化生成的封面 */
  coverUrl?: string;
  /** 歌名首字母索引（A-Z 挑战用，缺失时由 lib/pinyin 计算） */
  letter?: string;
  /** 精确到日的发行日期，接入官方曲库后才有值 */
  releaseDate?: string;
  /** 歌曲背后的故事文案 */
  story?: string;
  /** 跳转至官方平台的链接（不提供站内播放） */
  links?: { label: string; url: string }[];
};

/** 一次二选一的结果 */
export type Choice = {
  round: number;
  winnerId: string;
  loserId: string;
  timestamp: number;
};

/** 人格维度 */
export type Dimension = {
  name: string;
  score: number;
  desc: string;
};

/** 一条维度证据 */
export type Reason = { dimension: string; score: number; text: string };

/** AI 人格结果 */
export type PersonalityResult = {
  tags: string[];
  dimensions: Dimension[];
  verdict: string;
  /** 赛程里的关键瞬间，用于结果页和分享卡 */
  highlights: string[];
  /** 分数是怎么来的（可解释性） */
  reasons: Reason[];
  /** 反叛度 0-100：与「大众偏好」相反的比例 */
  rebellion: number;
  /** 最纠结的一次选择 */
  hesitation?: { winner: string; loser: string; seconds: number };
  /** 结果来源：本地规则引擎 或 大模型 */
  source: 'local' | 'llm';
};

/** 一局游戏 */
export type GameSession = {
  id: string;
  mode: 'bracket32';
  artist: string;
  songs: Song[];
  rounds: Choice[];
  finalSongId?: string;
  createdAt: string;
};

/** 挑战链接里携带的编码数据 */
export type ChallengePayload = {
  v: 1;
  artist: string;
  /** 32 首歌的 id，顺序即种子序位 */
  songs: string[];
  /** 31 场对决中胜者的下标 */
  picks: number[];
  /** 冠军下标 */
  winner: number;
  /** 发起人的人格标签 */
  tags: string[];
};

/** 共创房间里一个人的评分 */
export type CoPerson = {
  /** 昵称 */
  n: string;
  /** 与 songs 等长的评分，1-5 */
  s: number[];
};

/** 好友共创房间（链接里接力传递） */
export type CoRoomPayload = {
  v: 1;
  artistId: string;
  /** 共创歌单（默认 12 首） */
  songs: string[];
  people: CoPerson[];
};

/** 共创结果 */
export type CoResult = {
  /** 默契度 0-100，只有一人时为 undefined */
  harmony?: number;
  level?: string;
  /** 按平均分排序的歌曲（含分歧度） */
  ranking: { songId: string; avg: number; spread: number }[];
  /** 全员高分共鸣曲 */
  resonance: string[];
  /** 分歧最大的一首 */
  biggestGap?: { songId: string; spread: number; high: string; low: string };
  /** 每个人的定位 */
  roles: { name: string; role: string; avg: number }[];
};

/** 两人对比结果 */
export type Matchup = {
  /** 默契度 0-100 */
  score: number;
  level: string;
  championSame: boolean;
  /** 共同保留到四强的歌曲 id */
  sharedSemi: string[];
  /** 分歧最大的一首歌 */
  biggestGap?: { songId: string; gap: number };
};
