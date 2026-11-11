# Implement promise timeouts with injectable timers and manual clock

Status: accepted (generated, pending human review)

## Context

Promise.race with setTimeout leaves timers running, doesn't signal slow tasks, and makes tests wait in real time. Need a reusable utility that composes with caller signals, provides typed errors, and supports deterministic testing.

## Decision

Create a TypeScript library with withTimeout, sleep, raceAbort, and ManualTimers. Use AbortController internally, link to optional outer signal, and make timers injectable to enable a manual clock.

## Consequences

Users get reliable timeout behavior with cleanup and cancellation propagation. Tests can run without real timers. The library remains dependency-free and works in Node >=20.
