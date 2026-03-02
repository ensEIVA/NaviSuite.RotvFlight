import type { ServiceImpl } from '@connectrpc/connect';
import type { DataQualityService } from '../../src/gen/rotv/v1/data_quality_pb.js';

export const dataQualityHandler: ServiceImpl<typeof DataQualityService> = {
  async getReports(_req) {
    return { reports: [] };
  },

  async *streamActiveLine(_req, ctx) {
    while (!ctx.signal.aborted) {
      await new Promise<void>((r) => setTimeout(r, 10000));
    }
  },
};
