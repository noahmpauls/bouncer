import type { ExactHostnameMatcherData } from "./ExactHostnameMatcher";

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
 * Union of all types that represent matchers in their serialized form.
 */
export type UrlMatcherData = 
  ExactHostnameMatcherData;
