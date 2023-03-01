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
