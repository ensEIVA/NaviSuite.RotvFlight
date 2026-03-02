import { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import { useFlowStore } from "../../stores/useFlowStore";
import { useSystemsStore } from "../../stores/useSystemsStore";
import { usePreFlightStore } from "../../stores/usePreFlightStore";
import "./PreFlight.css";
import { ObcCard } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/components/card/card";
import { ObcFloatingItem } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/components/floating-item/floating-item";
import { ObiPending } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/icons/icon-pending";
import { ObcProgressBar } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/components/progress-bar/progress-bar";
import { ObcButton } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/components/button/button";
import { ButtonVariant } from "@ocean-industries-concept-lab/openbridge-webcomponents/dist/components/button/button";
import { ObcFloatingItemDirection, ObcFloatingItemLineType } from "@ocean-industries-concept-lab/openbridge-webcomponents/dist/components/floating-item/floating-item";
import { ObiCautionColorIec } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/icons/icon-caution-color-iec";
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

  useEffect(() => {
    if (selectedSystems.length > 0) {
      loadChecks(selectedSystems);
    }
  }, [selectedSystems, loadChecks]);

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
      <div className="preflight-view__header">
        <h1 className="preflight-view__title">Pre-flight Check</h1>
      </div>

      <div className="preflight-view-wrapper">
        {/* Left panel — 3D scene */}
        <section className="preflight-scene" aria-label="ROTV 3D model viewer">
          <ObcCard noTitle className="preflight-scene-card">
            <div className="preflight-scene__canvas">
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
            
            <ObcFloatingItem
              className="preflight-caution"
              lineType={ObcFloatingItemLineType.multiLine}
              direction={ObcFloatingItemDirection.vertical}
              action
              
            >
              <ObiCautionColorIec slot="primary-icon" />
              <span slot="title">Caution</span>
              <span slot="description">
                Ensure the ROTV area is clear of personnel before running
                preflight check.
              </span>

              <span
                slot="action"
                className="preflight-caution-button" 
                variant={ButtonVariant.raised}
                
              >
                ACK
              </span>
            </ObcFloatingItem>
          </ObcCard>
        </section>

        {/* Right panel — checklist */}
        <section
          className="preflight-checklist"
          aria-label="Pre-flight checklist"
        >
          <ObcCard noTitle className="preflight-checklist-card">
            {selectedSystems.map((system) => {
              const checks = checksBySystem[system.id] ?? [];
              const sysPassed = checks.filter(
                (c) => c.status === "passed",
              ).length;
              return (
                <div
                  key={system.id}
                  className="preflight-checklist-system-group"
                >
                  <h1 className="preflight-checklist-title" slot="title">
                    Status
                  </h1>
                  <div className="preflight-checklist-header" slot="header">
                    <h2 className="preflight-checklist-system-name">
                      {system.name}
                    </h2>
                    {checks.length > 0 && (
                      <div className="preflight-checklist-progress">
                        <span className="preflight-checklist-progress-count">
                          {sysPassed}
                        </span>
                        <span className="preflight-checklist-progress-total">
                          /{checks.length} passed
                        </span>
                      </div>
                    )}
                  </div>
                  <ObcProgressBar
                    value={
                      checks.length > 0 ? (sysPassed / checks.length) * 100 : 0
                    }
                    aria-label={`${sysPassed} out of ${checks.length} checks passed for ${system.name}`}
                  />
                  <ul
                    className="preflight-checklist-list"
                    role="list"
                    aria-label={`${system.name} checks`}
                  >
                    {checks.map((check) => (
                      <ObcFloatingItem lineType="multi-line" key={check.id} ico>
                        <ObiPending slot="primary-icon" />
                        <span slot="title">{check.label}</span>
                        <span slot="description">
                          {check.status.charAt(0).toUpperCase() +
                            check.status.slice(1)}
                        </span>
                      </ObcFloatingItem>
                    ))}
                  </ul>
                </div>
              );
            })}
          </ObcCard>
        </section>
      </div>

      <div className="preflight-view__actions">
        <ObcButton
          onClick={handleRunAll}
          disabled={isRunning || totalCount === 0}
          aria-busy={isRunning}
        >
          {isRunning ? "Running checks…" : "Run All Checks"}
        </ObcButton>
        <ObcButton
          variant={canProceed ? ButtonVariant.raised : ButtonVariant.normal}
          onClick={handleProceed}
          disabled={!canProceed}
          aria-label={
            canProceed
              ? "Proceed to Dashboard"
              : "All checks must pass before proceeding"
          }
        >
          {canProceed ? "Proceed to Dashboard →" : "Resolve checks to proceed"}
        </ObcButton>
      </div>
    </div>
  );
}
