import type { SystemStatus } from '../types';
import './StatusBadge.css';

interface StatusBadgeProps {
  status: SystemStatus;
  label?: string;
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const STATUS_LABELS: Record<SystemStatus, string> = {
  nominal: 'Nominal',
  warning: 'Warning',
  critical: 'Critical',
  offline:  'Offline',
  unknown:  'Unknown',
};

export function StatusBadge({ status, label, pulse = false, size = 'md' }: StatusBadgeProps) {
  const displayLabel = label ?? STATUS_LABELS[status];

  return (
    <span
      className={`status-badge status-badge--${status} status-badge--${size}${pulse ? ' status-badge--pulse' : ''}`}
      role="status"
      aria-label={`Status: ${displayLabel}`}
    >
      <span className="status-badge__dot" aria-hidden="true" />
      <span className="status-badge__label">{displayLabel}</span>
    </span>
  );
}
