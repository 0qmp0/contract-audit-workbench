import { create } from 'zustand';

interface AuditState {
  selectedFieldId: string | null;
  auditPanelExpanded: boolean;
  currentSessionId: string | null;
  selectField: (id: string | null) => void;
  toggleAuditPanel: () => void;
  setSessionId: (id: string | null) => void;
}

export const useAuditStore = create<AuditState>((set) => ({
  selectedFieldId: null,
  auditPanelExpanded: true,
  currentSessionId: null,
  selectField: (id) => set({ selectedFieldId: id }),
  toggleAuditPanel: () => set((state) => ({ auditPanelExpanded: !state.auditPanelExpanded })),
  setSessionId: (id) => set({ currentSessionId: id }),
}));