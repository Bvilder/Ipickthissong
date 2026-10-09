import type { Dimension, PersonalityResult, Song } from './types';

/**
 * AI 文案引擎
 *
 * 让「AI」贯穿整个体验，而不是只在最后一张卡上出现：
 * - 对局中：每次选择后的即时点评
 * - 字母表：把你填出的 26 格串成一段有文采的解读
 * - 专辑打分：Pitchfork 风格的短评
 * - 判词证据：解释人格分数是怎么来的
 *
 * 全部为确定性生成（同样输入永远同样输出），
 * 未来可在 app/api 层替换为大模型调用，接口不变。
 */

/** 标签 → 一句话气质（用于即时点评） */
const TAG_MOOD: Record<string, string> = {
  抒情: '把情绪摊开来讲的坦白',
  爆发: '那一下子的全部释放',
  高音: '直冲云霄的那一句',
  科幻: '宇宙尺度的浪漫',
  成长: '成长里那点不甘',
  遗憾: '没能说完的那句话',
  暗黑: '危险又迷人的暗面',
  张力: '绷住不放的那股劲',
  治愈: '被好好安慰了一下的感觉',
  现场: '舞台上的那阵热浪',
  坚定: '认定了就不回头',
  温暖: '有人站在你这边的暖',
  经典: '被时间验证过的旋律',
  甜蜜: '甜但不腻的那一下',
  深情: '情绪的浓度',
  早期: '最初的样子',
  青春: '教室窗外那个夏天',
  心动: '心跳漏一拍的瞬间',
  梦幻: '不肯醒来的那场梦',
  翻唱: '被重新讲过一遍的经典',
  浪漫: '不切实际的美好',
  宇宙: '把孤独写成星系',
  态度: '不肯将就的姿态',
  实验: '不守规矩的尝试',
  自我: '只对自己交代',
  回忆: '旧日子的气味',
  想象: '没发生过的另一种可能',
  脆弱: '承认自己撑不住',
  电影感: '自带画面感的叙事',
  文艺: '文艺到骨子里的表达',
  梦境: '梦和现实的交界',
  自省: '跟自己较劲的那段',
  细腻: '细节里藏着的情绪',
  坚韧: '在硬的地方开花',
  希望: '黑暗里那点光',
  热血: '燃起来的那股冲劲',
  轻快: '轻到能飘起来的节奏',
  英文: '另一种语言的呼吸',
  电子: '电流穿过身体的感觉',
  野性: '不驯服的野',
  节奏: '身体先懂的那部分',
  重制: '被重新擦亮的版本',
  续章: '故事没结束',
  信念: '撑住你的那个东西',
  磅礴: '铺天盖地的宏大',
  伤感: '说不出口的疼',
  哲思: '追问意义的时刻',
  倔强: '逆着风也不拐弯',
  自由: '不被任何东西绑住',
  中国风: '东方的留白与意境',
  说唱: '密集的字句砸下来',
  古典: '被古典浸过的旋律',
  唯美: '美到不敢出声',
  忧伤: '挥之不去的蓝',
  励志: '撑下去的理由',
  钢琴: '黑白键上的独白',
  暗恋: '没说出口的喜欢',
  亲情: '家里那盏灯',
  校园: '操场和课本的味道',
  怀旧: '旧时光的回声',
  出道: '一切开始的地方',
  清新: '干净得像刚下过雨',
  对唱: '两个人各说各的心事',
  秋天: '落叶和凉意',
  沧桑: '被时间打磨过的声音',
  雨天: '雨声里的独处',
  拉丁: '热带的懒散与热情',
  江湖: '快意恩仇的远方',
  夏天: '汗水与汽水的季节',
  校园文艺: '',
  'R&B': '慵懒又讲究的律动',
};

const moodOf = (song: Song) => {
  for (const t of song.tags) {
    const m = TAG_MOOD[t];
    if (m) return m;
  }
  return song.genre.find((g) => TAG_MOOD[g]) ? TAG_MOOD[song.genre.find((g) => TAG_MOOD[g])!] : '某种说不清的吸引力';
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const ROUND_TONE = ['', '你第一次出手就', '你又', '到了这个阶段，你', '半决赛，你', '最后一票，你'];

/**
 * 对局即时点评：基于这一手你选了什么、放弃了什么
 */
export function commentOnChoice(winner: Song, loser: Song, round: number): string {
  const wm = moodOf(winner);
  const lm = moodOf(loser);
  const tone = ROUND_TONE[Math.min(Math.max(round, 1), 5)];
  const seed = hash(winner.id + loser.id);

  const templates = [
    `${tone}选了《${winner.title}》而不是《${loser.title}》——比起${lm}，你更想要${wm}。`,
    `${tone}放弃了${lm}的《${loser.title}》，留下了${wm}的《${winner.title}》。`,
    `《${loser.title}》走了。你留下《${winner.title}》，说明${wm}对你来说更重要。`,
    `${wm}赢了${lm}。这一票投给了《${winner.title}》。`,
  ];

  // 同一歌手的年份差也可以成为点评素材
  if (Math.abs(winner.year - loser.year) >= 6 && seed % 3 === 0) {
    const older = winner.year < loser.year ? winner : loser;
    return `${tone}让${older.year}年的《${older.title}》${older.id === winner.id ? '留了下来' : '走了'}——你对时间的偏好，比想象中明显。`;
  }

  return templates[seed % templates.length];
}

/**
 * 人格分数的证据链：解释每一维度为什么是这个分
 */
export type Reason = { dimension: string; score: number; text: string };

export function explainDimensions(reasons: Reason[]): string {
  if (!reasons.length) return '';
  const r = reasons[0];
  return `${r.dimension} ${r.score} 分，主要来自：${r.text}`;
}

/**
 * A-Z 字母表解读：把填好的格子串成一段话
 */
export function interpretAlphabet(
  picks: Record<string, string>,
  library: Song[]
): { story: string; badges: { title: string; desc: string }[] } {
  const byId = new Map(library.map((s) => [s.id, s]));
  const letters = Object.keys(picks).sort();
  const entries = letters
    .map((l) => ({ letter: l, song: byId.get(picks[l]) }))
    .filter((e): e is { letter: string; song: Song } => Boolean(e.song));

  if (entries.length === 0) return { story: '', badges: [] };

  const first = entries[0];
  const last = entries[entries.length - 1];
  const mid = entries.slice(1, -1);

  let story = '';
  if (entries.length === 1) {
    story = `目前只有一格：${first.letter} 是《${first.song.title}》。字母表才刚刚开始。`;
  } else {
    const midText = mid
      .slice(0, 5)
      .map((e) => `${e.letter} 的《${e.song.title}》`)
      .join('、');
    story =
      `从 ${first.letter} 的《${first.song.title}》出发` +
      (midText ? `，经过 ${midText}${mid.length > 5 ? ` 等 ${mid.length} 格` : ''}` : '') +
      `，一路走到 ${last.letter} 的《${last.song.title}》。` +
      `这 ${entries.length} 首歌排在一起，就是此刻的你。`;
  }

  // ── 成就徽章 ──────────────────────────────────────────
  const badges: { title: string; desc: string }[] = [];
  const filled = entries.map((e) => e.letter).filter((l) => l !== '#');
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  if (filled.length >= 20) badges.push({ title: '字母表收藏家', desc: `填满了 ${filled.length} 个字母` });
  if (filled.includes('A') && filled.includes('Z'))
    badges.push({ title: '首尾呼应', desc: 'A 和 Z 都有你的答案' });
  if (picks['#']) badges.push({ title: '数字派', desc: '连 # 格都没放过' });

  // 连续段落
  let bestRun = 0;
  let run = 0;
  for (const l of alphabet) {
    if (filled.includes(l)) {
      run += 1;
      bestRun = Math.max(bestRun, run);
    } else run = 0;
  }
  if (bestRun >= 4) badges.push({ title: '连击', desc: `连续 ${bestRun} 个字母一气呵成` });

  // 年代与冷门倾向
  const years = entries.map((e) => e.song.year);
  const medYear = median(library.map((s) => s.year));
  const avgYear = years.reduce((a, b) => a + b, 0) / Math.max(years.length, 1);
  if (avgYear <= medYear - 2) badges.push({ title: '时光考古', desc: '你的答案整体偏向更早的年份' });

  const order = new Map(library.map((s, i) => [s.id, i]));
  const avgOrder = entries.reduce((a, e) => a + (order.get(e.song.id) ?? 0), 0) / Math.max(entries.length, 1);
  if (avgOrder > library.length * 0.55)
    badges.push({ title: '冷门猎手', desc: '你挑的大多是歌单后排的歌' });

  if (badges.length === 0) badges.push({ title: '开局', desc: '字母表已经写下了第一笔' });

  return { story, badges: badges.slice(0, 4) };
}

const median = (nums: number[]) => {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/**
 * 专辑乐评（Pitchfork 风格）
 */
export function reviewAlbum(input: {
  album: string;
  artist: string;
  year: number;
  score: number;
  best?: string;
  worst?: string;
  trackCount: number;
}): string {
  const { album, artist, year, score, best, worst, trackCount } = input;
  const bestText = best ? `《${best}》是整张里最亮的一笔` : '';
  const worstText = worst ? `，《${worst}》则显得没那么必要` : '';

  if (score >= 9)
    return `《${album}》几乎挑不出错。${bestText}${worstText}。${year} 年的${artist}，把想说的都说尽了，多一句都嫌吵。`;
  if (score >= 8)
    return `${year} 年的《${album}》是一张完成度很高的作品。${bestText}，撑起了整张的骨架${worstText}。它不完美，但足够让人反复。`;
  if (score >= 7)
    return `《${album}》有明确的方向，也有几处明显的犹豫。${bestText}${worstText}。${trackCount} 首里，大概有一半会被留下。`;
  if (score >= 6)
    return `《${album}》算得上及格，但缺少让人停下来的瞬间。${bestText}${worstText}。它会被播放，但不太会被记住。`;
  if (score >= 4)
    return `《${album}》的问题不是做得不好，而是想说的太多。${worstText || bestText}。${artist}在这里试了一次，但没完全站住。`;
  return `《${album}》是一次明显的失手。${worstText || bestText}。它会被归进「为了完整而听」的那一类。`;
}

// ══════════════════════════════════════════════════════════════
// 以下为新增 AI 元素（同样遵循「规则兜底 + 未来接大模型」原则）
// ══════════════════════════════════════════════════════════════

/** 维度 → 基因编码 */
export const DNA_CODE: Record<string, string> = {
  旋律偏好: 'MEL',
  节奏敏感: 'RHY',
  情绪深度: 'EMO',
  怀旧倾向: 'NOS',
  冷门挖掘: 'DIS',
  副歌执念: 'CHO',
};

/**
 * 音乐 DNA：把 6 维人格编码成一段基因序列，并给出 AI 解读。
 * 「AI 解码你的音乐基因」的核心视觉元素。
 */
export function musicDna(dimensions: Dimension[]): { sequence: string; reading: string } {
  const sequence = dimensions
    .map((d) => `${DNA_CODE[d.name] ?? d.name.slice(0, 1)}${d.score}`)
    .join('·');

  const sorted = [...dimensions].sort((a, b) => b.score - a.score);
  const top = sorted[0];
  const low = sorted[sorted.length - 1];

  const reading =
    `${top.name}（${top.score}）是你的显性基因，${low.name}（${low.score}）是你的隐性基因。` +
    `显性决定了你会被什么击中，隐性决定了你会被什么放过——两段一叠加，就是你独一无二的听感体质。`;

  return { sequence, reading };
}

/**
 * AI 完整人格报告（长文）：替代单句判词，输出一段有纵深的分析。
 */
export function personaReport(input: { artist: string; champion: Song; result: PersonalityResult }): string {
  const { artist, champion, result } = input;
  const sorted = [...result.dimensions].sort((a, b) => b.score - a.score);
  const top = sorted[0];
  const second = sorted[1];
  const low = sorted[sorted.length - 1];

  const open =
    `在「${artist}」的歌里，你最终把票投给了《${champion.title}》。` +
    `这不是一次随机的偏好，而是一条高度一致的线索：你的${top.name}（${top.score}）明显高于常人，` +
    `${second.name}（${second.score}）紧随其后。`;

  const mid =
    `你的每一次「留下 / 送走」，都在反复确认同一件事——${top.desc}。` +
    `相比之下，${low.name}（${low.score}）是你最不在意的维度，${low.desc}对你几乎构不成干扰。`;

  const end =
    result.rebellion >= 70
      ? `而且你的反叛度高达 ${result.rebellion}%，你并不在乎大众在听什么，只忠于自己的耳朵。`
      : result.rebellion >= 45
        ? `你的反叛度是 ${result.rebellion}%，在跟随与反骨之间保持着微妙的平衡。`
        : `你的反叛度只有 ${result.rebellion}%，你的耳朵和大众的耳朵长得很像，这本身也是一种答案。`;

  return `${open}${mid}${end} 音乐人格不是测试题做出来的，是你一次次选择之后，露出来的形状。`;
}

/**
 * 好友灵魂契合：分析两人的打分关系，给出关系命名与解读。
 */
export function soulMatch(input: {
  a: string;
  b: string;
  harmony: number;
  aAvg: number;
  bAvg: number;
}): { label: string; text: string } {
  const { a, b, harmony, aAvg, bAvg } = input;
  const gap = Math.abs(aAvg - bAvg);

  if (harmony >= 85) {
    return {
      label: '音乐灵魂伴侣',
      text: `你们几乎用同一套标准在听歌。${gap < 0.5 ? '连打分都咬得很紧，' : ''}${a} 和 ${b} 的耳朵，可能上辈子就认识。`,
    };
  }
  if (harmony >= 70) {
    return {
      label: '审美同频',
      text: `大方向高度一致，只有几首歌存在分歧。你们听得到彼此，也各自留了一点空间。`,
    };
  }
  if (harmony >= 55) {
    return {
      label: '互相补课',
      text: `口味有距离，但正好互补：${a} 喜欢的，${b} 会去听一听；反之亦然。这是一段能互相拓宽的关系。`,
    };
  }
  return {
    label: '审美死对头',
    text: `分歧不小${gap >= 1.5 ? '，一个偏严苛、一个偏慷慨' : ''}。但吵归吵，一起听歌反而最热闹。`,
  };
}

/** 维度 → 关联标签（用于歌单续杯推荐） */
const DIM_TAGS: Record<string, string[]> = {
  旋律偏好: ['抒情', '唯美', '浪漫', '钢琴', '中国风', '古典', '旋律'],
  节奏敏感: ['节奏', '电子', '说唱', '拉丁', '摇滚', 'R&B', '轻快'],
  情绪深度: ['遗憾', '脆弱', '自省', '伤感', '深情', '忧伤', '沧桑'],
  怀旧倾向: ['怀旧', '经典', '青春', '校园', '回忆', '早期', '夏天'],
  冷门挖掘: ['实验', '梦幻', '宇宙', '文艺', '暗黑', '野性', '哲思'],
  副歌执念: ['爆发', '高音', '张力', '热血', '磅礴', '励志', '坚定'],
};

/**
 * AI 歌单续杯：按人格最高维度，从曲库里推荐「你会喜欢的下一批歌」。
 */
export function recommendNext(input: {
  library: Song[];
  pickedIds: string[];
  result: PersonalityResult;
}): Song[] {
  const { library, pickedIds, result } = input;
  const sorted = [...result.dimensions].sort((a, b) => b.score - a.score);
  const tags = DIM_TAGS[sorted[0]?.name ?? '旋律偏好'] ?? [];
  const picked = new Set(pickedIds);

  const scored = library
    .filter((s) => !picked.has(s.id))
    .map((s) => ({ s, hit: s.tags.filter((t) => tags.includes(t)).length }))
    .sort((a, b) => b.hit - a.hit);

  const hits = scored.filter((x) => x.hit > 0).map((x) => x.s);
  const rest = scored.filter((x) => x.hit === 0).map((x) => x.s);
  return [...hits, ...rest].slice(0, 5);
}

// ══════════════════════════════════════════════════════════════
// 音乐人格身份（结果页主角）：把一个结果收敛成一个鲜明的人格形象
// ══════════════════════════════════════════════════════════════

/** 六维 → 人格原型 */
const ARCHETYPES: Record<string, { name: string; icon: string; en: string; slogan: string }> = {
  旋律偏好: { name: '旋律漫游者', icon: '🎵', en: 'Melody Wanderer', slogan: '旋律一响，你就认得出同类' },
  节奏敏感: { name: '节奏脉冲', icon: '🥁', en: 'Rhythm Pulse', slogan: '鼓点一响，身体先替你回答' },
  情绪深度: { name: '情绪深海', icon: '🌊', en: 'Emotion Diver', slogan: '你听的不是歌，是没说出口的话' },
  怀旧倾向: { name: '时光收藏家', icon: '📼', en: 'Time Collector', slogan: '你听的是旧歌，也是旧日子' },
  冷门挖掘: { name: '冷门猎手', icon: '🔭', en: 'Hidden Gem Hunter', slogan: '越冷的位置越容易被你捡到' },
  副歌执念: { name: '副歌捕手', icon: '⚡', en: 'Chorus Catcher', slogan: '副歌一起来，你就投降' },
};

export type PersonaIdentity = {
  /** 主人格名 */
  name: string;
  /** 副人格名（次高维度） */
  sub?: string;
  icon: string;
  en: string;
  slogan: string;
  /** 人格编号，像检测报告编号 */
  id: string;
};

/**
 * 人格身份：把 6 维分数收敛成一个有名字、有图标、有编号的人格形象。
 * 同样的选择永远得到同一个编号，可复现、可分享。
 */
export function personaIdentity(result: PersonalityResult): PersonaIdentity {
  const sorted = [...result.dimensions].sort((a, b) => b.score - a.score);
  const top = ARCHETYPES[sorted[0]?.name ?? ''] ?? ARCHETYPES['旋律偏好'];
  const second = ARCHETYPES[sorted[1]?.name ?? ''];

  const seedStr = result.dimensions.map((d) => `${d.score}`).join('-');
  const id = `MP-${(hash(seedStr) % 0xffffff).toString(16).toUpperCase().padStart(6, '0')}`;

  return {
    name: top.name,
    sub: second && second.name !== top.name ? second.name : undefined,
    icon: top.icon,
    en: top.en,
    slogan: top.slogan,
    id,
  };
}


