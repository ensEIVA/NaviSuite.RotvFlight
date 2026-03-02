import type { CheckStatus } from '../types';
import { transport } from './transport';
import { getPreflightClient } from './clients';
import { CheckStatus as ProtoCheckStatus } from '../gen/rotv/v1/common_pb';

// ---------------------------------------------------------------------------
// Proto → TS domain type mapping
// ---------------------------------------------------------------------------

export interface CheckStatusUpdate {
  systemId: string;
  checkId: string;
  status: CheckStatus;
  completedAt: string;
}

function mapStatus(s: ProtoCheckStatus): CheckStatus {
  switch (s) {
    case ProtoCheckStatus.PENDING:  return 'pending';
    case ProtoCheckStatus.RUNNING:  return 'running';
    case ProtoCheckStatus.PASSED:   return 'passed';
    case ProtoCheckStatus.FAILED:   return 'failed';
    case ProtoCheckStatus.SKIPPED:  return 'skipped';
    case ProtoCheckStatus.WARNING:  return 'warning';
    default:                        return 'pending';
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Runs a preflight session for the given system IDs.
 *
 * When VITE_USE_GRPC=true, streams `CheckStatusUpdate` from the server.
 * When false, the store falls back to the inline mock runner.
 *
 * Returns an async iterable of updates and an abort function.
 */
export function runSession(
  systemIds: string[],
  signal: AbortSignal,
): AsyncIterable<CheckStatusUpdate> {
  if (!transport) {
    // Should not be called when mock is active — store guards this
    throw new Error('runSession called without ConnectRPC transport');
  }

  const client = getPreflightClient();

  async function* generate(): AsyncGenerator<CheckStatusUpdate> {
    for await (const update of client.runSession(
      { systemIds },
      { signal },
    )) {
      yield {
        systemId: update.systemId,
        checkId: update.checkId,
        status: mapStatus(update.status),
        completedAt: update.completedAt,
      };
    }
  }

  return generate();
}
