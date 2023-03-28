import { deserializePolicy, IPolicy, serializePolicy } from "@bouncer/policy";
import { IStorage } from "@bouncer/storage";


/**
 * Provider of Bouncer data, for reading and writing.
 */
export interface IBouncerData {
  /**
   * Get all policies.
   * 
   * @returns all policies
   */
  getPolicies(): Promise<IPolicy[]>;
  
  /**
   * Set all policies.
   * 
   * @param policies policy entities
   */
  setPolicies(policies: IPolicy[]): Promise<void>;
  
  /**
   * Add a new policy.
   * 
   * @param policy policy to add, with dummy ID
   * @returns ID of added policy
   */
  addPolicy(policy: IPolicy): Promise<string>;
}


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
