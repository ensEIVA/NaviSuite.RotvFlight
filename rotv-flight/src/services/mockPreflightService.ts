import type { PreFlightCheck } from '../types';

// ---------------------------------------------------------------------------
// Mock runner — always succeeds, no artificial delay
// Swap this out for a real service call when hardware is available
// ---------------------------------------------------------------------------

export async function runCheck(_check: PreFlightCheck): Promise<'passed'> {
  return 'passed';
}
