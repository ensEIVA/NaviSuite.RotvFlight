import type { PreFlightCheck, CheckStatus } from '../types';

// ---------------------------------------------------------------------------
// Check templates keyed by system type
// ---------------------------------------------------------------------------

type CheckTemplate = Omit<PreFlightCheck, 'id' | 'status' | 'completedAt'>;

const CHECKS_BY_TYPE: Record<string, CheckTemplate[]> = {
  'Towed Undulating Vehicle': [
    { category: 'electrical', label: 'Battery Level',         description: 'Verify battery charge > 80%',              automated: true },
    { category: 'software',   label: 'IMU Calibration',       description: 'Check IMU calibration status',             automated: true },
    { category: 'mechanical', label: 'Flap - Starboard',      description: 'Test starboard control flap response',     automated: true },
    { category: 'mechanical', label: 'Flap - Port',           description: 'Test port control flap response',          automated: true },
    { category: 'software',   label: 'Depth Sensor',          description: 'Verify depth sensor readings in range',    automated: true },
    { category: 'comms',      label: 'Comms Link',            description: 'Verify communication link quality',        automated: true },
    { category: 'safety',     label: 'Emergency Stop Circuit',description: 'Test emergency stop function',             automated: true },
  ],
  'Deep-Tow Sensor Platform': [
    { category: 'electrical', label: 'Power Supply',          description: 'Verify power supply voltage and current',  automated: true },
    { category: 'software',   label: 'Motion Sensor',         description: 'Check motion sensor output validity',      automated: true },
    { category: 'software',   label: 'Camera - Forward',      description: 'Test forward camera feed and focus',       automated: true },
    { category: 'software',   label: 'Camera - Down',         description: 'Test downward camera feed and focus',      automated: true },
    { category: 'software',   label: 'Sonar',                 description: 'Verify sonar ping response and range',     automated: true },
    { category: 'comms',      label: 'Tether Integrity',      description: 'Check tether signal integrity',            automated: true },
  ],
  'Tow Winch Controller': [
    { category: 'mechanical', label: 'Winch Brake',           description: 'Verify brake engagement and release',      automated: true },
    { category: 'electrical', label: 'Motor Controller',      description: 'Check motor controller status and limits', automated: true },
    { category: 'software',   label: 'Cable Tension Sensor',  description: 'Calibrate tension sensor zero offset',     automated: true },
    { category: 'safety',     label: 'Overload Protection',   description: 'Test overload cutoff threshold',           automated: true },
  ],
};

const FALLBACK_CHECKS: CheckTemplate[] = [
  { category: 'software', label: 'System Online',  description: 'Verify system is responsive',   automated: true },
  { category: 'comms',    label: 'Comms Link',     description: 'Check communication link',       automated: true },
  { category: 'safety',   label: 'Emergency Stop', description: 'Test emergency stop function',   automated: true },
];

// ---------------------------------------------------------------------------
// Generate a fresh check list for a given system
// ---------------------------------------------------------------------------

export function generateChecksForSystem(systemId: string, systemType: string): PreFlightCheck[] {
  const templates = CHECKS_BY_TYPE[systemType] ?? FALLBACK_CHECKS;
  return templates.map((t, i) => ({
    ...t,
    id: `${systemId}-check-${i}`,
    status: 'pending' as CheckStatus,
  }));
}

// ---------------------------------------------------------------------------
// Mock runner — always succeeds, no artificial delay
// ---------------------------------------------------------------------------

export async function runCheck(_check: PreFlightCheck): Promise<'passed'> {
  return 'passed';
}
