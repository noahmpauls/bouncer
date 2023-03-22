import { assert } from "./assert";
import { deserializeMatcher, IUrlMatcher, serializeMatcher, UrlMatcherData } from "./matcher";
import { deserializePage, IPage, PageData, serializePage } from "./page";
import { deserializeEnforcer, EnforcerData, IEnforcer, serializeEnforcer } from "./enforcer";


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

type BasicPolicyData = {
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
