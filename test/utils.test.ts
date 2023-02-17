import { describe, expect, test } from "@jest/globals";
import { doSetInterval } from "../src/utils";

describe("doSetInterval", () => {
  test("executes immediately", () => {
    let counter = 0;
    const interval = doSetInterval(() => { counter += 1 }, 1000);
    expect(counter).toBeGreaterThan(0);
    clearInterval(interval);
  });
});
