/**
 * Module for interacting with a persistent storage solution.
 */
export type IStorage = {
  /**
   * Retrieve a value from storage.
   * 
   * @param key key to retrieve value of
   * @param fallback value to return if no value is found
   */
  get<TValue>(key: string, fallback: TValue): Promise<TValue>;

  /**
   * Set the value of an item in storage.
   * 
   * @param key key to set value of
   * @param value value to set
   */
  set<TValue>(key: string, value: TValue): Promise<void>;

  /**
   * Update the existing value of an item in storage using a function.
   * 
   * @param key key to update value of
   * @param func function to update the existing value
   * @param fallback value to return if there is no existing value
   * @returns a promise containing the new value
   */
  update<TValue>(key: string, func: (value: TValue) => TValue, fallback: TValue): Promise<TValue>

  /**
   * Remove a key/value pair from storage.
   * 
   * @param key key to delete value of
   */
  delete(key: string): Promise<void>;
}