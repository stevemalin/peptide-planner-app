# Prototype 0.4 — integrated browser review

The customer entry point is the established Peptide Planner app: **Pep School → Guide → My Plans → Tracker → More**. `MultiPlanLab` remains an unmounted development harness; synthetic stress data is used only by tests.

## Integrated behavior

- Quick Start expands inside School. The ten-compound library retains the original six records and adds the four existing contextual entries. Added compounds start custom plans with blank amounts, schedules and vial setup; no new human administration defaults were created.
- The original reference → review → stages → schedule → vial/calculation → start flow remains. Starting a plan adds it to `activePlans`, without archiving earlier plans.
- My Plans opens individual plan details, tracker, inventory and reminder settings. Customize a copy preserves the active original and leaves the copy's supply blank to avoid counting the same vials twice. Explicit archiving retains logged history.
- Aggregate Tracker combines Today chronologically, uses compact event counts in Calendar, and retains compound identity in completed/skipped History. Per-event calculation details preserve syringe settings by plan.
- Supply is optional and uses individual-vial language. Completed events consume their own plan's supply. Reminder reconciliation considers all enabled plans in one bounded queue and namespaces event identifiers by plan.

## Persistence and recovery

`peptide-planner:local:v04` is the new persistence key. On first launch without v4 data, the app validates and migrates the v3 save. The original `peptide-planner:local:v03` bytes are retained unchanged. A failed read/migration blocks writes rather than resetting data. The in-memory legacy editor adapter keeps `version: 3` typing; persisted records use version 4 and the full `activePlans` collection. `active` is a first-plan compatibility alias, never the authority for the collection.

The Git baseline `main` remains `4360bffa2d14fe44a7774109ad6219cbeb9c5118`. Returning to 0.3.3 reads the preserved pre-migration v3 save, not subsequent v4 changes; no downgrade synchronization is implied.

## Browser gate — 2026-09-05 Pacific

- 61 automated tests passed, including original arithmetic/provenance/scheduling tests, migration and multi-plan isolation, archival/reload and native reminder mocks.
- TypeScript passed; Expo dependencies compatible; Expo Doctor 21/21 passed.
- Original six full browser reference flows passed. Browser tests were updated only for intentional 0.4 navigation, storage, supply label and coexistence expectations.
- Integrated browser checks passed at 320×915, 412×915 and 1366×915 with 1, 3, 6 and 10 active plans. Screenshots inspected; cramped 320px Tracker tabs/month controls corrected. Zero browser console/runtime errors.
- Browser test data lives in isolated test profiles, never Steve's normal browser storage. Visual artifacts are ignored under `checks/`.

Run `npm test`, `npm run test:ui` (with `PLAYWRIGHT_CHANNEL=msedge` on this machine), and `npm run test:integration-ui` against `http://localhost:8081`. The last command currently uses installed Edge. From `app`, launch the browser build with `expo start --web --localhost --port 8081`.

## Evidence and limits

SS-31's prior investigational-only description was stale. Its entry now identifies the specific US FDA accelerated approval for Forzinity and links the [FDA snapshot](https://www.fda.gov/drugs/drug-trials-snapshots/drug-trials-snapshots-forzinity). This is not a Canadian approval claim or a general research-vial administration plan. The other new entries retain contextual evidence labels and disclose missing study citations rather than inventing them.

This is browser acceptance, not physical Android acceptance. Native notification delivery remains device-unverified; browser notification delivery is unsupported. No accounts, backend, production/customer integration, AURAPEP changes, main merge or new CI infrastructure were added.
