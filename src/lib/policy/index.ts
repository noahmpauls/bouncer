import { IEnforcer } from "@bouncer/enforcer";
import { IUrlMatcher } from "@bouncer/matcher";
import { IPage } from "@bouncer/page";
import { BasicPolicy, BasicPolicyData } from "./BasicPolicy";

/**
 * Represents a policy.
 */
export interface IPolicy {
  /**
   * Unique ID identifying a policy.
   */
  id: string;
  
  /**
   * Human-readable name of the policy.
   */
  name: string;
  
  /**
   * Whether the policy is active or not.
   */
  active: boolean;
  
  /**
   * Matcher determining what URLs this policy matches.
   */
  matcher: IUrlMatcher;

  /**
   * Enforcer to apply to policy page.
   */
  enforcer: IEnforcer;

  /**
   * Blockable page associated with the policy.
   */
  page: IPage;

  /**
   * Convert the policy to an object representation. The representation must
   * include a field "type" that indicates the type of policy represented.
   *
   * @returns object representing policy
   */
  toObject(): PolicyData;
}


/**
 * Deserialize a policy from an object.
 * 
 * @param obj object data representing policy
 * @returns deserialized policy
 */
export function deserializePolicy(obj: PolicyData): IPolicy {
  switch (obj.type) {
    case "BasicPolicy":
      return BasicPolicy.fromObject(obj);
    default:
      throw new Error(`invalid policy type ${(obj as any).type} cannot be deserialized`);
  }
}


/**
 * Serialize a policy to an object representation.
 * 
 * @param policy the policy to serialize
 * @returns serialized policy object
 */
export function serializePolicy(policy: IPolicy): PolicyData {
  return policy.toObject();
}


/**
 * Union of all types that represent policies in their serialized form.
 */
export type PolicyData =
  BasicPolicyData;


export { BasicPolicy } from "./BasicPolicy";
