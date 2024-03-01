/**
 * Produce the union of two sets.
 * 
 * @param a 
 * @param b 
 * @returns new set with the union of set a and set b
 */
function union<T>(a: Set<T>, b: Set<T>): Set<T> {
  const result = new Set(a);
  for (const item of b) {
    result.add(item);
  }
  return result;
}

/**
 * Produce the difference between two sets.
 * 
 * @param a 
 * @param b 
 * @returns new set comtaining elements of set a that are not in set b
 */
function difference<T>(a: Set<T>, b: Set<T>): Set<T> {
  const result = new Set(a);
  for (const item of b) {
    result.delete(item);
  }
  return result;
}

/**
 * Produce the intersection of two sets.
 * 
 * @param a 
 * @param b 
 * @returns new set containing elements that are in both sets
 */
function intersection<T>(a: Set<T>, b: Set<T>): Set<T> {
  const result = new Set<T>();
  for (const item of a) {
    if (b.has(item)) {
      result.add(item);
    }
  }
  return result;
}

/**
 * Set composition utilities. The web API equivalents have limited browser
 * support. See the link below.
 * 
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set#set_composition
 */
export const Sets = {
  union,
  difference,
  intersection
}