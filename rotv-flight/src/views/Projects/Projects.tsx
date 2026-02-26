import { useState } from 'react';
import { useProjectStore } from '../../stores/useProjectStore';
import { useOperationStore } from '../../stores/useOperationStore';
import './Projects.css';

// ---------------------------------------------------------------------------
// Projects view
// ---------------------------------------------------------------------------

export function Projects() {
  const {
    projects,
    activeProjectId,
    createProject,
    deleteProject,
    setActiveProject,
    linkOperation,
    unlinkOperation,
  } = useProjectStore();

  const {
    operations,
    activeOperationId,
    createOperation,
    deleteOperation,
    setActiveOperation,
  } = useOperationStore();

  const [newProjectName, setNewProjectName]     = useState('');
  const [newOperationName, setNewOperationName] = useState('');

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  function handleCreateProject() {
    const name = newProjectName.trim();
    if (!name) return;
    createProject(name);
    setNewProjectName('');
  }

  function handleCreateOperation() {
    const name = newOperationName.trim();
    if (!name) return;
    const op = createOperation(name);
    // Auto-link to the active project if one is selected
    if (activeProjectId) linkOperation(activeProjectId, op.id);
    setNewOperationName('');
  }

  function handleToggleLink(operationId: string) {
    if (!activeProjectId) return;
    const linked = activeProject?.operationIds.includes(operationId);
    if (linked) {
      unlinkOperation(activeProjectId, operationId);
    } else {
      linkOperation(activeProjectId, operationId);
    }
  }

  return (
    <div className="projects-view">
      <div className="projects-view__header">
        <h1 className="projects-view__title">Projects &amp; Operations</h1>
        <p className="projects-view__subtitle">
          {activeProject
            ? `Showing links for: ${activeProject.name}`
            : 'Select a project to manage its operations'}
        </p>
      </div>

      <div className="projects-view__columns">

        {/* ----------------------------------------------------------------
            Left — Projects
            ---------------------------------------------------------------- */}
        <section className="projects-col" aria-label="Projects">
          <h2 className="col-heading">Projects</h2>

          {projects.length === 0 ? (
            <p className="col-empty">No projects yet.</p>
          ) : (
            <ul className="col-list" role="list">
              {projects.map((project) => (
                <li
                  key={project.id}
                  className={`project-item${project.id === activeProjectId ? ' project-item--active' : ''}`}
                >
                  <button
                    className="project-item__name"
                    onClick={() =>
                      setActiveProject(project.id === activeProjectId ? null : project.id)
                    }
                    aria-pressed={project.id === activeProjectId}
                  >
                    {project.name}
                  </button>
                  <span className="project-item__meta">
                    {project.operationIds.length} op{project.operationIds.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    className="btn-delete"
                    onClick={() => deleteProject(project.id)}
                    aria-label={`Delete ${project.name}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="create-form">
            <input
              className="create-form__input"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
              placeholder="New project name"
              aria-label="New project name"
            />
            <button
              className="create-form__btn"
              onClick={handleCreateProject}
              disabled={!newProjectName.trim()}
            >
              Create
            </button>
          </div>
        </section>

        {/* ----------------------------------------------------------------
            Right — Operations
            ---------------------------------------------------------------- */}
        <section className="operations-col" aria-label="Operations">
          <h2 className="col-heading">Operations</h2>

          {operations.length === 0 ? (
            <p className="col-empty">No operations yet.</p>
          ) : (
            <ul className="col-list" role="list">
              {operations.map((op) => {
                const linked = activeProject?.operationIds.includes(op.id) ?? false;
                const isActive = op.id === activeOperationId;
                return (
                  <li
                    key={op.id}
                    className={`operation-item${linked ? ' operation-item--linked' : ''}${isActive ? ' operation-item--active' : ''}`}
                  >
                    <button
                      className="operation-item__name"
                      onClick={() => setActiveOperation(isActive ? null : op.id)}
                      aria-pressed={isActive}
                    >
                      {op.name}
                    </button>
                    <span className={`operation-item__status operation-item__status--${op.status}`}>
                      {op.status}
                    </span>
                    {activeProject && (
                      <button
                        className={`btn-link${linked ? ' btn-link--linked' : ''}`}
                        onClick={() => handleToggleLink(op.id)}
                        aria-label={linked ? `Unlink from ${activeProject.name}` : `Link to ${activeProject.name}`}
                      >
                        {linked ? 'Unlink' : 'Link'}
                      </button>
                    )}
                    <button
                      className="btn-delete"
                      onClick={() => deleteOperation(op.id)}
                      aria-label={`Delete ${op.name}`}
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="create-form">
            <input
              className="create-form__input"
              value={newOperationName}
              onChange={(e) => setNewOperationName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateOperation()}
              placeholder="New operation name"
              aria-label="New operation name"
            />
            <button
              className="create-form__btn"
              onClick={handleCreateOperation}
              disabled={!newOperationName.trim()}
            >
              {activeProject ? `Create & link to ${activeProject.name}` : 'Create'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
