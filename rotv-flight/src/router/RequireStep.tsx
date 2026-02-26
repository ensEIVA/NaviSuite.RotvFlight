import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useFlowStore } from '../stores/useFlowStore';

interface RequireStepProps {
  /**
   * The step number that must be complete before this route is accessible.
   *
   * step={1} — step 1 must be complete (redirects to / if not)
   * step={2} — steps 1 and 2 must both be complete (redirects to /preflight if not)
   */
  step: 1 | 2;
  children: ReactNode;
}

/**
 * Route guard that enforces the sequential step completion contract.
 *
 * - RequireStep step={1}: guards /preflight — redirects to / if step 1 is not done.
 * - RequireStep step={2}: guards /dashboard — redirects to /preflight if step 1 is
 *   done but step 2 is not, or to / if neither is done.
 */
export function RequireStep({ step, children }: RequireStepProps) {
  const { step1Complete, step2Complete } = useFlowStore();

  if (step === 1) {
    if (!step1Complete) {
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  }

  // step === 2
  if (!step1Complete) {
    return <Navigate to="/" replace />;
  }
  if (!step2Complete) {
    return <Navigate to="/preflight" replace />;
  }
  return <>{children}</>;
}
