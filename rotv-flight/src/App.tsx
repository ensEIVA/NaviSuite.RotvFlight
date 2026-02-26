import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { MantineProvider } from '@mantine/core';

export default function App() {
  return (
    <MantineProvider>
      <RouterProvider router={router} />
    </MantineProvider>
  );
}
