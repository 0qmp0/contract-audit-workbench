import { NextResponse } from 'next/server';

import { getKnowledgeContext } from '@/lib/knowledge-base';

export const runtime = 'nodejs'; // 法律库为 Node 端 SQLite，不能进 Edge/浏览器

export async function POST(req: Request) {
  try {
    const { names } = await req.json();
    if (!Array.isArray(names)) {
      return NextResponse.json({ error: 'names must be an array' }, { status: 400 });
    }

    const uniqueNames = [
      ...new Set(names.filter((n): n is string => typeof n === 'string' && n.trim().length > 0)),
    ];

    const entries = await Promise.all(
      uniqueNames.map(async (name) => [name, await getKnowledgeContext(name)] as const),
    );

    return NextResponse.json({ hints: Object.fromEntries(entries) });
  } catch (error) {
    console.error('[knowledge] 查询失败:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
