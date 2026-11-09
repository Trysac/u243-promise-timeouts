import { TimeoutsError } from "./errors.js";
import { defaultTimers, type Timers } from "./timers.js";

const MAX_MESSAGE_LENGTH = 200;
const MAX_TIMEOUT_MS = 2_147_483_647;

function truncateMessage(message: string): string {
  if (message.length <= MAX_MESSAGE_LENGTH) return message;
  return message.slice(0, MAX_MESSAGE_LENGTH);
}

function validateMs(ms: number): boolean {
  return Number.isInteger(ms) && ms >= 0 && ms <= MAX_TIMEOUT_MS;
}

/**
 * Runs `task` with a signal of its own and fails with a `timeout` `TimeoutsError` after `ms`.
 * The timer and every listener are removed on the first settled outcome; an outer `opts.signal`
 * abort rejects with `aborted` and aborts the task's signal too.
 */
export function withTimeout<T>(
  task: (signal: AbortSignal) => Promise<T>,
  ms: number,
  opts?: { signal?: AbortSignal; timers?: Timers; message?: string },
): Promise<T> {
  const timers = opts?.timers ?? defaultTimers;
  if (!validateMs(ms)) {
    return Promise.reject(new TimeoutsError("invalid_ms", `invalid ms: ${ms}`));
  }

  const outerSignal = opts?.signal;
  if (outerSignal?.aborted) {
    return Promise.reject(new TimeoutsError("aborted", "aborted"));
  }

  return new Promise<T>((resolve, reject) => {
    const controller = new AbortController();
    const customMessage = opts?.message;
    const timeoutMessage =
      customMessage !== undefined ? truncateMessage(customMessage) : `timed out after ${ms} ms`;
    let settled = false;
    let timerHandle: unknown;
    const removers: (() => void)[] = [];

    const cleanup = () => {
      if (settled) return;
      settled = true;
      timers.clearTimeout(timerHandle);
      for (const remove of removers) remove();
    };

    const settleReject = (reason: unknown) => {
      cleanup();
      reject(reason);
    };

    const onInnerAbort = () => {
      if (settled) return;
      const reason: unknown = controller.signal.reason;
      settleReject(
        reason instanceof TimeoutsError ? reason : new TimeoutsError("aborted", "aborted"),
      );
    };

    const onOuterAbort = () => {
      if (settled) return;
      controller.abort(new TimeoutsError("aborted", "aborted"));
    };

    controller.signal.addEventListener("abort", onInnerAbort, { once: true });
    removers.push(() => controller.signal.removeEventListener("abort", onInnerAbort));
    if (outerSignal) {
      outerSignal.addEventListener("abort", onOuterAbort, { once: true });
      removers.push(() => outerSignal.removeEventListener("abort", onOuterAbort));
    }

    timerHandle = timers.setTimeout(() => {
      if (settled) return;
      // Aborting the inner controller rejects the returned promise through onInnerAbort,
      // so a task that ignores its signal cannot keep the timeout from settling.
      controller.abort(new TimeoutsError("timeout", timeoutMessage));
    }, ms);

    let taskResult: Promise<T>;
    try {
      taskResult = task(controller.signal);
    } catch (error) {
      settleReject(error);
      return;
    }

    Promise.resolve(taskResult).then(
      (value) => {
        if (settled) return;
        cleanup();
        resolve(value);
      },
      (error: unknown) => {
        if (settled) return;
        settleReject(error);
      },
    );
  });
}
