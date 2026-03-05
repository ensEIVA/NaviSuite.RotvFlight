# Concerns & Ideas

Open questions, design decisions pending input, and ideas worth revisiting.
Add items freely — nothing here is committed to.

---

## Open questions

### Should store state persist across page refreshes?

Currently all Zustand stores reset on F5. The routing fix (`historyApiFallback`) means the correct page loads, but stores are empty — flow guards reset, selected systems gone, preflight state lost.

Options:
- **No persistence** (current) — safe for operations; no stale state from a previous session
- **`sessionStorage`** — survives refresh, cleared on tab close; good for flow state mid-session
- **`localStorage`** — survives everything; good for settings and operator preferences

The concern for an operations system: persisting preflight state from a previous session could give a false sense of readiness. Worth discussing with the operations team — what does a "refresh" mean in their workflow? Recovery from a browser crash, or something that should always restart the flow?

**Files involved:** `src/stores/`, Zustand `persist` middleware

---

### What rate do sensors actually publish at?

The stub server runs at 10 Hz. Real hardware rate is unknown. This affects:
- Whether throttling is needed in the service layer
- Whether the telemetry proto needs a timestamp field for sensor-side time (vs. server receive time)
- Memory/performance planning for history buffers (charts, logs)

**Action:** Confirm with hardware team before integration.

---

### How are multiple sensors of the same type handled?

If two systems both publish depth, `streamTelemetry` handles them independently by `system_id`. But if one system has two depth sensors internally (e.g. primary + redundant), the proto needs to reflect that. Currently it does not.

**Action:** Clarify with hardware team before the telemetry proto is locked.
**File:** `proto/rotv/v1/telemetry.proto`

---

### Should there be a hook layer over the service layer?

Right now views wire up `useEffect` + `useState` + cleanup manually per service call. If multiple views need the same data stream, a custom hook (e.g. `useTelemetry(systemId)`) would avoid repetition.

Recommendation: don't add it until two views actually need the same stream. Premature abstraction here adds indirection without benefit.

**Files involved:** `src/services/`, potential `src/hooks/`

---

## TODOs

### useTelemetryStore — centralise incoming telemetry

Currently each component that needs telemetry calls `streamTelemetry` directly
in a `useEffect` and holds its own local state. This means:

- Multiple components open separate subscriptions to the same stream
- Telemetry data is lost when the Telemetry view unmounts
- Alert threshold evaluation (`maxDepthM`, `rollThresholdDeg`, etc.) has no
  central place to run — it requires a component to be mounted

**What to build:** a `useTelemetryStore` (Zustand) that opens a single
subscription per `systemId`, fans the snapshot out to all consumers, and
evaluates alert thresholds independently of which view is currently mounted.

**Files involved:** new `src/stores/useTelemetryStore.ts`, `src/services/telemetryService.ts`, `src/views/Telemetry/Telemetry.tsx`

**Prerequisite:** confirm sensor publish rate with hardware team first (see open
question above) — affects whether throttling is needed before writing to the store.

---

## Ideas

### Throttling utility in the service layer

If high-frequency sensor data becomes a problem, a shared `throttle(ms, callback)` helper in the service layer would let each service gate its own update rate without duplicating the pattern. Currently each service would need its own time-gate implementation.

---

### `.env` per environment

Currently there is one `.env`. As the project moves toward staging/production, per-environment files (`.env.staging`, `.env.production`) with different `VITE_GRPC_BASE_URL` values would allow builds to target different backends without manual edits.

---

### Reconnection / error recovery in streaming services

The service layer currently has no reconnect logic. If the server goes down mid-session, the stream silently stops. Views show stale data with no indication of connection loss. A reconnect loop with exponential backoff and a visible connection status indicator would improve operator awareness.

---

### Proto versioning strategy

`buf breaking` is configured to catch breaking schema changes, but there is no versioning policy documented. If the hardware team ships a new server with changed field names or removed fields, the frontend breaks silently at runtime (proto fields default to zero/empty rather than erroring). Worth agreeing on a deprecation/versioning policy before the first real hardware integration.
