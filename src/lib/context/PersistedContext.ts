import { SyncedCache } from "@bouncer/cache";
import type { IContext } from "./types";
import type { IDataMapper } from "@bouncer/data";
import { Synchronizer } from "@bouncer/utils";

/**
 * Represents a data context that provies persistence for the objects it
 * exposes.
 * 
 * @typeParam T type of context contents
 */
export abstract class PersistedContext<T> implements IContext {
  /** Cache for context contents. */
  private _cache: T | undefined = undefined;
  /** Synchronizer for reading/writing cache */
  private readonly _sync: Synchronizer = new Synchronizer();

  /**
   * @param _dataMapper data mapper providing persistence for the context's
   *  data
   */
  constructor(
    private readonly _dataMapper: IDataMapper<T>    
  ) { }

  async save(): Promise<void> {
    await this._sync.sync(async () => {
    // only save if there is data to save
      if (this._cache !== undefined) {
        await this._dataMapper.toData(this._cache);
      }
    });
  }

  /**
   * Get all data in the context. Use this method to create accessors for
   * particular portions of the data in derived classes.
   * 
   * @returns all data available within the context
   */
  protected async _data(): Promise<T> {
    if (this._cache === undefined) {
      await this._initialize();
      return this._data();
    } else {
      return this._cache;
    }
  }

  /**
   * Initialize the context cache with data from the data mapper.
   */
  private async _initialize(): Promise<void> {
    if (this._cache !== undefined) {
      return;
    }
    await this._sync.sync(async () => {
      // handles the case where two simultaneous callers race to intialize;
      // only the first in line will see an undefined cache
      if (this._cache === undefined) {
        const data = await this._dataMapper.toObject();
        this._cache = data;
      }
    });
  }
}
