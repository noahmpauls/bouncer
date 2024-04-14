import { Maps } from "@bouncer/utils";
import type { ChangeSubscriber, IStorage } from "./types";

/**
 * Represents in-memory storage. Useful for testing.
 */
export class MemoryStorage implements IStorage {
  private readonly storage: Map<string, any> = new Map();
  private readonly subscribers: Map<string, Set<ChangeSubscriber<any>>> = new Map();

  async get<TValue>(key: string, fallback: TValue): Promise<TValue> {
    return Promise.resolve((this.storage.get(key) as TValue) ?? fallback);
  }

  async set<TValue>(key: string, value: TValue): Promise<void> {
    this.storage.set(key, value);
    this.callSubscribers(key, value);
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
    this.callSubscribers(key, undefined);
    return Promise.resolve();
  }

  subscribe = <TValue>(key: string, callback: ChangeSubscriber<TValue>): void => {
    const subscribers = Maps.getOrDefault(this.subscribers, key, new Set());
    subscribers.add(callback);
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
    return;
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
