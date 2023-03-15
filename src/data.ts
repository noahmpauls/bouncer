import { deserializeMatcher } from "./matcher";
import { BasicPage } from "./page";
import { deserializePolicy, IPolicy, PolicyData, serializePolicy } from "./policy";
import { deserializeEnforcer } from "./enforcer";
import { IStorage } from "./storage";


/**
 * Provider of Bouncer data, for reading and writing.
 */
export interface IBouncerData {
  /**
   * Get all policies and pages that correspond to a given URL.
   *
   * @param url the URL that policies should apply to
   * @returns applicable policies
   */
  getApplicablePolicies(url: URL): Promise<IPolicy[]>;

  /**
   * Get all policies.
   * 
   * @returns all policies
   */
  getPolicies(): Promise<IPolicy[]>;
  
  /**
   * Add a new policy.
   * 
   * @param policy policy to add, with dummy ID
   * @returns ID of added policy
   */
  addPolicy(policy: IPolicy): Promise<string>;

  /**
   * Set a given policy to a new value.
   *
   * @param policy the set policy
   */
  setPolicy(policy: IPolicy): Promise<void>;
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

  
  async getApplicablePolicies(url: URL): Promise<IPolicy[]> {
    const policies = await this.getPolicies();
    const applicablePolicies = policies.filter(p => p.matcher.matches(url));
    return applicablePolicies;
  }
  
  
  async getPolicies(): Promise<IPolicy[]> {
    const policyData = await this.storage.get<any[]>("policies", []);
    const policies = policyData.map(p => deserializePolicy(p));
    return policies;
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


  async setPolicy(policy: IPolicy): Promise<void> {
    const policies = await this.getPolicies();
    const policyIndex = policies.findIndex(p => p.id === policy.id);
    if (policyIndex === -1) {
      throw new Error(`policy with ID ${policy.id} does not exist`);
    }
    policies[policyIndex] = policy;
    const serializedPolicies = policies.map(p => serializePolicy(p));
    await this.storage.set("policies", serializedPolicies);
  }
}