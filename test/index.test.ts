import { describe, expect, it } from "vitest";
import { ManualTimers, raceAbort, sleep, TimeoutsError, withTimeout } from "../src/index.js";

describe("public API", () => {
  it("exports the documented functions and classes", () => {
    expect(typeof withTimeout).toBe("function");
    expect(typeof sleep).toBe("function");
    expect(typeof raceAbort).toBe("function");
    expect(typeof ManualTimers).toBe("function");
  });

  it("TimeoutsError carries a name, a message and a code", () => {
    const error = new TimeoutsError("timeout", "timed out after 1 ms");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("TimeoutsError");
    expect(error.code).toBe("timeout");
    expect(error.message).toBe("timed out after 1 ms");
  });

  it("the exported utilities work together with ManualTimers", async () => {
    const timers = new ManualTimers();
    const sleeping = sleep(5, { timers });
    timers.advance(5);
    await expect(sleeping).resolves.toBeUndefined();
    await expect(withTimeout(async () => "ok", 5, { timers })).resolves.toBe("ok");
    const controller = new AbortController();
    controller.abort();
    await expect(raceAbort(Promise.resolve("value"), controller.signal)).rejects.toMatchObject({
      code: "aborted",
    });
  });
});
