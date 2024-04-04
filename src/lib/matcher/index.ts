import { ExactHostnameMatcher } from "./ExactHostnameMatcher";
import { FrameTypeMatcher } from "./FrameTypeMatcher";
import { AndMatcher, NotMatcher, OrMatcher } from "./LogicalMatcher";
import type { IMatcher, MatcherData } from "./types";


/**
 * Deserialize a matcher from an object.
 * 
 * @param obj object data representing matcher
 * @returns deserialized matcher
 */
export function deserializeMatcher(obj: MatcherData): IMatcher {
  switch (obj.type) {
    case "ExactHostname":
      return ExactHostnameMatcher.fromObject(obj);
    case "FrameType":
      return FrameTypeMatcher.fromObject(obj);
    case "Or":
      return OrMatcher.fromObject(obj);
    case "And":
      return AndMatcher.fromObject(obj);
    case "Not":
      return NotMatcher.fromObject(obj);
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
export function serializeMatcher(matcher: IMatcher): MatcherData {
  return matcher.toObject();
}



export * from "./types";
export { ExactHostnameMatcher } from "./ExactHostnameMatcher";
export { FrameTypeMatcher } from "./FrameTypeMatcher";
export { OrMatcher, AndMatcher, NotMatcher } from "./LogicalMatcher";