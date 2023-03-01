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
}


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
  
  matches(url: URL): boolean {
    return url.hostname === this.hostname;
  }
}
