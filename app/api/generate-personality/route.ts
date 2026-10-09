import { NextResponse } from 'next/server';
import { getSongsByIds } from '@/lib/musicProvider';
import { generatePersonality } from '@/lib/personality';
import { chatJSON } from '@/lib/llm';
import type { Choice, PersonalityResult } from '@/lib/types';

/**
 * POST /api/generate-personality
 *
 * 入参：{ artist, songs: string[], choices: Choice[], winnerId: string }
 * 出参：PersonalityResult
 *
 * 默认走本地规则引擎（确定性、零成本、可离线演示）。
 * 配置 LLM_API_KEY / LLM_BASE_URL / LLM_MODEL 后自动切换为大模型生成，
 * 失败时静默降级回本地结果，保证 Demo 永远可用。
 */

type Body = {
  artist?: string;
  songs?: string[];
  choices?: Choice[];
  winnerId?: string;
  mode?: 'bracket32' | 'az';
  letterCount?: number;
};

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }

  const songs = getSongsByIds(body.songs ?? []);
  const choices = Array.isArray(body.choices) ? body.choices : [];
  const winnerId = body.winnerId || undefined;

  // 本地规则引擎：任何情况下都能给出一份与选择强相关的结果
  const local = generatePersonality({
    artist: body.artist ?? '未知歌手',
    songs,
    choices,
    winnerId,
    mode: body.mode ?? 'bracket32',
    letterCount: body.letterCount ?? 0,
  });

  const prompt = buildPrompt(body.artist ?? '这位歌手', songs.map((s) => `${s.title}（${s.year}｜${s.tags.join('、')}）`), choices, songs.find((s) => s.id === winnerId)?.title ?? '');

  try {
    const llm = await callLLM(prompt, local);
    if (llm) return NextResponse.json({ ...llm, source: 'llm' } satisfies PersonalityResult);
  } catch {
    // 大模型不可用时，静默降级
  }

  return NextResponse.json(local);
}

function buildPrompt(artist: string, songList: string[], choices: Choice[], champion: string) {
  const path = choices
    .map((c) => `R${c.round}: 选 ${c.winnerId} 弃 ${c.loserId}`)
    .join('; ');
  return [
    `你是音乐人格分析师。以下是用户在「${artist} 32 强淘汰赛」中的真实选择路径。`,
    `候选歌曲：${songList.join('、')}`,
    `选择路径（按轮次）：${path || '（无）'}`,
    `最终冠军：${champion}`,
    '请输出 JSON：{ tags: string[]（3-4 个中文人格标签）, dimensions: [{name,score}]（旋律偏好/节奏敏感/情绪深度/怀旧倾向/冷门挖掘/副歌执念，score 0-100）, verdict: string（不超过 80 字，有传播感，不要像机器报告） }',
  ].join('\n');
}

async function callLLM(prompt: string, local: PersonalityResult): Promise<PersonalityResult | null> {
  // 统一走 lib/llm.ts 的大模型层：未配置 key 时自动返回 null
  const parsed = await chatJSON<Partial<PersonalityResult>>([
    { role: 'system', content: '你是音乐人格分析师，只输出合法 JSON，不要输出任何多余文字。' },
    { role: 'user', content: prompt },
  ]);

  if (!parsed || !parsed.tags || !parsed.dimensions || !parsed.verdict) return null;

  return {
    tags: parsed.tags,
    dimensions: parsed.dimensions.map((d) => ({ name: d.name, score: d.score, desc: d.desc ?? '' })),
    verdict: parsed.verdict,
    // 可解释性证据以本地计算为准，模型给了则覆盖
    highlights: parsed.highlights?.length ? parsed.highlights : local.highlights,
    reasons: parsed.reasons?.length ? parsed.reasons : local.reasons,
    rebellion: local.rebellion,
    hesitation: local.hesitation,
    source: 'llm',
  };
}
