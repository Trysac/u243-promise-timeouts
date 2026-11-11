import { TimeoutsError } from "./errors.js";
import { defaultTimers, type Timers } from "./timers.js";

const MAX_TIMEOUT_MS = 2_147_483_647;

function validateMs(ms: number): boolean {
  return Number.isInteger(ms) && ms >= 0 && ms <= MAX_TIMEOUT_MS;
}

/**
 * Resolves after `ms` on the injected timers, or rejects with an `aborted` `TimeoutsError` when
 * `opts.signal` aborts; the pending timer is cleared on every path.
 */
export function sleep(ms: number, opts?: { signal?: AbortSignal; timers?: Timers }): Promise<void> {
  const timers = opts?.timers ?? defaultTimers;
  if (!validateMs(ms)) {
    return Promise.reject(new TimeoutsError("invalid_ms", `invalid ms: ${ms}`));
  }
  const signal = opts?.signal;
  if (signal?.aborted) {
    return Promise.reject(new TimeoutsError("aborted", "aborted"));
  }
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    let handle: unknown;
    const cleanup = () => {
      if (settled) return;
      settled = true;
      timers.clearTimeout(handle);
      if (signal) signal.removeEventListener("abort", onAbort);
    };
    const onAbort = () => {
      cleanup();
      reject(new TimeoutsError("aborted", "aborted"));
    };
    if (signal) signal.addEventListener("abort", onAbort, { once: true });
    handle = timers.setTimeout(() => {
      cleanup();
      resolve();
    }, ms);
  });
}
