import { DomainMatcher } from "./DomainMatcher";
import { ExactHostnameMatcher } from "./ExactHostnameMatcher";
import { FrameContextMatcher } from "./FrameContextMatcher";
import { AndMatcher, NotMatcher, OrMatcher } from "./LogicalMatcher";
import { PageOwnerMatcher } from "./PageOwnerMatcher";
import type { IMatcher, MatcherData } from "./types";


/**
 * Deserialize a matcher from an object.
 * 
 * @param obj object data representing matcher
 * @returns deserialized matcher
 */
export function deserializeMatcher(obj: MatcherData): IMatcher {
  switch (obj.type) {
    case "DomainMatcher":
      return DomainMatcher.fromObject(obj);
    case "ExactHostname":
      return ExactHostnameMatcher.fromObject(obj);
    case "PageOwner":
      return PageOwnerMatcher.fromObject(obj);
    case "FrameContext":
      return FrameContextMatcher.fromObject(obj);
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
export { PageOwnerMatcher } from "./PageOwnerMatcher";
export { FrameContextMatcher } from "./FrameContextMatcher";
export { OrMatcher, AndMatcher, NotMatcher } from "./LogicalMatcher";