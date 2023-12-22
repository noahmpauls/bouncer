import { type IEnforcer, deserializeEnforcer, serializeEnforcer, type EnforcerData } from "@bouncer/enforcer";
import { type IUrlMatcher, deserializeMatcher, serializeMatcher, type UrlMatcherData } from "@bouncer/matcher";
import { assert } from "@bouncer/utils";
import { type IPolicy } from "./types";

/**
 * Represents the mapping between a page/set of pages and an enforcement action
 * on those pages.
 */
export class BasicPolicy implements IPolicy {

  name: string;
  active: boolean;
  matcher: IUrlMatcher;
  enforcer: IEnforcer;

  constructor(
    name: string,
    active: boolean,
    matcher: IUrlMatcher,
    enforcer: IEnforcer,
  ) {
    this.name = name;
    this.active = active;
    this.matcher = matcher;
    this.enforcer = enforcer;
  }

  /**
   * Convert an object to this kind of policy.
   * 
   * @param obj object data representing the policy
   * @returns policy
   */
  static fromObject(obj: BasicPolicyData): BasicPolicy {
    assert(obj.type === "BasicPolicy", `cannot make BasicPolicy from data with type ${obj.type}`);
    return new BasicPolicy(
      obj.data.name,
      obj.data.active,
      deserializeMatcher(obj.data.matcher),
      deserializeEnforcer(obj.data.enforcer),
    );
  }

  toObject(): BasicPolicyData {
    return {
      type: "BasicPolicy",
      data: {
        name: this.name,
        active: this.active,
        matcher: serializeMatcher(this.matcher),
        enforcer: serializeEnforcer(this.enforcer),
      }
    }
  }
}

export type BasicPolicyData = {
  type: "BasicPolicy",
  data: {
    name: string,
    active: boolean,
    matcher: UrlMatcherData,
    enforcer: EnforcerData,
  }
}
