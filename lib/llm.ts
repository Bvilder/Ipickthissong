/**
 * 统一 AI 接入层 ——「接 AI 的端口」
 *
 * 本文件是全站唯一的大模型调用入口。腾讯（或任何接入方）接入时，
 * 只需在项目根目录的 .env.local 里填三个变量，即可把全站 AI 文案
 * （人格判词 / 即时点评 / 专辑乐评 / 字母解读 / 灵魂契合 / DNA 解读）
 * 从本地规则引擎自动升级为真实大模型生成：
 *
 *   LLM_API_KEY=你的密钥
 *   LLM_BASE_URL=https://api.hunyuan.cloud.tencent.com/v1
 *   LLM_MODEL=hunyuan-turbo
 *
 * 兼容所有 OpenAI 格式的 `/chat/completions` 接口：
 *   腾讯混元、DeepSeek、OpenAI、通义千问、Kimi、智谱 GLM 等。
 *
 * 不填 key 时，所有调用返回 null，上层自动降级到本地规则引擎，
 * 保证 Demo 在离线 / 无预算情况下永远可运行。
 *
 * 安全：本文件只应在服务端（Route Handler / Server Component）运行，
 * key 永远不会下发到浏览器。
 */

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export type ChatOptions = {
  /** 要求模型输出 JSON 对象 */
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
};

function cfg() {
  return {
    key: process.env.LLM_API_KEY?.trim() ?? '',
    base: (process.env.LLM_BASE_URL?.trim() ?? 'https://api.hunyuan.cloud.tencent.com/v1').replace(
      /\/+$/,
      ''
    ),
    model: process.env.LLM_MODEL?.trim() ?? 'hunyuan-turbo',
  };
}

/** 是否已配置大模型（true 时全站走真实 AI） */
export function isAIEnabled(): boolean {
  return Boolean(cfg().key);
}

/** 当前接入的模型信息（用于前端展示「AI 已接入」状态） */
export function aiInfo() {
  const { model, base } = cfg();
  return { model, base };
}

/**
 * 调用大模型，返回文本；未配置 / 失败时返回 null。
 * 上层拿到 null 时应降级到本地规则结果。
 */
export async function chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<string | null> {
  const { key, base, model } = cfg();
  if (!key) return null;

  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        temperature: opts.temperature ?? 0.8,
        ...(opts.maxTokens ? { max_tokens: opts.maxTokens } : {}),
        ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
        messages,
      }),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

/** 要求模型输出 JSON 并解析；失败返回 null */
export async function chatJSON<T>(messages: ChatMessage[], opts: ChatOptions = {}): Promise<T | null> {
  const text = await chat(messages, { ...opts, json: true });
  if (!text) return null;
  try {
    const match = text.match(/\{[\s\S]*\}/);
    return JSON.parse(match ? match[0] : text) as T;
  } catch {
    return null;
  }
}
