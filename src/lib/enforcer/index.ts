import { ScheduledLimit } from "./ScheduledLimit";
import type { EnforcerData, IEnforcer } from "./types";


/**
 * Deserialize an enforcer from an object.
 * 
 * @param obj object data representing enforcer
 * @returns deserialized enforcer
 */
export function deserializeEnforcer(obj: EnforcerData): IEnforcer {
  switch (obj.type) {
    case "ScheduledLimit":
      return ScheduledLimit.fromObject(obj);
    default:
      throw new Error(`invalid enforcer type ${(obj as any).type} cannot be deserialized`);
  }
}


/**
 * Serialize an enforcer to an object representation.
 * 
 * @param enforcer the enforcer to serialize
 * @returns serialized enforcer object
 */
export function serializeEnforcer(enforcer: IEnforcer): EnforcerData {
  return enforcer.toObject();
}


export * from "./types";
export { ScheduledLimit } from "./ScheduledLimit";
