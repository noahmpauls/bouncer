import type { BrowseLocation } from "@bouncer/events";
import type { FrameContextMatcherData } from "./FrameContextMatcher";
import type { AndMatcherData, NotMatcherData, OrMatcherData } from "./LogicalMatcher";
import type { PageOwnerMatcherData } from "./PageOwnerMatcher";
import type { DomainMatcherData } from "./DomainMatcher";
import type { PathPrefixMatcherData } from "./PathPrefixMatcher";
import type { QueryParamsMatcherData } from "./QueryParamsMatcher";

export type FrameType = "ROOT" | "CHILD";

/**
 * Represents a rule for matching a frame.
 */
export type IMatcher = {
  /**
   * Determine whether the pattern applies to a given frame.
   * 
   * @param location the frame's location
   * @returns whether the frame matches the rule
   */
  matches(location: BrowseLocation): boolean;
  
  /**
   * Convert matcher to an object representation. The representation must
   * include a field "type" that indicates the type of matcher represented.
   * 
   * @returns object representing matcher
   */
  toObject(): MatcherData;
}

/**
 * Union of all types that represent matchers in their serialized form.
 */
export type MatcherData = 
| DomainMatcherData
| PathPrefixMatcherData
| QueryParamsMatcherData
| PageOwnerMatcherData
| FrameContextMatcherData
| OrMatcherData
| AndMatcherData
| NotMatcherData
;
