import type { ServiceImpl } from '@connectrpc/connect';
import type { TelemetryService } from '../../src/gen/rotv/v1/telemetry_pb.js';

const TICK_MS = 100;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function randomWalk(current: number, step = 0.1, min = -180, max = 180) {
  return Math.min(max, Math.max(min, current + (Math.random() - 0.5) * step));
}

export const telemetryHandler: ServiceImpl<typeof TelemetryService> = {
  async *streamTelemetry(_req, ctx) {
    let roll = 0, pitch = 0, heading = 0;
    let depth = 25, altitude = 5;
    let tension = 12.5;

    while (!ctx.signal.aborted) {
      roll     = randomWalk(roll, 0.5, -30, 30);
      pitch    = randomWalk(pitch, 0.3, -20, 20);
      heading  = randomWalk(heading, 1.0, 0, 360);
      depth    = randomWalk(depth, 0.2, 10, 100);
      altitude = randomWalk(altitude, 0.1, 1, 20);
      tension  = randomWalk(tension, 0.5, 5, 30);

      yield {
        timestamp: new Date().toISOString(),
        attitude: { roll, pitch, heading },
        position: { latitude: 59.4285, longitude: 5.3047, depth, altitude },
        velocity: { surge: 1.2, sway: 0.1, heave: 0.0, groundSpeed: 2.4 },
        power: { voltage: 48.0, current: 8.5, powerW: 408 },
        towCableTension: tension,
        waterTemp: 8.2,
        salinity: 34.8,
        soundVelocity: 1490,
        cableOut: 120,
      };

      await sleep(TICK_MS);
    }
  },
};
