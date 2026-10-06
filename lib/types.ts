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

/** AI 人格结果 */
export type PersonalityResult = {
  tags: string[];
  dimensions: Dimension[];
  verdict: string;
  /** 赛程里的关键瞬间，用于结果页和分享卡 */
  highlights: string[];
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
