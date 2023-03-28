import { IPolicy, deserializePolicy, serializePolicy } from "@bouncer/policy";
import { IStorage } from "@bouncer/storage";
import { IBouncerData } from ".";

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

  
  async getPolicies(): Promise<IPolicy[]> {
    const policyData = await this.storage.get<any[]>("policies", []);
    const policies = policyData.map(p => deserializePolicy(p));
    return policies;
  }
  
  async setPolicies(policies: IPolicy[]): Promise<void> {
    const policyData = policies.map(p => serializePolicy(p));
    await this.storage.set("policies", policyData);
  }

  async addPolicy(policy: IPolicy): Promise<string> {
    const policyData = await this.storage.get<any[]>("policies", []);
    const id = policyData.length.toString();
    // TODO: it is far from ideal to directly change the policy's serialized
    //       representation, which should be entirely hidden. Need a way to
    //       create policy objects without IDs.
    const serializedPolicy = serializePolicy(policy);
    serializedPolicy.id = id;
    policyData.push(serializedPolicy);
    await this.storage.set("policies", policyData);
    return id;
  }
}
