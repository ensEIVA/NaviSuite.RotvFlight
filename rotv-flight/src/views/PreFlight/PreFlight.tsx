import { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import { useFlowStore } from "../../stores/useFlowStore";
import { useSystemsStore } from "../../stores/useSystemsStore";
import { usePreFlightStore } from "../../stores/usePreFlightStore";
import type { CheckStatus } from "../../types";
import "./PreFlight.css";
import { ObcCard } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/components/card/card";
import { ObcFloatingItem } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/components/floating-item/floating-item";
import {ObiPending } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/icons/icon-pending";
import { ObcProgressBar } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/components/progress-bar/progress-bar";
// ---------------------------------------------------------------------------
// Status icon
// ---------------------------------------------------------------------------

function StatusIcon({ status }: { status: CheckStatus }) {
  switch (status) {
    case "passed":
      return (
        <span className="check-icon check-icon--success" aria-hidden="true">
          &#10003;
        </span>
      );
    case "failed":
      return (
        <span className="check-icon check-icon--failed" aria-hidden="true">
          &#10007;
        </span>
      );
    case "running":
      return (
        <span
          className="check-icon check-icon--checking check-spinner"
          aria-hidden="true"
        >
          &#9696;
        </span>
      );
    case "pending":
    default:
      return (
        <span className="check-icon check-icon--pending" aria-hidden="true">
          &#128336;
        </span>
      );
  }
}

// ---------------------------------------------------------------------------
// ROTV 3D mesh
// ---------------------------------------------------------------------------

function RotvMesh() {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2.4, 0.5, 0.5]} />
        <meshStandardMaterial color="#1e90d4" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0.6, 0.35, 0]}>
        <boxGeometry args={[0.6, 0.25, 0.05]} />
        <meshStandardMaterial color="#3aa3e0" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.05, 0.55]}>
        <boxGeometry args={[1.1, 0.06, 0.5]} />
        <meshStandardMaterial color="#2a3f5f" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.05, -0.55]}>
        <boxGeometry args={[1.1, 0.06, 0.5]} />
        <meshStandardMaterial color="#2a3f5f" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[-1.35, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.25, 0.4, 8]} />
        <meshStandardMaterial color="#1a2236" metalness={0.7} roughness={0.2} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// PreFlight view
// ---------------------------------------------------------------------------

export function PreFlight() {
  const { selectedSystems } = useSystemsStore();
  const { checksBySystem, isRunning, loadChecks, runAllChecks } =
    usePreFlightStore();
  const { completeStep2 } = useFlowStore();
  const navigate = useNavigate();

  // Seed checks whenever the selected system list changes
  useEffect(() => {
    if (selectedSystems.length > 0) {
      loadChecks(selectedSystems);
    }
  }, [selectedSystems, loadChecks]);

  // Derived: total and passed counts across all selected systems
  const allChecks = selectedSystems.flatMap((s) => checksBySystem[s.id] ?? []);
  const passedCount = allChecks.filter((c) => c.status === "passed").length;
  const totalCount = allChecks.length;

  const canProceed = !isRunning && totalCount > 0 && passedCount === totalCount;

  function handleRunAll() {
    runAllChecks(selectedSystems);
  }

  function handleProceed() {
    completeStep2();
    navigate("/dashboard");
  }

  return (
    <div className="preflight-view">
      <h2>Preflight Check</h2>
      {/* Left panel — 3D scene */}
      <div className="preflight-view-wrapper">
        <section className="preflight-scene" aria-label="ROTV 3D model viewer">
          <ObcCard noTitle>
            <div>
              <Canvas
                camera={{ position: [4, 2, 4], fov: 45 }}
                style={{ background: "white", width: "100%", height: "100%" }}
                aria-label="3D ROTV vehicle model"
              >
                <ambientLight intensity={0.4} />
                <directionalLight
                  position={[5, 8, 5]}
                  intensity={1.2}
                  color="#e8edf5"
                />
                <directionalLight
                  position={[-4, -2, -4]}
                  intensity={0.3}
                  color="#1e90d4"
                />
                <RotvMesh />
                <OrbitControls
                  enablePan={false}
                  minDistance={3}
                  maxDistance={12}
                  autoRotate
                  autoRotateSpeed={0.6}
                />
              </Canvas>
            </div>
          </ObcCard>

          <ObcFloatingItem lineType="multi-line">
            <span slot="title">Caution</span>
            <span slot="description">
              Ensure the ROTV area is clear of personnel before running
              preflight check.
            </span>
            <span slot="action">ACK</span>
          </ObcFloatingItem>
        </section>

        {/* Right panel — checklist */}
        <section
          className="preflight-checklist"
          aria-label="Pre-flight checklist"
        >
          <ObcCard title="Status">
            {selectedSystems.map((system) => {
              const checks = checksBySystem[system.id] ?? [];
              return (
                <div
                  key={system.id}
                  className="preflight-checklist-system-group"
                >
                  <div className="preflight-checklist-header">
                  <h2 className="preflight-checklist-system-name">
                    {system.name}
                  </h2>
                  <div className="preflight-checklist-progress">
                    {checks.length > 0 ? (
                      <span className="preflight-checklist-progress-count">
                        {passedCount}
                        <span className="preflight-checklist-progress-total">
                          /{totalCount}
                        </span>
                        passed
                      </span>
                    ) : null}
                  </div>

                  </div>
                  <ObcProgressBar
                    value={checks.length > 0 ? (passedCount / totalCount) * 100 : 0}
                    aria-label={`${passedCount} out of ${totalCount} checks passed for ${system.name}`}
                  />
                  <ul
                    className="preflight-checklist-list"
                    role="list"
                    aria-label={`${system.name} checks`}
                  >
                    {checks.map((check) => (
                      <ObcFloatingItem lineType="multi-line" key={check.id} ico>
                        <ObiPending slot="primary-icon"></ObiPending>
                        <span slot="title">{check.label}</span>
                        <span slot="description">
                          {check.status.charAt(0).toUpperCase() + check.status.slice(1)}
                          </span>
                      </ObcFloatingItem>
                      // <li
                      //   key={check.id}
                      //   className={`preflight-checklist-item preflight-checklist-item--${check.status}`}
                      //   aria-label={`${check.label}: ${check.status}`}
                      // >
                      //   <StatusIcon status={check.status} />
                      //   <span className="preflight-checklist-item-label">
                      //     {check.label}
                      //   </span>
                      //   <span
                      //     className={`preflight-checklist-item-status-text preflight-checklist-item-status-text--${check.status}`}
                      //   >
                      //     {check.status}
                      //   </span>
                      // </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </ObcCard>

          {/* <div className="preflight-checklist-header">
            <div>
              <h1 className="preflight-checklist-title">Pre-flight Checks</h1>
              <p className="preflight-checklist-subtitle">
                Run all checks before proceeding to operations
              </p>
            </div>

            <div
              className="preflight-checklist-progress-pill"
              aria-live="polite"
            >
              <span className="preflight-checklist-progress-count">
                {passedCount}
                <span className="preflight-checklist-progress-total">
                  /{totalCount}
                </span>
              </span>
              <span className="preflight-checklist-progress-label">passed</span>
            </div>
          </div>

          
          <div className="preflight-checklist-systems">
            {selectedSystems.map((system) => {
              const checks = checksBySystem[system.id] ?? [];
              return (
                <div
                  key={system.id}
                  className="preflight-checklist-system-group"
                >
                  <h2 className="preflight-checklist-system-name">
                    {system.name}
                  </h2>
                  <ul
                    className="preflight-checklist-list"
                    role="list"
                    aria-label={`${system.name} checks`}
                  >
                    {checks.map((check) => (
                      <li
                        key={check.id}
                        className={`preflight-checklist-item preflight-checklist-item--${check.status}`}
                        aria-label={`${check.label}: ${check.status}`}
                      >
                        <StatusIcon status={check.status} />
                        <span className="preflight-checklist-item-label">
                          {check.label}
                        </span>
                        <span
                          className={`preflight-checklist-item-status-text preflight-checklist-item-status-text--${check.status}`}
                        >
                          {check.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          
          <div className="preflight-checklist-actions">
            <button
              className="btn-secondary preflight-checklist-run-btn"
              onClick={handleRunAll}
              disabled={isRunning || totalCount === 0}
              aria-busy={isRunning}
            >
              {isRunning ? "Running checks..." : "Run All Checks"}
            </button>

            <button
              className={`btn-lg preflight-v2__proceed-btn ${canProceed ? "btn-success" : "btn-secondary"}`}
              onClick={handleProceed}
              disabled={!canProceed}
              aria-label={
                canProceed
                  ? "Proceed to Dashboard"
                  : "All checks must pass before proceeding"
              }
            >
              {canProceed
                ? "Proceed to Dashboard \u2192"
                : "Resolve checks to proceed"}
            </button>
          </div> */}
        </section>
      </div>

      <div className="preflight-checklist-actions">
        <button
          className="btn-secondary preflight-checklist-run-btn"
          onClick={handleRunAll}
          disabled={isRunning || totalCount === 0}
          aria-busy={isRunning}
        >
          {isRunning ? "Running checks..." : "Run All Checks"}
        </button>

        <button
          className={`btn-lg preflight-v2__proceed-btn ${canProceed ? "btn-success" : "btn-secondary"}`}
          onClick={handleProceed}
          disabled={!canProceed}
          aria-label={
            canProceed
              ? "Proceed to Dashboard"
              : "All checks must pass before proceeding"
          }
        >
          {canProceed
            ? "Proceed to Dashboard \u2192"
            : "Resolve checks to proceed"}
        </button>
      </div>
    </div>
  );
}
