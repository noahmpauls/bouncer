import { BasicGuard } from "./BasicGuard";
import type { GuardData, IGuard } from "./types";


/**
 * Deserialize a guard from an object.
 * 
 * @param obj object data representing guard
 * @returns deserialized guard
 */
export function deserializeGuard(obj: GuardData): IGuard {
  switch (obj.type) {
    case "BasicGuard":
      return BasicGuard.fromObject(obj);
    default:
      throw new Error(`invalid guard type ${(obj as any).type} cannot be deserialized`);
  }
}


/**
 * Serialize a guard to an object representation.
 * 
 * @param guard the guard to serialize
 * @returns serialized guard object
 */
export function serializeGuard(guard: IGuard): GuardData {
  return guard.toObject();
}



export * from "./types";
export { BasicGuard } from "./BasicGuard";
