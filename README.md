# Fleet Cost

A cost-per-km tracker for taxi/rideshare drivers and logistics fleets.
Currently running on hardcoded seed data persisted to `localStorage` —
no backend yet.

## Stack

- Vite + React (JS, no TypeScript)
- Tailwind CSS
- react-router-dom for routing
- recharts for charts
- lucide-react for icons

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`).

## How the numbers work

`src/lib/calculations.js` is the single source of truth for cost math:

- **Annual depreciation** = `(purchasePrice - residualValue) / usefulLifeYears`
- **Fixed cost to date** = `(annualInsurance + annualTax + annualDepreciation) × yearsOwned`
- **Variable cost to date** = sum of all cost log entries for that vehicle
- **Cost / km** = `(fixed cost to date + variable cost to date) / (currentOdometer - initialOdometer)`

The vehicle detail page also plots cost/km *over time*, recomputing the
formula at each cost log entry's odometer reading.

## Where things live

```
src/
  lib/
    calculations.js   <- all cost/km math
    seedData.js        <- the hardcoded starting dataset
    storage.js          <- localStorage read/write wrapper
  context/
    DataContext.jsx    <- app state + CRUD, persisted via storage.js
  pages/               <- Dashboard, Vehicles, VehicleDetail, Drivers, CostLog, Settings
  components/          <- Layout, Sidebar, StatCard, Modal, charts, EmptyState
```

## Data persistence today

Everything (vehicles, drivers, cost log entries, settings) is kept in
React state and mirrored to `localStorage` on every change, namespaced
under `fleetcost:v1:*`. Settings > "Reset to demo data" wipes it and
reseeds from `seedData.js`.

## Swapping in Supabase later

Because all reads/writes already go through `DataContext.jsx` (which
calls `storage.js`), wiring up Supabase means:

1. Create the tables from the schema we discussed (`companies`,
   `profiles`, `vehicles`, `drivers`, `cost_logs`) with RLS policies
   keyed on `company_id`.
2. Replace the `useState(() => loadFromStorage(...))` initializers in
   `DataContext.jsx` with Supabase queries (`useEffect` + `supabase.from(...).select()`).
3. Replace each `set*` state updater with the matching
   `supabase.from(...).insert/update/delete()` call, plus (optionally)
   realtime subscriptions.
4. `calculations.js` doesn't change at all — it just consumes arrays
   of vehicles/costLogs regardless of where they came from.

## PDF export

The vehicle detail page currently has an "Export PDF" button that uses
the browser's native print dialog (`window.print()`) with a print
stylesheet that hides the sidebar/buttons — pick "Save as PDF" in the
print dialog. This can be upgraded to a styled, branded PDF (e.g. with
`@react-pdf/renderer` or `jspdf`) once real data is flowing in.
