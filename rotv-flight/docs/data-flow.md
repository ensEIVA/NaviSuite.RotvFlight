# Data Flow Diagram

## Overview

```
VITE_USE_GRPC=true   →  browser talks to ConnectRPC server (scripts/server.ts :4001)
VITE_USE_GRPC=false  →  service files return static fallback data (no server needed)
```

```mermaid
flowchart TD
    subgraph SERVER["scripts/ — ConnectRPC Server :4001"]
        SRV["server.ts\nHTTP/1.1 + Connect protocol\nCORS for localhost:5173"]
        HD["handlers/\nOne file per service\nContains stub data + streaming logic"]
        DAT["data/systems.ts\nSystem catalogue\n(checks, scene nodes, etc.)"]
        HD --> DAT
        SRV --> HD
    end

    subgraph TRANSPORT["src/services/ — Service Layer"]
        TR["transport.ts\nnull when VITE_USE_GRPC=false\nConnectTransport when true"]
        CL["clients.ts\nTyped client per service\n(uses transport)"]
        TR --> CL

        SDS["systemDiscoveryService.ts\ngetSystemsService()  ← streaming"]
        PFS["preflightService.ts\nrunSession()  ← streaming"]
        TEL["telemetryService.ts\nstreamTelemetry()  ← streaming"]
        OTH["calibration / diagnostics\nlogs / dataQuality / settings"]

        CL --> SDS
        CL --> PFS
        CL --> TEL
        CL --> OTH

        MOCK["mock/\nmockGetSystemsService.ts\nmockPreflightService.ts\n(used when transport is null)"]
        SDS -->|"fallback"| MOCK
        PFS -->|"fallback"| MOCK
    end

    subgraph STORES["Zustand Stores"]
        FST["useFlowStore\nstep1Complete / step2Complete"]
        SST["useSystemsStore\nconnectedSystems / selectedSystems"]
        PST["usePreFlightStore\nchecksBySystem / isRunning"]
    end

    subgraph VIEWS["Views"]
        SYS["Systems.tsx\nStep 1 — System Discovery"]
        PF["PreFlight.tsx\nStep 2 — Preflight Checks"]
        DB["Dashboard.tsx\nStep 3 — Operation Control"]
        REST["Telemetry / Calibration\nDiagnostics / Logs\nDataQuality / Settings"]
    end

    %% Server → service layer
    SRV -->|"ConnectRPC\nserver-streaming"| SDS
    SRV -->|"ConnectRPC\nserver-streaming"| PFS
    SRV -->|"ConnectRPC\nserver-streaming"| TEL
    SRV -->|"ConnectRPC\nunary"| OTH

    %% Service layer → views
    SDS -->|"onSystem(def) callback"| SYS
    PFS -->|"CheckStatusUpdate stream"| PST
    TEL -->|"TelemetrySnapshot stream"| REST
    OTH -->|"Promise / stream"| REST

    %% Views → stores
    SYS -->|"connectSystem / selectSystem"| SST
    SYS -->|"completeStep1()"| FST
    PF -->|"loadChecks / runAllChecks"| PST
    PST -->|"live check updates"| PF
    PF -->|"completeStep2()"| FST

    %% Guards
    FST -->|"gates route"| PF
    FST -->|"gates route"| DB
    SST -->|"selectedSystems"| PF

    classDef server  fill:#1a2c1a,stroke:#2d9c5a,color:#b6f5c8
    classDef svc     fill:#1a1f2e,stroke:#1e90d4,color:#a8d4f5
    classDef store   fill:#1e1a2e,stroke:#9b59b6,color:#dab6f5
    classDef view    fill:#2e1a1a,stroke:#e87c2e,color:#f5d0a8

    class SRV,HD,DAT server
    class TR,CL,SDS,PFS,TEL,OTH,MOCK svc
    class FST,SST,PST store
    class SYS,PF,DB,REST view
```

## Request lifecycle (example: Systems view loads)

```
1. Systems.tsx mounts
2. calls getSystemsService(onSystem)
3. service checks transport:
   - null  → mockGetSystemsService() streams 3 systems from static data
   - set   → opens ConnectRPC stream to server:4001/DiscoverSystems
4. server yields one SystemDef every 250 ms
5. each message → onSystem(def) → SST.connectSystem()
6. Systems.tsx re-renders as systems arrive
7. on unmount → cleanup() → ctrl.abort() → stream closes silently
```

## Adding / changing data

| What | Where |
|------|-------|
| Which systems appear | `scripts/data/systems.ts` |
| Check definitions (labels, scene nodes) | `scripts/data/systems.ts` |
| Check pass / fail outcome | `scripts/handlers/preflight.ts` |
| Telemetry values | `scripts/handlers/telemetry.ts` |
| Calibration records | `scripts/handlers/calibration.ts` |
| Diagnostic events | `scripts/handlers/diagnostics.ts` |
| Log entries | `scripts/handlers/logs.ts` |
| Data quality reports | `scripts/handlers/dataQuality.ts` |
| Default settings | `scripts/handlers/settings.ts` |
