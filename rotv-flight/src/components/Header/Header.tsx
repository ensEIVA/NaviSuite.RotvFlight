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
import { ObiCloseGoogle } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/icons/icon-close-google";
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
  // hack: OpenBridge ObcTopBar doesnt have an option for a right-side dismiss-button. So I manually inject it! ew!
  useEffect(() => {
    const nav = document.querySelector("#topbar") as HTMLElement;

    customElements.whenDefined("obc-icon-button").then(() => {
      const userBtn = nav?.shadowRoot?.querySelector('[part="user-button"]');
      if (userBtn) {
        const newBtn = document.createElement("obc-icon-button");
        newBtn.setAttribute("variant", "flat");
        newBtn.innerHTML = "<obi-close-google></obi-close-google>";
        userBtn.replaceWith(newBtn);
        newBtn.addEventListener("click", () => {
          setShowBrillianceMenu(false);
        });
      }
    });
  }, []);

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
        id="topbar"
        showAppIcon
        showDimmingButton
        menuButtonIcon={ObcTopBarMenuButtonIcon.Home}
        dimmingButtonActivated={showBrillianceMenu}
        onDimmingButtonClicked={handleDimmingButtonClicked}
        appTitle="ROTV Flight"
        pageName=""
        showUserButton
      >
        <ObiShip slot="app-icon"></ObiShip>
      </ObcTopBar>
    </>
  );
}
