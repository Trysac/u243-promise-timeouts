# Testing

## Tools

The tests use Vitest. They import the public API from `../src/index.js` and drive time with `ManualTimers`; no test uses real timers.

## Commands

```sh
npx vitest          # run the test files in test/
npx vitest --run    # single run
```

## Suites

- `test/index.test.ts` checks the public exports, `TimeoutsError` fields, and that `sleep`, `withTimeout`, and `raceAbort` work with `ManualTimers`.
- `test/manual-timers.test.ts` covers clock start/advance, deadline ordering with registration-order ties, callbacks scheduled during `advance`, `pending`, `clearTimeout` with unknown handles, invalid `ms` in `advance` and `setTimeout`, and error propagation from callbacks.
- `test/race-abort.test.ts` covers promise resolution/rejection before abort, abort before settle, and an already aborted signal.
- `test/sleep.test.ts` covers exact-ms resolution, abort clearing the timer, already aborted signal, and invalid `ms`.
- `test/with-timeout.test.ts` covers timeout timing, task resolution/rejection with timer cleanup, outer abort, already aborted outer signal without calling the task, invalid `ms`, `0 ms`, custom and truncated messages, synchronous task throws, task winning when settled before timer fires, ignoring task results after timeout, and nested `withTimeout` with an inner deadline longer than the outer.

## Rules

- Tests exercise the public entry point (`src/index.ts` via `../src/index.js`).
- Time is controlled with `ManualTimers`; `withTimeout` and `sleep` receive the `timers` option.
- Assertions cover observable outcomes: resolved values, rejected `TimeoutsError` codes/messages, timer cleanup via `pending()`, and task signal state.
- Each suite is deterministic and uses no network, real clock, or randomness.

## Tiers

All current tests are local unit tests in `test/`. There are no conformance or external-tool tests in the repository.

## Reports

Vitest reports results to the console. The test files do not define additional report files.
