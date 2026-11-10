import path from 'node:path';

import { searchLegislation } from '@ansvar/chinese-law-mcp/dist/tools/search-legislation.js';
import Database from '@ansvar/mcp-sqlite';

/**
 * 本地法律知识库：基于 @ansvar/chinese-law-mcp 的 SQLite 全文库
 * （1,188 部法律法规 / 62,981 条条文，FTS5 trigram 中文检索）。
 * 仅可在服务端使用（Node 运行时）。
 */

const DB_PATH = path.join(
  process.cwd(),
  'node_modules',
  '@ansvar',
  'chinese-law-mcp',
  'data',
  'database.db',
);

const MAX_HITS = 3;

let db: Database | null = null;

function getDb(): Database {
  if (!db) {
    db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
  }
  return db;
}

/**
 * 按字段名在法律库中做全文检索，返回条文标题 + 内容片段的摘要。
 * 未命中或查询失败返回 null（不阻断主流程）。
 */
export async function getKnowledgeContext(fieldName: string): Promise<string | null> {
  const query = fieldName.trim();
  if (!query) return null;

  try {
    const response = await searchLegislation(getDb(), { query, limit: MAX_HITS });
    const hits = response.results;
    if (!hits.length) return null;

    return hits
      .map(
        (hit) =>
          `《${hit.document_title}》${hit.provision_ref}：${hit.snippet.replaceAll('>>>', '「').replaceAll('<<<', '」')}`,
      )
      .join('\n');
  } catch (error) {
    console.error('[knowledge-base] 检索失败:', error);
    return null;
  }
}
