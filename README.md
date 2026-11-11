# @trysac/promise-timeouts

Promise timeouts and cancellation utilities built on `AbortSignal`, with injectable timers and a manual clock for deterministic tests.

## Installation

```sh
npm install @trysac/promise-timeouts
```

## Usage

```ts
import { withTimeout, ManualTimers, TimeoutsError } from '@trysac/promise-timeouts';

const timers = new ManualTimers();
const p = withTimeout(() => new Promise(() => {}), 100, { timers });
timers.advance(100);
const code = await p.catch((error: TimeoutsError) => error.code); // 'timeout'
```

## API

All functions and classes below are exported from `@trysac/promise-timeouts`; the package is ESM and has no runtime dependencies.

### `withTimeout(task, ms, opts?)`

`withTimeout<T>(task: (signal: AbortSignal) => Promise<T>, ms: number, opts?: { signal?: AbortSignal; timers?: Timers; message?: string }): Promise<T>`

Creates an `AbortController` for `task`. The timer fires after `ms`; when it does, the controller aborts with a `TimeoutsError` whose `code` is `'timeout'` and whose message is `timed out after <ms> ms` (or `opts.message` truncated to 200 characters), and the returned promise rejects with that error. An outer `opts.signal` aborts the task's signal and rejects with `code: 'aborted'`; if `opts.signal` is already aborted, `task` is not called. A task that throws synchronously or rejects rejects the returned promise with that value. The timeout timer and abort listeners are cleaned up on the first settled outcome. `ms` must be an integer from 0 to 2_147_483_647; other values reject with `code: 'invalid_ms'`.

### `sleep(ms, opts?)`

`sleep(ms: number, opts?: { signal?: AbortSignal; timers?: Timers }): Promise<void>`

Resolves after `ms` on `opts.timers` (default: global timers). If `opts.signal` aborts first, rejects with `TimeoutsError` `code: 'aborted'` and clears the timer. An already aborted signal rejects immediately. `ms` uses the same integer range 0..2_147_483_647; invalid values reject with `code: 'invalid_ms'`.

### `raceAbort(promise, signal)`

`raceAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T>`

Settles like `promise` while `signal` is not aborted. When `signal` aborts first, rejects with `TimeoutsError` `code: 'aborted'` without changing `promise`; a rejection from `promise` is consumed to avoid an unhandled rejection.

### `ManualTimers`

`new ManualTimers()` implements `Timers` with a virtual clock starting at `0`.

- `now(): number` returns the current virtual time.
- `setTimeout(fn, ms): unknown` schedules `fn`; `ms` must be a non-negative integer or it throws `TimeoutsError` `code: 'invalid_ms'`.
- `clearTimeout(handle): void` removes a scheduled callback; non-numeric or unknown handles are ignored.
- `advance(ms): void` moves the clock forward and runs due callbacks in deadline order, ties in registration order. Callbacks scheduled during `advance` run if their deadline is inside the window. `ms` must be a non-negative integer or it throws `TimeoutsError` `code: 'invalid_ms'`. If callbacks throw, the clock still moves to the target and the first error is rethrown after other due callbacks run.
- `pending(): number` returns the number of scheduled callbacks not yet run.

### `Timers` interface

```ts
interface Timers {
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}
```

`withTimeout` and `sleep` accept a `Timers` via `opts.timers`; the default uses `globalThis.setTimeout` and `globalThis.clearTimeout`.

### `TimeoutsError`

Extends `Error`, has `name === 'TimeoutsError'`, and carries `code: 'timeout' | 'aborted' | 'invalid_ms'`.

## Difference from `AbortSignal.timeout`

`AbortSignal.timeout` produces a signal that aborts after a fixed delay. It does not run a task with a task-owned signal, does not compose with a caller's signal in older runtimes, and has no injectable clock for deterministic tests. This package supplies injectable `Timers`, a `ManualTimers` clock, cleanup of timers and listeners, and composition with an outer `AbortSignal`.

See [docs/SECURITY.md](docs/SECURITY.md) for the threat model and limits.
