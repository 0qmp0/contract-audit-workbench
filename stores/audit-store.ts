import { create } from 'zustand';
import type { ExtractedField } from '@/types/field';
import { saveCurrentSession, saveToHistory, type AuditSession } from '@/lib/storage';

interface AuditState {
  selectedFieldId: string | null;
  auditPanelExpanded: boolean;
  currentSessionId: string | null;
  sourceText: string;
  extractedFields: ExtractedField[];
  
  selectField: (id: string | null) => void;
  toggleAuditPanel: () => void;
  setAuditResult: (text: string, fields: ExtractedField[]) => void;
  loadSession: (session: AuditSession) => void;
}

export const useAuditStore = create<AuditState>((set) => ({
  selectedFieldId: null,
  auditPanelExpanded: true,
  currentSessionId: null,
  sourceText: '',
  extractedFields: [],

  selectField: (id) => set({ selectedFieldId: id }),
  toggleAuditPanel: () => set((state) => ({ auditPanelExpanded: !state.auditPanelExpanded })),
  
  setAuditResult: (text, fields) => {
    const sessionId = Date.now().toString();
    const session: AuditSession = {
      id: sessionId,
      title: text.trim().slice(0, 15) + '...',
      createdAt: new Date().toISOString(),
      sourceText: text,
      fields,
    };
    
    set({ 
      sourceText: text, 
      extractedFields: fields,
      selectedFieldId: fields[0]?.id ?? null,
      currentSessionId: sessionId,
    });

    // 异步保存到本地数据库
    saveCurrentSession(session);
    saveToHistory(session);
  },

  loadSession: (session) => {
    set({
      currentSessionId: session.id,
      sourceText: session.sourceText,
      extractedFields: session.fields,
      selectedFieldId: session.fields[0]?.id ?? null,
    });
    saveCurrentSession(session);
  },
}));