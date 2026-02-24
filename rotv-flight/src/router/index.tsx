import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout }  from '../layouts/AppLayout';
import { Systems }    from '../views/Systems/Systems';
import { PreFlight }  from '../views/PreFlight/PreFlight';
import { Dashboard }  from '../views/Dashboard/Dashboard';
import { Telemetry }  from '../views/Telemetry/Telemetry';
import { DataQuality } from '../views/DataQuality/DataQuality';
import { Calibration } from '../views/Calibration/Calibration';
import { Diagnostics } from '../views/Diagnostics/Diagnostics';
import { Logs }       from '../views/Logs/Logs';
import { Settings }   from '../views/Settings/Settings';
import { RequireStep } from './RequireStep';

/**
 * Application router.
 *
 * The 3-step user journey:
 *   /            — Step 1: Systems discovery (always accessible)
 *   /preflight   — Step 2: Pre-flight checks (requires step 1 complete)
 *   /dashboard   — Step 3: Operation dashboard (requires steps 1+2 complete)
 *
 * Legacy routes remain available but have no guards — they are kept for
 * future integration with the full NaviSuite platform.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      // ----------------------------------------------------------------
      // 3-step journey
      // ----------------------------------------------------------------
      {
        index: true,
        element: <Systems />,
      },
      {
        path: 'preflight',
        element: (
          <RequireStep step={1}>
            <PreFlight />
          </RequireStep>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <RequireStep step={2}>
            <Dashboard />
          </RequireStep>
        ),
      },

      // ----------------------------------------------------------------
      // Legacy routes — no guards, kept for future use
      // ----------------------------------------------------------------
      {
        path: 'telemetry',
        element: <Telemetry />,
      },
      {
        path: 'data-quality',
        element: <DataQuality />,
      },
      {
        path: 'calibration',
        element: <Calibration />,
      },
      {
        path: 'diagnostics',
        element: <Diagnostics />,
      },
      {
        path: 'logs',
        element: <Logs />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },

      // ----------------------------------------------------------------
      // Catch-all
      // ----------------------------------------------------------------
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
