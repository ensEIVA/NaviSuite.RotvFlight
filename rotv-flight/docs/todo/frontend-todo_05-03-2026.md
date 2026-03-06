# Frontend TODO

Items flagged during architectural review of the logging implementation.
Most apply broadly — not just to the Logs view.

---

## Critical

- [x] **Cap Logs table rendering to 200 rows** — rendering all 2000 DOM rows causes layout jank under real hardware emit rates. Render a fixed window of the most recent entries; add a note when entries are hidden.
- [x] **Wrap filter computation in `useMemo`** — `entries.filter(...)`, `sources` Set, and sort memoized against filter state + entries.
- [ ] **Wire `loadLogs` systemId** — `App.tsx` calls `loadLogs('')`. Will send `{ systemId: '' }` to the real gRPC server. Needs to resolve from system selection state.

## Major

- [x] **Stream errors don't reach the store** — when the gRPC stream throws inside `tailLogs`, the error is swallowed in the async IIFE. The store never transitions to `'error'` and the Live indicator stays on forever. `tailLogs` needs an `onError` callback.
- [x] **`details` field stores full Pino object** — `write()` sink in `logger.ts` now strips standard Pino keys (`level`, `time`, `msg`, `pid`, `hostname`, `v`, `source`) and stores only the caller's extra data. `details` is `undefined` when no extra data was passed.

## Minor

- [x] **Stale comment in `logService.ts`** — updated to reference `utils/logger`.
- [x] **`sources` Set rebuilt every render** — covered by the `useMemo` task above.
- [x] **Search only matches `message`, not `source`** — search now matches against both `message` and `source`. Placeholder updated to "Search messages and sources...".

## Missing features

- [ ] **Export / download logs to CSV** — high operational value for incident reporting. Low implementation cost.
- [ ] **Warn when MAX_ENTRIES is hit** — when the store hits 2000 entries and starts dropping oldest, show a banner so operators know the view is incomplete.
- [ ] **Decide auto-scroll behaviour before adding virtualization** — does the table jump to newest on each new entry, or hold scroll position? Must be decided before implementing virtual scroll as it affects the implementation significantly.
- [ ] **Define remote transmit filter policy** — when `browser.transmit` is added to Pino, both `stream` and `operator` entries will go remote. Decide upfront whether operator-action entries should be transmitted, and filter inside `transmit.send` if not (Pino has no built-in concept of `origin`).
