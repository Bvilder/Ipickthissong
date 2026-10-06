import type { Choice, Dimension, PersonalityResult, Song } from './types';

/**
 * 音乐人格引擎（本地规则版）
 *
 * 输入：一局 32 强淘汰赛的完整选择路径
 * 输出：6 维分数 + 人格标签 + 判词 + 关键瞬间
 *
 * 设计要点：
 * 1. 完全由用户真实选择驱动，两个人选得不同，结果必然不同；
 * 2. 纯函数、可复现（同样的选择路径永远得到同样的结果）；
 * 3. 未来可在 app/api/generate-personality 中切换为腾讯混元 / DeepSeek，
 *    本文件的输出结构即接口契约。
 */

export type DimKey = 'melody' | 'rhythm' | 'emotion' | 'nostalgia' | 'discovery' | 'chorus';

export const DIMENSIONS: { key: DimKey; name: string; desc: string }[] = [
  { key: 'melody', name: '旋律偏好', desc: '你先记住的是那句能不能被哼出来' },
  { key: 'rhythm', name: '节奏敏感', desc: '鼓点一响，身体比理智先回答' },
  { key: 'emotion', name: '情绪深度', desc: '你听的是歌，还是没说出口的话' },
  { key: 'nostalgia', name: '怀旧倾向', desc: '旧歌里住着过去的自己' },
  { key: 'discovery', name: '冷门挖掘', desc: '越冷的位置越容易被你捡到' },
  { key: 'chorus', name: '副歌执念', desc: '高潮来了，你就投降' },
];

const ROUND_NAMES = ['首轮', '16 强', '8 强', '4 强', '决赛'];

/** A-Z 模式没有 32 强概念，轮次用中性说法 */
const roundLabel = (round: number, mode: 'bracket32' | 'az') =>
  mode === 'az' ? `第 ${round} 轮` : ROUND_NAMES[clamp(round - 1, 0, 4)];

/** 标签 → 维度权重 */
const TAG_MAP: Record<string, Partial<Record<DimKey, number>>> = {
  抒情: { melody: 2, emotion: 2 },
  爆发: { chorus: 3, rhythm: 1 },
  高音: { chorus: 3, melody: 1 },
  科幻: { melody: 1, discovery: 1 },
  成长: { emotion: 1, nostalgia: 1 },
  遗憾: { emotion: 3, nostalgia: 1 },
  暗黑: { emotion: 2, rhythm: 1 },
  张力: { chorus: 3 },
  治愈: { melody: 2, emotion: 2 },
  现场: { chorus: 2, rhythm: 1 },
  坚定: { emotion: 1, chorus: 1 },
  温暖: { melody: 2 },
  经典: { nostalgia: 3, melody: 1 },
  甜蜜: { melody: 1, emotion: 1 },
  深情: { emotion: 3, melody: 1 },
  早期: { nostalgia: 3 },
  青春: { nostalgia: 2, emotion: 1 },
  心动: { melody: 2 },
  梦幻: { melody: 2, discovery: 1 },
  翻唱: { nostalgia: 2, melody: 1 },
  浪漫: { melody: 2, emotion: 1 },
  宇宙: { melody: 1, discovery: 2 },
  态度: { rhythm: 2, chorus: 1 },
  实验: { discovery: 3, rhythm: 1 },
  自我: { emotion: 2, discovery: 1 },
  回忆: { nostalgia: 3, emotion: 1 },
  想象: { discovery: 2, melody: 1 },
  脆弱: { emotion: 3, melody: 1 },
  电影感: { melody: 2, emotion: 1 },
  文艺: { melody: 3, discovery: 1 },
  梦境: { melody: 2, discovery: 2 },
  自省: { emotion: 3, discovery: 1 },
  细腻: { melody: 2, emotion: 2 },
  坚韧: { emotion: 2, chorus: 1 },
  希望: { melody: 1, emotion: 1 },
  热血: { chorus: 3, rhythm: 1 },
  轻快: { rhythm: 2, melody: 1 },
  英文: { rhythm: 1 },
  电子: { rhythm: 3, discovery: 1 },
  野性: { rhythm: 2, chorus: 2 },
  节奏: { rhythm: 3 },
  重制: { nostalgia: 3 },
  续章: { nostalgia: 2 },
  信念: { chorus: 2, emotion: 1 },
  磅礴: { chorus: 3, melody: 1 },
  伤感: { emotion: 3, nostalgia: 1 },
  哲思: { emotion: 2, discovery: 2 },
  倔强: { emotion: 2, chorus: 1 },
  自由: { melody: 2, discovery: 1 },
  中国风: { melody: 3, nostalgia: 2 },
  说唱: { rhythm: 3, chorus: 1 },
  古典: { melody: 2, nostalgia: 1 },
  唯美: { melody: 3, emotion: 1 },
  忧伤: { emotion: 3, melody: 1 },
  励志: { chorus: 2, emotion: 1 },
  钢琴: { melody: 3, emotion: 1 },
  暗恋: { emotion: 2, melody: 1 },
  亲情: { emotion: 2, nostalgia: 1 },
  校园: { nostalgia: 2, melody: 1 },
  怀旧: { nostalgia: 3, emotion: 1 },
  出道: { nostalgia: 3 },
  清新: { melody: 2, discovery: 1 },
  对唱: { melody: 2, emotion: 1 },
  江湖: { nostalgia: 2, discovery: 1 },
  沧桑: { emotion: 3, nostalgia: 1 },
  雨天: { emotion: 2, melody: 1 },
  夏天: { nostalgia: 1, melody: 1 },
  秋天: { emotion: 2, nostalgia: 1 },
  拉丁: { rhythm: 3, discovery: 1 },
  'R&B': { rhythm: 2, melody: 1 },
};

/** 流派 → 维度权重 */
const GENRE_MAP: Record<string, Partial<Record<DimKey, number>>> = {
  摇滚: { rhythm: 2, chorus: 1 },
  嘻哈: { rhythm: 3 },
  说唱: { rhythm: 3, chorus: 1 },
  电子: { rhythm: 2, discovery: 1 },
  中国风: { melody: 3, nostalgia: 2 },
  民谣: { melody: 2, emotion: 1 },
  拉丁: { rhythm: 3, discovery: 1 },
  'R&B': { rhythm: 2, melody: 1 },
  流行: { melody: 1 },
};

/** 各维度的代表标签 */
const DIM_TAG: Record<DimKey, string> = {
  melody: '旋律原教旨主义者',
  rhythm: '节奏体质',
  emotion: '情绪深潜者',
  nostalgia: '时光考古员',
  discovery: '冷门挖掘机',
  chorus: '副歌捕手',
};

/** 判词用的维度短语 */
const PHRASE: Record<DimKey, { high: string; low: string }> = {
  melody: { high: '旋律一响，你就认得出同类', low: '旋律只是入口，你要的是那句话' },
  rhythm: { high: '鼓点一响，身体先替你做了决定', low: '你对鼓点保持克制，更在意整首的呼吸' },
  emotion: { high: '你把歌当成没说出口的那句话', low: '你不沉溺，听歌对你是一件清醒的事' },
  nostalgia: { high: '你听的是旧歌，也是旧日子', low: '你更在意此刻，而不是那年' },
  discovery: { high: '越冷的位置越容易被你捡到', low: '你尊重那些已经被验证过的答案' },
  chorus: { high: '副歌一起来，你就投降', low: '你要的是整首歌，而不只是那 15 秒' },
};

const DIM_KEYS: DimKey[] = ['melody', 'rhythm', 'emotion', 'nostalgia', 'discovery', 'chorus'];

const zero = (): Record<DimKey, number> => ({
  melody: 0,
  rhythm: 0,
  emotion: 0,
  nostalgia: 0,
  discovery: 0,
  chorus: 0,
});

/** 把一首歌的标签与流派折算成六维向量 */
function vector(song: Song | undefined): Record<DimKey, number> {
  const v = zero();
  if (!song) return v;
  for (const tag of song.tags) {
    const m = TAG_MAP[tag];
    if (m) for (const k of DIM_KEYS) v[k] += m[k] ?? 0;
  }
  for (const g of song.genre) {
    const m = GENRE_MAP[g];
    if (m) for (const k of DIM_KEYS) v[k] += m[k] ?? 0;
  }
  return v;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** 稳定哈希，保证同一局永远选中同一套文案 */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export type PersonalityInput = {
  artist: string;
  /** 参与本局的歌曲，顺序即种子序位（下标越小越主流） */
  songs: Song[];
  /** 选择记录 */
  choices: Choice[];
  /** 冠军（A-Z 模式没有单一冠军，可省略） */
  winnerId?: string;
  mode?: 'bracket32' | 'az';
  /** A-Z 模式下覆盖的字母数 */
  letterCount?: number;
};

export function generatePersonality(input: PersonalityInput): PersonalityResult {
  const { songs, choices, winnerId, mode = 'bracket32', letterCount = 0 } = input;
  const byId = new Map(songs.map((s) => [s.id, s]));
  const seedOf = new Map(songs.map((s, i) => [s.id, i]));
  const n = Math.max(songs.length, 2);

  /** 热度：0 = 最冷门，1 = 最主流 */
  const heat = (id: string) => 1 - (seedOf.get(id) ?? 0) / (n - 1);

  const years = songs.map((s) => s.year);
  const minY = Math.min(...years);
  const maxY = Math.max(...years);
  /** 年代感：1 = 曲库里最早的那一批 */
  const oldness = (id: string) => {
    const s = byId.get(id);
    if (!s || maxY === minY) return 0.5;
    return (maxY - s.year) / (maxY - minY);
  };

  const acc = zero();
  const depth = new Map<string, number>();
  let totalW = 0;
  let upset: { song: Song; round: number } | undefined;

  for (const c of choices) {
    // 越到后面权重越高：决赛的一次选择，比首轮更能说明你是谁
    const w = clamp(c.round, 1, 5);
    totalW += w;

    const winner = byId.get(c.winnerId);
    const loser = byId.get(c.loserId);
    const wv = vector(winner);
    const lv = vector(loser);

    for (const k of DIM_KEYS) {
      acc[k] += w * (wv[k] - 0.35 * lv[k]);
    }
    // 选了冷门 / 年代更久的那首，会分别推高这两个维度
    acc.discovery += w * (heat(c.winnerId) - heat(c.loserId)) * 6;
    acc.nostalgia += w * (oldness(c.winnerId) - 0.35 * oldness(c.loserId)) * 4;

    // 记录每首歌走到第几轮（1 = 首轮出局，6 = 冠军）
    depth.set(c.winnerId, Math.max(depth.get(c.winnerId) ?? 0, c.round + 1));
    depth.set(c.loserId, Math.max(depth.get(c.loserId) ?? 0, c.round));

    if (loser && (!upset || heat(loser.id) > heat(upset.song.id))) {
      upset = { song: loser, round: c.round };
    }
  }

  const champion = winnerId ? byId.get(winnerId) : undefined;
  const championVector = vector(champion);

  // 冠军单独加权：它代表你最后的答案
  if (champion) {
    for (const k of DIM_KEYS) acc[k] += totalW * 0.12 * championVector[k];
  }

  const weight = Math.max(totalW, 1);
  const raw: Record<DimKey, number> = zero();
  for (const k of DIM_KEYS) raw[k] = (acc[k] / weight) * 10;

  // 六维之间做一次相对展开，保证雷达图有可见的形状，同时落在 42-96 之间
  const values = DIM_KEYS.map((k) => raw[k]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(max - min, 10);

  const scored = DIM_KEYS.map((k) => ({
    key: k,
    score: Math.round(42 + ((raw[k] - min) / spread) * 54),
  }));
  const scoreOf = new Map(scored.map((s) => [s.key, s.score]));

  const dimensions: Dimension[] = DIMENSIONS.map((d) => ({
    name: d.name,
    desc: d.desc,
    score: scoreOf.get(d.key) ?? 60,
  }));

  const ranked = [...scored].sort((a, b) => b.score - a.score);
  const top = ranked[0];
  const bottom = ranked[ranked.length - 1];

  // ── 人格标签 ──────────────────────────────────────────────
  const tags: string[] = [DIM_TAG[top.key], DIM_TAG[ranked[1].key]];

  const championHeat = champion ? heat(champion.id) : 1;
  if (championHeat <= 0.4) tags.push('冷门挖掘机');
  if ((scoreOf.get('nostalgia') ?? 0) >= 80) tags.push('深夜考古党');
  if (upset && heat(upset.song.id) >= 0.9 && upset.round <= 2) tags.push('反流行判官');
  if (champion?.cover) tags.push('经典重塑者');
  if (top.score - bottom.score <= 12) tags.push('六边形听众');
  if ((scoreOf.get('chorus') ?? 0) >= 88) tags.push('副歌至上主义');
  if (mode === 'az') tags.push('字母表收藏家');

  const uniqueTags = Array.from(new Set(tags)).slice(0, 4);

  // ── 关键瞬间 ──────────────────────────────────────────────
  const highlights: string[] = [];

  if (upset) {
    highlights.push(
      `你在${roundLabel(upset.round, mode)}亲手送走了《${upset.song.title}》，它再也没能回来。`
    );
  }

  let darkHorse: { song: Song; score: number } | undefined;
  for (const [id, d] of depth) {
    const song = byId.get(id);
    if (!song || id === winnerId) continue;
    const s = d + (1 - heat(id)) * 4;
    if (!darkHorse || s > darkHorse.score) darkHorse = { song, score: s };
  }
  if (darkHorse && (1 - heat(darkHorse.song.id)) > 0.3) {
    highlights.push(
      `《${darkHorse.song.title}》一路走到${roundLabel(depth.get(darkHorse.song.id) ?? 1, mode)}，是这局最大的黑马。`
    );
  }

  const finalChoice = choices.find((c) => c.round === 5);
  if (mode === 'bracket32' && finalChoice) {
    const runnerUp = byId.get(finalChoice.loserId);
    if (runnerUp && champion) {
      highlights.push(`最后一票，你给了《${champion.title}》，而不是《${runnerUp.title}》。`);
    }
  }

  if (mode === 'az') {
    // 哪个字母下歌最多 = 纠结最久的一格
    const perLetter = new Map<string, number>();
    for (const c of choices) {
      const letter = byId.get(c.winnerId)?.letter;
      if (letter) perLetter.set(letter, (perLetter.get(letter) ?? 0) + 1);
    }
    const hardest = [...perLetter.entries()].sort((a, b) => b[1] - a[1])[0];
    if (hardest) {
      highlights.push(`字母 ${hardest[0]} 下有 ${hardest[1] + 1} 首歌，是你纠结最久的一格。`);
    }
  }

  // ── 判词 ──────────────────────────────────────────────────
  const hi = PHRASE[top.key];
  const lo = PHRASE[bottom.key];
  const championLine = champion
    ? `${champion.album === '单曲' ? '那首' : `《${champion.album}》里的`}《${champion.title}》`
    : '你的那一首';

  const azTemplates = [
    `${hi.high}，${lo.low}。你为 ${letterCount} 个字母各留下了一首歌——这不是一份歌单，是你的字母表。`,
    `从 A 到 Z，你填满了 ${letterCount} 格。空着的那几格不是遗憾，是你还没遇见的歌。${hi.high}。`,
    `你的字母表长这样：${hi.high}；${lo.low}。${letterCount} 个字母，${letterCount} 首歌，拼出此刻的你。`,
  ];

  const templates = [
    `${hi.high}，${lo.low}。31 次二选一之后，最后留下的是${championLine}——它不是你最熟悉的，但一定是最像你的。`,
    `别人用歌单描述品味，你用淘汰赛描述自己：${DIMENSIONS.find((d) => d.key === top.key)?.name} ${top.score} 分，${DIMENSIONS.find((d) => d.key === bottom.key)?.name} ${bottom.score} 分。终点是${championLine}。`,
    `你的选择很一致：${hi.high}。所以${championLine}从 32 首里活到最后，并不意外。只是${lo.low}。`,
    `把 31 次选择连成一条线，会看到一个人：${hi.high}；${lo.low}。这条线的尽头，站着${championLine}。`,
  ];

  const pool = mode === 'az' ? azTemplates : templates;
  const verdict = pool[hash(`${winnerId ?? 'az'}${choices.length}`) % pool.length];

  return {
    tags: uniqueTags,
    dimensions,
    verdict,
    highlights,
    source: 'local',
  };
}
