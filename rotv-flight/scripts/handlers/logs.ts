import type { ServiceImpl } from '@connectrpc/connect';
import type { LogService } from '../../src/gen/rotv/v1/logs_pb.js';
import { LogLevel } from '../../src/gen/rotv/v1/common_pb.js';

export const logHandler: ServiceImpl<typeof LogService> = {
  async getLogs(_req) {
    return { entries: [] };
  },

  async *tailLogs(_req, ctx) {
    while (!ctx.signal.aborted) {
      await new Promise<void>((r) => setTimeout(r, 2000));
      if (!ctx.signal.aborted) {
        yield {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: LogLevel.INFO,
          source: 'system',
          message: 'Heartbeat OK',
        };
      }
    }
  },
};
