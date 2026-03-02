import type { CheckSceneNode } from '../../types';

// ---------------------------------------------------------------------------
// Per-check registry (most specific — keyed by check.id)
// ---------------------------------------------------------------------------
// ROTV geometry reference:
//   Main body : box [0,0,0], x -1.2→1.2, y -0.25→0.25
//   Fin       : [0.6, 0.35, 0]
//   Port wing : [0, -0.05, 0.55]
//   Stbd wing : [0, -0.05, -0.55]
//   Nose cone : [-1.35, 0, 0]

export const ROTV_NODE_REGISTRY: Record<string, CheckSceneNode> = {
  'imu-power-on':     { position: [0.0,  0.32, 0],    radius: 0.07 },
  'dvl-self-test':    { position: [0.2, -0.30, 0],    radius: 0.07 },
  'comms-ping':       { position: [0.6,  0.50, 0],    radius: 0.07, meshAnchor: 'fin' },
  'camera-fwd-check': { position: [-1.0, 0.0,  0],    radius: 0.06 },
  'port-thruster':    { position: [0.0, -0.10, 0.70], radius: 0.07 },
  'stbd-thruster':    { position: [0.0, -0.10,-0.70], radius: 0.07 },
};

// ---------------------------------------------------------------------------
// Category defaults (fallback — keyed by check.category)
// ---------------------------------------------------------------------------

export const ROTV_CATEGORY_DEFAULTS: Record<string, CheckSceneNode> = {
  mechanical:    { position: [0.3,  0.32, 0],   radius: 0.07 },
  electrical:    { position: [1.0,  0.32, 0],   radius: 0.07 },
  software:      { position: [0.0,  0.32, 0],   radius: 0.07 },
  comms:         { position: [0.6,  0.50, 0],   radius: 0.07 },
  safety:        { position: [-0.9, 0.20, 0],   radius: 0.07 },
  environmental: { position: [0.0, -0.30, 0],   radius: 0.07 },
};

// ---------------------------------------------------------------------------
// Priority resolver: sceneNode → registry → category default → null
// ---------------------------------------------------------------------------

export function resolveSceneNode(check: {
  id: string;
  category: string;
  sceneNode?: CheckSceneNode;
}): CheckSceneNode | null {
  return (
    check.sceneNode ??
    ROTV_NODE_REGISTRY[check.id] ??
    ROTV_CATEGORY_DEFAULTS[check.category] ??
    null
  );
}
