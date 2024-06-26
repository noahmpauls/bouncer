import { SyncedCache } from "@bouncer/cache";
import { Configuration, type IConfiguration } from "@bouncer/config";
import { BrowserStorage, type IStorage } from "@bouncer/storage";
import type { IContext } from "./types";

export class ConfigContext implements IContext<IConfiguration> {
  private readonly key = "configuration";
  private readonly cache: SyncedCache<IConfiguration>;

  constructor(
    private readonly storage: IStorage,
  ) {
    this.cache = new SyncedCache(async () => {
      const config = this.storage.get<IConfiguration>(this.key, Configuration.default());
      return config;
    });
  }

  static browser = (): ConfigContext => {
    return new ConfigContext(BrowserStorage.local());
  }

  fetch = async (): Promise<IConfiguration> => {
    return await this.cache.value();
  }

  commit = async () => {
    const config = await this.cache.value();
    this.storage.set(this.key, config);
  }

  clear = async () => {
    await this.cache.clear();
  }
}