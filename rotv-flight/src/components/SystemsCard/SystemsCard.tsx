import { ObiSettingsIec } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/icons/icon-settings-iec";
import { ObiFileDownloadGoogle } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/icons/icon-file-download-google";
import { ObcIconButton } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/components/icon-button/icon-button";
import { ObcCard } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/components/card/card";
import { ObcStatusIndicator } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/components/status-indicator/status-indicator";
import { ObcButton } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/components/button/button";
import type { SystemDef } from "../../types";
import "./SystemsCard.css";
import { IconButtonVariant } from "@ocean-industries-concept-lab/openbridge-webcomponents/dist/components/icon-button/icon-button";
import { ButtonVariant } from "@ocean-industries-concept-lab/openbridge-webcomponents/dist/components/button/button";
import { StatusIndicatorStatus } from "@ocean-industries-concept-lab/openbridge-webcomponents/dist/components/status-indicator/status-indicator";

export interface SystemCardProps {
  def: SystemDef;
  isConnected: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onClickSettings: () => void;
}

export default function SystemCard({
  def,
  isConnected,
  isSelected,
  onToggleSelect,
  onClickSettings,
}: SystemCardProps) {
  return (
    <ObcCard title={def.displayName} className={`systems-card ${!isConnected ? "systems-card--disabled" : ""}`} aria-disabled={!isConnected}>
      <div slot="title">{def.displayName}</div>

      <div className="systems-card__content">
        <span
          className={`systems-card__status-label systems-card__status-label--${isConnected ? "connected" : "disconnected"}`}
        >
          <ObcStatusIndicator status={isConnected ? StatusIndicatorStatus.running : StatusIndicatorStatus.inactive}>
            {isConnected ? "Connected" : "Disconnected"}
          </ObcStatusIndicator>
        </span>

        <div className="systems-card__image">
          <img
            src={def.image}
            alt={def.displayName}
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.style.display = "none";
              const parent = target.parentElement;
              if (parent && !parent.querySelector(".systems-card__image-fallback")) {
                const fallback = document.createElement("div");
                fallback.className = "systems-card__image-fallback";
                fallback.textContent = def.displayName;
                parent.appendChild(fallback);
              }
            }}
          />
        </div>

        <div className="systems-card__footer">
          <span className="systems-card__footer-left">
            <ObcIconButton variant={IconButtonVariant.normal} onClick={onClickSettings} disabled={!isConnected} aria-label={`Settings for ${def.displayName}`}>
              <ObiSettingsIec />
            </ObcIconButton>

            {def.hasFirmwareUpdate && (
              <ObcButton
                className="systems-card__firmware-btn"
                variant={ButtonVariant.normal}
                showLeadingIcon
              >
                <ObiFileDownloadGoogle slot="leading-icon" />
                Firmware update!
              </ObcButton>
            )}
          </span>

          <span className="systems-card__footer-right">
            <ObcButton
              variant={isSelected ? ButtonVariant.raised : ButtonVariant.normal}
              onClick={onToggleSelect}
              disabled={!isConnected}
            >
              {isSelected ? "Selected" : "Select"}
            </ObcButton>
          </span>
        </div>
      </div>
    </ObcCard>
  );
}
