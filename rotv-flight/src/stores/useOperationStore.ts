import { create } from 'zustand';
import type { Operation, OperationStatus } from '../types';

interface OperationStore {
  operations: Operation[];
  activeOperationId: string | null;

  createOperation: (name: string, description?: string) => Operation;
  updateStatus: (id: string, status: OperationStatus) => void;
  deleteOperation: (id: string) => void;
  setActiveOperation: (id: string | null) => void;
}

export const useOperationStore = create<OperationStore>((set) => ({
  operations: [],
  activeOperationId: null,

  createOperation: (name, description = '') => {
    const operation: Operation = {
      id: crypto.randomUUID(),
      name,
      description,
      status: 'planned',
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ operations: [...state.operations, operation] }));
    return operation;
  },

  updateStatus: (id, status) =>
    set((state) => ({
      operations: state.operations.map((op) =>
        op.id === id ? { ...op, status } : op,
      ),
    })),

  // Removes the operation. Any project.operationIds[] referencing this id
  // become stale — getOperationsForProject() filters them out naturally.
  deleteOperation: (id) =>
  //  If you ever need to persist projects to a server, add a purgeOperationRef(operationId) call in the view layer before calling deleteOperation
    set((state) => ({
      operations: state.operations.filter((op) => op.id !== id),
      activeOperationId: state.activeOperationId === id ? null : state.activeOperationId,
    })),

  setActiveOperation: (id) => set({ activeOperationId: id }),
}));
