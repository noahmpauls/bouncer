/**
 * Test for a condition, throwing an error if the condition is not met.
 * 
 * @param condition the condition to assert
 * @param message message to throw if condition is not met
 */
export function assert(condition: boolean, message?: string) {
  if (!condition) {
    throw new Error(message || "assertion failed");
  }
}


/**
 * Assert that one time is equal to or after another.
 * 
 * @param prev previous time in the sequence
 * @param next next time in the sequence
 */
export function assertTimeSequence(prev: Date, next: Date) {
    const difference = next.getTime() - prev.getTime();
    assert(difference >= 0, `cannot move ${Math.abs(difference)} ms backwards in time`);
}
