import type { BrowseLocation } from "@bouncer/events";
import type { IMatcher } from "./types";
import { assert } from "@bouncer/utils";

/**
 * Represents a matcher for the path portion of a URL. It matches an exact path
 * prefix, and optionally any other paths underneath that prefix.
 * 
 * When an exact prefix is specified, the matcher will strip any trailing
 * slashes from the prefix, then match any path that either matches the prefix
 * or includes only trailing slashes.
 */
export class PathPrefixMatcher implements IMatcher {
  /**
   * 
   * @param pathPrefix The path prefix to match. Must begin with a slash, and
   *  cannot end with a slash.
   * @param matchSubpaths Whether to match all paths under the prefix.
   */
  constructor(
    private readonly pathPrefix: string,
    private readonly matchSubpaths: boolean,
  ) { this.checkRep(); }

  private checkRep = () => {
    assert(this.pathPrefix.startsWith("/"), "pathPrefix must start with slash");
    assert(!this.pathPrefix.endsWith("/"), "pathPrefix cannot end with slash");
  }

  /**
   * Convert an object to this type of matcher.
   * 
   * @param obj object data representing matcher
   * @returns matcher
   */
  static fromObject(obj: PathPrefixMatcherData): PathPrefixMatcher {
    assert(obj.type === "PathPrefix", `cannot make PathMatcher from data with type ${obj.type}`);
    return new PathPrefixMatcher(
      obj.data.pathPrefix,
      obj.data.matchSubpaths,
    );
  }
  
  matches = (location: BrowseLocation): boolean => {
    const path = location.url.pathname;
    if (path == this.pathPrefix) {
      return true;
    }
    const prefixWithSlash = `${this.pathPrefix}/`;
    return this.matchSubpaths
      ? path.startsWith(prefixWithSlash)
      : path == prefixWithSlash
      ;
  }

  toObject = (): PathPrefixMatcherData => {
    return {
      type: "PathPrefix",
      data: {
        pathPrefix: this.pathPrefix,
        matchSubpaths: this.matchSubpaths,
      }
    }
  }
}

export type PathPrefixMatcherData = {
  type: "PathPrefix",
  data: {
    pathPrefix: string,
    matchSubpaths: boolean,
  }
}