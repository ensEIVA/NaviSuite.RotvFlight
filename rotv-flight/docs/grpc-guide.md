# gRPC & ConnectRPC — A practical guide

This guide explains how gRPC works in this project, why it exists, and how the
frontend team and hardware team coordinate around it. No prior gRPC knowledge
assumed.

---

## 1. The problem gRPC solves

A ROTV sensor publishes depth readings 10 times a second. The frontend needs to
display them live. You have a few options:

- **REST (polling)** — frontend asks "what's the depth?" every 100ms. Works, but
  you're sending requests even when nothing changed, and 100ms latency is
  optimistic.
- **WebSockets** — frontend opens a socket, server pushes data. Works, but
  defining *what* data looks like is left entirely to convention. The server
  publishes `{ d: 38.4, t: 14.2 }` and every consumer has to just… know what
  `d` means.
- **gRPC** — frontend calls `StreamTelemetry()`, the ROTV pushes
  `TelemetrySnapshot` messages as they arrive. The *shape* of those messages is
  defined in a shared schema file that both sides generate code from. No
  ambiguity, no hand-rolled parsing, type-safe on every side.

gRPC is especially well-suited to this project because:
- Telemetry is **high-frequency and continuous** — streaming is a first-class
  concept, not a workaround.
- The hardware team and the frontend team are **separate groups** who need a
  hard contract they can both rely on independently.

---

## 2. The proto file — the shared contract

A `.proto` file is a language-agnostic schema. It describes services (what you
can call) and messages (what the data looks like). Neither team writes this in
TypeScript or C++ — they write it in Protobuf, and then generate code in
whatever language they need.

Here's the actual telemetry contract for this project:

```proto
// proto/rotv/v1/telemetry.proto

service TelemetryService {
  rpc StreamTelemetry(TelemetryStreamRequest) returns (stream TelemetrySnapshot);
}

message TelemetryStreamRequest {
  string system_id = 1;
}

message TelemetrySnapshot {
  string timestamp = 1;    // ISO 8601
  Attitude attitude = 2;
  Position position = 3;
  Velocity velocity = 4;
  Power power = 5;
  double tow_cable_tension = 6; // kN
  double water_temp = 7;        // °C
  double salinity = 8;          // PSU
}
```

Read this as: *"There is a service called `TelemetryService`. It has one RPC
called `StreamTelemetry`. You send it a `TelemetryStreamRequest` (containing a
system ID), and it responds with a **stream** of `TelemetrySnapshot` messages —
one per sensor update — until you disconnect."*

The field numbers (= 1, = 2, …) are how Protobuf encodes data on the wire. They
must never be reused once published.

---

## 3. How code gets generated from proto files

Once the proto file is written, `buf generate` (configured in `buf.gen.yaml`)
reads it and produces TypeScript files in `src/gen/rotv/v1/`:

```
proto/rotv/v1/telemetry.proto
        ↓  buf generate
src/gen/rotv/v1/telemetry_pb.js      ← message classes + service descriptor
src/gen/rotv/v1/telemetry_pb.d.ts    ← TypeScript types
```

You never edit these generated files. They are re-generated whenever the proto
changes. Treat them like a build artefact.

The service layer (`src/services/telemetryService.ts`) imports from the
generated files and wraps them in a clean API that views consume:

```
proto file  →  buf generate  →  src/gen/  →  src/services/  →  components
  (schema)       (tooling)      (generated)    (our wrapper)    (consumers)
```

Views never import from `src/gen/` directly — only from `src/services/`.

---

## 4. ConnectRPC — gRPC in the browser

Standard gRPC requires HTTP/2 binary framing that browsers can't speak natively.
**ConnectRPC** is a browser-side library that solves this — it is purely a
frontend concern.

Critically, ConnectRPC clients can be configured to speak **standard gRPC
protocol** directly, using `GrpcTransport`. This means the hardware team just
runs a plain gRPC server in whatever language they choose (Go, C++, Rust — it
doesn't matter). They do not need to know ConnectRPC exists.

The frontend connects via `src/services/transport.ts`, pointing at the ROTV's
IP and port via `VITE_GRPC_BASE_URL`. That's the entire production integration.
No proxy, no special server setup required on the hardware side.

---

## 5. Production data flow

Everything above the dashed line is a black box to the frontend team. We don't
know or care how the hardware team structures their software internally — that's
their concern. Our contract with them is exactly two things: **a host address
and the proto files**.

```
╔══════════════════════════════════╗
║  Hardware team's black box       ║
║                                  ║
║  ROTV sensors, firmware,         ║
║  embedded software, internal     ║
║  busses — structured however     ║
║  they see fit                    ║
║                                  ║
╚══════════════╤═══════════════════╝
               │  standard gRPC on agreed host:port
               │  speaking the agreed proto contract
               │  (rotv/v1/*.proto)
- - - - - - - -│- - - - - - - - - - - - our boundary
               ▼
src/services/transport.ts  (browser ConnectRPC client)
    │
    ▼
src/services/telemetryService.ts  (our wrapper)
    │  streamTelemetry(systemId, callback)
    ▼
React component / Zustand store
    │  snapshot.position.depth  (always metres — SI contract)
    ▼
useUnits().fmt(depth, 'depth')  →  { value: 126.0, unit: 'ft' }
    ▼
Rendered to the operator
```

---

## 6. How teams coordinate

The proto file is the **handshake point** between teams. No team can change it
unilaterally without coordinating with the others.

### Who owns what

| Team | Owns |
|---|---|
| Hardware / firmware | The ROTV's gRPC server — implementation, deployment, data rates |
| Frontend | `src/services/`, `src/gen/`, views, stores |
| **Shared** | `proto/rotv/v1/*.proto` — nobody owns this alone |

### The proto-first workflow

The correct order of operations for any change is:

```
1. Agree on the proto change  ←  both teams at the table
2. Merge the proto change
3. Each team implements from the new proto independently
4. Teams integrate against real hardware
```

**Never** skip step 1. If the frontend adds a field to the proto without telling
the hardware team, the server will never populate it and the frontend will always
see the zero value. If the hardware team adds a field without telling the
frontend, the frontend won't know it exists until someone notices.

### Example: hardware team wants to add a new sensor

The hardware team wants to expose a `turbidity` reading (water clarity, in NTU).

**Step 1 — Draft the proto change together.**
Hardware team proposes adding to `telemetry.proto`:

```proto
message TelemetrySnapshot {
  // ... existing fields ...
  double turbidity = 11;  // NTU — water turbidity
}
```

Both teams agree on:
- The field name and number (11 — must be new, never reused)
- The unit (`NTU` — noted in the comment)
- Whether it is always present or optional

**Step 2 — Merge the proto change.**
The proto file is updated in version control. Both teams pull it.

**Step 3 — Each team acts independently.**
- Hardware team: implement `turbidity` population in the embedded server.
- Frontend team:
  1. Run `npm run proto:gen` → `turbidity` appears in the generated types.
  2. Register the quantity: add `registerQuantity('turbidity', ...)` in
     `src/utils/units.ts`.
  3. Expose it in `src/types/index.ts` if needed.
  4. Surface it in the relevant view.

**Step 4 — Integrate against real hardware.**
Point `VITE_GRPC_BASE_URL` at the ROTV and verify the field populates correctly.

### What breaks coordination

- **Changing a field number** — field 6 is `tow_cable_tension`. If the hardware
  team renumbers it to 12, the frontend will decode garbage for that field
  silently. Field numbers are permanent once any party has shipped.
- **Renaming without versioning** — renaming `water_temp` to `temperature` in
  the proto is a breaking change. The generated code changes, every consumer
  must update. This is why the package is versioned (`rotv.v1`) — a breaking
  redesign would go to `rotv.v2`.
- **Assuming a field is always set** — Protobuf `double` fields default to `0.0`
  when not populated. A turbidity sensor that is offline will report `0`, not
  null. Use `optional double` if absence is meaningful.

---

## 7. Adding a new service — frontend checklist

When a new `.proto` service is agreed on and merged:

```
☐  npm run proto:gen          — regenerate src/gen/
☐  Create src/services/myService.ts
       — import client from src/services/clients.ts
☐  If the service exposes new quantities:
       — registerQuantity() in src/utils/units.ts
       — add TypeScript types to src/types/index.ts
☐  Wire into a view or store
☐  Integrate against real hardware to verify
```

---

## Appendix — Working without hardware

During development, pointing at real hardware isn't always practical. Two
options:

**Option A — Static mock data (default)**
Set `VITE_USE_GRPC=false` in `.env`. Every service in `src/services/` returns
hardcoded fallback data. No server needed, no ROTV needed. Suitable for UI
work.

**Option B — Local stub server**
`scripts/server.ts` is a minimal ConnectRPC server that implements the proto
contract with synthetic data. It exists purely as a dev tool — it is never
deployed, and has nothing to do with the production architecture. Run it when
you want to exercise the real gRPC code path locally:

```bash
# Terminal 1
npm run server:dev      # stub server on :4001

# Terminal 2
VITE_USE_GRPC=true npm run dev
```

The service layer is the only thing that changes between these modes — all
components, stores, and hooks are identical in production.
