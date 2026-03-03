import { create } from 'zustand';
import type { Project, Operation } from '../types';
import { useOperationStore } from './useOperationStore';

interface ProjectStore {
  projects: Project[];
  activeProjectId: string | null;

  createProject: (name: string, description?: string) => Project;
  deleteProject: (id: string) => void;
  setActiveProject: (id: string | null) => void;

  /**
   * Links an operation to a project.
   * useProjectStore is the sole owner of this relationship.
   */
  linkOperation: (projectId: string, operationId: string) => void;

  /**
   * Unlinks an operation from a project.
   */
  unlinkOperation: (projectId: string, operationId: string) => void;

  /** Returns the full Operation objects for a given project. */
  getOperationsForProject: (projectId: string) => Operation[];
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  activeProjectId: null,

  createProject: (name, description = '') => {
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      description,
      createdAt: new Date().toISOString(),
      operationIds: [],
    };
    set((state) => ({ projects: [...state.projects, project] }));
    return project;
  },

  deleteProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
    })),

  setActiveProject: (id) => set({ activeProjectId: id }),

  linkOperation: (projectId, operationId) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId && !p.operationIds.includes(operationId)
          ? { ...p, operationIds: [...p.operationIds, operationId] }
          : p,
      ),
    })),

  unlinkOperation: (projectId, operationId) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? { ...p, operationIds: p.operationIds.filter((id) => id !== operationId) }
          : p,
      ),
    })),

  getOperationsForProject: (projectId) => {
    const { operations } = useOperationStore.getState();
    const project = get().projects.find((p) => p.id === projectId);
    if (!project) return [];
    // Filters naturally handle stale ids left by deleteOperation.
    return operations.filter((op) => project.operationIds.includes(op.id));
  },
}));
