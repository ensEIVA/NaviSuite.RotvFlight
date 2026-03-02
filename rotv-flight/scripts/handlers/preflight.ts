import type { ServiceImpl } from '@connectrpc/connect';
import type { PreflightService } from '../../src/gen/rotv/v1/preflight_pb.js';
import { CheckStatus } from '../../src/gen/rotv/v1/common_pb.js';
import { SYSTEMS } from '../data/systems.js';

const CHECK_DELAY_MS = 400;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function getChecksForSystem(systemId: string) {
  const system = SYSTEMS.find((s) => s.entry?.id === systemId);
  return system?.entry?.checks ?? [];
}

export const preflightHandler: ServiceImpl<typeof PreflightService> = {
  async *runSession(req) {
    for (const systemId of req.systemIds) {
      const checks = getChecksForSystem(systemId);

      for (const check of checks) {
        yield {
          systemId,
          checkId: check.id,
          status: CheckStatus.RUNNING,
          completedAt: '',
        };

        await sleep(CHECK_DELAY_MS);

        yield {
          systemId,
          checkId: check.id,
          status: CheckStatus.PASSED,
          completedAt: new Date().toISOString(),
        };
      }
    }
  },
};
