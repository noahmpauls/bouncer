import { ExactHostnameMatcher, type UrlMatcherData } from "./ExactHostnameMatcher";
import type { IUrlMatcher } from "./types";


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



export * from "./types";
export { ExactHostnameMatcher } from "./ExactHostnameMatcher";