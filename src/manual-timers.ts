import { TimeoutsError } from "./errors.js";
import type { Timers } from "./timers.js";

interface TimerEntry {
  id: number;
  fn: () => void;
  deadline: number;
  order: number;
}

/** Timers backed by a virtual clock: nothing runs until {@link ManualTimers.advance} moves time. */
export class ManualTimers implements Timers {
  private currentTime = 0;
  private nextId = 0;
  private nextOrder = 0;
  private queue: TimerEntry[] = [];

  now(): number {
    return this.currentTime;
  }

  setTimeout(fn: () => void, ms: number): unknown {
    if (!Number.isInteger(ms) || ms < 0) {
      throw new TimeoutsError("invalid_ms", `invalid ms: ${ms}`);
    }
    const entry: TimerEntry = {
      id: this.nextId++,
      fn,
      deadline: this.currentTime + ms,
      order: this.nextOrder++,
    };
    this.queue.push(entry);
    return entry.id;
  }

  clearTimeout(handle: unknown): void {
    const id = typeof handle === "number" ? handle : -1;
    this.queue = this.queue.filter((entry) => entry.id !== id);
  }

  advance(ms: number): void {
    if (!Number.isInteger(ms) || ms < 0) {
      throw new TimeoutsError("invalid_ms", `invalid ms: ${ms}`);
    }
    const target = this.currentTime + ms;
    let firstError: unknown;
    let hasError = false;
    let entry = this.takeNextDue(target);
    while (entry !== undefined) {
      // Move the clock to the callback's deadline first so timers it schedules are
      // relative to its own time, not to the end of the advance window.
      this.currentTime = entry.deadline;
      try {
        entry.fn();
      } catch (error) {
        if (!hasError) {
          firstError = error;
          hasError = true;
        }
      }
      entry = this.takeNextDue(target);
    }
    this.currentTime = target;
    if (hasError) {
      throw firstError;
    }
  }

  pending(): number {
    return this.queue.length;
  }

  /** Removes and returns the earliest timer due at or before `target` (ties by registration order). */
  private takeNextDue(target: number): TimerEntry | undefined {
    let chosen: TimerEntry | undefined;
    // The queue keeps registration order, so a strict `<` comparison keeps the first
    // registered timer when two share a deadline.
    for (const entry of this.queue) {
      if (entry.deadline > target) continue;
      if (chosen === undefined || entry.deadline < chosen.deadline) {
        chosen = entry;
      }
    }
    if (chosen === undefined) return undefined;
    this.queue.splice(this.queue.indexOf(chosen), 1);
    return chosen;
  }
}
