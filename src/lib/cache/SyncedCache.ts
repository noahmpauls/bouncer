import { Synchronizer } from "@bouncer/utils";

/**
 * Represents a cache of data with an asynchronous initializer. Calls to the
 * initializer are synchronized to prevent data races between multiple readers.
 */
export class SyncedCache<T> {
  /** Cache value; undefined when not initialized. */
  private cache: T | undefined = undefined;

  /**
   * @param initializer the function used to intialize the cache value
   */
  constructor(
    private readonly initializer: () => Promise<T>,
    private readonly sync: Synchronizer = new Synchronizer(),
  ) { }

  /**
   * @returns whether the cache has been initialized
   */
  get isInitialized(): boolean{
    return !(this.cache === undefined);
  }

  /**
   * @returns the cache value after initialization
   */
  async value(): Promise<T> {
    if (this.cache === undefined) {
      await this.initialize();
      return this.value();
    } else {
      return this.cache;
    }
  }

  private async initialize(): Promise<void> {
    if (this.cache !== undefined) {
      return;
    }
    await this.sync.sync(async () => {
      // handles the case where two simultaneous callers race to intialize;
      // the loser will see a defined cache at this stage
      if (this.cache === undefined) {
        const data = await this.initializer();
        this.cache = data;
      }
    });
  }
}
