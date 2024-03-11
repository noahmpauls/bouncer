import type Browser from "webextension-polyfill";
import { type IStorage } from "./types";

/**
 * Persistent data manipulation through browser local extension storage.
 */
export class BrowserStorage implements IStorage {
  constructor(
    private readonly bucket: Browser.Storage.StorageArea,
  ) { }

  async get<T>(key: string, fallback: T): Promise<T> {
    const getArg = ({ [key]: fallback });
    return await this.bucket.get(getArg)
      .then((data: Record<string, T>) => data[key]);
  }

  async set<T>(key: string, value: T) {
    await this.bucket.set({ [key]: value });
  }

  async update<T>(key: string, func: (value: T) => T, fallback: T) {
    const prevValue = await this.get(key, fallback);
    const nextValue = func(prevValue);
    await this.set(key, nextValue);
    return nextValue;
  }

  async delete(key: string) {
    await this.bucket.remove(key);
  }
}

