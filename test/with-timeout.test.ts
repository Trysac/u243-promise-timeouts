import { describe, expect, it, vi } from "vitest";
import { ManualTimers, TimeoutsError, withTimeout } from "../src/index.js";

describe("withTimeout", () => {
  it("times out after specified ms", async () => {
    const timers = new ManualTimers();
    const signals: AbortSignal[] = [];
    const p = withTimeout(
      (signal) => {
        signals.push(signal);
        return new Promise(() => {});
      },
      100,
      { timers },
    );
    const [taskSignal] = signals;
    expect(taskSignal).toBeDefined();
    expect(taskSignal?.aborted).toBe(false);
    const assertion = expect(p).rejects.toMatchObject({
      code: "timeout",
      message: "timed out after 100 ms",
    });
    let settled = false;
    void p.catch(() => {
      settled = true;
    });
    timers.advance(99);
    expect(timers.pending()).toBe(1);
    expect(taskSignal?.aborted).toBe(false);
    await Promise.resolve();
    expect(settled).toBe(false);
    timers.advance(1);
    await assertion;
    expect(taskSignal?.aborted).toBe(true);
    const timeoutReason = taskSignal?.reason;
    expect(timeoutReason).toBeInstanceOf(TimeoutsError);
    expect((timeoutReason as TimeoutsError).code).toBe("timeout");
  });

  it("resolves with task value and cleans timer", async () => {
    const timers = new ManualTimers();
    const p = withTimeout(async () => "ok", 100, { timers });
    await expect(p).resolves.toBe("ok");
    expect(timers.pending()).toBe(0);
  });

  it("rejects with task error and cleans timer", async () => {
    const timers = new ManualTimers();
    const p = withTimeout(
      async () => {
        throw new Error("boom");
      },
      100,
      { timers },
    );
    await expect(p).rejects.toThrow("boom");
    expect(timers.pending()).toBe(0);
  });

  it("aborts on outer signal and aborts task signal", async () => {
    const timers = new ManualTimers();
    const outerController = new AbortController();
    const signals: AbortSignal[] = [];
    const p = withTimeout(
      (signal) => {
        signals.push(signal);
        return new Promise(() => {});
      },
      100,
      { timers, signal: outerController.signal },
    );
    const [taskSignal] = signals;
    expect(taskSignal).toBeDefined();
    const assertion = expect(p).rejects.toMatchObject({ code: "aborted" });
    outerController.abort();
    await assertion;
    expect(taskSignal?.aborted).toBe(true);
    const abortReason = taskSignal?.reason;
    expect(abortReason).toBeInstanceOf(TimeoutsError);
    expect((abortReason as TimeoutsError).code).toBe("aborted");
    expect(timers.pending()).toBe(0);
  });

  it("rejects immediately with aborted if outer signal already aborted, without calling task", async () => {
    const timers = new ManualTimers();
    const controller = new AbortController();
    controller.abort();
    const taskSpy = vi.fn(() => new Promise(() => {}));
    const p = withTimeout(taskSpy, 100, { timers, signal: controller.signal });
    await expect(p).rejects.toMatchObject({ code: "aborted" });
    expect(taskSpy).not.toHaveBeenCalled();
    expect(timers.pending()).toBe(0);
  });

  it("rejects with invalid_ms for invalid ms values", async () => {
    const timers = new ManualTimers();
    const invalid = [-1, NaN, Infinity, 1.5, 2_147_483_648];
    for (const ms of invalid) {
      const p = withTimeout(() => new Promise(() => {}), ms, { timers });
      await expect(p).rejects.toMatchObject({ code: "invalid_ms" });
    }
  });

  it("accepts 0 ms and times out on advance(0)", async () => {
    const timers = new ManualTimers();
    const p = withTimeout(() => new Promise(() => {}), 0, { timers });
    const assertion = expect(p).rejects.toMatchObject({ code: "timeout" });
    timers.advance(0);
    await assertion;
    expect(timers.pending()).toBe(0);
  });

  it("uses a custom short message verbatim", async () => {
    const timers = new ManualTimers();
    const p = withTimeout(() => new Promise(() => {}), 100, { timers, message: "nope" });
    const assertion = expect(p).rejects.toMatchObject({ code: "timeout", message: "nope" });
    timers.advance(100);
    await assertion;
  });

  it("rejects with a synchronously thrown error and clears the timer", async () => {
    const timers = new ManualTimers();
    const p = withTimeout(
      (): Promise<never> => {
        throw new Error("sync boom");
      },
      100,
      { timers },
    );
    await expect(p).rejects.toThrow("sync boom");
    expect(timers.pending()).toBe(0);
  });

  it("the task wins when it settles before the timer fires in the same window", async () => {
    const timers = new ManualTimers();
    const deferred: { resolve?: (value: string) => void } = {};
    const p = withTimeout(
      () =>
        new Promise<string>((resolve) => {
          deferred.resolve = resolve;
        }),
      100,
      { timers },
    );
    expect(deferred.resolve).toBeDefined();
    deferred.resolve?.("done");
    await Promise.resolve();
    timers.advance(100);
    await expect(p).resolves.toBe("done");
    expect(timers.pending()).toBe(0);
  });

  it("uses custom message truncated to 200 characters", async () => {
    const timers = new ManualTimers();
    const longMessage = "x".repeat(250);
    const p = withTimeout(() => new Promise(() => {}), 100, { timers, message: longMessage });
    const assertion = expect(p).rejects.toMatchObject({
      code: "timeout",
      message: longMessage.slice(0, 200),
    });
    timers.advance(100);
    await assertion;
  });

  it("task settling after timeout is ignored and no unhandled rejection", async () => {
    const timers = new ManualTimers();
    const deferred: { resolve?: (value: void | PromiseLike<void>) => void } = {};
    const p = withTimeout(
      () =>
        new Promise<void>((resolve) => {
          deferred.resolve = resolve;
        }),
      100,
      { timers },
    );
    const assertion = expect(p).rejects.toMatchObject({ code: "timeout" });
    timers.advance(100);
    await assertion;
    deferred.resolve?.(undefined);
    await Promise.resolve();
    expect(true).toBe(true);
  });

  it("task rejecting after the timeout is ignored and no unhandled rejection", async () => {
    const timers = new ManualTimers();
    const deferred: {
      resolve?: (value: void | PromiseLike<void>) => void;
      reject?: (reason?: unknown) => void;
    } = {};
    const p = withTimeout(
      () =>
        new Promise<void>((resolve, reject) => {
          deferred.resolve = resolve;
          deferred.reject = reject;
        }),
      100,
      { timers },
    );
    expect(deferred.resolve).toBeDefined();
    expect(deferred.reject).toBeDefined();
    const assertion = expect(p).rejects.toMatchObject({ code: "timeout" });
    timers.advance(100);
    await assertion;
    deferred.reject?.(new Error("late boom"));
    await Promise.resolve();
    expect(timers.pending()).toBe(0);
  });

  it("nested withTimeout: inner deadline longer than outer rejects with outer timeout", async () => {
    const timers = new ManualTimers();
    const outerController = new AbortController();
    const p = withTimeout(
      async (signal) => {
        return withTimeout(
          async () => {
            await new Promise(() => {});
          },
          200,
          { timers, signal },
        );
      },
      100,
      { timers, signal: outerController.signal },
    );
    const assertion = expect(p).rejects.toMatchObject({ code: "timeout" });
    timers.advance(100);
    await assertion;
    expect(timers.pending()).toBe(0);
  });
});
