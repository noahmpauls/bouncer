export type IUrlMatcher = {
  /**
   * Determine whether the pattern applies to a given URL.
   * 
   * @param url the URL to test
   * @returns whether the URL matches the pattern
   */
  matches(url: URL): boolean;
}

