import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFlowStore } from "../../stores/useFlowStore";
import { useSystemsStore } from "../../stores/useSystemsStore";
import { getSystemsService } from "../../services/systemDiscoveryService";

import type { SystemDef } from "../../types";
import "./Systems.css";
import { ObcButton } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/components/button/button";

import SystemCard from "../../components/SystemsCard/SystemsCard";
import { useDisclosure } from "@mantine/hooks";
import { Modal } from "@mantine/core";

// ---------------------------------------------------------------------------
// Systems view — Step 1
// ---------------------------------------------------------------------------

export function Systems() {
  const [catalogue, setCatalogue] = useState<SystemDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const {
    connectedSystems,
    selectedSystems,
    connectSystem,
    // disconnectSystem,
    selectSystem,
    deselectSystem,
  } = useSystemsStore();
  const { completeStep1 } = useFlowStore();

  const navigate = useNavigate();

  // Subscribe to system discovery — systems trickle in one by one
  useEffect(() => {
    const cleanup = getSystemsService((def) => {
      setCatalogue((prev) => [...prev, def]);
      if (def.initiallyConnected) {
        connectSystem(def.entry);
      }
      setLoading(false);
    });
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canProceed = selectedSystems.some((sel) =>
    connectedSystems.some((con) => con.id === sel.id),
  );

  function handleProceed() {
    if (!canProceed) return;
    completeStep1();
    navigate("/preflight");
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

  function handleClickSettings(def: SystemDef) {
    // In a real app, this would open a system-specific settings page/modal
    open();
    console.log(def);
  }

  return (
    <div className="systems-view">
      <div className="systems-view__header">
        <h1 className="systems-view__title">
          Systems available on your network
        </h1>
        <p className="systems-view__subtitle">
          Select systems to use for operation
        </p>
      </div>

      <section className="systems-view__grid" aria-label="Available systems">
        {loading ? (
          <p className="systems-view__loading">Scanning network...</p>
        ) : (
          catalogue.map((def) => {
            const isConnected = connectedSystems.some(
              (s) => s.id === def.entry.id,
            );
            const isSelected = selectedSystems.some(
              (s) => s.id === def.entry.id,
            );

            return (
              <SystemCard
                key={def.entry.id}
                def={def}
                isConnected={isConnected}
                isSelected={isSelected}
                onToggleSelect={() => handleToggleSelect(def)}
                onClickSettings={() => handleClickSettings(def)}
              />
            );
          })
        )}
      </section>

      <div className="systems-view__actions">
        <ObcButton
          onClick={handleProceed}
          disabled={!canProceed}
          aria-label={
            canProceed
              ? "Proceed to Pre-flight checks"
              : "Select at least one connected system to continue"
          }
        >
          Next
        </ObcButton>
      </div>

        <Modal opened={opened} onClose={close} title="Settings">
          <p>Systems-specific settings would go here.</p>

      </Modal>
    </div>
  );
}
