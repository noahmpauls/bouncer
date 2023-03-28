import { assert } from "@bouncer/utils";
import { IUrlMatcher } from ".";

/**
 * Union of all types that represent matchers in their serialized form.
 */
export type UrlMatcherData = 
  ExactHostnameMatcherData;


/**
 * Determines whether a URL exactly matches a given hostname.
 */
export class ExactHostnameMatcher implements IUrlMatcher {
  
  private readonly hostname: string;

  /**
   * @param hostname the hostname to match against
   */
  constructor(hostname: string) {
    this.hostname = hostname;
  }


  /**
   * Convert an object to this type of matcher.
   * 
   * @param obj object data representing matcher
   * @returns matcher
   */
  static fromObject(obj: ExactHostnameMatcherData): ExactHostnameMatcher {
    assert(obj.type === "ExactHostname", `cannot make ExactHostname from data with type ${obj.type}`);
    return new ExactHostnameMatcher(obj.data.hostname);
  }

  
  matches(url: URL): boolean {
    return url.hostname === this.hostname;
  }
  

  toObject(): ExactHostnameMatcherData {
    return {
      type: "ExactHostname",
      data: {
        hostname: this.hostname
      }
    };
  }
}

export type ExactHostnameMatcherData = {
  type: "ExactHostname",
  data: {
    hostname: string,
  }
}
