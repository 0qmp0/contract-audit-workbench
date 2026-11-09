import { create } from 'zustand';
import type { ExtractedField } from '@/types/field';

interface AuditState {
  selectedFieldId: string | null;
  auditPanelExpanded: boolean;
  currentSessionId: string | null;
  sourceText: string;
  extractedFields: ExtractedField[];
  
  selectField: (id: string | null) => void;
  toggleAuditPanel: () => void;
  setSessionId: (id: string | null) => void;
  setAuditResult: (text: string, fields: ExtractedField[]) => void;
  resetAudit: () => void;
}

export const useAuditStore = create<AuditState>((set) => ({
  selectedFieldId: null,
  auditPanelExpanded: true,
  currentSessionId: null,
  sourceText: '',
  extractedFields: [],

  selectField: (id) => set({ selectedFieldId: id }),
  toggleAuditPanel: () => set((state) => ({ auditPanelExpanded: !state.auditPanelExpanded })),
  setSessionId: (id) => set({ currentSessionId: id }),
  
  setAuditResult: (text, fields) => set({ 
    sourceText: text, 
    extractedFields: fields,
    selectedFieldId: fields[0]?.id ?? null,
    currentSessionId: Date.now().toString(),
  }),
  
  resetAudit: () => set({ 
    sourceText: '', 
    extractedFields: [], 
    selectedFieldId: null, 
    currentSessionId: null 
  }),
}));