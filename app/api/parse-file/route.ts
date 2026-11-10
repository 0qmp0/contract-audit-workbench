import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: '文件超过 20MB 限制' }, { status: 413 });
    }

    const name = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    if (name.endsWith('.pdf')) {
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      try {
        const parsed = await parser.getText();
        return NextResponse.json({ text: parsed.text });
      } finally {
        await parser.destroy();
      }
    }

    if (name.endsWith('.docx')) {
      const { default: mammoth } = await import('mammoth');
      const { value } = await mammoth.extractRawText({ buffer });
      return NextResponse.json({ text: value });
    }

    // .txt / .md 等纯文本兜底
    return NextResponse.json({ text: buffer.toString('utf-8') });
  } catch (error) {
    console.error('[parse-file] 解析失败:', error);
    return NextResponse.json({ error: '文件解析失败' }, { status: 500 });
  }
}
