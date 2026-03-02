import { createConnectTransport } from '@connectrpc/connect-web';
import type { Transport } from '@connectrpc/connect';

/**
 * Single transport singleton.
 * When VITE_USE_GRPC=true, creates a ConnectRPC HTTP transport.
 * When false (default), returns null so service files fall back to mocks.
 */
export const transport: Transport | null =
  import.meta.env.VITE_USE_GRPC === 'true'
    ? createConnectTransport({
        baseUrl: import.meta.env.VITE_GRPC_BASE_URL ?? 'http://localhost:4001',
      })
    : null;
