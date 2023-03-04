import { IUrlMatcher } from "./matcher";
import { IRule } from "./rule";


/**
 * Represents a mapping between a set of URL matchers and the rules that apply
 * to URLs matched by the matchers.
 */
export interface IPolicy {
  /**
   * Unique policy identifier.
   */
  id: string;

  /**
   * The policy URL matchers.
   */
  matchers: IUrlMatcher[];

  /**
   * The applicable rule.
   */
  rule: IRule;

  /**
   * Convert the policy to an object representation.
   *
   * @returns object representing policy
   */
  toObject(): any;
}


/**
 * Deserialize a policy from an object.
 * 
 * @param id the id of the policy
 * @param data object data representing policy
 * @returns deserialized policy
 */
export function deserializePolicy(id: string, data: any): IPolicy {
  throw new Error("Function not implemented.");
}


/**
 * Serialize a policy to an object representation.
 * 
 * @param policy the policy to serialize
 * @returns serialized policy object
 */
export function serializePolicy(policy: IPolicy): any {
  return policy.toObject();
}
