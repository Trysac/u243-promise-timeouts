# Stack

## Used

| Tool | Purpose | Why |
|---|---|---|
| TypeScript | Language and type checking | Typed public API with declarations; source uses `.js` import specifiers for ESM output. |
| Node.js 20+ | Runtime | Target runtime for the ESM package. |
| Vitest | Tests | Test suites in `test/` import Vitest and run against `src/index.ts`. |
| `ManualTimers` | Test clock | The library's own virtual timer implementation; tests use it instead of real timers. |

## Discarded

| Tool | Why not |
|---|---|
| Runtime dependencies | The specification allows none (`allowed_dependencies: []`). |
| Real timers in tests | The test suites use `ManualTimers` for deterministic time control. |
| Retries, process-level deadlines, Node-only APIs | Out of scope for this utility. |
