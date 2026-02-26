/**
 * Mock system discovery publisher
 *
 * Simulates systems being detected on the network one by one.
 * Run with:  node scripts/publisher.js
 */

const { WebSocketServer } = await import('ws');

const PORT = 4001;
const TRICKLE_INTERVAL_MS = 250;

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
      checks: [
        { id: 'scanfish-check-0', category: 'electrical', label: 'Battery Level',          description: 'Verify battery charge > 80%',               automated: true, status: 'pending' },
        { id: 'scanfish-check-1', category: 'software',   label: 'IMU Calibration',        description: 'Check IMU calibration status',              automated: true, status: 'pending' },
        { id: 'scanfish-check-2', category: 'mechanical', label: 'Flap - Starboard',       description: 'Test starboard control flap response',      automated: true, status: 'pending' },
        { id: 'scanfish-check-3', category: 'mechanical', label: 'Flap - Port',            description: 'Test port control flap response',           automated: true, status: 'pending' },
        { id: 'scanfish-check-4', category: 'software',   label: 'Depth Sensor',           description: 'Verify depth sensor readings in range',     automated: true, status: 'pending' },
        { id: 'scanfish-check-5', category: 'comms',      label: 'Comms Link',             description: 'Verify communication link quality',         automated: true, status: 'pending' },
        { id: 'scanfish-check-6', category: 'safety',     label: 'Emergency Stop Circuit', description: 'Test emergency stop function',              automated: true, status: 'pending' },
      ],
    },
    displayName: 'ScanFish Rocio',
    image: './assets/scanfish.png',
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
      checks: [
        { id: 'viperfish-check-0', category: 'electrical', label: 'Power Supply',    description: 'Verify power supply voltage and current', automated: true, status: 'pending' },
        { id: 'viperfish-check-1', category: 'software',   label: 'Motion Sensor',   description: 'Check motion sensor output validity',    automated: true, status: 'pending' },
        { id: 'viperfish-check-2', category: 'software',   label: 'Camera - Forward',description: 'Test forward camera feed and focus',     automated: true, status: 'pending' },
        { id: 'viperfish-check-3', category: 'software',   label: 'Camera - Down',   description: 'Test downward camera feed and focus',    automated: true, status: 'pending' },
        { id: 'viperfish-check-4', category: 'software',   label: 'Sonar',           description: 'Verify sonar ping response and range',   automated: true, status: 'pending' },
        { id: 'viperfish-check-5', category: 'comms',      label: 'Tether Integrity',description: 'Check tether signal integrity',          automated: true, status: 'pending' },
      ],
    },
    displayName: 'ViperFish',
    image: './assets/viperfish.png',
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
      checks: [
        { id: 'winch-check-0', category: 'mechanical', label: 'Winch Brake',          description: 'Verify brake engagement and release',     automated: true, status: 'pending' },
        { id: 'winch-check-1', category: 'electrical', label: 'Motor Controller',     description: 'Check motor controller status and limits', automated: true, status: 'pending' },
        { id: 'winch-check-2', category: 'software',   label: 'Cable Tension Sensor', description: 'Calibrate tension sensor zero offset',     automated: true, status: 'pending' },
        { id: 'winch-check-3', category: 'safety',     label: 'Overload Protection',  description: 'Test overload cutoff threshold',           automated: true, status: 'pending' },
      ],
    },
    displayName: 'Winch',
    image: './assets/winch.png',
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
