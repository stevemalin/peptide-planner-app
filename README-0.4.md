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

## Completed refinement — 2026-09-06 Pacific

Started from fetched branch commit `44b0e9a` and preserved its School/profile, sourced SS-31 context, plan-card and Tracker work. No School dosing or reconstitution claims were added or changed in this pass.

- Actual compound pages now mount SchoolAccordion and school-profile-v04 helpers. The simple 101 introduction comes first, followed by evidence, expandable research context, existing reference flows and Sources. Related Compounds opens the target School profile with collapsed sections and reset scroll. The future AURAPEP product card remains disabled; no store or production connection was made.
- Bottom navigation now uses a graduation cap for Pep School and an open book for Guide.
- Compact My Plans cards have distinct View and Edit actions. Edit opens the existing stages/schedule/calculator journey for that active plan, rather than copying it or replacing another plan.
- Active edits persist separately as `activeEdit` in v4 storage. They can be resumed after navigation or restart, or explicitly discarded. An unfinished new-plan draft is preserved independently.
- Saving edits preserves the active plan ID and all completed, skipped and already-due events exactly, including amounts, calculations and log timestamps. Only future pending events are rebuilt from the edited configuration. Earlier configurations and supply totals are retained as plan revisions. Other plans remain untouched.
- Blank supply during editing preserves the inventory ledger. A provided whole-number count means individual vials remaining, at the edited vial strength; consumed mass remains accounted for. Concurrent plan-setting changes fail closed while retaining the edit draft. Schedule editing requires the original plan time zone.
- Tracker counts all due/unlogged items, including today's overdue items. Scheduled dates remain visible in History. The header exposes the next event directly; Calendar retains compact count indicators for many plans.

Validation: 79 automated tests passed; TypeScript passed; Expo dependencies compatible; Expo Doctor 21/21 passed. The original six complete browser flows passed. The 1/3/6/10-plan matrix passed at 320×915, 412×915 and 1366×915. All ten School profiles, related-card navigation, active edit/reload/resume/discard, future-event changes, independent supply changes and unchanged logged history passed browser checks at all three widths. No browser console/runtime errors. Screenshots reviewed under ignored `checks/refinement04` and `checks/integration04`. Run `npm run test:refinement-ui` for this pass's additional browser coverage.

No physical Android or native notification-delivery acceptance is claimed. `main` remains the protected 0.3.3 baseline. No CI infrastructure was added or modified locally.

## Manual plan and Today finishing pass — 2026-09-06 Pacific

Continued from `0c99ec7e17c09de8a42db9cdb3e3b188d9d8d6a1` on `develop/0.4-multiplan` after fetching GitHub. Existing source content and the protected main baseline are unchanged.

- Manual plans now follow Amount & Stages → Schedule → Vial & Calculation → Review → Start Plan, with step context, validation and Back actions. Final activation validates the reviewed configuration and returns to My Plans after persistence, with the newest plan first. The completed draft clears while other active plans and histories remain intact. Validation errors scroll into view.
- Draft discard, active-edit discard and replacement of an existing draft require confirmation. Cancelling preserves the draft. Discard returns to the draft's compound in Guide. Active plans and logs are not discarded.
- Collapsed aggregate event cards show amount/unit, time, stage, status, syringe units, mL and a miniature U-100 syringe using the same scale as the full display. Capacity overflow remains explicit. Expanded details retain the large syringe and add saved-event arithmetic and clearly labelled current vial setup.
- A horizontal touch swipe reveals a Taken confirmation; scrolling does not log an event. The explicit Taken / Completed action remains keyboard accessible. Undo appears on the completed event and restores its exact prior pending state, including snooze. Undo refuses stale or archived events rather than overwriting later activity. Skip and reminder actions remain in expanded details.
- SS-31 is explicitly marked as a content/research gap for an approved transferable reference plan. No dose, schedule, preparation or other research claims were added. The existing sourced context is retained; this gap does not block UI review.

Validation: 81 automated tests; TypeScript; Expo dependency compatibility; Expo Doctor 21/21. Original six reference workflows and persistence passed with intentional navigation updates. The aggregate 1/3/6/10-plan matrix passed at 320, 412 and 1366 pixels. All ten School profiles and active edits passed at those widths. `npm run test:finish-ui` adds the full manual activation journey, Back, confirmed discard/replacement cancellation, multiple active plans, saved miniature calculations, real touch swipe, keyboard completion, Undo, calendar/history and reload persistence. Browser console/runtime checks are clean. Visual screenshots reviewed in ignored `checks/finish04`, `checks/integration04` and `checks/refinement04`.

Browser acceptance only; no physical-device or native-notification acceptance claimed. No new CI, production changes or merge to main.

## Dense Today and reference architecture — 2026-09-06 Pacific

Fetched and continued from `82adee46aebb0a4350f77f17c8b9ae629eafb23a` on `develop/0.4-multiplan`.

- Today groups due, later (including snoozed reminders), completed and skipped events. Pending cards retain compound/time/stage, unmistakable mg/mcg, units/mL, status and a syringe, with less whitespace and a smaller header. Completed cards omit the miniature until expanded. Pending cards are under 240px at tested widths; completed cards are smaller.
- Mini syringes retain unchanged arithmetic and selected 30/50/100-unit scales, with barrel shading, flanges, plunger, major/minor graduations and draw marker. Overflow is explicit. All three selected-capacity marker positions are covered by browser tests.
- Touch left reveals Taken, Skip and Remind Later; right reveals active-plan Edit. Visible buttons offer the same actions. Browser horizontal navigation no longer intercepts gestures; vertical scrolling remains enabled. Taken moves the event into Completed and presents Undo above the scrolling timeline. No Delete action was added.
- Persistent Profile and Settings controls open local prototype destinations. No accounts or cloud connection were added. The five bottom destinations and graduation-cap/book icons remain; Shop is reserved in the destination type and remains an unavailable More placeholder.
- Added a typed ResearchPracticeReference schema and future School card, covering amount/unit, stages, schedule/frequency, duration, break, time, vial/diluent, evidence and provenance, with an explicit transfer gate. Every compound has an adapter yielding existing common-practice fields or nulls. No new compound defaults were populated. Nonclinical notices distinguish research practice from established clinical schedules, both in School and after Guide import.
- Import now honors explicitly supplied setup values over separate fallback setup values, retains supplied frequency times and copies scalar references into one stage. The six existing verified setups remain unchanged. A synthetic test fixture covers every transferable field; it is not part of School content. Existing source/provenance is retained. SS-31 and other missing defaults await the separately researched and approved matrix.

Checks: 84 automated tests passed; TypeScript passed; Expo dependencies compatible; Expo Doctor 21/21. Six original reference workflows, complete manual activation/Back/discard, ten School profiles and active editing, and the existing 1/3/6/10-plan calendar/history/inventory matrix passed. New Chrome browser testing covers 1/5/10 events at 320, 412 and 1366px, selected syringe capacity, both touch directions, Taken/Undo, Skip, Remind Later, and Profile/Settings. Screenshots reviewed under ignored checks/density04. No browser warnings/runtime errors in the passing suites.

Gesture verification uses Chrome DevTools touch-event emulation in an isolated browser profile. Native Android gesture behavior is not claimed. No production changes, new CI infrastructure, main modifications or merge.

## Center Today and persistence diagnosis — 2026-09-06 Pacific

Continued from fetched `453ee91857d1222967df7b7ae4ead648a186c2fc`. Navigation is now Pep School → Guide → TODAY → My Plans → More. TODAY is the emphasized center tab and retains Today/Calendar/History. Profile/Settings, compact cards, calculations, touch actions, School and Guide are preserved. Internal route names remain stable.

The missing-plan report was traced to separate Edge and Chrome local-storage states at the same `http://localhost:8081` origin. The original browser still holds valid data; switching browser did not transfer it. A read-only, app-key-only local audit located and validated both states and preserved private JSON copies outside the repository under the local PeptidePlanner Recovery folder. No user storage was reset, replaced, seeded or merged. The two browser states contain overlapping compounds under distinct plan IDs, so automatic consolidation could duplicate schedules. Private records, counts and hashes are not committed here.

Storage keys remain `peptide-planner:local:v03` and `peptide-planner:local:v04`. The preceding refinement changed reference import logic, not persisted-state reading or migration. The normal v4 reader preserves activePlans, draft, active edits, archives and saved events; invalid data blocks writes. The legacy key remains preserved during v3 migration. A separate audit finding was corrected: transitional v3 payloads with an explicit activePlans array now validate and retain the full array instead of retaining only the active alias. This was not the cause of the observed browser mismatch; the recovered browser records were v4.

Validation: 87 local automated tests, TypeScript, Expo dependency compatibility and Expo Doctor 21/21 passed. In a new isolated Chrome profile, the prior running build created two plans through the UI, logged an event and saved/reloaded them. Chrome was closed, Expo was stopped/restarted with this update, and the same Chrome profile reopened without seeding or resetting. Full state matched exactly, including events and history. Both plans remained visible in My Plans, Today, Calendar and History, including another reload. The 320/412/1366px Chrome density/touch matrix passed with zero browser warnings/runtime errors. Screenshots show the new center tab without card regressions.

Reproduce restart coverage with a fresh `PEPTIDE_TEST_PROFILE` directory and `node upgrade-persistence-ui04.cjs before`, restart Expo, then `node upgrade-persistence-ui04.cjs after` with the same directory. The before phase refuses an existing profile rather than clearing it. Regular unit coverage includes v4 round-trip, draft/active-edit preservation, legacy single-plan migration, transitional multi-plan migration and malformed-data protection.

No additional peptide content, CI infrastructure, production changes or merge to main.
