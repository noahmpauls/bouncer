import type Browser from "webextension-polyfill";
import { type ChangeSubscriber, type IStorage } from "./types";
import { browser } from "@bouncer/browser";
import { Maps } from "@bouncer/utils";

/**
 * Persistent data manipulation through browser local extension storage.
 */
export class BrowserStorage implements IStorage {
  private readonly subscribers: Map<string, Set<ChangeSubscriber<any>>> = new Map();

  constructor(
    private readonly bucket: Browser.Storage.StorageArea,
  ) { }

  /**
   * @returns browser session storage
   */
  static session = (): BrowserStorage => {
    return new BrowserStorage(browser.storage.session);
  }

  /**
   * @returns browser local storage
   */
  static local = (): BrowserStorage => {
    return new BrowserStorage(browser.storage.local);
  }

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

  subscribe = <TValue>(key: string, callback: ChangeSubscriber<TValue>): void => {
    const addListener = this.subscribers.size === 0;
    const subscribers = Maps.getOrDefault(this.subscribers, key, new Set());
    subscribers.add(callback);
    if (addListener) {
      this.bucket.onChanged.addListener(this.changeCallback);
    }
  }

  unsubscribe = <TValue>(key: string, callback: ChangeSubscriber<TValue>): void => {
    const subscribers = this.subscribers.get(key);
    if (subscribers === undefined) {
      return;
    }
    subscribers.delete(callback);
    if (subscribers.size === 0) {
      this.subscribers.delete(key);
    }
    if (this.subscribers.size === 0) {
      this.bucket.onChanged.removeListener(this.changeCallback);
    }
    return;
  }

  private changeCallback = (changes: Browser.Storage.StorageAreaOnChangedChangesType) => {
    for (const key of this.subscribers.keys()) {
      if (key in changes) {
        this.callSubscribers(key, changes[key].newValue);
      }
    }
  }

  private callSubscribers = <TValue>(key: string, value: TValue | undefined) => {
    const subscribers = this.subscribers.get(key);
    if (subscribers === undefined) {
      return;
    }
    for (const subscriber of subscribers) {
      subscriber(value);
    }
  }

}

