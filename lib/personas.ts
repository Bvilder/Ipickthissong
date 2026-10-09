/**
 * 音乐人格图鉴
 *
 * 收集欲的来源：玩得越多、选得越不一样，点亮的人格越多。
 */
export type Persona = {
  id: string;
  name: string;
  desc: string;
  rare?: boolean;
};

export const PERSONAS: Persona[] = [
  { id: 'melody', name: '旋律原教旨主义者', desc: '旋律一响，你就认得出同类' },
  { id: 'rhythm', name: '节奏体质', desc: '身体比理智先回答' },
  { id: 'emotion', name: '情绪深潜者', desc: '你听的是没说出口的话' },
  { id: 'nostalgia', name: '时光考古员', desc: '旧歌里住着过去的自己' },
  { id: 'discovery', name: '冷门挖掘机', desc: '越冷的位置越容易被你捡到' },
  { id: 'chorus', name: '副歌捕手', desc: '高潮一来，你就投降' },
  { id: 'chorus-max', name: '副歌至上主义', desc: '副歌执念高得离谱', rare: true },
  { id: 'night', name: '深夜考古党', desc: '怀旧倾向异常突出' },
  { id: 'anti-pop', name: '反流行判官', desc: '开局就把大热门送走了', rare: true },
  { id: 'rebuild', name: '经典重塑者', desc: '你的冠军是一首翻唱' },
  { id: 'hexagon', name: '六边形听众', desc: '六维均衡，没有明显偏科', rare: true },
  { id: 'alphabet', name: '字母表收藏家', desc: '完成过一次 A-Z 字母表' },
  { id: 'extreme', name: '极端分子', desc: '某一维高到压过全场', rare: true },
  { id: 'retro', name: '复古狂热', desc: '怀旧倾向接近满分', rare: true },
  { id: 'deep-cut', name: '冷门偏执', desc: '专挑歌单最后一排', rare: true },
  { id: 'harsh', name: '严苛评审', desc: '专辑均分低于 6 分', rare: true },
  { id: 'generous', name: '慷慨听众', desc: '专辑均分 8.5 以上' },
  { id: 'detail', name: '细节控', desc: '同一张专辑里分差拉得很开' },
];

const BY_NAME = new Map(PERSONAS.map((p) => [p.name, p.id]));

/** 把人格标签映射到图鉴 id */
export function idsOfTags(tags: string[]): string[] {
  const out: string[] = [];
  for (const t of tags) {
    const id = BY_NAME.get(t);
    if (id && !out.includes(id)) out.push(id);
  }
  return out;
}

export const TOTAL_PERSONAS = PERSONAS.length;
