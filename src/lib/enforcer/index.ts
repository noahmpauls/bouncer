import { IPage } from "@bouncer/page";
import { ScheduledLimit, ScheduledLimitData } from "./ScheduledLimit";

/**
 * Represents an enforcer that limits allowed browsing behavior for a page.
 */
export interface IEnforcer {
  /**
   * Apply an enforcer to a page, potentially mutating the page.
   * 
   * @param time time to apply the enforcer at
   * @param page the page to apply the enforcer to
   */
  applyTo(time: Date, page: IPage): void;

  /**
   * Get the amount of viewtime remaining until the next viewtime-based block.
   * 
   * @param time the current time
   * @param page page to be blocked
   * @returns amount of viewtime until the page is blocked, in ms
   */
  remainingViewtime(time: Date, page: IPage): number;

  /**
   * 
   * @param time the current time
   * @param page page to be blocked
   * @returns remaining time in window until the page is blocked, in ms
   */
  remainingWindow(time: Date, page: IPage): number;

  /**
   * Convert enforcer to an object representation. The representation must
   * include a field "type" that indicates the type of enforcer represented.
   * 
   * @returns object representing enforcer
   */
  toObject(): EnforcerData;
}


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


/**
 * Union of all types that represent enforcers in their serialized form.
 */
export type EnforcerData =
  ScheduledLimitData;


export { ScheduledLimit } from "./ScheduledLimit";
