import { assert } from "./assert";

/**
 * Represents a URL matching pattern.
 */
export type IUrlMatcher = {
  /**
   * Type discriminator indicating the type of matcher.
   */
  type: UrlMatcherType;

  /**
   * Determine whether the pattern applies to a given URL.
   * 
   * @param url the URL to test
   * @returns whether the URL matches the pattern
   */
  matches(url: URL): boolean;
  
  /**
   * Convert matcher to an object representation. The representation must
   * include a field "type" that indicates the type of matcher represented.
   * 
   * @returns object representing matcher
   */
  toObject(): any;
}


/**
 * Deserialize a matcher from an object.
 * 
 * @param data object data representing matcher
 * @returns deserialized matcher
 */
export function deserializeMatcher(data: any): IUrlMatcher {
  switch (data.type as UrlMatcherType) {
    case "ExactHostname":
      return ExactHostnameMatcher.fromObject(data);
    default:
      throw new Error(`invalid matcher type ${data.type} cannot be deserialized`);
  }
}


/**
 * Serialize a matcher to an object representation.
 * 
 * @param matcher the matcher to serialize
 * @returns serialized matcher object
 */
export function serializeMatcher(matcher: IUrlMatcher): any {
  return matcher.toObject();
}


/**
 * Discriminator type for each kind of matcher.
 */
type UrlMatcherType = 
  "ExactHostname";


/**
 * Determines whether a URL exactly matches a given hostname.
 */
export class ExactHostnameMatcher implements IUrlMatcher {
  readonly type: UrlMatcherType = "ExactHostname";
  
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
   * @param data object data representing matcher
   * @returns matcher
   */
  static fromObject(data: any): ExactHostnameMatcher {
    assert(data.type === "ExactHostname", `cannot make ExactHostname from data with type ${data.type}`);
    return new ExactHostnameMatcher(data.hostname);
  }

  
  matches(url: URL): boolean {
    return url.hostname === this.hostname;
  }
  

  toObject(): any {
    return {
      type: this.type,
      hostname: this.hostname
    };
  }
}
