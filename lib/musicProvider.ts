import base from '@/data/gem.json';
import type { Song } from './types';
import { letterOf } from './pinyin';

/**
 * 数据层抽象。
 *
 * 现在：预置的本地曲库（仅元数据）。
 * 未来：把 getSongsByArtist / getSongsByIds 换成 QQ 音乐开放平台 API 即可，
 *       上层页面与组件无需改动。
 */

/** 每位歌曲背后的文案（主观描述，不含音频） */
const details: Record<string, Partial<Song>> = {
  泡沫: {
    story: '从一段感情里看见幻灭，也在破碎之后学会诚实。它是邓紫棋最具代表性的叙事抒情歌之一。',
  },
  光年之外: {
    story: '电影《太空旅客》中国区主题曲。宇宙尺度的孤独，被写成一份跨越光年的坚定告白。',
  },
  句号: {
    story: '写给一段重要合作关系的告别。她把成长里的不甘与释然都收进了这一枚句号。',
  },
  来自天堂的魔鬼: {
    story: '以强烈的节奏和暗黑张力描绘危险吸引力，是她舞台爆发力的代表作。',
  },
  倒数: {
    story: '在倒数的时间里，把爱说得更坦诚。这首歌记录的是与当下和解的勇气。',
  },
  喜欢你: {
    story: '在《我是歌手》的舞台上重新演绎经典，细腻与爆发同时抵达。',
  },
  多远都要在一起: {
    story: '写给远距离的坚持。副歌一出来，所有等待都有了形状。',
  },
  'A.I.N.Y.': {
    story: '十八岁写下的歌，成了很多人第一次认识她的入口。',
  },
  我的秘密: {
    story: '少女心事的最小单位：不说破，但全写在旋律的缝隙里。',
  },
  睡公主: {
    story: '早期作品里最梦幻的一首，也是她童话叙事的起点。',
  },
  摩天动物园: {
    story: '用一座动物园比喻成人世界，是她转向态度表达的分水岭。',
  },
  差不多姑娘: {
    story: '对「差不多」say no。这首歌的锋利来自她对自己标准的坚持。',
  },
  很久以后: {
    story: '写给时间。有些答案要很久以后才肯出现。',
  },
  透明: {
    story: '把脆弱摊开来讲的一首歌，编曲极简，情绪极重。',
  },
  画: {
    story: '文艺气质最浓的一首，像用声音画一幅没有边界的画。',
  },
  岩石里的花: {
    story: '在最硬的地方开花，是她写给自己也写给听众的鼓励。',
  },
  夜空中最亮的星: {
    story: '现场版里那一声爆发，让这首翻唱有了属于她的版本。',
  },
  灰狼: {
    story: '野性、实验、带点危险气息，是她曲风边界最宽的一次尝试。',
  },
  Hell: {
    story: '暗黑与爆发并存，舞台上的她在这首歌里几乎不留余地。',
  },
  回忆的沙漏: {
    story: '早期最耐听的慢歌之一，像把回忆倒过来再数一遍。',
  },
  新的心跳: {
    story: '同名专辑的主打。她说这是重新开始的心跳，也是整张专辑的宣言。',
  },
  一路逆风: {
    story: '写给所有逆着风走的人。倔强不是姿态，是她的行进方式。',
  },
  你不是真正的快乐: {
    story: '在《我是歌手》舞台上的翻唱，把一首别人的歌唱成了自己的处境。',
  },
  你把我灌醉: {
    story: '现场版的高音爆发点，也是那一季舞台记忆里最热的一幕。',
  },
};

/** 歌手列表：目前只开放一位，其余留给后续接入 */
export const ARTISTS = [
  {
    id: 'gem',
    name: '邓紫棋',
    subtitle: 'G.E.M. · 预置曲库',
    available: true,
  },
  {
    id: 'more',
    name: '更多歌手',
    subtitle: '接入 QQ 音乐开放平台后开放',
    available: false,
  },
] as const;

/** 生成跳转至官方平台的搜索链接（站内不播放任何音频） */
const officialLinks = (title: string): Song['links'] => [
  {
    label: '在 QQ 音乐收听',
    url: `https://y.qq.com/portal/search.html#page=1&searchid=1&remoteplace=txt.yqq.top&t=song&w=${encodeURIComponent(
      `邓紫棋 ${title}`
    )}`,
  },
];

const decorate = (song: Song): Song => ({
  ...song,
  ...details[song.title],
  letter: song.letter ?? letterOf(song.title),
  links: officialLinks(song.title),
});

let cache: Song[] | null = null;

/** 当前歌手的完整曲库（按热度大致排序，越靠前越为主流） */
export function getSongsByArtist(): Song[] {
  if (!cache) {
    const seen = new Set<string>();
    cache = (base as Song[])
      .filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)))
      .map(decorate);
  }
  return cache;
}

/** 兼容旧调用：热门曲目 */
export function getPopularSongs(): Song[] {
  return getSongsByArtist();
}

/** 按 id 还原歌曲（挑战链接用） */
export function getSongsByIds(ids: string[]): Song[] {
  const byId = new Map(getSongsByArtist().map((s) => [s.id, s]));
  return ids.map((id) => byId.get(id)).filter((s): s is Song => Boolean(s));
}

export function getSongById(id: string): Song | undefined {
  return getSongsByArtist().find((s) => s.id === id);
}
