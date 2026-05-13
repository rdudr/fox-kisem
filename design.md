# Design Document

## Data Hierarchy

To accommodate the user's requirement for a multi-level tag hierarchy, the data structure has been refined:
1. **Zone**: The highest-level physical division (e.g., a Factory or Building). This corresponds to the `AreaTag` model.
2. **Area**: A specific subdivision within a Zone (e.g., a Room). This is tracked via `areaName` on the `Entry` model.
3. **Machine Tag**: The primary identifier for a machine (`machineTag`).
4. **Sub Machine Tag**: A component or subsystem of the machine (`subMachineTag`).
5. **Sub-Sub Machine Tag**: An even more granular component or subsystem (`subSubMachineTag`).

## UI Terminology
- "Area" has been renamed to "Zone" in the Company Profile and Data Entry views to better reflect the new hierarchy.
- A new "Area" field has been introduced for data entries to represent the subdivision within a Zone.
- "Sub-Sub Machine Tag" is added as a dedicated input field.

## CSV Export
- The exported filename dynamically pulls from the company profile.
- All hierarchy levels (Zone, Area, Machine, Sub, Sub-Sub) are distinctly represented as columns.

## Offline-First Mobile App Architecture (Capacitor)
- **Local Persistence**: Integrated `zustand` combined with `idb-keyval` to store all data (`CompanyProfile`, `ZoneTag`, `AreaTag`, `Entry`) locally inside IndexedDB. This ensures full data availability across sessions without internet connectivity.
- **Offline Client-Side Export**: Utilizing `xlsx` library to assemble and export customized multi-sheet Excel spreadsheets completely client-side.
- **Manual Cloud Sync Mechanism**: Implemented a `/api/sync` route capable of taking local IndexedDB payload and safely merging/upserting into the PostgreSQL production environment when the user clicks "Sync to Cloud".
- **Authentication**: Client-side authentication via `AuthGuard` supports offline verification against stored user credentials with an 8-hour session lifetime, elegantly falling back to API verification when online.
- **Static Export**: Pre-configured `output: "export"` with server-only API endpoints correctly tagged static to generate a highly optimized `out/` structure compatible with native mobile runtime wrappers via Capacitor.
