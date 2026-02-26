import { NavLink, useLocation } from "react-router-dom";

import { ObiUser } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/icons/icon-user";
import { ObcNavigationMenu } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/components/navigation-menu/navigation-menu";

import { ObcNavigationItem } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/components/navigation-item/navigation-item";
import { ObcVendorButton } from "@ocean-industries-concept-lab/openbridge-webcomponents-react/components/vendor-button/vendor-button";
import "./Sidebar.css";
import { useFlowStore } from "../stores/useFlowStore";
const IMG_LOGO =
  "https://www.figma.com/api/mcp/asset/f369b666-5032-4b86-900f-c25c3c2c77c7";

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
  { label: "Systems", path: "/", icon: <ObiUser /> },
  { label: "Files", path: "/", icon: <ObiUser /> },
  // { label: 'Pre-flight', path: '/preflight', icon: <IconCheckList />, requiresStep: 1 },
  // { label: 'Dashboard',  path: '/dashboard', icon: <IconDashboard />, requiresStep: 2 },
];

// ---------------------------------------------------------------------------
// Footer nav items
// ---------------------------------------------------------------------------

const FOOTER_NAV: NavItemDef[] = [
  // { label: 'Alerts',   path: '/alerts',   icon: <IconBell /> },
  { label: "Help", path: "/help", icon: <ObiUser /> },
  // { label: 'Settings', path: '/settings', icon: <IconSettings /> },
];

// ---------------------------------------------------------------------------
// Sidebar component
// ---------------------------------------------------------------------------

export function Sidebar() {
  const { step1Complete, step2Complete } = useFlowStore();
  const location = useLocation();

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

  function navItemClass(item: NavItemDef): string {
    const unlocked = isUnlocked(item);
    const active = isActive(item);
    const classes = ["nav-item"];
    if (!unlocked) classes.push("nav-item--locked");
    else if (active) classes.push("nav-item--active");
    return classes.join(" ");
  }

  return (
    <ObcNavigationMenu>
      <ObcNavigationItem slot="main" label="Systems" hasIcon>
        <ObiUser slot="icon"></ObiUser>
      </ObcNavigationItem>
      <ObcNavigationItem slot="main" label="Files" hasIcon>
        <ObiUser slot="icon"></ObiUser>
      </ObcNavigationItem>

      <ObcNavigationItem slot="footer" label="Help" hasIcon>
        <ObiUser slot="icon"></ObiUser>
      </ObcNavigationItem>

      <ObcVendorButton
        slot="logo"
        imgsrc={IMG_LOGO}
        alt="ROTV FLIGHT"
      ></ObcVendorButton>
    </ObcNavigationMenu>

    // <nav className="sidebar" aria-label="Primary navigation">
    //   {/* Top section: main nav */}
    //   <ul className="sidebar__nav-list" role="list" aria-label="Main navigation">
    //     {MAIN_NAV.map((item) => {
    //       const unlocked = isUnlocked(item);
    //       const active = isActive(item);

    //       if (!unlocked) {
    //         // Render a non-interactive locked item
    //         return (
    //           <li key={item.path}>
    //             <span
    //               className={navItemClass(item)}
    //               aria-label={`${item.label} — locked`}
    //               role="listitem"
    //             >
    //               <span className="nav-item__icon" aria-hidden="true">
    //                 {item.icon}
    //               </span>
    //               <span className="nav-item__label">{item.label}</span>
    //               <span className="nav-item__lock-icon" aria-hidden="true">
    //                 <ObiUser />
    //               </span>
    //             </span>
    //           </li>
    //         );
    //       }

    //       return (
    //         <li key={item.path}>
    //           <NavLink
    //             to={item.path}
    //             end={item.path === '/'}
    //             className={() => navItemClass(item)}
    //             aria-current={active ? 'page' : undefined}
    //           >
    //             <span className="nav-item__icon" aria-hidden="true">
    //               {item.icon}
    //             </span>
    //             <span className="nav-item__label">{item.label}</span>
    //           </NavLink>
    //         </li>
    //       );
    //     })}
    //   </ul>

    //   {/* Push footer to bottom */}
    //   <div className="sidebar__spacer" />

    //   {/* Footer section */}
    //   <div className="sidebar__footer">
    //     {/* Top divider */}
    //     <hr className="sidebar__divider" />

    //     {/* Footer nav items */}
    //     <ul className="sidebar__nav-list" role="list" aria-label="Utility navigation">
    //       {FOOTER_NAV.map((item) => {
    //         const active = isActive(item);
    //         const activeClass = active ? ' nav-item--active' : '';
    //         return (
    //           <li key={item.path}>
    //             <NavLink
    //               to={item.path}
    //               className={() => `nav-item${activeClass}`}
    //               aria-current={active ? 'page' : undefined}
    //             >
    //               <span className="nav-item__icon" aria-hidden="true">
    //                 {item.icon}
    //               </span>
    //               <span className="nav-item__label">{item.label}</span>
    //             </NavLink>
    //           </li>
    //         );
    //       })}
    //     </ul>

    //     {/* Bottom divider */}
    //     <hr className="sidebar__divider" />

    //     {/* Vendor logo button */}
    //     <button
    //       className="sidebar__vendor-btn"
    //       type="button"
    //       aria-label="Vendor information"
    //     >
    //       <img
    //         src={IMG_LOGO}
    //         alt="NaviSuite logo"
    //         className="sidebar__vendor-logo"
    //         onError={(e) => {
    //           // Fallback if Figma asset URL expires
    //           (e.currentTarget as HTMLImageElement).style.display = 'none';
    //         }}
    //       />
    //       <span className="sidebar__vendor-fallback" aria-hidden="true">NaviSuite</span>
    //     </button>
    //   </div>
    // </nav>
  );
}
