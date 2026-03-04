import { useState, useEffect } from "react";
import "./Header.css";
import { ObcTopBar } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/components/top-bar/top-bar";
import {
  ObcBrillianceMenu,
  type ObcPaletteChangeEvent,
} from "@ocean-industries-concept-lab/openbridge-webcomponents-react/components/brilliance-menu/brilliance-menu";
import { ObcPalette } from "@ocean-industries-concept-lab/openbridge-webcomponents/dist/components/brilliance-menu/brilliance-menu";
import { ObcTopBarMenuButtonIcon } from "@ocean-industries-concept-lab/openbridge-webcomponents/dist/components/top-bar/top-bar";
import { ObiShip } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/icons/icon-ship";

export function Header() {
  const [showBrillianceMenu, setShowBrillianceMenu] = useState(false);
  const [palette, setPalette] = useState(ObcPalette.day);

  const handleDimmingButtonClicked = () => {
    setShowBrillianceMenu(!showBrillianceMenu);
  };

  const handlePalleteChange = (e: ObcPaletteChangeEvent) => {
    document.documentElement.setAttribute("data-obc-theme", e.detail.value);
    setPalette(e.detail.value);
  };

  return (
    <>
      {showBrillianceMenu && (
        <ObcBrillianceMenu
          onPaletteChanged={handlePalleteChange}
          palette={palette}
          hideBrightness
          className="brilliance"
        />
      )}
      <ObcTopBar
        showAppIcon
        showDimmingButton
        menuButtonIcon={ObcTopBarMenuButtonIcon.Home}
        dimmingButtonActivated={showBrillianceMenu}
        onDimmingButtonClicked={handleDimmingButtonClicked}
        appTitle="ROTV-Flight"
        showUserButton
      >
        <ObiShip slot="app-icon"></ObiShip>
      </ObcTopBar>
    </>
  );
}
