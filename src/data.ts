import { IPage } from "./page";
import { IPolicy } from "./policy";
import { IStorage } from "./storage";


/**
 * Provider of Bouncer data, for reading and writing.
 */
export interface IBouncerData {
  /**
   * Get all policies and pages that correspond to a given URL.
   *
   * @param url the URL that policies should apply to
   * @returns applicable policies and corresponding pages
   */
  getApplicablePolicies(url: string): Promise<{ policy: IPolicy, page: IPage }[]>;

  /**
   * Get all policies.
   * 
   * @returns all policies
   */
  getPolicies(): Promise<IPolicy[]>;

  /**
   * Set the policy with the given ID.
   *
   * @param policyId the ID of the policy to set
   * @param policy the set policy
   */
  setPolicy(policyId: string, policy: IPolicy): Promise<void>;

  /**
   * Set the page associated with a given policy.
   * 
   * @param policyId the ID of the page's policy
   * @param page the set page
   */
  setPolicyPage(policyId: string, page: IPage): Promise<void>;
}


/**
 * Represents a Bouncer data provider that uses a persistent storage solution.
 */
export class StoredBouncerData implements IBouncerData {

  /**
   * @param storage the storage provider
   */
  constructor(storage: IStorage) {
    throw new Error("Method not implemented.");
  }

  
  getApplicablePolicies(url: string): Promise<{ policy: IPolicy, page: IPage; }[]> {
    throw new Error("Method not implemented.");
  }


  getPolicies(): Promise<IPolicy[]> {
    throw new Error("Method not implemented.");
  }

  
  setPolicy(policyId: string, policy: IPolicy): Promise<void> {
    throw new Error("Method not implemented.");
  }
  

  setPolicyPage(policyId: string, page: IPage): Promise<void> {
    throw new Error("Method not implemented.");
  }
}