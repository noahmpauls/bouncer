import { IEnforcer, deserializeEnforcer, serializeEnforcer, EnforcerData } from "@bouncer/enforcer";
import { IUrlMatcher, deserializeMatcher, serializeMatcher, UrlMatcherData } from "@bouncer/matcher";
import { IPage, deserializePage, serializePage, PageData } from "@bouncer/page";
import { assert } from "@bouncer/utils";
import { IPolicy } from ".";

/**
 * Represents the mapping between a page/set of pages and an enforcement action
 * on those pages.
 */
export class BasicPolicy implements IPolicy {

  readonly id: string;
  name: string;
  active: boolean;
  matcher: IUrlMatcher;
  enforcer: IEnforcer;
  readonly page: IPage;

  constructor(
    id: string,
    name: string,
    active: boolean,
    matcher: IUrlMatcher,
    enforcer: IEnforcer,
    page: IPage,
  ) {
    this.id = id;
    this.name = name;
    this.active = active;
    this.matcher = matcher;
    this.enforcer = enforcer;
    this.page = page;
  }

  /**
   * Convert an object to this kind of policy.
   * 
   * @param obj object data representing the policy
   * @returns policy
   */
  static fromObject(obj: BasicPolicyData): BasicPolicy {
    assert(obj.type === "BasicPolicy", `cannot make Basic Policy from data with type ${obj.type}`);
    return new BasicPolicy(
      obj.id,
      obj.data.name,
      obj.data.active,
      deserializeMatcher(obj.data.matcher),
      deserializeEnforcer(obj.data.enforcer),
      deserializePage(obj.data.page)
    );
  }

  toObject(): BasicPolicyData {
    return {
      type: "BasicPolicy",
      id: this.id,
      data: {
        name: this.name,
        active: this.active,
        matcher: serializeMatcher(this.matcher),
        enforcer: serializeEnforcer(this.enforcer),
        page: serializePage(this.page),
      }
    }
  }
}

export type BasicPolicyData = {
  type: "BasicPolicy",
  id: string,
  data: {
    name: string,
    active: boolean,
    matcher: UrlMatcherData,
    enforcer: EnforcerData,
    page: PageData,
  }
}
