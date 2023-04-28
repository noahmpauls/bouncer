import { type IStorage } from "./types";

/**
 * Represents in-memory storage. Useful for testing.
 */
export class MemoryStorage implements IStorage {

  private readonly storage: Map<string, any> = new Map();

  constructor() { }
  
  async get<TValue>(key: string, fallback: TValue): Promise<TValue> {
    return Promise.resolve((this.storage.get(key) as TValue) ?? fallback);
  }

  async set<TValue>(key: string, value: TValue): Promise<void> {
    this.storage.set(key, value);
    return Promise.resolve();
  }

  async update<TValue>(key: string, func: (value: TValue) => TValue, fallback: TValue): Promise<TValue> {
    const prev = await this.get(key, fallback);
    const next = func(prev);
    this.set(key, next);
    return Promise.resolve(next);
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
    return Promise.resolve();
  }
}
