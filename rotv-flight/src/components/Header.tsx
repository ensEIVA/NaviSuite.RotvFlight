import { useState, useEffect } from 'react';
import './Header.css';

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
    <header className="topbar" role="banner" aria-label="Application topbar">
      {/* Left section */}
      <div className="topbar__left">
        {/* Hamburger menu button */}
        <button
          className="topbar__icon-btn"
          aria-label="Open navigation menu"
          type="button"
        >
          <svg
            className="topbar__icon"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect x="3" y="6" width="18" height="2" fill="currentColor" />
            <rect x="3" y="11" width="18" height="2" fill="currentColor" />
            <rect x="3" y="16" width="18" height="2" fill="currentColor" />
          </svg>
        </button>

        {/* Ship icon */}
        <span className="topbar__ship-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M3 17L5 11H19L21 17H3Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M7 11V8C7 7.44772 7.44772 7 8 7H16C16.5523 7 17 7.44772 17 8V11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
              fill="none"
            />
            <line
              x1="12"
              y1="7"
              x2="12"
              y2="4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M5 17L4 20H20L19 17"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </span>

        {/* App name */}
        <span className="topbar__app-name">ROTV Flight</span>
      </div>

      {/* Right section */}
      <div className="topbar__right">
        {/* Alerts button group */}
        <div className="topbar__btn-group" role="group" aria-label="Alert controls">
          <button
            className="topbar__icon-btn topbar__icon-btn--alert"
            aria-label="View alerts"
            type="button"
          >
            <svg
              className="topbar__icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M12 3C9.23858 3 7 5.23858 7 8V13L5 15V16H19V15L17 13V8C17 5.23858 14.7614 3 12 3Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d="M10 16C10 17.1046 10.8954 18 12 18C13.1046 18 14 17.1046 14 16"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </button>

          <button
            className="topbar__icon-btn"
            aria-label="View alarm list"
            type="button"
          >
            <svg
              className="topbar__icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M4 6H20M4 10H14M4 14H10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Divider */}
        <span className="topbar__divider" aria-hidden="true" />

        {/* Brightness button */}
        <button
          className="topbar__icon-btn"
          aria-label="Adjust brightness"
          type="button"
        >
          <svg
            className="topbar__icon"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <line x1="12" y1="3" x2="12" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="12" y1="19" x2="12" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="3" y1="12" x2="5" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="19" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="5.63604" y1="5.63604" x2="7.05025" y2="7.05025" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="16.9497" y1="16.9497" x2="18.364" y2="18.364" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="5.63604" y1="18.364" x2="7.05025" y2="16.9497" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="16.9497" y1="7.05025" x2="18.364" y2="5.63604" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Divider */}
        <span className="topbar__divider" aria-hidden="true" />

        {/* UTC clock */}
        <time
          className="topbar__clock"
          dateTime={utcTime}
          aria-label={`Current UTC time: ${utcTime}`}
        >
          {utcTime}
        </time>
      </div>
    </header>
  );
}

function formatUtc(date: Date): string {
  return date.toISOString().substring(11, 19);
}
