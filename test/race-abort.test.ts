import { describe, expect, it } from "vitest";
import { raceAbort } from "../src/index.js";

describe("raceAbort", () => {
  it("resolves with promise if it settles before abort", async () => {
    const signal = new AbortController().signal;
    const p = Promise.resolve("value");
    await expect(raceAbort(p, signal)).resolves.toBe("value");
  });

  it("rejects with promise error if it settles before abort", async () => {
    const signal = new AbortController().signal;
    const p = Promise.reject(new Error("boom"));
    await expect(raceAbort(p, signal)).rejects.toThrow("boom");
  });

  it("rejects with aborted when signal aborts before promise settles", async () => {
    const controller = new AbortController();
    const deferred: { resolve?: () => void } = {};
    const promise = new Promise<void>((resolve) => {
      deferred.resolve = resolve;
    });
    const racePromise = raceAbort(promise, controller.signal);
    const assertion = expect(racePromise).rejects.toMatchObject({ code: "aborted" });
    controller.abort();
    await assertion;
    deferred.resolve?.();
    await Promise.resolve();
  });

  it("rejects immediately if signal already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const p = Promise.resolve("value");
    await expect(raceAbort(p, controller.signal)).rejects.toMatchObject({ code: "aborted" });
  });
});
