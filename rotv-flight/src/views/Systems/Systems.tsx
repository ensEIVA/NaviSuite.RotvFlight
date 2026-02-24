import { useNavigate } from "react-router-dom";
import { useFlow, type SystemEntry } from "../../context/FlowContext";
import "./Systems.css";
import { ObcCard } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/components/card/card";
import { ObcButton } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/components/button/button";
import {
  AppShell,
  AppShellFooter,
  AppShellHeader,
  AppShellMain,
} from "@mantine/core";
// ---------------------------------------------------------------------------
// Static system catalogue — plausible dummy data
// ---------------------------------------------------------------------------

const SYSTEM_CATALOGUE: SystemEntry[] = [
  {
    id: "scanfish",
    name: "ScanFish",
    type: "Towed Undulating Vehicle",
    ip: "192.168.1.10",
    firmware: "v4.12.3",
    signal: -58,
  },
  {
    id: "viperfish",
    name: "Viperfish",
    type: "Deep-Tow Sensor Platform",
    ip: "192.168.1.24",
    firmware: "v2.8.1",
    signal: -71,
  },
  {
    id: "winch",
    name: "Winch",
    type: "Tow Winch Controller",
    ip: "192.168.1.50",
    firmware: "v1.6.0",
    signal: -44,
  },
];

// ---------------------------------------------------------------------------
// Helper — signal strength label
// ---------------------------------------------------------------------------

function signalLabel(dBm: number): string {
  if (dBm >= -60) return "Excellent";
  if (dBm >= -70) return "Good";
  if (dBm >= -80) return "Fair";
  return "Poor";
}

function signalClass(dBm: number): string {
  if (dBm >= -60) return "signal--excellent";
  if (dBm >= -70) return "signal--good";
  if (dBm >= -80) return "signal--fair";
  return "signal--poor";
}

// ---------------------------------------------------------------------------
// SystemCard sub-component
// ---------------------------------------------------------------------------

interface SystemCardProps {
  system: SystemEntry;
  isConnected: boolean;
  isSelected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onSelect: () => void;
  onDeselect: () => void;
}

function SystemCard({
  system,
  isConnected,
  isSelected,
  onConnect,
  onDisconnect,
  onSelect,
  onDeselect,
}: SystemCardProps) {
  const canSelect = isConnected;

  return (
    <ObcCard>
      <h3 slot="title">{system.name}</h3>
      <div>
        {isConnected ? (
          <label>Connected</label>
        ) : (
          <label slot="footer" onClick={onConnect}>
            Disconnected
          </label>
        )}

        <div className="systems-card__footer">
          <ObcButton
            variant={isSelected ? "raised" : "normal"}
            onClick={isSelected ? onDeselect : onSelect}
          >
            {isSelected ? "Selected" : "Select"}
          </ObcButton>
        </div>
      </div>
    </ObcCard>
    // <article
    //   className={`system-card${isSelected ? ' system-card--selected' : ''}${isConnected ? ' system-card--connected' : ''}`}
    //   aria-label={`${system.name} system card`}
    // >
    //   {/* Card header */}
    //   <div className="system-card__header">
    //     <div className="system-card__identity">
    //       <h2 className="system-card__name">{system.name}</h2>
    //       <span className="system-card__type">{system.type}</span>
    //     </div>
    //     <div className="system-card__status-indicator" aria-label={isConnected ? 'Connected' : 'Disconnected'}>
    //       <span
    //         className={`system-card__status-dot ${isConnected ? 'system-card__status-dot--connected' : 'system-card__status-dot--disconnected'}`}
    //         aria-hidden="true"
    //       />
    //       <span className="system-card__status-label">
    //         {isConnected ? 'Connected' : 'Disconnected'}
    //       </span>
    //     </div>
    //   </div>

    //   {/* Card body */}
    //   <div className="system-card__body">
    //     <dl className="system-card__details">
    //       <div className="system-card__detail-row">
    //         <dt>IP Address</dt>
    //         <dd><code>{system.ip}</code></dd>
    //       </div>
    //       <div className="system-card__detail-row">
    //         <dt>Firmware</dt>
    //         <dd>{system.firmware}</dd>
    //       </div>
    //       <div className="system-card__detail-row">
    //         <dt>Signal</dt>
    //         <dd>
    //           <span className={`system-card__signal ${signalClass(system.signal)}`}>
    //             {system.signal} dBm — {signalLabel(system.signal)}
    //           </span>
    //         </dd>
    //       </div>
    //     </dl>
    //   </div>

    //   {/* Card footer */}
    //   <div className="system-card__footer">
    //     {isConnected ? (
    //       <button
    //         className="btn-secondary system-card__btn"
    //         onClick={onDisconnect}
    //         aria-label={`Disconnect ${system.name}`}
    //       >
    //         Disconnect
    //       </button>
    //     ) : (
    //       <button
    //         className="btn-primary system-card__btn"
    //         onClick={onConnect}
    //         aria-label={`Connect to ${system.name}`}
    //       >
    //         Connect
    //       </button>
    //     )}

    //     {isSelected ? (
    //       <button
    //         className="btn-warning system-card__btn"
    //         onClick={onDeselect}
    //         disabled={!canSelect}
    //         aria-label={`Deselect ${system.name}`}
    //       >
    //         Deselect
    //       </button>
    //     ) : (
    //       <button
    //         className={`system-card__btn ${canSelect ? 'btn-success' : 'btn-secondary'}`}
    //         onClick={onSelect}
    //         disabled={!canSelect}
    //         aria-label={canSelect ? `Select ${system.name}` : `Connect ${system.name} first`}
    //         title={canSelect ? undefined : 'Connect to this system first'}
    //       >
    //         Select
    //       </button>
    //     )}
    //   </div>
    // </article>
  );
}

// ---------------------------------------------------------------------------
// Systems view
// ---------------------------------------------------------------------------

export function Systems() {
  const {
    connectedSystems,
    selectedSystems,
    connectSystem,
    disconnectSystem,
    selectSystem,
    deselectSystem,
    completeStep1,
  } = useFlow();

  const navigate = useNavigate();

  // Step 2 is unlocked when at least one system is both connected AND selected
  const canProceed = selectedSystems.some((sel) =>
    connectedSystems.some((con) => con.id === sel.id),
  );

  function handleProceed() {
    completeStep1();
    navigate("/preflight");
  }

  return (
    <div className="systems-view">
      <header className="view-header systems-view__header">
        <div>
          <h1 className="view-title">Systems Available on Network</h1>
          <h2>Select systems to use for operation</h2>
        </div>
        <div className="systems-view__header-meta">
          <span className="systems-view__count">
            {connectedSystems.length} connected · {selectedSystems.length}{" "}
            selected
          </span>
        </div>
      </header>
      {/* System cards grid */}
      <section className="systems-view__grid" aria-label="Available systems">
        {SYSTEM_CATALOGUE.map((system) => {
          const isConnected = connectedSystems.some((s) => s.id === system.id);
          const isSelected = selectedSystems.some((s) => s.id === system.id);

          return (
            <SystemCard
              key={system.id}
              system={system}
              isConnected={isConnected}
              isSelected={isSelected}
              onConnect={() => connectSystem(system)}
              onDisconnect={() => disconnectSystem(system.id)}
              onSelect={() => selectSystem(system)}
              onDeselect={() => deselectSystem(system.id)}
            />
          );
        })}
      </section>

      {/* Selected systems summary */}
      {selectedSystems.length > 0 && (
        <section
          className="systems-view__selection-summary"
          aria-live="polite"
          aria-label="Selected systems"
        >
          <span className="systems-view__selection-label">
            Selected for mission:
          </span>
          <ul className="systems-view__selection-list" role="list">
            {selectedSystems.map((s) => (
              <li key={s.id} className="systems-view__selection-tag">
                {s.name}
              </li>
            ))}
          </ul>
        </section>
      )}
      {/* Proceed CTA */}
      {canProceed && (
        <div className="systems-view__cta" role="status">
          <p>hehe</p>
          <button
            className="btn-primary btn-lg systems-view__proceed-btn"
            onClick={handleProceed}
            aria-label="Proceed to Pre-flight checks"
          >
            Proceed to Pre-flight &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
