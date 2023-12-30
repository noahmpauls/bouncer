import { type IStorage } from "@bouncer/storage";
import { type IBouncerData } from "./types";
import { deserializeGuard, serializeGuard, type IGuard } from "@bouncer/guard";

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
}
