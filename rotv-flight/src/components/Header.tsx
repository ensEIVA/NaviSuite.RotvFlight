import { StatusBadge } from './StatusBadge';
import { EmergencyStop } from './EmergencyStop';
import type { FlightPhase, SystemStatus } from '../types';
import './Header.css';

interface HeaderProps {
  systemStatus: SystemStatus;
  flightPhase: FlightPhase;
  missionName: string;
  utcTime: string;
  onEmergencyStop: () => void;
}

const PHASE_LABELS: Record<FlightPhase, string> = {
  standby:     'Standby',
  pre_flight:  'Pre-Flight',
  launch:      'Launch',
  transit:     'Transit',
  on_station:  'On Station',
  survey:      'Survey',
  recovery:    'Recovery',
  post_flight: 'Post-Flight',
};

export function Header({
  systemStatus,
  flightPhase,
  missionName,
  utcTime,
  onEmergencyStop,
}: HeaderProps) {
  return (
    <header className="app-header" role="banner">
      {/* Left: mission context */}
      <div className="app-header__left">
        <div className="app-header__mission">
          <span className="app-header__mission-label">Mission</span>
          <span className="app-header__mission-name">{missionName}</span>
        </div>

        <div className="app-header__divider" aria-hidden="true" />

        <div className="app-header__phase">
          <span className="app-header__phase-label">Phase</span>
          <span className={`app-header__phase-value app-header__phase-value--${flightPhase}`}>
            {PHASE_LABELS[flightPhase]}
          </span>
        </div>
      </div>

      {/* Centre: system status */}
      <div className="app-header__centre">
        <StatusBadge status={systemStatus} pulse={systemStatus === 'nominal'} size="lg" />
      </div>

      {/* Right: time + E-STOP */}
      <div className="app-header__right">
        <div className="app-header__utc">
          <span className="app-header__utc-label">UTC</span>
          <time className="app-header__utc-time" dateTime={utcTime} aria-label={`Current UTC time: ${utcTime}`}>
            {utcTime}
          </time>
        </div>

        <div className="app-header__divider" aria-hidden="true" />

        <EmergencyStop onConfirm={onEmergencyStop} />
      </div>
    </header>
  );
}
