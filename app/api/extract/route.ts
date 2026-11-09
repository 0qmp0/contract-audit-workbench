import { streamText } from 'ai';
import {
  EXTRACTION_SYSTEM_PROMPT,
  EXTRACTION_USER_PROMPT_TEMPLATE,
  extractionModel,
} from '@/lib/ai';
import { createUIMessageStreamResponse, toUIMessageStream } from 'ai';

export const runtime = 'nodejs'; // 确保在 Node.js 运行时，而不是 Edge

export async function POST(req: Request) {
  const { sourceText } = await req.json();

      if (!sourceText || typeof sourceText !== 'string') {
      return new Response(JSON.stringify({ error: 'sourceText is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      return new Response(JSON.stringify({ error: 'DEEPSEEK_API_KEY 未配置' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

  const result = streamText({
    model: extractionModel,
    system: EXTRACTION_SYSTEM_PROMPT,
    prompt: EXTRACTION_USER_PROMPT_TEMPLATE(sourceText),
    temperature: 0, // 提取任务用低温度，减少随机性
  });
return createUIMessageStreamResponse({
  stream: toUIMessageStream({
    stream: result.stream,
    onError(error) {
      // 服务端打印完整错误，方便终端排查
      console.error('[extract] stream error:', error);
      // 把真实错误信息返回给前端
      if (error == null) return 'unknown error';
      if (typeof error === 'string') return error;
      if (error instanceof Error) return error.message;
      return JSON.stringify(error);
    },
  }),
});
}
