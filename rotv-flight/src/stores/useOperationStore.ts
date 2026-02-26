import { create } from 'zustand';
import type { Operation, OperationStatus } from '../types';
import { useProjectStore } from './useProjectStore';

// ---------------------------------------------------------------------------
// Shape
// ---------------------------------------------------------------------------

interface OperationStore {
  operations: Operation[];
  activeOperationId: string | null;

  createOperation: (name: string, description?: string) => Operation;
  updateStatus: (id: string, status: OperationStatus) => void;
  deleteOperation: (id: string) => void;
  setActiveOperation: (id: string | null) => void;

  /** Called by useProjectStore when managing the many-to-many link */
  addProjectRef:    (operationId: string, projectId: string) => void;
  removeProjectRef: (operationId: string, projectId: string) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

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
      projectIds: [],
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

  deleteOperation: (id) => {
    // Cascade: remove this operation from every project that references it
    const { projects } = useProjectStore.getState();
    projects.forEach((p) => {
      if (p.operationIds.includes(id)) {
        useProjectStore.getState().unlinkOperation(p.id, id);
      }
    });
    set((state) => ({
      operations: state.operations.filter((op) => op.id !== id),
      activeOperationId: state.activeOperationId === id ? null : state.activeOperationId,
    }));
  },

  setActiveOperation: (id) => set({ activeOperationId: id }),

  addProjectRef: (operationId, projectId) =>
    set((state) => ({
      operations: state.operations.map((op) =>
        op.id === operationId && !op.projectIds.includes(projectId)
          ? { ...op, projectIds: [...op.projectIds, projectId] }
          : op,
      ),
    })),

  removeProjectRef: (operationId, projectId) =>
    set((state) => ({
      operations: state.operations.map((op) =>
        op.id === operationId
          ? { ...op, projectIds: op.projectIds.filter((pid) => pid !== projectId) }
          : op,
      ),
    })),
}));
