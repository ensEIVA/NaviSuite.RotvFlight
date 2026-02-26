# User Journey
## 1. Systems View
    "Systems available on network" page with a list of available units (ScanFish, Viperfish, Winch) as cards.
    - system cards have a header, body, and footer
    - system cards can be connected and disconnected
    - system cards have a 'select' button, that adds the system to a store-registry of systems.

## 2. Preflight Check
    User can do a preflight check to make sure their system is A-OKAY. Can load 3d model into scene
    - Can load a set of mock preflight-checks from a systems ID
        - preflight-check
        - id
        - nodeRefId
        - title
        -description
        -status
    -Can check each mock preflight-checks to a mock service
        -returns pending, checking, success, and failed. Imagine software tests! ("Battery - Error", "I/O Module - Success","Flap - starboard: pending", "Motionsensor: Pending")

## 3. Operation Dashboard
    This is the view where we look at current systems state.
    Left aside with fieldsets:
        - Parking:
        - Fixed Depth
        - Follow Seabed
        - Ondulation
    Graph Body
        - has depth monitor and track offset, blasting dummy data
        - has Pitch Roll Flap angles components

---

## Data Flow

### State Architecture

Three separate state units, each with a single responsibility:

```
FlowContext (React Context + useReducer)
│   step1Complete: boolean
│   step2Complete: boolean
│   completeStep1() / completeStep2()
│   → Used by: Systems, PreFlight, Dashboard, RequireStep (route guard)

useSystemsStore (Zustand)
│   connectedSystems: SystemEntry[]
│   selectedSystems:  SystemEntry[]
│   connectSystem / disconnectSystem / selectSystem / deselectSystem
│   → Used by: Systems view, PreFlight view

usePreFlightStore (Zustand)
│   checksBySystem: Record<systemId, PreFlightCheck[]>
│   isRunning: boolean
│   loadChecks(systems) / runAllChecks(systems) / reset() / allPassed(systems)
│   → Used by: PreFlight view
```

### Step 1 — Systems View

```
User action                         State change
────────────────────────────────    ───────────────────────────────────────
Click Connect / Disconnect          useSystemsStore: connectedSystems ±= system
Click Select / Deselect             useSystemsStore: selectedSystems  ±= system
Click Next (≥1 system selected)     FlowContext: step1Complete = true
                                    → navigate('/preflight')
```

### Step 2 — PreFlight View

```
Mount                               usePreFlightStore.loadChecks(selectedSystems)
                                    → generates PreFlightCheck[] per system type
                                    → all checks start as status: 'pending'

Click "Run All Checks"              usePreFlightStore.runAllChecks(selectedSystems)
                                    └─ for each system (sequential):
                                         for each check (sequential):
                                           set status → 'running'
                                           await mockPreflightService.runCheck()
                                           set status → 'passed'

All checks passed                   canProceed = true → "Proceed" button enabled

Click "Proceed to Dashboard"        FlowContext: step2Complete = true
                                    → navigate('/dashboard')
```

### Step 3 — Dashboard

```
RequireStep guard validates:
  step1Complete && step2Complete → render Dashboard
  else → redirect to appropriate earlier step

useSystemsStore.selectedSystems available for dashboard to display active system context
```

### Mock Service (`src/services/mockPreflightService.ts`)

```
generateChecksForSystem(systemId, systemType)
  Input:  system id + type string (e.g. "Towed Undulating Vehicle")
  Output: PreFlightCheck[] with status 'pending'
  Note:   check templates keyed by system type; falls back to generic checks

runCheck(check)
  Input:  any PreFlightCheck
  Output: Promise<'passed'>   ← always succeeds, no delay (swap for real service later)
```

### Key Invariants

- A system cannot be **selected** unless it is **connected**
- Disconnecting a system automatically **deselects** it
- `step2Complete` can only be set after `step1Complete` (enforced by `RequireStep` route guard)
- Checks are always **loaded fresh** when `selectedSystems` changes
- Checks run **sequentially**: finish all checks for system A before starting system B
