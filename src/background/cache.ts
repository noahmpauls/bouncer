import { IBouncerData } from "@bouncer/data";
import { IPolicy } from "@bouncer/policy";
import { Synchronizer } from "@bouncer/utils";


export interface IBouncerCache {

  getPolicies(): Promise<IPolicy[]>;

  getApplicablePolicies(url: URL): Promise<IPolicy[]>;
  
  refresh(): Promise<void>;

  persist(): Promise<void>;
}


export class BouncerCache implements IBouncerCache {
  data: IBouncerData;
  cache: IPolicy[] | undefined = undefined;
  sync: Synchronizer = new Synchronizer();

  constructor(data: IBouncerData) {
    this.data = data;
    this.initCache();
  }

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
  
  async getPolicies(): Promise<IPolicy[]> {
    if (this.cache === undefined) {
      await this.initCache();
      return this.getPolicies();
    } else {
      return this.cache;
    }
  }
  
  async getApplicablePolicies(url: URL): Promise<IPolicy[]> {
    if (this.cache === undefined) {
      await this.initCache();
      return this.getApplicablePolicies(url);
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