import type { ServiceImpl } from '@connectrpc/connect';
import type { CalibrationService } from '../../src/gen/rotv/v1/calibration_pb.js';

export const calibrationHandler: ServiceImpl<typeof CalibrationService> = {
  async listCalibrations(_req) {
    return { items: [] };
  },

  async *runCalibration(req) {
    for (let pct = 10; pct <= 100; pct += 10) {
      await new Promise<void>((r) => setTimeout(r, 200));
      yield {
        calibrationId: req.calibrationId,
        status: pct < 100 ? 'in_progress' : 'passed',
        progressPct: pct,
        completedAt: pct === 100 ? new Date().toISOString() : undefined,
      };
    }
  },
};
