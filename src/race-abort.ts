import { TimeoutsError } from "./errors.js";

/**
 * Settles like `promise`, unless `signal` aborts first, in which case it rejects with an
 * `aborted` `TimeoutsError` without touching `promise`.
 */
export function raceAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) {
    // The caller's promise must not surface as an unhandled rejection once we stop observing it.
    promise.catch(() => {});
    return Promise.reject(new TimeoutsError("aborted", "aborted"));
  }
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => {
      reject(new TimeoutsError("aborted", "aborted"));
      promise.catch(() => {});
    };
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (err) => {
        signal.removeEventListener("abort", onAbort);
        reject(err);
      },
    );
  });
}
