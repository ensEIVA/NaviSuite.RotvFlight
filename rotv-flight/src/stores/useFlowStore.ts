import { create } from 'zustand';

interface FlowStore {
  step1Complete: boolean;
  step2Complete: boolean;
  completeStep1: () => void;
  completeStep2: () => void;
}

export const useFlowStore = create<FlowStore>((set) => ({
  step1Complete: false,
  step2Complete: false,
  completeStep1: () => set({ step1Complete: true }),
  completeStep2: () => set({ step2Complete: true }),
}));
