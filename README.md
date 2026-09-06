# Peptide Planner app

Private development source for the separately branded Peptide Planner Android app. Current development branch: **Prototype 0.4**, integrated into the established app. See [the 0.4 review handoff](README-0.4.md) for current browser behavior and persistence. Protected `main` baseline: **Prototype 0.3.3**. This repository contains only the mobile prototype and its tests. It is independent of AURAPEP WordPress/WooCommerce and has no production or customer-data integration.

## Architecture

React Native 0.86 / React 19.2 with Expo SDK 57 and TypeScript. The application lives in `app/`.

- `app/App.tsx`: Pep School, Guide, compound navigation and main tabs.
- `app/src/content.ts`, `school-content.v0.3.1.json`: current six-compound content and alias search. Older content JSON files are historical source references, not active runtime data.
- `app/src/reference-setup.ts`: prototype Common Research Setup defaults, kept separate from clinical/source-plan provenance.
- `app/src/engine.ts`, `quantities.ts`, `planning.ts`: source transfer, stages, mg/mcg conversion, deterministic calculations, schedules, events and progress.
- `Workspace.tsx`, `StageCard.tsx`, `ScheduleSheet.tsx`, `VialSetup.tsx`, `Syringe.tsx`: review, plan editing, scheduling, calculator and syringe UI.
- `Tracker.tsx`: Today, Calendar and History; inventory derives from saved plans/events.

Flow: **Pep School → Guide → My Plan / Review → Schedule → Vial & Calculation → Start Plan → Tracker**. Compounds: **Retatrutide, Tirzepatide, Semaglutide, Glow 70 mg, GHK-Cu and KPV**. Branding is temporary. Do not invent scientific or dosing content; preserve source classes and provenance.

## Android testing

Use Node.js 24 and npm. From a fresh clone:

```sh
cd app
npm ci
npx expo start --go --lan
```

Install/update Expo Go on Android, keep phone and development computer on the same Wi-Fi, and scan the displayed QR. This remains the current phone-testing workflow. The original Windows testing project and its local start/stop launchers are preserved separately; machine-specific launchers and portable runtimes are intentionally not committed.

No Google Play publishing, cloud backend or account is configured. An Android development APK has not been built or device-validated. The current metadata version alone does not prove that a phone loaded the intended bundle.

## Persistence and notifications

AsyncStorage stores the draft, active plan, archived history, provenance, setup defaults, start date, schedules, generated events, logging timestamps, calculation inputs, inventory and selected syringe capacity under `peptide-planner:local:v03`. Compatible older saved data is retained. Clearing Expo Go storage deletes local data; there is no cloud backup.

The reminder data model is implemented. Notification loading is guarded: Expo Go skips the notification package to avoid its unsupported Android remote-push initialization path. OS reminder delivery is paused in Expo Go; local-notification delivery in a supported development build still needs physical-device validation. No remote push token service is configured.

## Known open bugs / Android acceptance issues

These issues are reported from phone testing and **remain open**. Source code contains attempted fixes and automated tests; those are not sufficient evidence to close the device-reported issues.

1. Retatrutide School → Guide does not yet reliably pre-fill the intended Common Research Setup vial/diluent defaults.
2. Syringe capacity selector (0.3 / 0.5 / 1.0 mL) is not yet visible/implemented correctly.
3. Syringe visualization still needs the approved higher-quality redesign.
4. Recurring Android warning: `".5" is not a valid number or percentage` remains unresolved.
5. Reference transfer/default-resolution still requires verification across all six compounds.

Start investigations by verifying the exact bundle/device version and reproducing on Android. Preserve existing functionality and approved visuals; do not treat passing browser or mocked-native tests as phone acceptance.

## Checks

Install app dependencies first as above, then run from the repository root:

```sh
npm ci
npm test
cd app
npx tsc --noEmit
npx expo install --check
npx expo-doctor
```

The root package installs Playwright for the optional browser regression suite. Start Expo on port 8081 in another terminal, then from the root:

```sh
npx playwright install chromium
npm run test:ui
```

`PLAYWRIGHT_CHANNEL=msedge` can select an installed Edge browser. Browser tests create synthetic data under ignored `checks/` and use localhost. They do not access phone storage or production systems. Current tests cover source/setup transfer, units, calculations, event generation, persistence, reminder capability guards, native-picker adapter behavior and SVG gradient parsing.

## Repository boundaries

Never commit credentials, tokens, `.env` files, signing keys, production exports, customer data, device databases, node_modules, Expo state, build output, APKs or backups. The `.gitignore` also excludes generated native directories; if native development-build source is intentionally introduced later, review that policy explicitly. No deployment or production automation is included.
