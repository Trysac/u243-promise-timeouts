# Project record: promise-timeouts

## Objective

Provide a small ESM TypeScript library, `@trysac/promise-timeouts`, for timeouts and cancellation of promises built on `AbortSignal`. The measurable outcome is the public API and behavior exercised by the repository tests: `withTimeout`, `sleep`, `raceAbort`, `ManualTimers`, `TimeoutsError`, and the `Timers` interface, including deterministic tests driven by `ManualTimers` instead of real timers.

## Scope

In scope:

- `withTimeout` with a task-owned `AbortSignal`, outer-signal composition, injectable timers, optional custom message, and cleanup.
- `sleep` with optional abort signal and injectable timers.
- `raceAbort` over a promise and an `AbortSignal`.
- `ManualTimers` virtual clock with `now`, `setTimeout`, `clearTimeout`, `advance`, and `pending`.
- `TimeoutsError` with codes `timeout`, `aborted`, and `invalid_ms`.
- The `Timers` interface and default global timers.
- Validation of `ms` as an integer in `0..2_147_483_647`.

Out of scope:

- Retries.
- Deadlines across processes.
- Node-only APIs.

## Timeline

| Date | Milestone |
|---|---|
| 2026 | Repository created from the factory utility template. |

## Effort metrics

| Metric | Value | Source |
|---|---|---|
| Tokens (input / output) | 5374868 / 218677 | factory ledger |
| Hours (human) | pending measurement | time log |
| Cost (USD) | 0.2148 | factory ledger |

## Factory run u243 (measured from API usage)

| Phase | Model | Batch | Input | Output | Cache write | Cache read | Cost (USD) |
|---|---|---|---|---|---|---|---|
| generation | deepseek-v4-pro | yes | 4734 | 22685 | 0 | 0 | 0.0480 |
| fix-1 | deepseek-flash | no | 39373 | 32801 | 0 | 846976 | 0.0281 |
| fix-2 | deepseek-flash | no | 30296 | 32580 | 0 | 1067264 | 0.0273 |
| fix-3 | deepseek-flash | no | 24445 | 49505 | 0 | 1070336 | 0.0366 |
| fix-4 | deepseek-flash | no | 30253 | 24043 | 0 | 682496 | 0.0210 |
| fix-1 | deepseek-flash | no | 28774 | 15331 | 0 | 677504 | 0.0155 |
| audit | deepseek-flash | no | 43896 | 25433 | 0 | 731520 | 0.0240 |
| fix-2 | deepseek-flash | no | 15808 | 2878 | 0 | 69120 | 0.0043 |
| docs | deepseek-flash | no | 11817 | 13421 | 0 | 256 | 0.0098 |

Total: $0.2148. Prices: deepseek line, as measured by its adapter.
