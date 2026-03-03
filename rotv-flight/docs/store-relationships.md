# Store Relationships

```mermaid
flowchart TD

    subgraph Stores["Zustand Stores"]
        FlowStore["**useFlowStore**
        ─────────────────
        step1Complete
        step2Complete"]

        SystemsStore["**useSystemsStore**
        ─────────────────
        connectedSystems[ ]
        selectedSystems[ ]"]

        ProjectStore["**useProjectStore**
        ─────────────────
        projects[ ]
        activeProjectId"]

        OperationStore["**useOperationStore**
        ─────────────────
        operations[ ]
        activeOperationId"]

        PreFlightStore["**usePreFlightStore**
        ─────────────────
        checksBySystem
        isRunning"]

        SettingsStore["**useSettingsStore** ★ persist
        ─────────────────
        settings
        unitPrefs"]
    end

    subgraph Services["Services"]
        SettingsSvc["settingsService
        getSettings / saveSettings"]

        PreflightSvc["preflightService
        runSession — gRPC stream"]

        MockPreflight["mockPreflightService
        runCheck — mock loop"]
    end

    subgraph Utils["Utilities & Storage"]
        UnitsUtil["utils/units
        applyPreset()"]

        LocalStorage[("localStorage
        key: 'display-prefs'
        { unitPrefs }")]
    end

    %% ── Project ↔ Operation (bidirectional many-to-many) ──────────────────
    ProjectStore -->|"linkOperation()\n→ addProjectRef()"| OperationStore
    ProjectStore -->|"unlinkOperation()\n→ removeProjectRef()"| OperationStore
    ProjectStore -->|"getOperationsForProject()\nreads .getState()"| OperationStore
    OperationStore -->|"deleteOperation() cascade\n→ unlinkOperation()"| ProjectStore

    %% ── SystemsStore feeds PreFlightStore via the view layer ──────────────
    SystemsStore -. "selectedSystems[ ]
    passed as arg at view layer" .-> PreFlightStore

    %% ── PreFlightStore → service routing (runtime branch) ────────────────
    PreFlightStore -->|"transport != null
    runSession()"| PreflightSvc

    PreFlightStore -->|"transport == null
    runCheck()"| MockPreflight

    %% ── SettingsStore → services & utils ─────────────────────────────────
    SettingsStore -->|"load() / save()"| SettingsSvc
    SettingsStore -->|"load() + applyPreset()
    computePreset()"| UnitsUtil
    SettingsStore -->|"persist: write unitPrefs"| LocalStorage
    LocalStorage -->|"persist: restore unitPrefs
    on hydration"| SettingsStore

    %% ── FlowStore is standalone ───────────────────────────────────────────
    FlowStore:::isolated

    classDef isolated stroke-dasharray:5 5,opacity:0.6
```

## Summary

| Store | Role | Direct Store Dependencies |
|---|---|---|
| `useFlowStore` | Wizard step flags (step 1 / 2) | None — isolated |
| `useSystemsStore` | Live system registry (connected / selected) | None — feeds others via view props |
| `useProjectStore` | Project CRUD + many-to-many link management | `useOperationStore` (reads + writes) |
| `useOperationStore` | Operation CRUD + per-operation project refs | `useProjectStore` (cascade delete only) |
| `usePreFlightStore` | Runs preflight checks via gRPC or mock | None — receives `SystemEntry[]` as arg |
| `useSettingsStore` | App settings + unit prefs, persisted | None — talks to services + utils |

### Key design notes

- **Project ↔ Operation** is a true bidirectional many-to-many managed across both stores.
  `useProjectStore` is the *owner* of link mutations; `useOperationStore` just maintains its side of the ref.

- **useSystemsStore → usePreFlightStore** is *not* a store import — `selectedSystems` is passed as an argument by the PreFlight view. The stores are decoupled.

- **usePreFlightStore** branches at runtime on whether `transport` is non-null (gRPC enabled) and routes to the real service or the mock accordingly.

- **useSettingsStore** is the only store using Zustand `persist`; it only hydrates `unitPrefs` (not the full settings object, which comes from the server).
```
