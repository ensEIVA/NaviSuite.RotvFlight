/**
 * Mock system discovery publisher
 *
 * Simulates systems being detected on the network one by one.
 * Run with:  node scripts/publisher.js
 */

const { WebSocketServer } = await import('ws');

const PORT = 4001;
const TRICKLE_INTERVAL_MS = 750;

// ---------------------------------------------------------------------------
// System definitions (mirrors mockGetSystemsService catalogue)
// ---------------------------------------------------------------------------

const SYSTEMS = [
  {
    entry: {
      id: 'scanfish',
      name: 'ScanFish Rocio',
      type: 'Towed Undulating Vehicle',
      ip: '192.168.1.10',
      firmware: 'v4.12.3',
      signal: -58,
    },
    displayName: 'ScanFish Rocio',
    image: '',
    hasFirmwareUpdate: true,
    initiallyConnected: true,
  },
  {
    entry: {
      id: 'viperfish',
      name: 'ViperFish',
      type: 'Deep-Tow Sensor Platform',
      ip: '192.168.1.24',
      firmware: 'v2.8.1',
      signal: -71,
    },
    displayName: 'ViperFish',
    image: '',
    hasFirmwareUpdate: false,
    initiallyConnected: false,
  },
  {
    entry: {
      id: 'winch',
      name: 'Winch',
      type: 'Tow Winch Controller',
      ip: '192.168.1.50',
      firmware: 'v1.6.0',
      signal: -44,
    },
    displayName: 'Winch',
    image: '',
    hasFirmwareUpdate: false,
    initiallyConnected: true,
  },
];

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const wss = new WebSocketServer({ port: PORT });
console.log(`[publisher] WebSocket server listening on ws://localhost:${PORT}`);

wss.on('connection', (ws) => {
  console.log('[publisher] Client connected — starting system trickle');

  SYSTEMS.forEach((system, i) => {
    setTimeout(() => {
      if (ws.readyState !== ws.OPEN) return;

      ws.send(JSON.stringify(system));
      console.log(`[publisher] Sent: ${system.displayName}`);

      if (i === SYSTEMS.length - 1) {
        console.log('[publisher] All systems sent');
      }
    }, (i + 1) * TRICKLE_INTERVAL_MS);
  });

  ws.on('close', () => console.log('[publisher] Client disconnected'));
});
