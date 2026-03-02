import type { CalibrationResult } from '../types';
import { transport } from './transport';
import { getCalibrationClient } from './clients';

// ---------------------------------------------------------------------------
// Static fallback used when VITE_USE_GRPC=false
// ---------------------------------------------------------------------------

const FALLBACK: CalibrationResult[] = [
  { id: 'cal-01', subsystem: 'imu',          label: 'IMU — Heading Offset',           status: 'passed',      lastRun: '2024-11-13T14:00:00Z', operator: 'J. Mackenzie', residualError: 0.12 },
  { id: 'cal-02', subsystem: 'imu',          label: 'IMU — Roll / Pitch Bias',        status: 'passed',      lastRun: '2024-11-13T14:08:00Z', operator: 'J. Mackenzie', residualError: 0.04 },
  { id: 'cal-03', subsystem: 'dvl',          label: 'DVL — Alignment Angles',         status: 'stale',       lastRun: '2024-11-10T09:22:00Z', operator: 'S. Torvik',    residualError: 0.31, notes: 'Last run >3 days ago — recommend re-run before next survey.' },
  { id: 'cal-04', subsystem: 'dvl',          label: 'DVL — Scale Factor',             status: 'passed',      lastRun: '2024-11-13T14:30:00Z', operator: 'J. Mackenzie', residualError: 0.02 },
  { id: 'cal-05', subsystem: 'usbl',         label: 'USBL — Lever Arm Offsets',       status: 'passed',      lastRun: '2024-11-14T07:00:00Z', operator: 'S. Torvik',    residualError: 0.06 },
  { id: 'cal-06', subsystem: 'sonar',        label: 'Sonar — Sound Velocity Profile', status: 'in_progress', lastRun: '2024-11-14T08:10:00Z', operator: 'J. Mackenzie' },
  { id: 'cal-07', subsystem: 'altimeter',    label: 'Altimeter — Offset Check',       status: 'not_run' },
  { id: 'cal-08', subsystem: 'pressure_vessel', label: 'Pressure Sensor — Depth Cal', status: 'passed',     lastRun: '2024-11-13T13:45:00Z', operator: 'S. Torvik',    residualError: 0.01 },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function listCalibrations(systemId: string): Promise<CalibrationResult[]> {
  if (!transport) return FALLBACK;

  const response = await getCalibrationClient().listCalibrations({ systemId });
  return response.items.map((item) => ({
    id: item.id,
    subsystem: item.subsystem as CalibrationResult['subsystem'],
    label: item.label,
    status: item.status as CalibrationResult['status'],
    lastRun: item.lastRun,
    operator: item.operator,
    residualError: item.residualError,
    notes: item.notes,
  }));
}

export interface CalibrationProgressUpdate {
  calibrationId: string;
  status: string;
  progressPct: number;
  message?: string;
  residualError?: number;
  completedAt?: string;
}

export function runCalibration(
  systemId: string,
  calibrationId: string,
  onProgress: (update: CalibrationProgressUpdate) => void,
): () => void {
  if (!transport) {
    onProgress({ calibrationId, status: 'passed', progressPct: 100 });
    return () => {};
  }

  const ctrl = new AbortController();

  (async () => {
    try {
      for await (const p of getCalibrationClient().runCalibration(
        { systemId, calibrationId },
        { signal: ctrl.signal },
      )) {
        onProgress({
          calibrationId: p.calibrationId,
          status: p.status,
          progressPct: p.progressPct,
          message: p.message,
          residualError: p.residualError,
          completedAt: p.completedAt,
        });
      }
    } catch (err) {
      if (!ctrl.signal.aborted) {
        console.error('[calibrationService] stream error', err);
      }
    }
  })();

  return () => ctrl.abort();
}
