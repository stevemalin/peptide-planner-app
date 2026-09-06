# Prototype 0.4 browser review

Protected baseline: `main` at `4360bffa2d14fe44a7774109ad6219cbeb9c5118` (0.3.3).

This branch introduces a development review surface for multi-plan architecture without rewriting the known-good 0.3.3 core.

## Review targets

- 1 / 3 / 6 / 10 simultaneous-plan stress views
- My Plans dashboard
- aggregated Today timeline
- aggregated Calendar with density/count handling
- explicit individual-vial inventory language and optional kit conversion
- expanded 10-compound School review surface
- deeper optional research-context sections
- protected switch back to the untouched 0.3.3 core

## Initial real-world six-plan acceptance set

Retatrutide, GHK-Cu, 5-Amino-1MQ, SS-31 / elamipretide, NAD+, and MOTS-c.

The four additions are deliberately not given invented human administration schedules. 5-Amino-1MQ and NAD+ are also explicitly classified as non-peptides.

## Important

The multi-plan review screen uses synthetic schedule/inventory data for UX stress testing. It is not a dosing recommendation layer. The next integration gate is to migrate the persistent store from one active plan to a true active-plan collection only after the aggregate UX passes browser review.
