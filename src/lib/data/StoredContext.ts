import type { IStorage } from "@bouncer/storage";
import { Synchronizer } from "@bouncer/utils";
import type { IContext, ITransformer, KeyConfig } from "./types";

/**
 * Represents a data context that persists to/retrieves from a Storage solution.
 * 
 * @typeParam TObject runtime object type
 * @typeParam TData stored data type
 * @typeParam TBuckets storage bucket lookup type
 */
export class StoredContext<TObject, TData extends Record<string, unknown>, TBuckets extends Record<string, IStorage>> implements IContext<TObject> {
  private cache: TObject | undefined = undefined;
  private readonly sync: Synchronizer = new Synchronizer();
  
  /**
   * @param storage storage providers
   * @param transformer transformer between runtime and stored data
   * @param keyConfig options for storage by key
   */
  constructor(
    private readonly storage: TBuckets,
    private readonly transformer: ITransformer<TObject, TData>,
    private readonly keyConfig: KeyConfig<TData, TBuckets>,
  ) { }

  commit = async (): Promise<void> => {
    await this.sync.sync(async () => {
      if (this.cache === undefined) {
        return;
      }
      const data: TData = this.transformer.serialize(this.cache);
      for (const key of Object.keys(this.keyConfig)) {
        const { bucket } = this.keyConfig[key as keyof TData];
        const value = data[key as keyof TData];
        await this.storage[bucket].set(key, value);
      }
    });
  }

  fetch = async (): Promise<TObject> => {
    if (this.cache !== undefined) {
      return this.cache;
    }
    await this.initialize();
    return await this.fetch();
  }

  /**
   * Initialize the context cache with data from storage.
   */
  private async initialize(): Promise<void> {
    if (this.cache !== undefined) {
      return;
    }
    await this.sync.sync(async () => {
      // handles the case where two simultaneous callers race to intialize;
      // only the first in line will see an undefined cache
      if (this.cache !== undefined) {
        return;
      }
      // time to play typescript pretend
      const data = {} as TData;
      for (const k of Object.keys(this.keyConfig)) {
        const key = k as Extract<keyof TData, string>
        const { bucket, fallback } = this.keyConfig[key];
        const fallbackValue = "value" in fallback
          ? fallback.value
          : await fallback.initialize();
        data[key] = await this.storage[bucket].get(key, fallbackValue);
      }
      this.cache = this.transformer.deserialize(data as TData);
    });
  }
}
