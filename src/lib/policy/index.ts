import { BasicPolicy } from "./BasicPolicy";
import type { PolicyData, IPolicy } from "./types";


/**
 * Deserialize a policy from an object.
 * 
 * @param obj object data representing policy
 * @returns deserialized policy
 */
export function deserializePolicy(obj: PolicyData): IPolicy {
  switch (obj.type) {
    case "BasicPolicy":
      return BasicPolicy.fromObject(obj);
    default:
      throw new Error(`invalid policy type ${(obj as any).type} cannot be deserialized`);
  }
}


/**
 * Serialize a policy to an object representation.
 * 
 * @param policy the policy to serialize
 * @returns serialized policy object
 */
export function serializePolicy(policy: IPolicy): PolicyData {
  return policy.toObject();
}



export * from "./types";
export { BasicPolicy } from "./BasicPolicy";
