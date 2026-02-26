import { create } from 'zustand';
import type { Project, Operation } from '../types';
import { useOperationStore } from './useOperationStore';

// ---------------------------------------------------------------------------
// Shape
// ---------------------------------------------------------------------------

interface ProjectStore {
  projects: Project[];
  activeProjectId: string | null;

  createProject: (name: string, description?: string) => Project;
  deleteProject: (id: string) => void;
  setActiveProject: (id: string | null) => void;

  /**
   * Links an operation to a project — updates both sides of the many-to-many.
   * The operation must already exist in useOperationStore.
   */
  linkOperation: (projectId: string, operationId: string) => void;

  /**
   * Unlinks an operation from a project — updates both sides.
   */
  unlinkOperation: (projectId: string, operationId: string) => void;

  /** Returns the full Operation objects for a given project */
  getOperationsForProject: (projectId: string) => Operation[];
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

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

  deleteProject: (id) => {
    // Remove this project's ref from every linked operation
    const project = get().projects.find((p) => p.id === id);
    if (project) {
      const { removeProjectRef } = useOperationStore.getState();
      project.operationIds.forEach((opId) => removeProjectRef(opId, id));
    }
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
    }));
  },

  setActiveProject: (id) => set({ activeProjectId: id }),

  linkOperation: (projectId, operationId) => {
    // Update project's operationIds
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId && !p.operationIds.includes(operationId)
          ? { ...p, operationIds: [...p.operationIds, operationId] }
          : p,
      ),
    }));
    // Update operation's projectIds
    useOperationStore.getState().addProjectRef(operationId, projectId);
  },

  unlinkOperation: (projectId, operationId) => {
    // Update project's operationIds
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? { ...p, operationIds: p.operationIds.filter((id) => id !== operationId) }
          : p,
      ),
    }));
    // Update operation's projectIds
    useOperationStore.getState().removeProjectRef(operationId, projectId);
  },

  getOperationsForProject: (projectId) => {
    const { operations } = useOperationStore.getState();
    const project = get().projects.find((p) => p.id === projectId);
    if (!project) return [];
    return operations.filter((op) => project.operationIds.includes(op.id));
  },
}));
