import browser from "webextension-polyfill";
import { IStorage } from "./storage";

export class BrowserStorage<T> implements IStorage<T> {
  async get(key: string, fallback: T): Promise<T> {
    const getArg = ({ [key]: fallback });
    return await browser.storage.local.get(getArg)
      .then((data: Record<string, T>) => data[key]);
  }

  async set(key: string, value: T) {
    await browser.storage.local.set({ [key]: value });
  }

  async update(key: string, func: (value: T) => T, fallback: T) {
    const prevValue = await this.get(key, fallback);
    const nextValue = func(prevValue);
    await this.set(key, nextValue);
    return nextValue;
  }

  async delete(key: string) {
    await browser.storage.local.remove(key);
  }
}
