import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { MantineProvider } from '@mantine/core';
import { useSettingsStore } from './stores/useSettingsStore';
import { useLogsStore } from './stores/useLogsStore';

export default function App() {
  const loadSettings = useSettingsStore((s) => s.load);
  const loadLogs     = useLogsStore((s) => s.load);

  useEffect(() => {
    loadSettings();
    loadLogs(''); // stream runs for the entire session — not tied to the Logs view
  }, []);

  return (
    <MantineProvider>
      <RouterProvider router={router} />
    </MantineProvider>
  );
}
