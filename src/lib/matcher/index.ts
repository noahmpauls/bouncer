import { ExactHostnameMatcher, ExactHostnameMatcherData } from "./ExactHostnameMatcher";

/**
 * Represents a URL matching pattern.
 */
export type IUrlMatcher = {
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
  toObject(): UrlMatcherData;
}


/**
 * Deserialize a matcher from an object.
 * 
 * @param obj object data representing matcher
 * @returns deserialized matcher
 */
export function deserializeMatcher(obj: UrlMatcherData): IUrlMatcher {
  switch (obj.type) {
    case "ExactHostname":
      return ExactHostnameMatcher.fromObject(obj);
    default:
      throw new Error(`invalid matcher type ${(obj as any).type} cannot be deserialized`);
  }
}


/**
 * Serialize a matcher to an object representation.
 * 
 * @param matcher the matcher to serialize
 * @returns serialized matcher object
 */
export function serializeMatcher(matcher: IUrlMatcher): UrlMatcherData {
  return matcher.toObject();
}


/**
 * Union of all types that represent matchers in their serialized form.
 */
export type UrlMatcherData = 
  ExactHostnameMatcherData;


export { ExactHostnameMatcher } from "./ExactHostnameMatcher";