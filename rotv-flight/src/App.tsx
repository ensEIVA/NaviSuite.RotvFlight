import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { MantineProvider } from '@mantine/core';
import { useSettingsStore } from './stores/useSettingsStore';

export default function App() {
  const load = useSettingsStore((s) => s.load);

  useEffect(() => {
    load();
  }, []);

  return (
    <MantineProvider>
      <RouterProvider router={router} />
    </MantineProvider>
  );
}
