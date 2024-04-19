import type { BrowseLocation } from "@bouncer/events";
import type { IMatcher } from "./types";
import { assert } from "@bouncer/utils";

/**
 * Represents a matcher for the domain portion of a URL. It matches an exact
 * domain name, and optionally matches specific subdomains.
 * 
 * A matching URL must have a domain that is equal to or a subdomain of the
 * matcher's `domain`. If the URL's domain has any subdomains, they must match
 * the `subdomains` rule:
 * 
 * - If an `include` list is given, the subdomain must be in the list to result
 *   in a match. An empty include list means that no subdomains are matched.
 * - If an `exclude` list is given, the subdomain must not be in the list to
 *   result in a match. An empty exclude list means that all subdomains are
 *   matched.
 */
export class DomainMatcher implements IMatcher {
  /**
   * @param domain the base domain to match
   * @param subdomains rule for including/excluding subdomains
   */
  constructor(
    private readonly domain: string,
    private readonly subdomains: SubdomainsRule,
  ) { }

  /**
   * Convert an object to this type of matcher.
   * 
   * @param obj object data representing matcher
   * @returns matcher
   */
  static fromObject(obj: DomainMatcherData): DomainMatcher {
    assert(obj.type === "Domain", `cannot make ExactHostname from data with type ${obj.type}`);
    return new DomainMatcher(
      obj.data.domain,
      obj.data.subdomains,
    );
  }

  matches = (location: BrowseLocation): boolean => {
    const domain = location.url.hostname;
    const expectedSegments = this.domain.split(".");
    const actualSegments = domain.split(".");

    if (actualSegments.length < expectedSegments.length) {
      return false;
    }

    while (true) {
      const expected = expectedSegments.pop();
      if (expected === undefined) {
        break;
      }
      const actual = actualSegments.pop();
      if (actual === undefined) {
        return false;
      }
      if (expected !== actual) {
        return false;
      }
    }


    if (actualSegments.length === 0) {
      return true;
    }

    const subdomain = actualSegments.join(".");
    if ("include" in this.subdomains) {
      if (this.subdomains.include.includes(subdomain)) {
        return true;
      }
      return false;
    }

    if ("exclude" in this.subdomains) {
      if (this.subdomains.exclude.includes(subdomain)) {
        return false;
      }
      return true;
    }

    throw new Error("unreachable");
  }

  toObject = (): DomainMatcherData => {
    return {
      type: "Domain",
      data: {
        domain: this.domain,
        subdomains: this.subdomains,
      }
    }
  }
}

export type DomainMatcherData = {
  type: "Domain",
  data: {
    domain: string,
    subdomains: SubdomainsRule,
  }
}

/**
 * Represents a rule for which subdomains to match.
 */
type SubdomainsRule = {
  /** Include the given subdomains; exclude all if empty. */
  include: string[],
} | {
  /** Exclude the given subdomains; include all if empty. */
  exclude: string[],
}