import { describe, expect, it } from "vitest";
import { ManualTimers, sleep } from "../src/index.js";

describe("sleep", () => {
  it("resolves after exact ms", async () => {
    const timers = new ManualTimers();
    const p = sleep(50, { timers });
    let resolved = false;
    p.then(() => {
      resolved = true;
    });
    timers.advance(49);
    expect(resolved).toBe(false);
    timers.advance(1);
    await expect(p).resolves.toBeUndefined();
    expect(timers.pending()).toBe(0);
  });

  it("rejects on abort and clears timer", async () => {
    const timers = new ManualTimers();
    const controller = new AbortController();
    const p = sleep(50, { timers, signal: controller.signal });
    const assertion = expect(p).rejects.toMatchObject({ code: "aborted" });
    controller.abort();
    await assertion;
    expect(timers.pending()).toBe(0);
  });

  it("rejects immediately if signal already aborted", async () => {
    const timers = new ManualTimers();
    const controller = new AbortController();
    controller.abort();
    const p = sleep(50, { timers, signal: controller.signal });
    await expect(p).rejects.toMatchObject({ code: "aborted" });
    expect(timers.pending()).toBe(0);
  });

  it("rejects invalid ms", async () => {
    const timers = new ManualTimers();
    for (const ms of [-1, NaN, Infinity, 1.5, 2_147_483_648]) {
      await expect(sleep(ms, { timers })).rejects.toMatchObject({ code: "invalid_ms" });
    }
  });
});
