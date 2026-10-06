import gem from '@/data/gem.json';
import jay from '@/data/jay.json';
import type { Song } from './types';
import { letterOf } from './pinyin';

/**
 * 数据层抽象。
 *
 * 现在：预置的多歌手曲库（仅元数据）。
 * 未来：把 getSongsByArtist / getSongsByIds 换成 QQ 音乐开放平台 API 即可，
 *       上层页面与组件无需改动。
 */

export type Artist = {
  id: string;
  name: string;
  /** 封面上的短标识 */
  short: string;
  subtitle: string;
  available: boolean;
};

export const ARTISTS: Artist[] = [
  { id: 'gem', name: '邓紫棋', short: 'G.E.M.', subtitle: '预置曲库', available: true },
  { id: 'jay', name: '周杰伦', short: 'Jay', subtitle: '预置曲库', available: true },
];

export const DEFAULT_ARTIST = 'gem';

const LIBRARIES: Record<string, Song[]> = {
  gem: gem as Song[],
  jay: jay as Song[],
};

/** 每位歌曲背后的文案（主观描述，不含音频），按歌手隔离，避免同名歌曲串台 */
const DETAILS: Record<string, Record<string, Partial<Song>>> = {
  gem: {
    泡沫: { story: '从一段感情里看见幻灭，也在破碎之后学会诚实。它是邓紫棋最具代表性的叙事抒情歌之一。' },
    光年之外: { story: '电影《太空旅客》中国区主题曲。宇宙尺度的孤独，被写成一份跨越光年的坚定告白。' },
    句号: { story: '写给一段重要合作关系的告别。她把成长里的不甘与释然都收进了这一枚句号。' },
    来自天堂的魔鬼: { story: '以强烈的节奏和暗黑张力描绘危险吸引力，是她舞台爆发力的代表作。' },
    倒数: { story: '在倒数的时间里，把爱说得更坦诚。这首歌记录的是与当下和解的勇气。' },
    喜欢你: { story: '在《我是歌手》的舞台上重新演绎经典，细腻与爆发同时抵达。' },
    多远都要在一起: { story: '写给远距离的坚持。副歌一出来，所有等待都有了形状。' },
    'A.I.N.Y.': { story: '十八岁写下的歌，成了很多人第一次认识她的入口。' },
    我的秘密: { story: '少女心事的最小单位：不说破，但全写在旋律的缝隙里。' },
    睡公主: { story: '早期作品里最梦幻的一首，也是她童话叙事的起点。' },
    摩天动物园: { story: '用一座动物园比喻成人世界，是她转向态度表达的分水岭。' },
    差不多姑娘: { story: '对「差不多」say no。这首歌的锋利来自她对自己标准的坚持。' },
    很久以后: { story: '写给时间。有些答案要很久以后才肯出现。' },
    透明: { story: '把脆弱摊开来讲的一首歌，编曲极简，情绪极重。' },
    画: { story: '文艺气质最浓的一首，像用声音画一幅没有边界的画。' },
    岩石里的花: { story: '在最硬的地方开花，是她写给自己也写给听众的鼓励。' },
    夜空中最亮的星: { story: '现场版里那一声爆发，让这首翻唱有了属于她的版本。' },
    灰狼: { story: '野性、实验、带点危险气息，是她曲风边界最宽的一次尝试。' },
    Hell: { story: '暗黑与爆发并存，舞台上的她在这首歌里几乎不留余地。' },
    回忆的沙漏: { story: '早期最耐听的慢歌之一，像把回忆倒过来再数一遍。' },
    新的心跳: { story: '同名专辑的主打。她说这是重新开始的心跳，也是整张专辑的宣言。' },
    一路逆风: { story: '写给所有逆着风走的人。倔强不是姿态，是她的行进方式。' },
    你不是真正的快乐: { story: '在《我是歌手》舞台上的翻唱，把一首别人的歌唱成了自己的处境。' },
    你把我灌醉: { story: '现场版的高音爆发点，也是那一季舞台记忆里最热的一幕。' },
  },
  jay: {
    七里香: { story: '整张专辑的夏天气味都浓缩在这一首里。前奏一响，就是那年教室外的操场。' },
    晴天: { story: '关于青春里没说出口的那句话。它几乎是一代人的共同记忆坐标。' },
    稻香: { story: '写给所有在城市里迷路的人：回家吧，回到最初的美好。' },
    青花瓷: { story: '中国风的分水岭。他把釉色、烟雨和留白都写进了旋律里。' },
    夜曲: { story: '以古典钢琴开篇，悼念式的温柔。整张《十一月的萧邦》从这一首开始。' },
    简单爱: { story: '最简单的和弦，最持久的喜欢。它定义了千禧年初的甜蜜。' },
    告白气球: { story: '轻快的法式浪漫，塞纳河畔的气味。后期传唱度最高的一首。' },
    双截棍: { story: '说唱、摇滚、功夫电影的混血。它让中文说唱第一次成为主流声音。' },
    龙卷风: { story: '出道专辑里最被反复翻唱的一首，也是很多人认识他的第一首慢歌。' },
    星晴: { story: '一把吉他、一片星空。出道时最干净的一次表达。' },
    东风破: { story: '中国风的起点。琵琶与二胡第一次和 R&B 节奏自然长在一起。' },
    听妈妈的话: { story: '用最轻松的口气讲最认真的道理，后来真的被写进了教材。' },
    菊花台: { story: '电影《满城尽带黄金甲》片尾曲。中国风里最苍凉的一次收束。' },
    兰亭序: { story: '把书法写进旋律。行云流水的编曲，像一次临帖。' },
    烟花易冷: { story: '用一座城的兴衰写一段等待，沧桑感是他中国风的另一面。' },
    不能说的秘密: { story: '同名电影的主题曲。钢琴一响，故事就已经开始了。' },
    等你下课: { story: '一把吉他，一段没赶上的青春。发行多年后依然在榜单上。' },
    Mojito: { story: '拉丁节奏里的一次度假。他难得如此轻松。' },
  },
};

/** 生成跳转至官方平台的搜索链接（站内不播放任何音频） */
const officialLinks = (artist: string, title: string): Song['links'] => [
  {
    label: '在 QQ 音乐收听',
    url: `https://y.qq.com/portal/search.html#page=1&searchid=1&remoteplace=txt.yqq.top&t=song&w=${encodeURIComponent(
      `${artist} ${title}`
    )}`,
  },
];

const decorate = (artistId: string, artist: string, song: Song): Song => ({
  ...song,
  ...DETAILS[artistId]?.[song.title],
  letter: song.letter ?? letterOf(song.title),
  links: officialLinks(artist, song.title),
});

const cache: Record<string, Song[]> = {};

/** 指定歌手的完整曲库（按热度大致排序，越靠前越为主流） */
export function getSongsByArtist(artistId: string = DEFAULT_ARTIST): Song[] {
  if (!cache[artistId]) {
    const seen = new Set<string>();
    cache[artistId] = (LIBRARIES[artistId] ?? [])
      .filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)))
      .map((s) => decorate(artistId, s.artist, s));
  }
  return cache[artistId];
}

/** 兼容旧调用 */
export function getPopularSongs(artistId: string = DEFAULT_ARTIST): Song[] {
  return getSongsByArtist(artistId);
}

export function getArtist(artistId: string): Artist | undefined {
  return ARTISTS.find((a) => a.id === artistId);
}

export function artistName(artistId: string): string {
  return getArtist(artistId)?.name ?? '未知歌手';
}

let allCache: Song[] | null = null;

/** 全部歌手的曲库（用于按 id 还原挑战链接） */
export function getAllSongs(): Song[] {
  if (!allCache) allCache = ARTISTS.flatMap((a) => getSongsByArtist(a.id));
  return allCache;
}

export function getSongsByIds(ids: string[]): Song[] {
  const byId = new Map(getAllSongs().map((s) => [s.id, s]));
  return ids.map((id) => byId.get(id)).filter((s): s is Song => Boolean(s));
}

export function getSongById(id: string): Song | undefined {
  return getAllSongs().find((s) => s.id === id);
}
