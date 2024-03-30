import { describe, expect, test } from "@jest/globals";
import { assert, assertTimeSequence, Synchronizer } from "@bouncer/utils";


describe("assert", () => {
  /**
   * Partitions
   * ----------
   * 
   * condition:
   *  [X] true
   *  [X] false
   * message:
   *  [X] provided
   *  [X] not provided
   */

  /**
   * condition: true
   */
  test("succeeds", () => {
    assert(2 + 2 === 4);
  });
  
  /**
   * condition: false
   * message: not provided
   */
  test("fails no message", () => {
    expect(
      () => assert(2 + 2 === 5)
    ).toThrow("assertion failed");
  });
  
  /**
   * condition: false
   * message: provided
   */
  test("fails with message", () => {
    const message = "2 + 2 should equal 5";
    expect(
      () => assert(2 + 2 === 5, message)
    ).toThrow(message);
  });
});


describe("assertTimeSequence", () => {
  /**
   * Partitions
   * ----------
   * 
   * inputs:
   *  [X] prev before next
   *  [X] prev = next
   *  [X] prev after next
   * output:
   *  [X] successful assertion
   *  [X] failed assertion
   */

  test("times are in sequence", () => {
    const prev = new Date(2023, 0, 1);
    const next = new Date(prev.getTime() + 1);
    
    assertTimeSequence(prev, next);
  });

  test("times are equal", () => {
    const prev = new Date(2023, 0, 1);
    const next = prev;
    
    assertTimeSequence(prev, next);
  });

  test("times are not in sequence", () => {
    const prev = new Date(2023, 0, 1);
    const next = new Date(prev.getTime() - 1);
    
    expect(() => {
      assertTimeSequence(prev, next);
    }).toThrow();
  });
});


describe("Synchronizer", () => {
  test("correctly synchronizes", async () => {
    let arr: number[] = [];
    let sync = new Synchronizer();

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
