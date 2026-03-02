import type { SystemDef, SystemEntry, PreFlightCheck, CheckSceneNode } from '../types';
import { transport } from './transport';
import { getSystemDiscoveryClient } from './clients';
import mockGetSystemsService from './mock/mockGetSystemsService';
import type { SystemDef as ProtoSystemDef } from '../gen/rotv/v1/system_discovery_pb';
import type { SystemEntry as ProtoSystemEntry } from '../gen/rotv/v1/common_pb';
import type { PreFlightCheck as ProtoCheck, CheckSceneNode as ProtoNode } from '../gen/rotv/v1/common_pb';
import { CheckStatus, CheckCategory } from '../gen/rotv/v1/common_pb';

// ---------------------------------------------------------------------------
// Proto → TS domain type mapping
// ---------------------------------------------------------------------------

function mapCheckStatus(s: CheckStatus): PreFlightCheck['status'] {
  switch (s) {
    case CheckStatus.PENDING:     return 'pending';
    case CheckStatus.RUNNING:     return 'running';
    case CheckStatus.PASSED:      return 'passed';
    case CheckStatus.FAILED:      return 'failed';
    case CheckStatus.SKIPPED:     return 'skipped';
    case CheckStatus.WARNING:     return 'warning';
    default:                      return 'pending';
  }
}

function mapCheckCategory(c: CheckCategory): PreFlightCheck['category'] {
  switch (c) {
    case CheckCategory.MECHANICAL:   return 'mechanical';
    case CheckCategory.ELECTRICAL:   return 'electrical';
    case CheckCategory.SOFTWARE:     return 'software';
    case CheckCategory.COMMS:        return 'comms';
    case CheckCategory.SAFETY:       return 'safety';
    case CheckCategory.ENVIRONMENTAL: return 'environmental';
    default:                         return 'software';
  }
}

function mapSceneNode(n: ProtoNode): CheckSceneNode {
  return {
    position: [n.positionX, n.positionY, n.positionZ],
    label: n.label,
    radius: n.radius,
    normalOffset:
      n.normalOffsetX !== 0 || n.normalOffsetY !== 0 || n.normalOffsetZ !== 0
        ? [n.normalOffsetX, n.normalOffsetY, n.normalOffsetZ]
        : undefined,
    meshAnchor: n.meshAnchor,
  };
}

function mapCheck(c: ProtoCheck): PreFlightCheck {
  return {
    id: c.id,
    category: mapCheckCategory(c.category),
    label: c.label,
    description: c.description,
    status: mapCheckStatus(c.status),
    automated: c.automated,
    operator: c.operator,
    completedAt: c.completedAt,
    notes: c.notes,
    sceneNode: c.sceneNode ? mapSceneNode(c.sceneNode) : undefined,
  };
}

function mapSystemEntry(e: ProtoSystemEntry): SystemEntry {
  return {
    id: e.id,
    name: e.name,
    type: e.type,
    ip: e.ip,
    firmware: e.firmware,
    signal: e.signal,
    checks: e.checks.map(mapCheck),
  };
}

function mapSystemDef(d: ProtoSystemDef): SystemDef {
  return {
    entry: mapSystemEntry(d.entry!),
    displayName: d.displayName,
    image: d.imageUrl,
    hasFirmwareUpdate: d.hasFirmwareUpdate,
    initiallyConnected: d.initiallyConnected,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Subscribes to system discovery.
 *
 * When VITE_USE_GRPC=true, opens a ConnectRPC server-streaming call.
 * When false, falls back to the WebSocket mock (publisher.js).
 *
 * Returns a cleanup/abort function.
 */
export function getSystemsService(onSystem: (def: SystemDef) => void): () => void {
  if (!transport) return mockGetSystemsService(onSystem);

  const ctrl = new AbortController();

  (async () => {
    try {
      for await (const def of getSystemDiscoveryClient().discoverSystems(
        {},
        { signal: ctrl.signal },
      )) {
        onSystem(mapSystemDef(def));
      }
    } catch (err) {
      if (!ctrl.signal.aborted) {
        console.error('[systemDiscoveryService] stream error', err);
      }
    }
  })();

  return () => ctrl.abort();
}
