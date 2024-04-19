import { DomainMatcher } from "./DomainMatcher";
import { FrameContextMatcher } from "./FrameContextMatcher";
import { AndMatcher, NotMatcher, OrMatcher } from "./LogicalMatcher";
import { PageOwnerMatcher } from "./PageOwnerMatcher";
import { PathPrefixMatcher } from "./PathPrefixMatcher";
import type { IMatcher, MatcherData } from "./types";


/**
 * Deserialize a matcher from an object.
 * 
 * @param obj object data representing matcher
 * @returns deserialized matcher
 */
export function deserializeMatcher(obj: MatcherData): IMatcher {
  switch (obj.type) {
    case "Domain":
      return DomainMatcher.fromObject(obj);
    case "PathPrefix":
      return PathPrefixMatcher.fromObject(obj);
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
export { DomainMatcher } from "./DomainMatcher";
export { PageOwnerMatcher } from "./PageOwnerMatcher";
export { PathPrefixMatcher } from "./PathPrefixMatcher";
export { FrameContextMatcher } from "./FrameContextMatcher";
export { OrMatcher, AndMatcher, NotMatcher } from "./LogicalMatcher";