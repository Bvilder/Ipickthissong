import { NextResponse } from 'next/server';
import { chat, isAIEnabled } from '@/lib/llm';

/**
 * POST /api/ai
 *
 * 通用 AI 端点：任何前端组件都可以把自己的 prompt 发到这里，
 * 由统一的大模型层（lib/llm.ts）处理。
 *
 * 入参：{ prompt, system?, json?, temperature? }
 * 出参：{ enabled, text }
 *
 * - enabled=false 表示未配置 LLM_API_KEY，text 为 null，前端应使用本地规则兜底；
 * - enabled=true  时 text 为模型生成结果。
 */
export async function POST(req: Request) {
  let body: { prompt?: string; system?: string; json?: boolean; temperature?: number } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    body = {};
  }

  const prompt = body.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ enabled: isAIEnabled(), text: null });
  }

  const messages = [
    ...(body.system ? [{ role: 'system' as const, content: body.system }] : []),
    { role: 'user' as const, content: prompt },
  ];

  const text = await chat(messages, { json: body.json, temperature: body.temperature });

  return NextResponse.json({ enabled: isAIEnabled(), text });
}
