import { IPage } from "./page";
import { IPolicy } from "./policy";
import { IRule } from "./rule";
import { IStorage } from "./storage";


/**
 * Provider of Bouncer data, for reading and writing.
 */
export interface IBouncerData {
  /**
   * Get all rules and pages that correspond to a given URL.
   *
   * @param url the URL that rules should apply to
   * @returns applicable rules and pages
   */
  getApplicableRules(url: string): Promise<{ id: string, rule: IRule, page: IPage }[]>;

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
  setRulePage(policyId: string, page: IPage): Promise<void>;
}


/**
 * Represents a Bouncer data provider that uses a persistent storage solution.
 */
export class StoredBouncerData implements IBouncerData {

  /**
   * Construct a new `StoredBouncerData` instance.
   * 
   * @param storage the storage provider
   */
  constructor(storage: IStorage) {
    throw new Error("Method not implemented.");
  }

  
  getApplicableRules(url: string): Promise<{ id: string; rule: IRule; page: IPage; }[]> {
    throw new Error("Method not implemented.");
  }


  getPolicies(): Promise<IPolicy[]> {
    throw new Error("Method not implemented.");
  }

  
  setPolicy(policyId: string, policy: IPolicy): Promise<void> {
    throw new Error("Method not implemented.");
  }
  

  setRulePage(policyId: string, page: IPage): Promise<void> {
    throw new Error("Method not implemented.");
  }
}