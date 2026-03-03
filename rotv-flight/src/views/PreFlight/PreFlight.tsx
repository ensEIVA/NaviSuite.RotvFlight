import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import { useFlowStore } from "../../stores/useFlowStore";
import { useSystemsStore } from "../../stores/useSystemsStore";
import { usePreFlightStore } from "../../stores/usePreFlightStore";
import { RotvScene } from "./RotvScene";
import type { SceneCheck } from "./RotvScene";
import "./PreFlight.css";
import { ObcCard } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/components/card/card";
import { ObcFloatingItem } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/components/floating-item/floating-item";
import { ObiPending } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/icons/icon-pending";
import { ObcProgressBar } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/components/progress-bar/progress-bar";
import { ObcButton } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/components/button/button";
import { ButtonVariant } from "@ocean-industries-concept-lab/openbridge-webcomponents/dist/components/button/button";
import {
  ObcFloatingItemDirection,
  ObcFloatingItemLineType,
} from "@ocean-industries-concept-lab/openbridge-webcomponents/dist/components/floating-item/floating-item";
import { ObiCautionColorIec } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/icons/icon-caution-color-iec";
import { ObcStatusIndicator } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/components/status-indicator/status-indicator";
import { ObiRunning } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/icons/icon-running";
import { StatusIndicatorStatus } from "@ocean-industries-concept-lab/openbridge-webcomponents/dist/components/status-indicator/status-indicator";
import { ObiAlarmUnacknowledgedIec } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/icons/icon-alarm-unacknowledged-iec";
// ---------------------------------------------------------------------------
// PreFlight view
// ---------------------------------------------------------------------------

export function PreFlight() {
  const { selectedSystems } = useSystemsStore();
  const { checksBySystem, isRunning, loadChecks, runAllChecks } =
    usePreFlightStore();
  const { completeStep2 } = useFlowStore();
  const navigate = useNavigate();

  const [hoveredCheckId, setHoveredCheckId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedSystems.length > 0) {
      loadChecks(selectedSystems);
    }
  }, [selectedSystems, loadChecks]);

  const allChecks = selectedSystems.flatMap((s) => checksBySystem[s.id] ?? []);
  const passedCount = allChecks.filter((c) => c.status === "passed").length;
  const totalCount = allChecks.length;

  const canProceed = !isRunning && totalCount > 0 && passedCount === totalCount;

  const flatChecks: SceneCheck[] = selectedSystems.flatMap((s) =>
    (checksBySystem[s.id] ?? []).map((c) => ({
      id: c.id,
      label: c.label,
      category: c.category,
      status: c.status,
      sceneNode: c.sceneNode,
    })),
  );

  function handleRunAll() {
    runAllChecks(selectedSystems);
  }

  function handleProceed() {
    completeStep2();
    navigate("/dashboard");
  }
  function handleCancelPreflightCheck() {
    navigate("/system-selection");
  }

  return (
    <div className="preflight-view">
      <div className="preflight-view__header">
        <h1 className="preflight-view__title">Pre-flight Check</h1>
      </div>

      <div className="preflight-view-wrapper">
        {/* Left panel — 3D scene */}
        <section className="preflight-scene" aria-label="ROTV 3D model viewer">
          <div className="preflight-scene-legend">
            <ObcStatusIndicator
              status={StatusIndicatorStatus.inactive}
              title="Pending"
            >
              Pending
            </ObcStatusIndicator>
            <ObcStatusIndicator
              status={StatusIndicatorStatus.active}
              title="Checking"
            >
              Checking
            </ObcStatusIndicator>
            <ObcStatusIndicator
              status={StatusIndicatorStatus.running}
              title="Passed"
            >
              Passed
            </ObcStatusIndicator>
            <ObcStatusIndicator
              status={StatusIndicatorStatus.alarm}
              title="Failed"
            >
              Failed
            </ObcStatusIndicator>
          </div>
          <ObcCard noTitle className="preflight-scene-card">
            <div className="preflight-scene__canvas">
              <Canvas
                camera={{ position: [4, 2, 4], fov: 45 }}
                style={{ width: "100%", height: "100%" }}
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
                <RotvScene
                  checks={flatChecks}
                  hoveredCheckId={hoveredCheckId}
                  onNodeHover={setHoveredCheckId}
                />
                <OrbitControls
                  enablePan={false}
                  minDistance={3}
                  maxDistance={12}
                  autoRotate
                  autoRotateSpeed={0.6}
                />
              </Canvas>

              {/* <ObcLegend
                items={[
                  { color: "#4caf50", label: "Passed" },
                  { color: "#f44336", label: "Failed" },
                  { color: "#ff9800", label: "Pending" },
                ]}
                aria-label="Check status legend"
              /> */}
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
                      <div
                        key={check.id}
                        className={`preflight-check-wrapper${hoveredCheckId === check.id ? " preflight-check-wrapper--hovered" : ""}`}
                        onMouseEnter={() => setHoveredCheckId(check.id)}
                        onMouseLeave={() => setHoveredCheckId(null)}
                      >
                        <ObcFloatingItem lineType="multi-line">
                          {check.status === "pending" && (
                            <ObiPending slot="primary-icon" />
                          )}
                          {check.status === "failed" && (
                            <ObiAlarmUnacknowledgedIec slot="primary-icon" />
                          )}
                          {check.status === "running" && (
                            <ObcProgressBar
                              type="circular"
                              circularState="indeterminate"
                              showUnit={false}
                              progressiveIndeterminate={false}
                              slot="primary-icon"
                            />
                          )}
                          {check.status === "passed" && (
                            <ObiRunning slot="primary-icon" />
                          )}

                          {/* <ObiPending slot="primary-icon" /> */}
                          <span slot="title">{check.label}</span>
                          <span slot="description">
                            {check.status.charAt(0).toUpperCase() +
                              check.status.slice(1)}
                          </span>
                        </ObcFloatingItem>
                      </div>
                    ))}
                  </ul>
                </div>
              );
            })}
          </ObcCard>
        </section>
      </div>

      <div className="preflight-view__actions">
        <span className="preflight-view__actions-span">
          <ObcButton onClick={handleCancelPreflightCheck}>Cancel</ObcButton>
        </span>
        <span className="preflight-view__actions-span">
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
            {canProceed
              ? "Proceed to Dashboard →"
              : "Resolve checks to proceed"}
          </ObcButton>
        </span>
      </div>
    </div>
  );
}
