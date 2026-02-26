import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlowStore } from '../../stores/useFlowStore';
import { useSystemsStore } from '../../stores/useSystemsStore';
import mockGetSystemsService from '../../services/mockGetSystemsService';
import type { SystemEntry } from '../../types';
import './Systems.css';



// ---------------------------------------------------------------------------
//  Static system catalogue
// ---------------------------------------------------------------------------

export interface SystemDef {
  entry: SystemEntry;
  displayName: string;
  image: string;
  hasFirmwareUpdate: boolean;
  /** Initial connected state — in a real app this would come from the network */
  initiallyConnected: boolean;
}



// ---------------------------------------------------------------------------
// SVG icons
// ---------------------------------------------------------------------------

function IconChevronRight() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="card-chevron-icon"
    >
      <path
        d="M6 4L10 8L6 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="btn-icon"
    >
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path
        d="M10 3V5M10 15V17M3 10H5M15 10H17M4.92893 4.92893L6.34315 6.34315M13.6569 13.6569L15.0711 15.0711M4.92893 15.0711L6.34315 13.6569M13.6569 6.34315L15.0711 4.92893"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="btn-icon"
    >
      <path
        d="M10 3V13M10 13L6.5 9.5M10 13L13.5 9.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 15H17"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="btn-icon"
    >
      <polyline
        points="4,10 8,14 16,6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Connection badge sub-component
// ---------------------------------------------------------------------------

interface ConnectionBadgeProps {
  connected: boolean;
}

function ConnectionBadge({ connected }: ConnectionBadgeProps) {
  if (connected) {
    return (
      <span className="connection-badge connection-badge--connected" aria-label="Connected">
        <span className="connection-badge__indicator" aria-hidden="true" />
        Connected
      </span>
    );
  }
  return (
    <span className="connection-badge connection-badge--disconnected" aria-label="Disconnected">
      <span className="connection-badge__indicator" aria-hidden="true">—</span>
      Disconnected
    </span>
  );
}

// ---------------------------------------------------------------------------
// SystemCard sub-component
// ---------------------------------------------------------------------------

interface SystemCardProps {
  def: SystemDef;
  isConnected: boolean;
  isSelected: boolean;
  onToggleConnect: () => void;
  onToggleSelect: () => void;
}

function SystemCard({
  def,
  isConnected,
  isSelected,
  onToggleConnect,
  onToggleSelect,
}: SystemCardProps) {
  const cardClasses = [
    'system-card',
    isConnected ? 'system-card--connected' : 'system-card--disconnected',
    isSelected ? 'system-card--selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={cardClasses} aria-label={`${def.displayName} system card`}>
      {/* Card heading row */}
      <div className="card-heading">
        <span className="card-label">{def.displayName}</span>
        <span className="card-chevron" aria-hidden="true">
          <IconChevronRight />
        </span>
      </div>

      {/* Divider */}
      <hr className="card-divider" />

      {/* Status row: connection badge */}
      <div className="card-status-row">
        <ConnectionBadge connected={isConnected} />
      </div>

      {/* System name */}
      <p className="system-name">{def.displayName}</p>

      {/* Image area */}
      <div className="card-image">
        <img
          src={def.image}
          alt={def.displayName}
          onError={(e) => {
            // Fallback placeholder if Figma URL expires
            const target = e.currentTarget as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent && !parent.querySelector('.card-image-fallback')) {
              const fallback = document.createElement('div');
              fallback.className = 'card-image-fallback';
              fallback.textContent = def.displayName;
              parent.appendChild(fallback);
            }
          }}
        />
      </div>

      {/* Divider */}
      <hr className="card-divider" />

      {/* Footer actions */}
      <div className="card-footer">
        {/* Settings icon button — clicking toggles connection state */}
        <button
          className="card-btn card-btn--icon"
          type="button"
          aria-label={`Settings for ${def.displayName}`}
          onClick={onToggleConnect}
          title={isConnected ? `Disconnect ${def.displayName}` : `Connect ${def.displayName}`}
        >
          <IconSettings />
        </button>

        {/* Firmware Update button — only for systems that have an update pending */}
        {def.hasFirmwareUpdate && (
          <button
            className="card-btn card-btn--firmware"
            type="button"
            aria-label={`Firmware update available for ${def.displayName}`}
          >
            <IconDownload />
            Firmware Update
          </button>
        )}

        {/* Select / Deselect button */}
        <button
          className={`card-btn card-btn--select${isSelected ? ' card-btn--selected' : ''}`}
          type="button"
          onClick={onToggleSelect}
          disabled={!isConnected}
          aria-label={isSelected ? `Deselect ${def.displayName}` : `Select ${def.displayName}`}
          aria-pressed={isSelected}
          title={!isConnected ? 'Connect this system first' : undefined}
        >
          {isSelected && <IconCheck />}
          {isSelected ? 'Selected' : 'Select'}
        </button>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Systems view — Step 1
// ---------------------------------------------------------------------------

export function Systems() {
  const [catalogue, setCatalogue] = useState<SystemDef[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    connectedSystems,
    selectedSystems,
    connectSystem,
    disconnectSystem,
    selectSystem,
    deselectSystem,
  } = useSystemsStore();
  const { completeStep1 } = useFlowStore();

  const navigate = useNavigate();

  // Fetch available systems from the network (mock), then seed initial connections
  useEffect(() => {
    mockGetSystemsService().then((defs) => {
      setCatalogue(defs);
      defs.forEach((def) => {
        if (def.initiallyConnected) {
          connectSystem(def.entry);
        }
      });
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canProceed = selectedSystems.some((sel) =>
    connectedSystems.some((con) => con.id === sel.id),
  );

  function handleProceed() {
    if (!canProceed) return;
    completeStep1();
    navigate('/preflight');
  }

  function handleToggleConnect(def: SystemDef) {
    const isConnected = connectedSystems.some((s) => s.id === def.entry.id);
    if (isConnected) {
      disconnectSystem(def.entry.id);
    } else {
      connectSystem(def.entry);
    }
  }

  function handleToggleSelect(def: SystemDef) {
    const isConnected = connectedSystems.some((s) => s.id === def.entry.id);
    if (!isConnected) return;
    const isSelected = selectedSystems.some((s) => s.id === def.entry.id);
    if (isSelected) {
      deselectSystem(def.entry.id);
    } else {
      selectSystem(def.entry);
    }
  }

  return (
    <div className="systems-view">
      <div className="systems-view__header">
        <h1 className="systems-view__title">Systems available on your network</h1>
        <p className="systems-view__subtitle">Select systems to use for operation</p>
      </div>

      <section className="systems-view__grid" aria-label="Available systems">
        {loading ? (
          <p className="systems-view__loading">Scanning network...</p>
        ) : (
          catalogue.map((def) => {
            const isConnected = connectedSystems.some((s) => s.id === def.entry.id);
            const isSelected = selectedSystems.some((s) => s.id === def.entry.id);

            return (
              <SystemCard
                key={def.entry.id}
                def={def}
                isConnected={isConnected}
                isSelected={isSelected}
                onToggleConnect={() => handleToggleConnect(def)}
                onToggleSelect={() => handleToggleSelect(def)}
              />
            );
          })
        )}
      </section>

      <div className="systems-view__actions">
        <button
          className={`systems-view__next-btn${canProceed ? ' systems-view__next-btn--enabled' : ''}`}
          type="button"
          onClick={handleProceed}
          disabled={!canProceed}
          aria-label={
            canProceed
              ? 'Proceed to Pre-flight checks'
              : 'Select at least one connected system to continue'
          }
        >
          Next
        </button>
      </div>
    </div>
  );
}
