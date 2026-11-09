import { get, set, del } from 'idb-keyval';
import type { ExtractedField } from '@/types/field';

export interface AuditSession {
  id: string;
  title: string;
  createdAt: string;
  sourceText: string;
  fields: ExtractedField[];
}

const CURRENT_SESSION_KEY = 'audit_current_session';
const HISTORY_LIST_KEY = 'audit_history_list';

export async function saveCurrentSession(session: AuditSession) {
  await set(CURRENT_SESSION_KEY, session);
}

export async function loadCurrentSession(): Promise<AuditSession | undefined> {
  return await get<AuditSession>(CURRENT_SESSION_KEY);
}

export async function saveToHistory(session: AuditSession) {
  const history = (await get<AuditSession[]>(HISTORY_LIST_KEY)) || [];
  const filtered = history.filter((item) => item.id !== session.id);
  await set(HISTORY_LIST_KEY, [session, ...filtered]);
}

export async function getHistory(): Promise<AuditSession[]> {
  return (await get<AuditSession[]>(HISTORY_LIST_KEY)) || [];
}

export async function clearAllData() {
  await del(CURRENT_SESSION_KEY);
  await del(HISTORY_LIST_KEY);
}