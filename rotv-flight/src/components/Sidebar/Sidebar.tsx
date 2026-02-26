import { NavLink, useLocation, useNavigate } from "react-router-dom";

import { ObiUser } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/icons/icon-user";
import { ObcNavigationMenu } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/components/navigation-menu/navigation-menu";

import { ObcNavigationItem } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/components/navigation-item/navigation-item";
import { ObcVendorButton } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/components/vendor-button/vendor-button";
import "./Sidebar.css";
import { useFlowStore } from "../../stores/useFlowStore";
const IMG_LOGO = "./src/assets/eiva.svg"; 

// ---------------------------------------------------------------------------
// Nav item type
// ---------------------------------------------------------------------------

interface NavItemDef {
  label: string;
  path: string;
  icon: React.ReactNode;
  /** Which flow step must be complete before this item is accessible */
  requiresStep?: 1 | 2;
}

// ---------------------------------------------------------------------------
// Main nav items
// ---------------------------------------------------------------------------

const MAIN_NAV: NavItemDef[] = [
  { label: "Systems", path: "/", icon: <ObiUser slot="icon" /> },
  { label: "Projects", path: "/projects", icon: <ObiUser slot="icon" /> },
  { label: 'Pre-flight', path: '/preflight', icon: <ObiUser slot="icon" />, requiresStep: 1 },
  { label: 'Dashboard',  path: '/dashboard', icon: <ObiUser slot="icon" />, requiresStep: 2 },
];

// ---------------------------------------------------------------------------
// Footer nav items
// ---------------------------------------------------------------------------

const FOOTER_NAV: NavItemDef[] = [
  { label: "Help", path: "/help", icon: <ObiUser slot="icon" /> },
  // { label: 'Alerts',   path: '/alerts',   icon: <IconBell /> },
  // { label: 'Settings', path: '/settings', icon: <IconSettings /> },
];

// ---------------------------------------------------------------------------
// Sidebar component
// ---------------------------------------------------------------------------

export function Sidebar() {
  const { step1Complete, step2Complete } = useFlowStore();
  const location = useLocation();
  const navigate = useNavigate();

  function isUnlocked(item: NavItemDef): boolean {
    if (!item.requiresStep) return true;
    if (item.requiresStep === 1) return step1Complete;
    if (item.requiresStep === 2) return step1Complete && step2Complete;
    return false;
  }

  function isActive(item: NavItemDef): boolean {
    if (item.path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(item.path);
  }

  return (
    <ObcNavigationMenu className="navigation-menu">
      {MAIN_NAV.map((item) => {
        const unlocked = isUnlocked(item);
        const active = isActive(item);

        if (!unlocked) {
          // Render a non-interactive locked item
            return (<></>)
          // return (
          //   <ObcNavigationItem
          //     checked={active}
          //     key={item.path}
          //     slot="main"
          //     hasIcon
              
          //     label='lol'
          //   >
          //     {item.icon}
          //   </ObcNavigationItem>
          // );
        }

        return (
          <ObcNavigationItem
            key={item.path}
            slot="main"
            hasIcon
            label={item.label}
            checked={active}
            onClick={() => navigate(item.path)}
          >
            {item.icon}
          </ObcNavigationItem>
        );
      })}
      //
      

      {FOOTER_NAV.map((item) => (
        <ObcNavigationItem
          key={item.path}
          slot="footer"
          hasIcon
          label={item.label}
          onClick={() => navigate(item.path)}
        >
          {item.icon}
        </ObcNavigationItem>
      ))}

      <ObcVendorButton
        className="vendor-button"
        slot="logo"
        imageSrc={IMG_LOGO}
        alt="ROTV FLIGHT!"
      ></ObcVendorButton>
    </ObcNavigationMenu>
      

  );
}
