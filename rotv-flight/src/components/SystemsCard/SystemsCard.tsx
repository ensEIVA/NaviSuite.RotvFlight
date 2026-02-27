import { ObiSettingsIec } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/icons/icon-settings-iec";
import { ObiFileDownloadGoogle } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/icons/icon-file-download-google";
import { ObcIconButton } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/components/icon-button/icon-button";
import { ObcCard } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/components/card/card";
import { ObcStatusIndicator } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/components/status-indicator/status-indicator";
import type { SystemDef } from "../../views/Systems/Systems";
import { ObcButton } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/components/button/button";
import "./SystemsCard.css";
export interface SystemCardProps {
  def: SystemDef;
  isConnected: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
}

export default function SystemCard({
  def,
  isConnected,
  isSelected,
  
  onToggleSelect,
}: SystemCardProps) {
  return (
    <ObcCard
      title={def.displayName}
      key={def.entry.id}
      className="systems-card"
    >
      <div slot="title">{def.displayName}</div>
      <div className="systems-card__content">
        {isConnected ? (
          <span className="systems-card__status-label connected">
            <ObcStatusIndicator status="running">Connected</ObcStatusIndicator>
          </span>
        ) : (
          <span className="systems-card__status-label disconnected">
            <ObcStatusIndicator status="inactive">
              Disconnected
            </ObcStatusIndicator>
          </span>
        )}

        <div className="systems-card__image">
          <img
            src={def.image}
            alt={def.displayName}
            onError={(e) => {
              // Fallback placeholder if no url!
              const target = e.currentTarget as HTMLImageElement;
              target.style.display = "none";
              const parent = target.parentElement;
              if (
                parent &&
                !parent.querySelector(".systems-card__image-fallback")
              ) {
                const fallback = document.createElement("div");
                fallback.className = "systems-card__image-fallback";
                fallback.textContent = def.displayName;
                parent.appendChild(fallback);
              }
            }}
          />
        </div>

        <div className="systems-card__footer">
          <span className="left">
            <ObcIconButton variant="normal">
              <ObiSettingsIec />
            </ObcIconButton>

            {def.hasFirmwareUpdate && (
              <ObcButton
                className="firmware-button"
                variant="normal"
                showLeadingIcon
                disabled={!def.hasFirmwareUpdate}
              >
                <ObiFileDownloadGoogle slot="leading-icon" />
                Firmware update!
              </ObcButton>
            )}
          </span>
          <span className="right">
            <ObcButton
              variant={isSelected ? "raised" : "normal"}
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
