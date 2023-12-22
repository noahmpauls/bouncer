import { type IBouncerData } from "@bouncer/data";
import { Synchronizer } from "@bouncer/utils";
import { type IBouncerContext } from "./types";
import type { IGuard } from "@bouncer/guard";


/**
 * Represents a data context that serves entities out of an in-memory cache
 * populated from the data source.
 */
export class CachedBouncerContext implements IBouncerContext {
  data: IBouncerData;
  cache: IGuard[] | undefined = undefined;
  sync: Synchronizer = new Synchronizer();

  constructor(data: IBouncerData) {
    this.data = data;
    this.initCache();
  }

  /**
   * Synchronously populate the cache from the data source, if the cache isn't
   * already populated.
   */
  private async initCache(): Promise<void> {
    if (this.cache !== undefined) {
      return;
    }
    await this.sync.sync(async () => {
      if (this.cache === undefined) {
        const data = await this.data.getGuards();
        this.cache = data;
      }
    });
  }
  
  async guards(): Promise<IGuard[]> {
    if (this.cache === undefined) {
      await this.initCache();
      return this.guards();
    } else {
      return this.cache;
    }
  }
  
  async applicableGuards(url: URL): Promise<IGuard[]> {
    if (this.cache === undefined) {
      await this.initCache();
      return this.applicableGuards(url);
    } else {
      return this.cache.filter(g => g.policy.active && g.policy.matcher.matches(url));
    }
  }
  
  async refresh(): Promise<void> {
    await this.sync.sync(async () => {
      const data = await this.data.getGuards();
      this.cache = data;
    });
  }
  
  async persist(): Promise<void> {
    await this.sync.sync(async () => {
      if (this.cache !== undefined) {
        await this.data.setGuards(this.cache);
      }
    });
  }
}
