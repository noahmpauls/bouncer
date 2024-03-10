import type { IStorage } from "@bouncer/storage";
import type { IContext, ITransformer, KeyConfig } from "./types";
import { Synchronizer } from "@bouncer/utils";

/**
 * Represents a data context that persists to/retrieves from a Storage solution.
 * 
 * @typeParam TObject runtime object type
 * @typeParam TData stored data type
 */
export class StoredContext<TObject, TData extends Object> implements IContext<TObject> {
  private cache: TObject | undefined = undefined;
  private readonly sync: Synchronizer = new Synchronizer();
  
  /**
   * @param storage storage provider
   * @param transformer transformer between runtime and stored data
   * @param keyConfig options for storage by key
   */
  constructor(
    private readonly storage: IStorage,
    private readonly transformer: ITransformer<TObject, TData>,
    private readonly keyConfig: KeyConfig<TData>,
  ) { }

  commit = async (): Promise<void> => {
    await this.sync.sync(async () => {
      if (this.cache == undefined) {
        return;
      }
      const data: TData = this.transformer.serialize(this.cache);
      for (const [key, value] of Object.entries(data)) {
        await this.storage.set(key, value);
      }
    });
  }

  fetch = async (): Promise<TObject> => {
    if (this.cache !== undefined) {
      return this.cache;
    } else {
      await this.initialize();
      return await this.fetch();
    }
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
      if (this.cache === undefined) {
        const data: any = {};
        for (const [key, config] of Object.entries(this.keyConfig)) {
          data[key] = await this.storage.get(key, config.fallback);
        }
        this.cache = this.transformer.deserialize(data);
      }
    });
  }
}
