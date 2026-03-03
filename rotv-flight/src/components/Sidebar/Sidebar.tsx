import { useLocation, useNavigate } from "react-router-dom";

import { ObiUser } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/icons/icon-user";
import { ObiSupportGoogle } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/icons/icon-support-google";
import { ObcNavigationMenu } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/components/navigation-menu/navigation-menu";

import { ObcNavigationItem } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/components/navigation-item/navigation-item";
import { ObcVendorButton } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/components/vendor-button/vendor-button";
import { useFlowStore } from "../../stores/useFlowStore";

import "./Sidebar.css";
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

const SystemsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="14"
    viewBox="0 0 24 14"
    fill="none"
    {...props}
  >
    <path
      d="M1.34 13.35L3.66 9.22H1.7L3.91 2.15C4.26 1.04 4.72 0.35 5.22 0.18C5.15 0.0900003 5.09 0.0199966 5.03 0.0199966L4.79 0H4.58C4.48 0.02 4.39 0.069996 4.29 0.159996L1.24 3.17H1.23L0 4.38L0.410004 13.36"
      fill="#535353"
    />
    <path
      d="M22.66 13.35L20.34 9.22H22.3L20.09 2.15C19.74 1.04 19.28 0.35 18.78 0.18C18.85 0.0900003 18.91 0.0199966 18.97 0.0199966L19.21 0H19.42C19.52 0.02 19.61 0.069996 19.71 0.159996L22.76 3.17H22.77L24 4.38L23.59 13.36"
      fill="#535353"
    />
    <path d="M20.17 7.13H3.83L3.64 7.71001H20.36L20.17 7.13Z" fill="#535353" />
    <path
      d="M18.67 1.91999C18.34 0.889991 17.86 0.299988 17.37 0.299988L12.31 0.349991H12.33V3.45999H11.69V0.349991L6.59 0.399994C6.1 0.399994 5.63 0.989987 5.3 2.00999L3.46 7.67999H8.12L8.41 5.85999H15.59L15.88 7.67999H20.54L18.67 1.89999V1.91999ZM6.6 6.02999C6.11 6.02999 5.72 5.73999 5.72 5.36999C5.72 4.99999 6.11 4.70999 6.6 4.70999C7.09 4.70999 7.48 4.99999 7.48 5.36999C7.48 5.73999 7.09 6.02999 6.6 6.02999ZM7.48 4.47999C6.99 4.47999 6.6 4.18999 6.6 3.81999C6.6 3.44999 6.99 3.15999 7.48 3.15999C7.97 3.15999 8.36 3.44999 8.36 3.81999C8.36 4.18999 7.97 4.47999 7.48 4.47999ZM15.66 3.82999C15.66 3.46999 16.05 3.16999 16.54 3.16999C17.03 3.16999 17.42 3.45999 17.42 3.82999C17.42 4.19999 17.03 4.48999 16.54 4.48999C16.05 4.48999 15.66 4.19999 15.66 3.82999ZM17.42 6.02999C16.93 6.02999 16.54 5.73999 16.54 5.36999C16.54 4.99999 16.93 4.70999 17.42 4.70999C17.91 4.70999 18.3 4.99999 18.3 5.36999C18.3 5.73999 17.91 6.02999 17.42 6.02999Z"
      fill="#535353"
    />
  </svg>
);
const ProjectsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <path
      d="M4 20C3.45 20 2.97917 19.8042 2.5875 19.4125C2.19583 19.0208 2 18.55 2 18V6C2 5.45 2.19583 4.97917 2.5875 4.5875C2.97917 4.19583 3.45 4 4 4H10L12 6H20C20.55 6 21.0208 6.19583 21.4125 6.5875C21.8042 6.97917 22 7.45 22 8V18C22 18.55 21.8042 19.0208 21.4125 19.4125C21.0208 19.8042 20.55 20 20 20H4ZM4 18H20V8H11.175L9.175 6H4V18Z"
      fill="#535353"
    />
  </svg>
);
const MAIN_NAV: NavItemDef[] = [
  { label: "Systems", path: "/", icon: <SystemsIcon slot="icon" /> },
  { label: "Projects", path: "/projects", icon: <ProjectsIcon slot="icon" /> },
  {
    label: "Pre-flight",
    path: "/preflight",
    icon: <ObiUser slot="icon" />,
    requiresStep: 1,
  },
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: <ObiUser slot="icon" />,
    requiresStep: 2,
  },
];


/// ---------------------------------------------------------------------------
// Debug nav items
// ---------------------------------------------------------------------------
const DEBUG_NAV: NavItemDef[] = [
  { label: 'Telemetry', path: '/telemetry', icon: <ObiSupportGoogle slot="icon" /> },
  { label: 'Calibration', path: '/calibration', icon: <ObiSupportGoogle slot="icon" /> },
  { label: 'Diagnostics', path: '/diagnostics', icon: <ObiSupportGoogle slot="icon" /> },
  { label: 'Logs', path: '/logs', icon: <ObiSupportGoogle slot="icon" /> },
  { label: 'Settings', path: '/settings', icon: <ObiSupportGoogle slot="icon" /> },
]

// ---------------------------------------------------------------------------
// Footer nav items
// ---------------------------------------------------------------------------

const FOOTER_NAV: NavItemDef[] = [
  { label: "Help", path: "/help", icon: <ObiSupportGoogle slot="icon" /> },
  // { label: 'Alerts',   path: '/alerts',   icon: <IconBell /> },
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
          return <></>;
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

      {DEBUG_NAV.map((item) => (
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
