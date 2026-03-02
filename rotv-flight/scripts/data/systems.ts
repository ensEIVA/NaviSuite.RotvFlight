import { create } from '@bufbuild/protobuf';
import {
  SystemDefSchema,
  type SystemDef,
} from '../../src/gen/rotv/v1/system_discovery_pb.js';
import {
  SystemEntrySchema,
  PreFlightCheckSchema,
  CheckSceneNodeSchema,
  CheckCategory,
  CheckStatus,
} from '../../src/gen/rotv/v1/common_pb.js';

function check(
  id: string,
  category: CheckCategory,
  label: string,
  description: string,
  pos: [number, number, number],
  radius: number,
  meshAnchor?: string,
) {
  return create(PreFlightCheckSchema, {
    id,
    category,
    label,
    description,
    automated: true,
    status: CheckStatus.PENDING,
    sceneNode: create(CheckSceneNodeSchema, {
      positionX: pos[0],
      positionY: pos[1],
      positionZ: pos[2],
      radius,
      meshAnchor,
    }),
  });
}

/**
 * System catalogue used by the ConnectRPC server.
 * Mirrors the data previously in scripts/publisher.js.
 * imageUrl references /assets/* served by the server.
 */
export const SYSTEMS: SystemDef[] = [
  create(SystemDefSchema, {
    displayName: 'ScanFish Rocio',
    imageUrl: '/assets/scanfish.png',
    hasFirmwareUpdate: true,
    initiallyConnected: true,
    entry: create(SystemEntrySchema, {
      id: 'scanfish',
      name: 'ScanFish Rocio',
      type: 'Towed Undulating Vehicle',
      ip: '192.168.1.10',
      firmware: 'v4.12.3',
      signal: -58,
      checks: [
        check('scanfish-check-0', CheckCategory.ELECTRICAL, 'Battery Level',          'Verify battery charge > 80%',               [ 0.9,  0.00,  0.0], 0.07),
        check('scanfish-check-1', CheckCategory.SOFTWARE,   'IMU Calibration',        'Check IMU calibration status',              [ 0.0,  0.32,  0.0], 0.07),
        check('scanfish-check-2', CheckCategory.MECHANICAL, 'Flap - Starboard',       'Test starboard control flap response',      [ 0.0, -0.05, -0.7], 0.07, 'stbd-wing'),
        check('scanfish-check-3', CheckCategory.MECHANICAL, 'Flap - Port',            'Test port control flap response',           [ 0.0, -0.05,  0.7], 0.07, 'port-wing'),
        check('scanfish-check-4', CheckCategory.SOFTWARE,   'Depth Sensor',           'Verify depth sensor readings in range',     [ 0.0, -0.30,  0.0], 0.07),
        check('scanfish-check-5', CheckCategory.COMMS,      'Comms Link',             'Verify communication link quality',         [ 0.6,  0.50,  0.0], 0.07, 'fin'),
        check('scanfish-check-6', CheckCategory.SAFETY,     'Emergency Stop Circuit', 'Test emergency stop function',              [ 1.0,  0.32,  0.0], 0.07),
      ],
    }),
  }),

  create(SystemDefSchema, {
    displayName: 'ViperFish',
    imageUrl: '/assets/viperfish.png',
    hasFirmwareUpdate: false,
    initiallyConnected: false,
    entry: create(SystemEntrySchema, {
      id: 'viperfish',
      name: 'ViperFish',
      type: 'Deep-Tow Sensor Platform',
      ip: '192.168.1.24',
      firmware: 'v2.8.1',
      signal: -71,
      checks: [
        check('viperfish-check-0', CheckCategory.ELECTRICAL, 'Power Supply',     'Verify power supply voltage and current', [ 0.9,  0.32,  0.0], 0.07),
        check('viperfish-check-1', CheckCategory.SOFTWARE,   'Motion Sensor',    'Check motion sensor output validity',    [ 0.0,  0.32,  0.0], 0.07),
        check('viperfish-check-2', CheckCategory.SOFTWARE,   'Camera - Forward', 'Test forward camera feed and focus',     [-1.0,  0.00,  0.0], 0.06, 'nose'),
        check('viperfish-check-3', CheckCategory.SOFTWARE,   'Camera - Down',    'Test downward camera feed and focus',    [-0.5, -0.30,  0.0], 0.06),
        check('viperfish-check-4', CheckCategory.SOFTWARE,   'Sonar',            'Verify sonar ping response and range',   [ 0.2, -0.30,  0.0], 0.07),
        check('viperfish-check-5', CheckCategory.COMMS,      'Tether Integrity', 'Check tether signal integrity',          [ 1.1,  0.00,  0.0], 0.07),
      ],
    }),
  }),

  create(SystemDefSchema, {
    displayName: 'Winch',
    imageUrl: '/assets/winch.png',
    hasFirmwareUpdate: false,
    initiallyConnected: true,
    entry: create(SystemEntrySchema, {
      id: 'winch',
      name: 'Winch',
      type: 'Tow Winch Controller',
      ip: '192.168.1.50',
      firmware: 'v1.6.0',
      signal: -44,
      checks: [
        check('winch-check-0', CheckCategory.MECHANICAL, 'Winch Brake',          'Verify brake engagement and release',     [ 0.3,  0.32,  0.0], 0.07),
        check('winch-check-1', CheckCategory.ELECTRICAL, 'Motor Controller',     'Check motor controller status and limits', [ 0.8,  0.32,  0.0], 0.07),
        check('winch-check-2', CheckCategory.SOFTWARE,   'Cable Tension Sensor', 'Calibrate tension sensor zero offset',     [ 0.0, -0.30,  0.0], 0.07),
        check('winch-check-3', CheckCategory.SAFETY,     'Overload Protection',  'Test overload cutoff threshold',           [-0.9,  0.20,  0.0], 0.07),
      ],
    }),
  }),
];
