import { randomUUID } from 'node:crypto';
import type { ServiceImpl } from '@connectrpc/connect';
import { create } from '@bufbuild/protobuf';
import { TimestampSchema } from '@bufbuild/protobuf/wkt';
import type { AutonomyService } from '../../src/gen/autonomy/v1/autonomy_service_pb.js';
import {
  VehicleMode,
  SequenceState,
  SubsystemStatus,
  PreflightCheckStatus,
  CalibrationStatus,
  EventType,
} from '../../src/gen/autonomy/v1/autonomy_service_pb.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TICK_MS = 100;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function randomWalk(current: number, step = 0.1, min = -180, max = 180) {
  return Math.min(max, Math.max(min, current + (Math.random() - 0.5) * step));
}

function nowTs() {
  return create(TimestampSchema, {
    seconds: BigInt(Math.floor(Date.now() / 1000)),
    nanos: 0,
  });
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export const autonomyHandler: ServiceImpl<typeof AutonomyService> = {

  async *streamTelemetry(req, ctx) {
    let roll = 0, pitch = 0, heading = 0;
    let depth = 25, altitude = 5;
    let tension = 12.5;

    while (!ctx.signal.aborted) {
      roll     = randomWalk(roll,    0.5,  -30,  30);
      pitch    = randomWalk(pitch,   0.3,  -20,  20);
      heading  = randomWalk(heading, 1.0,    0, 360);
      depth    = randomWalk(depth,   0.2,   10, 100);
      altitude = randomWalk(altitude, 0.1,   1,  20);
      tension  = randomWalk(tension,  0.5,   5,  30);

      yield {
        timestamp:   nowTs(),
        vehicleId:   req.vehicleId,
        attitude:    { roll, pitch, heading },
        position:    { latitude: 59.4285, longitude: 5.3047, depth, altitude },
        velocity:    { surge: 1.2, sway: 0.1, heave: 0, groundSpeed: 2.4 },
        power:       { voltage: 48.0, current: 8.5, powerW: 408 },
        environment: { towCableTension: tension, waterTemp: 8.2, salinity: 34.8, soundVelocity: 1490, cableOut: 120 },
      };

      await sleep(TICK_MS);
    }
  },

  async *streamVehicleStatus(req, ctx) {
    yield {
      timestamp:       nowTs(),
      vehicleId:       req.vehicleId,
      mode:            VehicleMode.DEPTH_HOLD,
      sequenceState:   SequenceState.NONE,
      activeAlerts:    [],
      subsystemHealth: [
        { id: 'navigation', label: 'Navigation', status: SubsystemStatus.NOMINAL },
        { id: 'power',      label: 'Power',      status: SubsystemStatus.NOMINAL },
        { id: 'sensors',    label: 'Sensors',    status: SubsystemStatus.NOMINAL },
      ],
    };
    // Hold open until disconnect; re-emit here on state change in the future
    while (!ctx.signal.aborted) {
      await sleep(30_000);
    }
  },

  async sendCommand(req) {
    console.log(`[autonomy] sendCommand ${req.payload.case} vehicle=${req.vehicleId}`);
    return { accepted: true, commandId: randomUUID() };
  },

  async abort(req) {
    console.log(`[autonomy] abort vehicle=${req.vehicleId} reason="${req.reason}"`);
    return { accepted: true };
  },

  async getConfiguration(req) {
    return {
      vehicleId:   req.vehicleId,
      vehicleType: 'ScanFish',
      displayName: 'ScanFish 3D',
      firmware:    '2.4.1',
      imageUrl:    '/assets/scanfish.png',
      sensors: [
        { id: 'dvl', type: 'dvl', label: 'DVL', present: true, status: SubsystemStatus.NOMINAL, firmwareVersion: '1.2.0' },
        { id: 'imu', type: 'imu', label: 'IMU', present: true, status: SubsystemStatus.NOMINAL },
        { id: 'ctd', type: 'ctd', label: 'CTD', present: true, status: SubsystemStatus.NOMINAL },
      ],
      availableModes: [VehicleMode.DEPTH_HOLD, VehicleMode.FOLLOW_SEABED],
    };
  },

  async *streamEvents(req, ctx) {
    let seq = 0;
    while (!ctx.signal.aborted) {
      await sleep(30_000);
      if (ctx.signal.aborted) break;
      yield {
        id:        `evt-${++seq}`,
        timestamp: nowTs(),
        type:      EventType.SYSTEM,
        source:    'system',
        message:   'Periodic system health check — nominal',
        payload:   { case: undefined },
      };
    }
    void req; // vehicle_id available for future filtering
  },

  async *runPreflight(_req) {
    const checks = [
      { checkId: 'nav-1',     label: 'Navigation System', subsystem: 'navigation' },
      { checkId: 'power-1',   label: 'Power System',       subsystem: 'power'      },
      { checkId: 'sensors-1', label: 'Sensor Array',        subsystem: 'sensors'    },
    ];

    for (const check of checks) {
      yield { ...check, status: PreflightCheckStatus.RUNNING };
      await sleep(400);
      yield { ...check, status: PreflightCheckStatus.PASSED };
    }
  },

  async *runCalibration(req) {
    for (let pct = 10; pct <= 100; pct += 10) {
      await sleep(200);
      yield {
        calibrationId: req.calibrationId,
        status:        pct < 100 ? CalibrationStatus.RUNNING : CalibrationStatus.PASSED,
        progressPct:   pct,
      };
    }
  },
};
