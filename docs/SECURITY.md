# Security practices

Threat model and limits for `@trysac/promise-timeouts`. The code is a small ESM library with no runtime dependencies.

## Threat model

Defended:

- Invalid `ms` values are rejected before a timer is created: `withTimeout` and `sleep` require an integer in `0..2_147_483_647`; `ManualTimers.setTimeout` and `ManualTimers.advance` require a non-negative integer. Rejections use `TimeoutsError` with `code: 'invalid_ms'`.
- Timer handles and abort listeners are removed on the first settled outcome in `withTimeout`; `sleep` clears its timer on resolve and abort.
- `withTimeout` composes with an outer `AbortSignal`; an already aborted outer signal rejects with `code: 'aborted'` without calling the task.
- `raceAbort` attaches a rejection handler to the original promise after abort so an aborted race does not produce an unhandled rejection from that promise.
- Custom timeout messages are truncated to 200 characters.
- `ManualTimers.clearTimeout` ignores non-numeric and unknown handles.
- The implementation uses no `eval`, dynamic `Function` construction, shell commands, network access, or file I/O.

Not defended:

- `withTimeout` cannot stop a task that ignores its `AbortSignal`. The returned promise rejects on timeout or outer abort, but the task may continue running and producing side effects.
- `raceAbort` cannot cancel the original promise; it stops observing it and suppresses unhandled rejection after abort.
- There is no sandbox for malicious task code or custom `Timers` implementations.
- There are no retries, process-level deadlines, or Node-only cancellation mechanisms.
- The library does not manage secrets or credentials because it performs no I/O and reads no environment variables.

## Secrets

The library source contains no secrets, tokens, or credentials, and it reads no environment variables.

## Dependencies

The specification allows no runtime dependencies. Tests use Vitest; the library itself does not.

## Code

Inputs are validated as described in the threat model. Errors are raised as `TimeoutsError` where the public API documents `timeout`, `aborted`, or `invalid_ms`; a task's own synchronous throw or rejection is passed through unchanged. `ManualTimers.advance` runs all due callbacks, moves the clock to the target time, and rethrows the first callback error.

## Publishing

The package is public OSS, ESM, and published as `@trysac/promise-timeouts` for Node.js 20+. The source has no runtime dependencies.
