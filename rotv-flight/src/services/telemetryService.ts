import type { TelemetrySnapshot } from '../types';
import { transport } from './transport';
import { getTelemetryClient } from './clients';

// ---------------------------------------------------------------------------
// Static fallback used when VITE_USE_GRPC=false
// ---------------------------------------------------------------------------

function makeFallbackSnapshot(): TelemetrySnapshot {
  return {
    timestamp: new Date().toISOString(),
    attitude: { roll: 0, pitch: 0, heading: 0 },
    position: { latitude: 0, longitude: 0, depth: 0, altitude: 0 },
    velocity: { surge: 0, sway: 0, heave: 0, groundSpeed: 0 },
    power: { voltage: 0, current: 0, powerW: 0 },
    towCableTension: 0,
    waterTemp: 0,
    salinity: 0,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function streamTelemetry(
  systemId: string,
  onSnapshot: (snap: TelemetrySnapshot) => void,
): () => void {
  if (!transport) {
    onSnapshot(makeFallbackSnapshot());
    return () => {};
  }

  const ctrl = new AbortController();

  (async () => {
    try {
      for await (const snap of getTelemetryClient().streamTelemetry(
        { systemId },
        { signal: ctrl.signal },
      )) {
        onSnapshot({
          timestamp: snap.timestamp,
          attitude: {
            roll: snap.attitude?.roll ?? 0,
            pitch: snap.attitude?.pitch ?? 0,
            heading: snap.attitude?.heading ?? 0,
          },
          position: {
            latitude: snap.position?.latitude ?? 0,
            longitude: snap.position?.longitude ?? 0,
            depth: snap.position?.depth ?? 0,
            altitude: snap.position?.altitude ?? 0,
          },
          velocity: {
            surge: snap.velocity?.surge ?? 0,
            sway: snap.velocity?.sway ?? 0,
            heave: snap.velocity?.heave ?? 0,
            groundSpeed: snap.velocity?.groundSpeed ?? 0,
          },
          power: {
            voltage: snap.power?.voltage ?? 0,
            current: snap.power?.current ?? 0,
            powerW: snap.power?.powerW ?? 0,
            batteryPct: snap.power?.batteryPct,
          },
          towCableTension: snap.towCableTension,
          waterTemp: snap.waterTemp,
          salinity: snap.salinity,
        });
      }
    } catch (err) {
      if (!ctrl.signal.aborted) {
        console.error('[telemetryService] stream error', err);
      }
    }
  })();

  return () => ctrl.abort();
}
