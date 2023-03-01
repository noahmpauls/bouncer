import { describe, expect, test } from "@jest/globals";
import { assert } from "../src/assert";

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
