import type { SystemDef } from '../../types';

// Static system catalogue — mirrors scripts/data/systems.ts
// Used when VITE_USE_GRPC=false (no server required)

const MOCK_SYSTEMS: SystemDef[] = [
  {
    displayName: 'ScanFish Rocio',
    image: '/assets/scanfish.png',
    hasFirmwareUpdate: true,
    initiallyConnected: true,
    entry: {
      id: 'scanfish',
      name: 'ScanFish Rocio',
      type: 'Towed Undulating Vehicle',
      ip: '192.168.1.10',
      firmware: 'v4.12.3',
      signal: -58,
      checks: [
        { id: 'scanfish-check-0', category: 'electrical', label: 'Battery Level',          description: 'Verify battery charge > 80%',              status: 'pending', automated: true, sceneNode: { position: [ 0.9,  0.00,  0.0], radius: 0.07 } },
        { id: 'scanfish-check-1', category: 'software',   label: 'IMU Calibration',        description: 'Check IMU calibration status',             status: 'pending', automated: true, sceneNode: { position: [ 0.0,  0.32,  0.0], radius: 0.07 } },
        { id: 'scanfish-check-2', category: 'mechanical', label: 'Flap - Starboard',       description: 'Test starboard control flap response',     status: 'pending', automated: true, sceneNode: { position: [ 0.0, -0.05, -0.7], radius: 0.07, meshAnchor: 'stbd-wing' } },
        { id: 'scanfish-check-3', category: 'mechanical', label: 'Flap - Port',            description: 'Test port control flap response',          status: 'pending', automated: true, sceneNode: { position: [ 0.0, -0.05,  0.7], radius: 0.07, meshAnchor: 'port-wing' } },
        { id: 'scanfish-check-4', category: 'software',   label: 'Depth Sensor',           description: 'Verify depth sensor readings in range',    status: 'pending', automated: true, sceneNode: { position: [ 0.0, -0.30,  0.0], radius: 0.07 } },
        { id: 'scanfish-check-5', category: 'comms',      label: 'Comms Link',             description: 'Verify communication link quality',        status: 'pending', automated: true, sceneNode: { position: [ 0.6,  0.50,  0.0], radius: 0.07, meshAnchor: 'fin' } },
        { id: 'scanfish-check-6', category: 'safety',     label: 'Emergency Stop Circuit', description: 'Test emergency stop function',             status: 'pending', automated: true, sceneNode: { position: [ 1.0,  0.32,  0.0], radius: 0.07 } },
      ],
    },
  },
  {
    displayName: 'ViperFish',
    image: '/assets/viperfish.png',
    hasFirmwareUpdate: false,
    initiallyConnected: false,
    entry: {
      id: 'viperfish',
      name: 'ViperFish',
      type: 'Deep-Tow Sensor Platform',
      ip: '192.168.1.24',
      firmware: 'v2.8.1',
      signal: -71,
      checks: [
        { id: 'viperfish-check-0', category: 'electrical', label: 'Power Supply',     description: 'Verify power supply voltage and current', status: 'pending', automated: true, sceneNode: { position: [ 0.9,  0.32,  0.0], radius: 0.07 } },
        { id: 'viperfish-check-1', category: 'software',   label: 'Motion Sensor',    description: 'Check motion sensor output validity',    status: 'pending', automated: true, sceneNode: { position: [ 0.0,  0.32,  0.0], radius: 0.07 } },
        { id: 'viperfish-check-2', category: 'software',   label: 'Camera - Forward', description: 'Test forward camera feed and focus',     status: 'pending', automated: true, sceneNode: { position: [-1.0,  0.00,  0.0], radius: 0.06, meshAnchor: 'nose' } },
        { id: 'viperfish-check-3', category: 'software',   label: 'Camera - Down',    description: 'Test downward camera feed and focus',    status: 'pending', automated: true, sceneNode: { position: [-0.5, -0.30,  0.0], radius: 0.06 } },
        { id: 'viperfish-check-4', category: 'software',   label: 'Sonar',            description: 'Verify sonar ping response and range',   status: 'pending', automated: true, sceneNode: { position: [ 0.2, -0.30,  0.0], radius: 0.07 } },
        { id: 'viperfish-check-5', category: 'comms',      label: 'Tether Integrity', description: 'Check tether signal integrity',          status: 'pending', automated: true, sceneNode: { position: [ 1.1,  0.00,  0.0], radius: 0.07 } },
      ],
    },
  },
  {
    displayName: 'Winch',
    image: '/assets/winch.png',
    hasFirmwareUpdate: false,
    initiallyConnected: true,
    entry: {
      id: 'winch',
      name: 'Winch',
      type: 'Tow Winch Controller',
      ip: '192.168.1.50',
      firmware: 'v1.6.0',
      signal: -44,
      checks: [
        { id: 'winch-check-0', category: 'mechanical', label: 'Winch Brake',          description: 'Verify brake engagement and release',        status: 'pending', automated: true, sceneNode: { position: [ 0.3,  0.32,  0.0], radius: 0.07 } },
        { id: 'winch-check-1', category: 'electrical', label: 'Motor Controller',     description: 'Check motor controller status and limits',   status: 'pending', automated: true, sceneNode: { position: [ 0.8,  0.32,  0.0], radius: 0.07 } },
        { id: 'winch-check-2', category: 'software',   label: 'Cable Tension Sensor', description: 'Calibrate tension sensor zero offset',       status: 'pending', automated: true, sceneNode: { position: [ 0.0, -0.30,  0.0], radius: 0.07 } },
        { id: 'winch-check-3', category: 'safety',     label: 'Overload Protection',  description: 'Test overload cutoff threshold',             status: 'pending', automated: true, sceneNode: { position: [-0.9,  0.20,  0.0], radius: 0.07 } },
      ],
    },
  },
];

// Trickle systems in 250 ms apart, matching server behaviour
export default function mockGetSystemsService(
  onSystem: (def: SystemDef) => void,
): () => void {
  let cancelled = false;
  const timers: ReturnType<typeof setTimeout>[] = [];

  MOCK_SYSTEMS.forEach((sys, i) => {
    const t = setTimeout(() => {
      if (!cancelled) onSystem(sys);
    }, 250 * (i + 1));
    timers.push(t);
  });

  return () => {
    cancelled = true;
    timers.forEach(clearTimeout);
  };
}
