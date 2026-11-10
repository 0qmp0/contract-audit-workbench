import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'DASHSCOPE_API_KEY is not configured' }, { status: 500 });
    }

    // 调用阿里云百炼文生图接口（wan2.7-image 仅支持同步调用，直接返回图片 URL）
    const response = await fetch(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'wan2.7-image', // 万相文生图（华北2 北京地域免费额度）
          input: {
            messages: [
              {
                role: 'user',
                content: [{ text: prompt }],
              },
            ],
          },
          parameters: { size: '1024*1024', n: 1 },
        }),
      },
    );

    const data = await response.json();

    const content = data.output?.choices?.[0]?.message?.content;
    const imageUrl = Array.isArray(content)
      ? content.find((c: { type?: string }) => c.type === 'image')?.image
      : undefined;

    if (imageUrl) {
      return NextResponse.json({ imageUrl });
    }
    return NextResponse.json({ error: 'Failed to generate image', details: data }, { status: 500 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
