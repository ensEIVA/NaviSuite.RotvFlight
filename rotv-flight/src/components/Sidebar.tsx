import { NavLink, useLocation } from 'react-router-dom';
import { useFlow } from '../context/FlowContext';
import './Sidebar.css';

// ---------------------------------------------------------------------------
// Image asset constants (Figma — valid ~7 days)
// ---------------------------------------------------------------------------

const IMG_LOGO = 'https://www.figma.com/api/mcp/asset/f369b666-5032-4b86-900f-c25c3c2c77c7';

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
// SVG Icon components (inline — no external deps)
// ---------------------------------------------------------------------------

function IconGrid() {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <rect x="11" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <rect x="3" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <rect x="11" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" fill="none" />
    </svg>
  );
}

function IconCheckList() {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M4 5H16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M4 10H16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M4 15H10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <polyline points="12,13 14,15 18,11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function IconDashboard() {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M10 3C6.134 3 3 6.134 3 10C3 13.866 6.134 17 10 17C13.866 17 17 13.866 17 10C17 6.134 13.866 3 10 3Z"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
      />
      <path d="M10 10L13 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="10" cy="10" r="1.2" fill="currentColor" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M10 3C7.79086 3 6 4.79086 6 7V11L4.5 12.5V13.5H15.5V12.5L14 11V7C14 4.79086 12.2091 3 10 3Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M8.5 13.5C8.5 14.3284 9.17157 15 10 15C10.8284 15 11.5 14.3284 11.5 13.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function IconHelp() {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path
        d="M7.5 8C7.5 6.61929 8.61929 5.5 10 5.5C11.3807 5.5 12.5 6.61929 12.5 8C12.5 9.20361 11.6584 10.2072 10.52 10.459C10.2196 10.5236 10 10.7876 10 11.0947V11.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="10" cy="14" r="0.75" fill="currentColor" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path
        d="M10 3V5M10 15V17M3 10H5M15 10H17M4.92893 4.92893L6.34315 6.34315M13.6569 13.6569L15.0711 15.0711M4.92893 15.0711L6.34315 13.6569M13.6569 6.34315L15.0711 4.92893"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconLock() {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="4" y="9" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path
        d="M7 9V7C7 5.34315 8.34315 4 10 4C11.6569 4 13 5.34315 13 7V9"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main nav items
// ---------------------------------------------------------------------------

const MAIN_NAV: NavItemDef[] = [
  { label: 'Systems',    path: '/',          icon: <IconGrid /> },
  { label: 'Pre-flight', path: '/preflight', icon: <IconCheckList />, requiresStep: 1 },
  { label: 'Dashboard',  path: '/dashboard', icon: <IconDashboard />, requiresStep: 2 },
];

// ---------------------------------------------------------------------------
// Footer nav items
// ---------------------------------------------------------------------------

const FOOTER_NAV: NavItemDef[] = [
  { label: 'Alerts',   path: '/alerts',   icon: <IconBell /> },
  { label: 'Help',     path: '/help',     icon: <IconHelp /> },
  { label: 'Settings', path: '/settings', icon: <IconSettings /> },
];

// ---------------------------------------------------------------------------
// Sidebar component
// ---------------------------------------------------------------------------

export function Sidebar() {
  const { step1Complete, step2Complete } = useFlow();
  const location = useLocation();

  function isUnlocked(item: NavItemDef): boolean {
    if (!item.requiresStep) return true;
    if (item.requiresStep === 1) return step1Complete;
    if (item.requiresStep === 2) return step1Complete && step2Complete;
    return false;
  }

  function isActive(item: NavItemDef): boolean {
    if (item.path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(item.path);
  }

  function navItemClass(item: NavItemDef): string {
    const unlocked = isUnlocked(item);
    const active = isActive(item);
    const classes = ['nav-item'];
    if (!unlocked) classes.push('nav-item--locked');
    else if (active) classes.push('nav-item--active');
    return classes.join(' ');
  }

  return (
    <nav className="sidebar" aria-label="Primary navigation">
      {/* Top section: main nav */}
      <ul className="sidebar__nav-list" role="list" aria-label="Main navigation">
        {MAIN_NAV.map((item) => {
          const unlocked = isUnlocked(item);
          const active = isActive(item);

          if (!unlocked) {
            // Render a non-interactive locked item
            return (
              <li key={item.path}>
                <span
                  className={navItemClass(item)}
                  aria-label={`${item.label} — locked`}
                  role="listitem"
                >
                  <span className="nav-item__icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="nav-item__label">{item.label}</span>
                  <span className="nav-item__lock-icon" aria-hidden="true">
                    <IconLock />
                  </span>
                </span>
              </li>
            );
          }

          return (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={() => navItemClass(item)}
                aria-current={active ? 'page' : undefined}
              >
                <span className="nav-item__icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="nav-item__label">{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>

      {/* Push footer to bottom */}
      <div className="sidebar__spacer" />

      {/* Footer section */}
      <div className="sidebar__footer">
        {/* Top divider */}
        <hr className="sidebar__divider" />

        {/* Footer nav items */}
        <ul className="sidebar__nav-list" role="list" aria-label="Utility navigation">
          {FOOTER_NAV.map((item) => {
            const active = isActive(item);
            const activeClass = active ? ' nav-item--active' : '';
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={() => `nav-item${activeClass}`}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="nav-item__icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="nav-item__label">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>

        {/* Bottom divider */}
        <hr className="sidebar__divider" />

        {/* Vendor logo button */}
        <button
          className="sidebar__vendor-btn"
          type="button"
          aria-label="Vendor information"
        >
          <img
            src={IMG_LOGO}
            alt="NaviSuite logo"
            className="sidebar__vendor-logo"
            onError={(e) => {
              // Fallback if Figma asset URL expires
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
          <span className="sidebar__vendor-fallback" aria-hidden="true">NaviSuite</span>
        </button>
      </div>
    </nav>
  );
}
