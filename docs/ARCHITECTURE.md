# Architecture

## Overview

`@trysac/promise-timeouts` is an ESM TypeScript library for promise timeouts and cancellation built on `AbortSignal`. It has injectable timers, a cancellable `sleep`, a `raceAbort` helper, and a virtual clock (`ManualTimers`) for deterministic tests. The package has no runtime dependencies and targets Node.js 20+.

## Modules

| Module | Responsibility |
|---|---|
| `src/index.ts` | Public entry point; re-exports `TimeoutsError`, `ManualTimers`, `raceAbort`, `sleep`, `withTimeout`, and the `Timers` type. |
| `src/errors.ts` | `TimeoutsError` and the `TimeoutErrorCode` union (`timeout`, `aborted`, `invalid_ms`). |
| `src/timers.ts` | `Timers` interface and `defaultTimers` backed by `globalThis.setTimeout` / `globalThis.clearTimeout`. |
| `src/with-timeout.ts` | `withTimeout`: task-owned `AbortController`, outer-signal composition, timeout timer, message truncation, and cleanup. |
| `src/sleep.ts` | `sleep`: timer-based delay with optional abort signal and timer cleanup. |
| `src/race-abort.ts` | `raceAbort`: races a promise against an `AbortSignal` without cancelling the original promise. |
| `src/manual-timers.ts` | `ManualTimers`: virtual clock, deadline-ordered callbacks, `advance`, `pending`, and validation. |

## Boundaries

- No runtime dependencies.
- No network, file I/O, environment-variable reads, or process APIs in the library code.
- Public errors for documented failure modes are `TimeoutsError`; task errors and callback errors in `ManualTimers.advance` are passed through as thrown values.
- Timer access is isolated behind `Timers`, so tests can replace real timers with `ManualTimers`.
- `withTimeout` cannot force a task to stop after abort; it rejects the returned promise and aborts the task's signal.

## Build and distribution

The package is public OSS, published as `@trysac/promise-timeouts`, ESM with type declarations, for Node.js 20+. Source modules under `src/` use `.js` import specifiers.

## Decisions

The module boundaries above keep timer injection, error shape, and abort composition separate: `timers.ts` defines the injectable timer contract, `errors.ts` defines the only public error type, and each operation (`withTimeout`, `sleep`, `raceAbort`) owns its cleanup path.
