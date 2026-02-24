import { RouterProvider } from 'react-router-dom';
import { FlowProvider } from './context/FlowContext';
import { router } from './router';
import { MantineProvider } from '@mantine/core';

/**
 * App — root React component.
 *
 * FlowProvider wraps RouterProvider so that FlowContext is available
 * to every route including the AppLayout (which reads step state for
 * the stepper nav) and the route guards (RequireStep).
 */
export default function App() {
  return (
    <FlowProvider>
      <MantineProvider>

        <RouterProvider router={router} />
      </MantineProvider>
    </FlowProvider>
  );
}
