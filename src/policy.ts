import { IUrlMatcher } from "./matcher";
import { IRule } from "./rule";


/**
 * Represents a mapping between a set of URL matchers and the rules that apply
 * to URLs matched by the matchers.
 */
export interface IPolicy {
  /**
   * The policy URL matchers.
   */
  matchers: IUrlMatcher[];

  /**
   * The applicable rule.
   */
  rule: IRule;
}