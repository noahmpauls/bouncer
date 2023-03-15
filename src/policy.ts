import { assert } from "./assert";
import { deserializeMatcher, IUrlMatcher, serializeMatcher } from "./matcher";
import { deserializePage, IPage, serializePage } from "./page";
import { deserializeRule, IRule, serializeRule } from "./rule";


/**
 * Represents a policy bundled with its metadata.
 */
export interface IPolicy {
  /**
   * Type discriminator indicating the type of policy.
   */
  type: PolicyType

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
   * Rule to enforce on policy page.
   */
  rule: IRule;

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
  toObject(): any;
}


/**
 * Deserialize a policy from an object.
 * 
 * @param data object data representing policy
 * @returns deserialized policy
 */
export function deserializePolicy(data: any): IPolicy {
  switch (data.type as PolicyType) {
    case "BasicPolicy":
      return BasicPolicy.fromObject(data);
    default:
      throw new Error(`invalid policy type ${data.type} cannot be deserialized`);
  }
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


/**
 * Discriminator type for each kind of policy.
 */
type PolicyType =
  "BasicPolicy";


/**
 * Represents a mapping between a set of URL matchers and the rules that apply
 * to URLs matched by the matchers.
 */
export class BasicPolicy implements IPolicy {
  readonly type: PolicyType = "BasicPolicy";

  readonly id: string;
  name: string;
  active: boolean;
  matcher: IUrlMatcher;
  rule: IRule;
  readonly page: IPage;

  /**
   * @param matchers determines what URLs the policy applies to
   * @param rule the rule to apply
   */
  constructor(
    id: string,
    name: string,
    active: boolean,
    matcher: IUrlMatcher,
    rule: IRule,
    page: IPage,
  ) {
    this.id = id;
    this.name = name;
    this.active = active;
    this.matcher = matcher;
    this.rule = rule;
    this.page = page;
  }

  /**
   * Convert an object to this kind of policy.
   * 
   * @param data object data representing the policy
   * @returns policy
   */
  static fromObject(data: any): BasicPolicy {
    assert(data.type === "BasicPolicy", `cannot make Basic Policy from data with type ${data.type}`);
    return new BasicPolicy(
      data.id,
      data.name,
      data.active,
      deserializeMatcher(data.matcher),
      deserializeRule(data.rule),
      deserializePage(data.page)
    );
  }

  toObject() {
    return {
      type: this.type,
      id: this.id,
      name: this.name,
      active: this.active,
      matcher: serializeMatcher(this.matcher),
      rule: serializeRule(this.rule),
      page: serializePage(this.page),
    }
  }

}
