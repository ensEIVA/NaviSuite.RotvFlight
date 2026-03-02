# Using data services in a view

All live data comes through the service layer in `src/services/`. Views never import from `src/gen/` directly.

## Example — depth in a custom component

```ts
import { useEffect, useState } from 'react';
import { streamTelemetry } from '../../services/telemetryService';

export function MyWidget({ systemId }: { systemId: string }) {
  const [depth, setDepth] = useState<number>(0);

  useEffect(() => {
    const stop = streamTelemetry(systemId, (snap) => {
      setDepth(snap.position.depth);
    });
    return stop; // abort on unmount
  }, [systemId]);

  return <span>{depth.toFixed(1)} m</span>;
}
```

## Available services

| Service file | Function | Returns |
|---|---|---|
| `telemetryService` | `streamTelemetry(id, cb)` | `TelemetrySnapshot` — depth, attitude, velocity, power, tension… |
| `systemDiscoveryService` | `getSystemsService(cb)` | `SystemDef` stream — connected systems |
| `dataQualityService` | `getReports(id)` | `DataQualityReport[]` — SNR, coverage, density… |
| `calibrationService` | `listCalibrations(id)` | `CalibrationResult[]` |
| `diagnosticsService` | `getEvents(id)` | `DiagnosticEvent[]` |
| `logService` | `getLogs(id)` | `LogEntry[]` |
| `settingsService` | `getSettings()` | `SystemSettings` |

All types are in `src/types/index.ts`.

## Rules

**Streaming functions** (`stream*`, `getSystemsService`) return a cleanup function — always return it from `useEffect`:

```ts
useEffect(() => {
  const stop = streamTelemetry(id, cb);
  return stop;
}, [id]);
```

**Unary functions** (`get*`, `list*`) return a Promise:

```ts
useEffect(() => {
  getLogs(id).then(setEntries).catch(console.error);
}, [id]);
```

## Working without the server

Set `VITE_USE_GRPC=false` in `.env` (the default). All services return static fallback data so UI work doesn't require a running server.

Set `VITE_USE_GRPC=true` and run `yarn server:dev` in a separate terminal to use live ConnectRPC data.
