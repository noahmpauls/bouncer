import { type IPolicy } from "@bouncer/policy";
import { type IStorage } from "@bouncer/storage";
import { type IBouncerData } from "./types";
import { deserializeGuard, serializeGuard, type IGuard, BasicGuard } from "@bouncer/guard";
import { BasicPage } from "@bouncer/page";

/**
 * Represents a Bouncer data provider that uses a persistent storage solution.
 */
export class StoredBouncerData implements IBouncerData {
  private readonly storage: IStorage;

  /**
   * @param storage the storage provider
   */
  constructor(storage: IStorage) {
    this.storage = storage;
  }

  
  async getGuards(): Promise<IGuard[]> {
    const data = await this.storage.get<any[]>("guards", []);
    const objects = data.map(g => deserializeGuard(g));
    return objects;
  }
  
  async setGuards(guards: IGuard[]): Promise<void> {
    const data = guards.map(g => serializeGuard(g));
    await this.storage.set("guards", data);
  }

  async addPolicy(policy: IPolicy): Promise<IGuard> {
    const data = await this.storage.get<any[]>("guards", []);
    // TODO: generating IDs this way does not work...
    const id = data.length.toString();
    const guard = new BasicGuard(id, policy, new BasicPage());
    const serializedGuard = serializeGuard(guard);
    data.push(serializedGuard);
    await this.storage.set("guards", data);
    return guard;
  }
}
