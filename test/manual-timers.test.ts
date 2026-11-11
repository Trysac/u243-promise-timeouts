import { describe, expect, it } from "vitest";
import { ManualTimers, TimeoutsError } from "../src/index.js";

describe("ManualTimers", () => {
  it("starts now at 0 and advances", () => {
    const t = new ManualTimers();
    expect(t.now()).toBe(0);
    t.advance(10);
    expect(t.now()).toBe(10);
  });

  it("runs callbacks in deadline order, ties in registration order", () => {
    const t = new ManualTimers();
    const calls: string[] = [];
    t.setTimeout(() => calls.push("late"), 20);
    t.setTimeout(() => calls.push("early1"), 10);
    t.setTimeout(() => calls.push("early2"), 10);
    t.setTimeout(() => calls.push("immediate"), 0);
    t.advance(30);
    expect(calls).toEqual(["immediate", "early1", "early2", "late"]);
    expect(t.pending()).toBe(0);
  });

  it("runs callbacks scheduled during advance if due within window", () => {
    const t = new ManualTimers();
    const calls: string[] = [];
    t.setTimeout(() => {
      calls.push("first");
      t.setTimeout(() => calls.push("inner"), 5);
    }, 10);
    t.setTimeout(() => calls.push("second"), 20);
    t.advance(25);
    expect(calls).toEqual(["first", "inner", "second"]);
    expect(t.pending()).toBe(0);
  });

  it("pending returns number of scheduled but not run callbacks", () => {
    const t = new ManualTimers();
    expect(t.pending()).toBe(0);
    const h1 = t.setTimeout(() => {}, 10);
    t.setTimeout(() => {}, 20);
    expect(t.pending()).toBe(2);
    t.clearTimeout(h1);
    expect(t.pending()).toBe(1);
    t.advance(15);
    expect(t.pending()).toBe(1);
    t.advance(5);
    expect(t.pending()).toBe(0);
  });

  it("clearTimeout with unknown handle does nothing", () => {
    const t = new ManualTimers();
    t.setTimeout(() => {}, 10);
    t.clearTimeout(999);
    t.clearTimeout("not-a-handle");
    expect(t.pending()).toBe(1);
  });

  it("advance rejects invalid ms", () => {
    const t = new ManualTimers();
    for (const ms of [-1, 1.5, NaN, Infinity]) {
      expect(() => t.advance(ms)).toThrowError(TimeoutsError);
      expect(() => t.advance(ms)).toThrowError(expect.objectContaining({ code: "invalid_ms" }));
    }
  });

  it("setTimeout rejects invalid ms", () => {
    const t = new ManualTimers();
    for (const ms of [-1, 1.5, NaN, Infinity]) {
      expect(() => t.setTimeout(() => {}, ms)).toThrowError(TimeoutsError);
      expect(() => t.setTimeout(() => {}, ms)).toThrowError(
        expect.objectContaining({ code: "invalid_ms" }),
      );
    }
  });

  it("callback errors propagate after clock moved and other callbacks run", () => {
    const t = new ManualTimers();
    const calls: string[] = [];
    t.setTimeout(() => {
      calls.push("throw");
      throw new Error("boom");
    }, 10);
    t.setTimeout(() => calls.push("after"), 20);
    expect(() => t.advance(20)).toThrowError("boom");
    expect(calls).toEqual(["throw", "after"]);
    expect(t.now()).toBe(20);
    expect(t.pending()).toBe(0);
  });
});
