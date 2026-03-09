import { transport } from './transport';
import { getAutonomyClient } from './clients';
import {
  VehicleMode,
  SequenceState,
  SubsystemStatus,
  PreflightCheckStatus,
  CalibrationStatus,
} from '../gen/autonomy/v1/autonomy_service_pb';
import type { Command } from '../gen/autonomy/v1/autonomy_service_pb';

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export interface AutonomyTelemetrySnapshot {
  timestamp: string;
  vehicleId: string;
  attitude?: { roll: number; pitch: number; heading: number };
  position?: { latitude: number; longitude: number; depth: number; altitude: number };
  velocity?: { surge: number; sway: number; heave: number; groundSpeed: number };
  power?: { voltage: number; current: number; powerW: number; batteryPct?: number };
  environment?: {
    towCableTension: number;
    waterTemp: number;
    salinity: number;
    soundVelocity: number;
    cableOut: number;
  };
}

export interface AutonomyVehicleStatus {
  timestamp: string;
  vehicleId: string;
  mode: VehicleMode;
  sequenceState: SequenceState;
  activeAlerts: Array<{
    id: string;
    subsystem: string;
    message: string;
    severity: number;
    acknowledged: boolean;
  }>;
  subsystemHealth: Array<{
    id: string;
    label: string;
    status: SubsystemStatus;
    message?: string;
  }>;
}

export interface AutonomyCommandAck {
  accepted: boolean;
  commandId: string;
  reason?: string;
}

export interface AutonomyAbortAck {
  accepted: boolean;
  reason?: string;
}

export interface AutonomyVehicleConfiguration {
  vehicleId: string;
  vehicleType: string;
  displayName: string;
  firmware: string;
  imageUrl: string;
  sensors: Array<{
    id: string;
    type: string;
    label: string;
    present: boolean;
    status: SubsystemStatus;
  }>;
  availableModes: VehicleMode[];
}

export interface AutonomyEvent {
  id: string;
  timestamp: string;
  type: number;
  source: string;
  message: string;
}

export interface AutonomyPreflightUpdate {
  checkId: string;
  label: string;
  subsystem: string;
  status: PreflightCheckStatus;
  message?: string;
}

export interface AutonomyCalibrationUpdate {
  calibrationId: string;
  status: CalibrationStatus;
  progressPct?: number;
  message?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isoTs(ts?: { seconds: bigint; nanos: number }): string {
  return ts ? new Date(Number(ts.seconds) * 1000).toISOString() : new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Mock fallbacks
// ---------------------------------------------------------------------------

function makeMockSnapshot(vehicleId: string): AutonomyTelemetrySnapshot {
  return {
    timestamp: new Date().toISOString(),
    vehicleId,
    attitude: { roll: 0, pitch: 0, heading: 45 },
    position: { latitude: 59.4285, longitude: 5.3047, depth: 25, altitude: 5 },
    velocity: { surge: 1.2, sway: 0.1, heave: 0, groundSpeed: 2.4 },
    power: { voltage: 48, current: 8.5, powerW: 408 },
    environment: { towCableTension: 12.5, waterTemp: 8.2, salinity: 34.8, soundVelocity: 1490, cableOut: 120 },
  };
}

const MOCK_CHECKS: Array<{ checkId: string; label: string; subsystem: string }> = [
  { checkId: 'nav-1',     label: 'Navigation System', subsystem: 'navigation' },
  { checkId: 'power-1',   label: 'Power System',       subsystem: 'power'      },
  { checkId: 'sensors-1', label: 'Sensor Array',        subsystem: 'sensors'    },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function streamTelemetry(
  vehicleId: string,
  onSnapshot: (snap: AutonomyTelemetrySnapshot) => void,
): () => void {
  if (!transport) {
    onSnapshot(makeMockSnapshot(vehicleId));
    return () => {};
  }

  const ctrl = new AbortController();

  (async () => {
    try {
      for await (const snap of getAutonomyClient().streamTelemetry(
        { vehicleId },
        { signal: ctrl.signal },
      )) {
        onSnapshot({
          timestamp: isoTs(snap.timestamp),
          vehicleId: snap.vehicleId,
          attitude: snap.attitude
            ? { roll: snap.attitude.roll, pitch: snap.attitude.pitch, heading: snap.attitude.heading }
            : undefined,
          position: snap.position
            ? { latitude: snap.position.latitude, longitude: snap.position.longitude, depth: snap.position.depth, altitude: snap.position.altitude }
            : undefined,
          velocity: snap.velocity
            ? { surge: snap.velocity.surge, sway: snap.velocity.sway, heave: snap.velocity.heave, groundSpeed: snap.velocity.groundSpeed }
            : undefined,
          power: snap.power
            ? { voltage: snap.power.voltage, current: snap.power.current, powerW: snap.power.powerW, batteryPct: snap.power.batteryPct }
            : undefined,
          environment: snap.environment
            ? { towCableTension: snap.environment.towCableTension, waterTemp: snap.environment.waterTemp, salinity: snap.environment.salinity, soundVelocity: snap.environment.soundVelocity, cableOut: snap.environment.cableOut }
            : undefined,
        });
      }
    } catch (err) {
      if (!ctrl.signal.aborted) console.error('[autonomyService] streamTelemetry error', err);
    }
  })();

  return () => ctrl.abort();
}

export function streamVehicleStatus(
  vehicleId: string,
  onStatus: (status: AutonomyVehicleStatus) => void,
): () => void {
  if (!transport) {
    onStatus({
      timestamp: new Date().toISOString(),
      vehicleId,
      mode: VehicleMode.DEPTH_HOLD,
      sequenceState: SequenceState.NONE,
      activeAlerts: [],
      subsystemHealth: [
        { id: 'navigation', label: 'Navigation', status: SubsystemStatus.NOMINAL },
        { id: 'power',      label: 'Power',      status: SubsystemStatus.NOMINAL },
        { id: 'sensors',    label: 'Sensors',    status: SubsystemStatus.NOMINAL },
      ],
    });
    return () => {};
  }

  const ctrl = new AbortController();

  (async () => {
    try {
      for await (const s of getAutonomyClient().streamVehicleStatus(
        { vehicleId },
        { signal: ctrl.signal },
      )) {
        onStatus({
          timestamp: isoTs(s.timestamp),
          vehicleId: s.vehicleId,
          mode: s.mode,
          sequenceState: s.sequenceState,
          activeAlerts: s.activeAlerts.map((a) => ({
            id: a.id,
            subsystem: a.subsystem,
            message: a.message,
            severity: a.severity,
            acknowledged: a.acknowledged,
          })),
          subsystemHealth: s.subsystemHealth.map((h) => ({
            id: h.id,
            label: h.label,
            status: h.status,
            message: h.message,
          })),
        });
      }
    } catch (err) {
      if (!ctrl.signal.aborted) console.error('[autonomyService] streamVehicleStatus error', err);
    }
  })();

  return () => ctrl.abort();
}

export async function sendCommand(cmd: Command): Promise<AutonomyCommandAck> {
  if (!transport) return { accepted: true, commandId: crypto.randomUUID() };
  const ack = await getAutonomyClient().sendCommand(cmd);
  return { accepted: ack.accepted, commandId: ack.commandId, reason: ack.reason };
}

export async function abort(
  vehicleId: string,
  operatorId: string,
  reason: string,
): Promise<AutonomyAbortAck> {
  if (!transport) return { accepted: true };
  const ack = await getAutonomyClient().abort({ vehicleId, operatorId, reason });
  return { accepted: ack.accepted, reason: ack.reason };
}

export async function getConfiguration(vehicleId: string): Promise<AutonomyVehicleConfiguration> {
  if (!transport) {
    return {
      vehicleId,
      vehicleType: 'ScanFish',
      displayName: 'ScanFish 3D',
      firmware: '2.4.1',
      imageUrl: '/assets/scanfish.png',
      sensors: [
        { id: 'dvl', type: 'dvl', label: 'DVL',    present: true, status: SubsystemStatus.NOMINAL },
        { id: 'imu', type: 'imu', label: 'IMU',    present: true, status: SubsystemStatus.NOMINAL },
        { id: 'ctd', type: 'ctd', label: 'CTD',    present: true, status: SubsystemStatus.NOMINAL },
      ],
      availableModes: [VehicleMode.DEPTH_HOLD, VehicleMode.FOLLOW_SEABED],
    };
  }
  const cfg = await getAutonomyClient().getConfiguration({ vehicleId });
  return {
    vehicleId: cfg.vehicleId,
    vehicleType: cfg.vehicleType,
    displayName: cfg.displayName,
    firmware: cfg.firmware,
    imageUrl: cfg.imageUrl,
    sensors: cfg.sensors.map((s) => ({
      id: s.id,
      type: s.type,
      label: s.label,
      present: s.present,
      status: s.status,
    })),
    availableModes: cfg.availableModes,
  };
}

export function streamEvents(
  vehicleId: string,
  onEvent: (event: AutonomyEvent) => void,
): () => void {
  if (!transport) return () => {};

  const ctrl = new AbortController();

  (async () => {
    try {
      for await (const ev of getAutonomyClient().streamEvents(
        { vehicleId },
        { signal: ctrl.signal },
      )) {
        onEvent({
          id: ev.id,
          timestamp: isoTs(ev.timestamp),
          type: ev.type,
          source: ev.source,
          message: ev.message,
        });
      }
    } catch (err) {
      if (!ctrl.signal.aborted) console.error('[autonomyService] streamEvents error', err);
    }
  })();

  return () => ctrl.abort();
}

export function runPreflight(
  vehicleId: string,
  systemIds: string[],
  signal: AbortSignal,
): AsyncIterable<AutonomyPreflightUpdate> {
  if (!transport) {
    async function* mockRun() {
      for (const check of MOCK_CHECKS) {
        if (signal.aborted) break;
        yield { ...check, status: PreflightCheckStatus.RUNNING };
        await new Promise<void>((r) => setTimeout(r, 400));
        yield { ...check, status: PreflightCheckStatus.PASSED };
      }
    }
    return mockRun();
  }

  async function* generate() {
    for await (const u of getAutonomyClient().runPreflight(
      { vehicleId, systemIds },
      { signal },
    )) {
      yield {
        checkId: u.checkId,
        label: u.label,
        subsystem: u.subsystem,
        status: u.status,
        message: u.message,
      };
    }
  }
  return generate();
}

export function runCalibration(
  vehicleId: string,
  calibrationId: string,
  signal: AbortSignal,
): AsyncIterable<AutonomyCalibrationUpdate> {
  if (!transport) {
    async function* mockRun() {
      for (let pct = 10; pct <= 100; pct += 10) {
        if (signal.aborted) break;
        await new Promise<void>((r) => setTimeout(r, 200));
        yield {
          calibrationId,
          status: pct < 100 ? CalibrationStatus.RUNNING : CalibrationStatus.PASSED,
          progressPct: pct,
        };
      }
    }
    return mockRun();
  }

  async function* generate() {
    for await (const u of getAutonomyClient().runCalibration(
      { vehicleId, calibrationId },
      { signal },
    )) {
      yield {
        calibrationId: u.calibrationId,
        status: u.status,
        progressPct: u.progressPct,
        message: u.message,
      };
    }
  }
  return generate();
}
