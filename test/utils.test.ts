import { describe, expect, test } from "@jest/globals";
import { doSetInterval, Sync } from "../src/utils";

describe("doSetInterval", () => {
  test("executes immediately", () => {
    let counter = 0;
    const interval = doSetInterval(() => { counter += 1 }, 1000);
    expect(counter).toBeGreaterThan(0);
    clearInterval(interval);
  });
});


describe("Sync", () => {
  test("correctly synchronizes", async () => {
    let arr: number[] = [];
    let sync = new Sync();

    const delayedPush = async (val: number, delay: number) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          arr.push(val);
          resolve();
        }, delay);
      });
    }
    
    const delays = [100, 100, 0, 0];
    delays.forEach(function (delay, i) { sync.sync(() => delayedPush(i, delay)) });
    await sync.sync(() => new Promise<void>((resolve) => resolve()));
    
    expect(arr).toEqual([0, 1, 2, 3]);
  });
});
