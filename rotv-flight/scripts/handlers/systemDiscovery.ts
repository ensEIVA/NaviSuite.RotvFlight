import type { ServiceImpl } from '@connectrpc/connect';
import type { SystemDiscoveryService } from '../../src/gen/rotv/v1/system_discovery_pb.js';
import { SYSTEMS } from '../data/systems.js';

const TRICKLE_INTERVAL_MS = 250;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export const systemDiscoveryHandler: ServiceImpl<typeof SystemDiscoveryService> = {
  async *discoverSystems() {
    for (const system of SYSTEMS) {
      await sleep(TRICKLE_INTERVAL_MS);
      yield system;
    }
  },
};
