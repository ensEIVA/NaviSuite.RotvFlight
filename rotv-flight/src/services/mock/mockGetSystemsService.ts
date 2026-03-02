import type { SystemDef } from '../../types';

const WS_URL = 'ws://localhost:4001';

/**
 * Opens a WebSocket connection to the local publisher and calls `onSystem`
 * each time a system is discovered on the network.
 *
 * Returns a cleanup function that closes the socket.
 */
export default function mockGetSystemsService(
  onSystem: (def: SystemDef) => void,
): () => void {
  const ws = new WebSocket(WS_URL);

  ws.onmessage = (event) => {
    try {
      const def = JSON.parse(event.data as string) as SystemDef;
      onSystem(def);
    } catch {
      console.warn('[mockGetSystemsService] Failed to parse message', event.data);
    }
  };

  ws.onerror = () => {
    console.warn('[mockGetSystemsService] WebSocket error — is publisher.js running?');
  };

  return () => ws.close();
}
