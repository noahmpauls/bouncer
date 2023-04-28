import type { IEnforcer } from "@bouncer/enforcer";
import type { IUrlMatcher } from "@bouncer/matcher";
import type { IPage } from "@bouncer/page";
import type { BasicPolicyData } from "./BasicPolicy";

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
 * Union of all types that represent policies in their serialized form.
 */
export type PolicyData =
  BasicPolicyData;
