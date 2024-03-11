/**
 * Get the value of a key in the map, or insert and return a default value if
 * the key is not defined.
 * 
 * @param map 
 * @param key 
 * @param fallback default value if key is not in map
 * @returns value of key in map
 */
function getOrDefault<K, V>(map: Map<K, V>, key: K, fallback: V): V {
  let value = map.get(key);
  if (value === undefined) {
    value = fallback;
    map.set(key, value);
  }
  return value;
}

/**
 * Map utilities.
 */
export const Maps = {
  getOrDefault,
}