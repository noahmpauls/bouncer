import { AlwaysBlock } from "./AlwaysBlock";
import { ViewtimeCooldownLimit } from "./ViewtimeCooldownLimit";
import { WindowCooldownLimit } from "./WindowCooldownLimit";
import type { ILimit, LimitData } from "./types";


/**
 * Deserialize a limit from an object.
 * 
 * @param obj object data representing limit
 * @returns deserialized limit
 */
export function deserializeLimit(obj: LimitData): ILimit {
  switch (obj.type) {
    case "AlwaysBlock":
      return AlwaysBlock.fromObject(obj);
    case "ViewtimeCooldown":
      return ViewtimeCooldownLimit.fromObject(obj);
    case "WindowCooldown":
      return WindowCooldownLimit.fromObject(obj);
    default:
      throw new Error(`invalid limit type ${(obj as any).type} cannot be deserialized`);
  }
}


/**
 * Serialize a limit to an object representation.
 * 
 * @param limit the limit to serialize
 * @returns serialized limit object
 */
export function serializeLimit(limit: ILimit): LimitData {
  return limit.toObject();
}


export * from "./types";
export { AlwaysBlock } from "./AlwaysBlock";
export { ViewtimeCooldownLimit } from "./ViewtimeCooldownLimit";
export { WindowCooldownLimit } from "./WindowCooldownLimit";