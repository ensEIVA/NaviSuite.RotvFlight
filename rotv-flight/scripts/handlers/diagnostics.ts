import type { ServiceImpl } from '@connectrpc/connect';
import type { DiagnosticsService } from '../../src/gen/rotv/v1/diagnostics_pb.js';
import { Severity, SystemStatus } from '../../src/gen/rotv/v1/common_pb.js';

export const diagnosticsHandler: ServiceImpl<typeof DiagnosticsService> = {
  async getEvents(_req) {
    return { events: [] };
  },

  async *streamEvents(_req, ctx) {
    while (!ctx.signal.aborted) {
      await new Promise<void>((r) => setTimeout(r, 5000));
      if (!ctx.signal.aborted) {
        yield {
          id: `evt-${Date.now()}`,
          timestamp: new Date().toISOString(),
          subsystem: 'comms_link',
          type: 'threshold_breach',
          description: 'Signal strength dropped below threshold',
          severity: Severity.WARNING,
          resolved: false,
        };
      }
    }
  },

  async getHealth(_req) {
    return {
      overallStatus: SystemStatus.NOMINAL,
      timestamp: new Date().toISOString(),
      subsystems: [],
    };
  },
};
