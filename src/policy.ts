import { assert } from "./assert";
import { deserializeMatcher, IUrlMatcher, serializeMatcher } from "./matcher";
import { deserializeRule, IRule, serializeRule } from "./rule";


/**
 * Represents metadata about a policy.
 */
export interface IPolicyMetadata {
  /**
   * Unique ID identifying a policy.
   */
  id: string;
  
  /**
   * Human-readable name of the policy.
   */
  name?: string;
  
  /**
   * Humean-readable description of the policy.
   */
  description?: string;
  
  /**
   * Whether the policy is active or not.
   */
  active: boolean;
}


/**
 * Represents a mapping between a set of URL matchers and the rules that apply
 * to URLs matched by the matchers.
 */
export interface IPolicy {
  /**
   * Type discriminator indicating the type of policy.
   */
  type: PolicyType

  /**
   * The policy URL matchers.
   */
  matchers: IUrlMatcher[];

  /**
   * The applicable rule.
   */
  rule: IRule;

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

  readonly matchers: IUrlMatcher[];
  readonly rule: IRule;

  /**
   * @param matchers determines what URLs the policy applies to
   * @param rule the rule to apply
   */
  constructor(matchers: IUrlMatcher[], rule: IRule) {
    this.matchers = matchers;
    this.rule = rule;
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
      data.matchers.map((m: any) => deserializeMatcher(m)),
      deserializeRule(data.rule)
    );
  }

  toObject() {
    return {
      type: this.type,
      matchers: this.matchers.map((m: IUrlMatcher) => serializeMatcher(m)),
      rule: serializeRule(this.rule)
    }
  }

}
