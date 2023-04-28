import { type IBouncerData } from "@bouncer/data";
import { type IPolicy } from "@bouncer/policy";
import { Synchronizer } from "@bouncer/utils";
import { type IBouncerContext } from "./types";


/**
 * Represents a data context that serves entities out of an in-memory cache
 * populated from the data source.
 */
export class CachedBouncerContext implements IBouncerContext {
  data: IBouncerData;
  cache: IPolicy[] | undefined = undefined;
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
        const data = await this.data.getPolicies();
        this.cache = data;
      }
    });
  }
  
  async policies(): Promise<IPolicy[]> {
    if (this.cache === undefined) {
      await this.initCache();
      return this.policies();
    } else {
      return this.cache;
    }
  }
  
  async applicablePolicies(url: URL): Promise<IPolicy[]> {
    if (this.cache === undefined) {
      await this.initCache();
      return this.applicablePolicies(url);
    } else {
      return this.cache.filter(p => p.matcher.matches(url));
    }
  }
  
  async refresh(): Promise<void> {
    await this.sync.sync(async () => {
      const data = await this.data.getPolicies();
      this.cache = data;
    });
  }
  
  async persist(): Promise<void> {
    await this.sync.sync(async () => {
      if (this.cache !== undefined) {
        await this.data.setPolicies(this.cache);
      }
    });
  }
}
