import type { IEnforcer } from "@bouncer/enforcer";
import type { IUrlMatcher } from "@bouncer/matcher";
import type { BasicPolicyData } from "./BasicPolicy";

/**
 * Represents a policy.
 */
export interface IPolicy {
  /**
   * Human-readable name of the policy.
   */
  name: string;
  
  /**
   * Matcher determining what URLs this policy matches.
   */
  matcher: IUrlMatcher;

  /**
   * Enforcer to apply to policy page.
   */
  enforcer: IEnforcer;

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
