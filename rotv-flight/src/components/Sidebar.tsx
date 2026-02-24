import { NavLink } from 'react-router-dom';
import type { NavItem } from '../types';
import './Sidebar.css';

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',    path: '/',              icon: '◈' },
  { label: 'Pre-Flight',   path: '/pre-flight',    icon: '✓' },
  { label: 'Telemetry',    path: '/telemetry',     icon: '◉' },
  { label: 'Data Quality', path: '/data-quality',  icon: '▦' },
  { label: 'Calibration',  path: '/calibration',   icon: '⊕' },
  { label: 'Diagnostics',  path: '/diagnostics',   icon: '⚙' },
  { label: 'Logs',         path: '/logs',          icon: '≡' },
  { label: 'Settings',     path: '/settings',      icon: '⋮' },
];

export function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Primary navigation">
      {/* Brand / product identity */}
      <div className="sidebar__brand">
        <div className="sidebar__brand-mark" aria-hidden="true">RF</div>
        <div className="sidebar__brand-text">
          <span className="sidebar__brand-name">ROTV</span>
          <span className="sidebar__brand-sub">Flight</span>
        </div>
      </div>

      {/* Primary navigation */}
      <nav className="sidebar__nav">
        <ul className="sidebar__nav-list" role="list">
          {NAV_ITEMS.map((item) => (
            <li key={item.path} className="sidebar__nav-item">
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `sidebar__nav-link${isActive ? ' sidebar__nav-link--active' : ''}`
                }
                aria-current={undefined}
              >
                <span className="sidebar__nav-icon" aria-hidden="true">{item.icon}</span>
                <span className="sidebar__nav-label">{item.label}</span>
                {item.badge !== undefined && (
                  <span className="sidebar__nav-badge" aria-label={`${item.badge} notifications`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom section — instance info */}
      <div className="sidebar__footer">
        <div className="sidebar__instance">
          <span className="sidebar__instance-dot" aria-hidden="true" />
          <div className="sidebar__instance-info">
            <span className="sidebar__instance-name">ROTV-01</span>
            <span className="sidebar__instance-vessel">MV Meridian</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
