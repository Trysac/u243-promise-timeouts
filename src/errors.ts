/** The outcome an operation can fail with. */
export type TimeoutErrorCode = "timeout" | "aborted" | "invalid_ms";

/** Error raised by every utility in this package; `code` tells the three failure modes apart. */
export class TimeoutsError extends Error {
  readonly code: TimeoutErrorCode;

  constructor(code: TimeoutErrorCode, message: string) {
    super(message);
    this.name = "TimeoutsError";
    this.code = code;
  }
}
