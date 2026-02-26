import { useState, useEffect } from "react";
import "./Header.css";
import { ObcTopBar } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/components/top-bar/top-bar";
import { ObiShip } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/icons/icon-ship";
// ---------------------------------------------------------------------------
// Topbar — OpenBridge light theme
//
// Left:  hamburger menu icon  ›  ship icon  ›  "ROTV Flight" app name
// Right: alerts button group  ›  brightness button  ›  live UTC clock
//
// EmergencyStop is NOT rendered here (moved to Dashboard view per Figma).
// ---------------------------------------------------------------------------

export function Header() {
  const [utcTime, setUtcTime] = useState<string>(() => formatUtc(new Date()));

  useEffect(() => {
    const id = setInterval(() => setUtcTime(formatUtc(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <ObcTopBar
      showAppIcon
      showAppsButton
      showDimmingButton
      pageName="ROTV-Flight"
    >
      <ObiShip slot="app-icon"></ObiShip>
    </ObcTopBar>
  );
}

function formatUtc(date: Date): string {
  return date.toISOString().substring(11, 19);
}
