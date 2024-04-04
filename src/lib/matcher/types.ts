import type { ExactHostnameMatcherData } from "./ExactHostnameMatcher";
import type { FrameTypeMatcherData } from "./FrameTypeMatcher";
import type { AndMatcherData, NotMatcherData, OrMatcherData } from "./LogicalMatcher";

export type FrameType = "ROOT" | "CHILD";

/**
 * Represents a rule for matching a frame.
 */
export type IMatcher = {
  /**
   * Determine whether the pattern applies to a given frame.
   * 
   * @param url the URL of the frame
   * @param type the type of the frame
   * @returns whether the frame matches the rule
   */
  matches(url: URL, type: FrameType): boolean;
  
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
  ExactHostnameMatcherData
| FrameTypeMatcherData
| OrMatcherData
| AndMatcherData
| NotMatcherData
;
