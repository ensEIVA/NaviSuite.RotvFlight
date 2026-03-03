# ROTV Flight

Browser-based operations frontend for ROTV (Remotely Operated Towed Vehicle) survey missions.

## Running the project

In two separate terminals:

```bash
yarn run server:dev                   # ConnectRPC server on :4001
VITE_USE_GRPC=true yarn run dev       # Vite dev server on :5173
```

To run without a server (static mock data):

```bash
VITE_USE_GRPC=false yarn run dev
```

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `VITE_USE_GRPC` | `false` | Set to `true` to connect to a live ConnectRPC server. `false` uses static mock data with no server required. |
| `VITE_GRPC_BASE_URL` | `http://localhost:4001` | Base URL of the ConnectRPC server the frontend connects to. Only used when `VITE_USE_GRPC=true`. Change this to point at a remote server when integrating with real hardware or a backend team's gRPC implementation. |

Copy `.env.example` to `.env` and adjust as needed.

---

## Architecture overview

### Three main layers

**1. Proto contracts (`proto/rotv/v1/`)**
Plain text files defining every message and service — field names, types, units. This is the shared contract between the frontend and any backend or hardware service. If you know Protobuf, you're home. Start with `proto/rotv/v1/telemetry.proto` for the live sensor stream and `proto/rotv/v1/common.proto` for shared types.

**2. Server (`scripts/server.ts`)**
A Node.js process implementing the proto services. Routing is defined in `scripts/server.ts`; each service has its own handler in `scripts/handlers/` (e.g. `scripts/handlers/telemetry.ts`). Static system data lives in `scripts/data/systems.ts`. Currently returns stub data — when hardware is ready, the handler `yield` statements are replaced with real sensor reads. A C++ or C# team could run their own gRPC server instead; the frontend doesn't care as long as it speaks the same proto.

**3. Frontend service layer (`src/services/`)**
Thin TypeScript files that call the server and feed typed data to the UI. The transport singleton in `src/services/transport.ts` is the only place that knows about gRPC — it is `null` when `VITE_USE_GRPC=false`, which causes each service to return static fallback data instead. Client factories are in `src/services/clients.ts`. Views never touch gRPC directly — they call e.g. `streamTelemetry(id, callback)` from `src/services/telemetryService.ts` and receive typed snapshots. All domain types are defined in `src/types/index.ts`. See `docs/using-data-services.md`.

---

## How data gets to the frontend

gRPC messages are encoded in **Protobuf** — binary, compact, schema-enforced. The frontend does not use WebSockets. It uses plain **HTTP POST** requests via the Connect protocol (`src/services/transport.ts`), which makes gRPC work natively in browsers without a proxy.

For a streaming call:

```
Browser                            Server
  |                                  |
  |-- HTTP POST /TelemetryService --> |
  |                                  |
  |<-- 200 OK (chunked stream) ------
  |<-- [chunk] TelemetrySnapshot ----
  |<-- [chunk] TelemetrySnapshot ----
  |         (until aborted)          |
```

For unary calls (one request, one response) it is a normal HTTP POST/response. The connection stays open for streaming calls and the server pushes each message as soon as it is ready — there is no polling.

### Update rate

Controlled by the server handler. Currently telemetry runs at **10 Hz** (`TICK_MS = 100` in `scripts/handlers/telemetry.ts`). When real hardware is connected the `sleep` is removed and the handler yields whenever the sensor fires.

### High-frequency data

At very high rates (e.g. 1 ms / 1000 Hz) the frontend can become overloaded:

- Every message triggers a React `setState` and re-render queue — at 1000/s the UI becomes unresponsive
- JS is single-threaded; parsing and mapping messages competes with rendering
- Storing history (logs, charts) grows memory faster than GC can keep up

Standard mitigations:
- **Throttle in the service layer** — only forward to React at the rate the UI needs (typically 10–30 Hz for display). Add a time-gate in the relevant `src/services/*Service.ts` file before calling the callback.
- **Throttle on the server** — buffer/average internally and only yield at the display rate. Adjust `TICK_MS` in `scripts/handlers/telemetry.ts` or the equivalent handler.
- **Web Workers** — move heavy parsing off the main thread

The right rate depends on the use case. 1 ms sensor data for a chart only needs 10–30 Hz rendered. The same data for logging needs batched writes, not 1000 individual state updates.

---

## For backend / hardware teams

The proto files are the handshake. To publish sensor data to the frontend:

1. Implement the services defined in `proto/rotv/v1/` in your language (C++, C#, Go, etc.)
2. Expose a port
3. Point `VITE_GRPC_BASE_URL` in `.env` at it — the frontend's `src/services/transport.ts` will connect there

Start with `proto/rotv/v1/telemetry.proto` — it defines the live sensor stream, including field names, units, and message structure. Agree on field names, units, and update rate before the proto is locked, as these are expensive to change later. The generated TypeScript types in `src/gen/rotv/v1/` are derived directly from these files via `yarn proto:gen`.

---

## Multiple sensors of the same type

Each sensor is addressed by `system_id`. Calling `streamTelemetry` twice with different IDs opens two independent streams:

```ts
const depthA = useTelemetry('scanfish');
const depthB = useTelemetry('viperfish');
```

System IDs are defined in `scripts/data/systems.ts` (server side) and mirrored in `src/services/mock/mockGetSystemsService.ts` (client fallback). If a single system aggregates multiple sensors internally, the shape of `TelemetrySnapshot` in `proto/rotv/v1/telemetry.proto` needs to reflect that — either as separate fields or separate stream requests. Clarify with the hardware team before the proto is finalised.

---

## Security

The development server (`scripts/server.ts`) is intended for local development and integration testing only.

- **HTTP only** — no TLS. All traffic between the browser and the dev server is unencrypted.
- **No authentication** — any client that can reach port 4001 can call any service.
- **Not suitable for production** — do not expose this server on a network or deploy it to any environment beyond a developer's workstation.

Production deployments must use a gRPC server with TLS (HTTPS/h2) and an appropriate authentication mechanism (e.g. mutual TLS, JWT, or API keys) enforced at the server or a terminating proxy.

---

## Further reading

- `docs/using-data-services.md` — how to consume data in a view
- `docs/data-flow.md` — full data flow diagram
- `proto/rotv/v1/` — service and message definitions
- `scripts/handlers/` — where to edit stub data
