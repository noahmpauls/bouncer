import type { IPolicy } from "@bouncer/policy";

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
