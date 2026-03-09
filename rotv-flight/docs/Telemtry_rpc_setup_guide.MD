  ---
  Guide: Wiring Live Telemetry into Telemetry.tsx

  The data pipeline

  Before touching any code, understand what you're actually connecting:

  scripts/handlers/autonomy.ts          ← Mock server: yields a new snapshot every 100 ms
          ↓  (ConnectRPC HTTP streaming)
  src/services/autonomyService.ts       ← Service layer: wraps the stream, maps proto→domain types
          ↓  (callback / async iterable)
  src/views/Telemetry/Telemetry.tsx     ← React: subscribes on mount, stores data in state, re-renders
          ↓
  <GaugeBar /> and <TelemetryRow />     ← UI: reads from state, displays values

  Each layer has one job. You don't skip layers — the component never imports from gen/ directly.

  ---
  Layer 1 — The server (already done)

  scripts/handlers/autonomy.ts has streamTelemetry — an async generator that loops every 100 ms, random-walks the sensor values, and yields a new object. When the client disconnects, ctx.signal.aborted becomes
   true and the loop exits.

  You don't touch this for the basic wiring.

  ---
  Layer 2 — The service (already done)

  src/services/autonomyService.ts exports:

  export function streamTelemetry(
    vehicleId: string,
    onSnapshot: (snap: AutonomyTelemetrySnapshot) => void,
  ): () => void

  - Takes a vehicleId and a callback that fires on every snapshot.
  - Returns a cleanup function (calls ctrl.abort() internally) that you must call when you're done.
  - When VITE_USE_GRPC=false (your current default), it fires the callback once with static mock data and returns a no-op cleanup. When true, it connects to the real server.

  The callback pattern is deliberate — it's the simplest bridge between an async stream and React state.

  ---
  Layer 3 — React (the part you write)

  React components are functions that re-run when state changes. The wiring pattern is always the same:

  mount   →  subscribe to stream  →  each snapshot updates state  →  React re-renders
  unmount →  call cleanup         →  server stops streaming

  In React, this is a useEffect with a state setter inside the callback and the cleanup in the return:

  const [telemetry, setTelemetry] = useState<AutonomyTelemetrySnapshot | null>(null);

  useEffect(() => {
    const stop = streamTelemetry('sf-01', (snap) => setTelemetry(snap));
    return stop;  // React calls this on unmount
  }, []);         // [] = run once on mount, not on every render

  That's the entire subscription lifecycle. Three lines.

  ---
  Why useEffect with []?if If

  Without [], React would re-subscribe on every render — your component renders, starts a stream, which updates state, which triggers a render, which starts another stream. Infinite loop.

  With [], React guarantees the effect runs exactly once after the first render (mount), and the return function runs once when the component is removed from the DOM (unmount). The stream matches the
  component's lifetime.

  ---
  The actual code change in Telemetry.tsx

  Step 1 — Add the imports at the top:

  import { useState, useEffect } from 'react';
  import { streamTelemetry, type AutonomyTelemetrySnapshot } from '../../services/autonomyService';

  Step 2 — Inside the Telemetry() function, replace the static TELEMETRY const with state:

  // Remove this:
  const TELEMETRY = {
    attitude: { roll: 1.4, pitch: -0.8, heading: 247.3 },
    // ...
  };

  // Replace with:
  const [snap, setSnap] = useState<AutonomyTelemetrySnapshot | null>(null);

  useEffect(() => {
    const stop = streamTelemetry('sf-01', setSnap);
    return stop;
  }, []);

  setSnap IS the callback — you can pass it directly without wrapping.

  Step 3 — Guard the render while the first snapshot hasn't arrived yet:

  if (!snap) return <div>Connecting…</div>;

  Put this after the useEffect, before the return (...). Without it, TypeScript complains that snap might be null everywhere you access it.

  Step 4 — Update the JSX to read from snap instead of TELEMETRY. The structure mirrors exactly what the static object had:

  ┌──────────────────────────┬────────────────────────────────────────┐
  │           Old            │                  New                   │
  ├──────────────────────────┼────────────────────────────────────────┤
  │ TELEMETRY.attitude.roll  │ snap.attitude?.roll ?? 0               │
  ├──────────────────────────┼────────────────────────────────────────┤
  │ TELEMETRY.position.depth │ snap.position?.depth ?? 0              │
  ├──────────────────────────┼────────────────────────────────────────┤
  │ TELEMETRY.power.voltage  │ snap.power?.voltage ?? 0               │
  ├──────────────────────────┼────────────────────────────────────────┤
  │ TELEMETRY.tow.tension    │ snap.environment?.towCableTension ?? 0 │
  ├──────────────────────────┼────────────────────────────────────────┤
  │ TELEMETRY.env.waterTemp  │ snap.environment?.waterTemp ?? 0       │
  └──────────────────────────┴────────────────────────────────────────┘

  The ?. is because sub-messages in the proto are optional — the autonomy service can report a sensor as absent by omitting the whole sub-object. The ?? 0 gives you a safe fallback for display.

  ---
  What you'll see with VITE_USE_GRPC=false

  The mock path in autonomyService.ts calls your callback once with static values then returns. The gauges will show real-ish numbers but won't animate — it's frozen mock data.

  What you'll see with VITE_USE_GRPC=true

  Start the server (npm run server:dev) then the dev client (npm run dev). The streamTelemetry handler in the server loops every 100 ms. React calls setSnap 10 times per second, each triggering a re-render.
  The gauge bars and table values visibly animate.

  To see this working, open browser devtools → Network tab → filter by Fetch/XHR → you'll see a single long-lived POST request to /flight.v1.AutonomyService/StreamTelemetry that stays open. That's the stream.

  ---
  Things to watch out for

  Stale closure: If you pass a function that captures a variable instead of setSnap directly, make sure the function is stable. setSnap from useState is always stable (React guarantees it), so passing it
  directly is safe.

  Fast updates: 10 Hz means 10 re-renders per second. React batches these efficiently, but if your component is expensive to render, throttle the state update to every 2nd or 3rd snapshot by adding a frame
  counter in the callback.

  The vehicle ID: 'sf-01' is hardcoded above. In a real implementation this comes from whichever system is selected — likely useSystemsStore() or the URL. For now hardcoding is fine.

  Two streams at once: When you later add streamVehicleStatus for the mode panel, it follows the exact same pattern — a second useEffect in the same or a different component. Each stream is independent with
  its own AbortController.

  ---
  Summary of files touched

  ┌───────────────────────────────────┬────────────────────────────────────────────────┐
  │               File                │                     Change                     │
  ├───────────────────────────────────┼────────────────────────────────────────────────┤
  │ src/views/Telemetry/Telemetry.tsx │ Replace static const with useState + useEffect │
  ├───────────────────────────────────┼────────────────────────────────────────────────┤
  │ Everything else                   │ No change                                      │
  └───────────────────────────────────┴────────────────────────────────────────────────┘

  That's it — one file, ~10 lines changed, and the entire pipeline from mock server to animated gauges is live.


  claude --resume 4cd26c71-c01b-41c2-81f6-f3d67b0a1c4a