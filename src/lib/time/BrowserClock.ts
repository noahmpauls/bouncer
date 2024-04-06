import type { IClock } from "./types";

/**
 * Represents a clock that gets its current time from the browser.
 */
export const BrowserClock: IClock = {
  time: (): Date => {
    return new Date();
  }
}