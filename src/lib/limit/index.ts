import { IPageMetrics, PageAction } from "@bouncer/page";
import { AlwaysBlock, AlwaysBlockData } from "./AlwaysBlock";
import { ViewtimeCooldownLimit, ViewtimeCooldownData } from "./ViewtimeCooldownLimit";
import { WindowCooldownData, WindowCooldownLimit } from "./WindowCooldownLimit";


/**
 * Represents a suggested limit on browsing activity.
 */
export interface ILimit {
  /**
   * Recommend an action to take on a page at the given time.
   * 
   * @param time time to apply the limit at
   * @param page the page to apply the limit to
   * @returns the recommended action to take on the page
   */
  actions(time: Date, page: IPageMetrics): PageAction[];


  /**
   * Get the amount of viewtime remaining until the next suggested 
   * viewtime-based block. Should return `Infinity` if the limit does not
   * recommend blocks based on viewtime.
   * 
   * @param time the current time
   * @param page page to be blocked
   * @returns amount of viewtime until the page should be blocked, in ms
   */
  remainingViewtime(time: Date, page: IPageMetrics): number;
  

  /**
   * Get the amount of time remaining in the window since a page's initial
   * visit until the next suggested window-based block. Should return
   * `Infinity` if the limit does not recommend blocks based on windows.
   * 
   * @param time the current time
   * @param page page to be blocked
   * @returns remaining time in window until the page should be blocked, in ms
   */
  remainingWindow(time: Date, page: IPageMetrics): number;


  /**
   * Convert limit to an object representation. The representation must
   * include a field "type" that indicates the type of limit represented.
   * 
   * @returns object representing limit
   */
  toObject(): LimitData;
}


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


/**
 * Union of all types that represent limits in their serialized form.
 */
export type LimitData =
    AlwaysBlockData
  | ViewtimeCooldownData
  | WindowCooldownData
  ;


export { AlwaysBlock } from "./AlwaysBlock";
export { ViewtimeCooldownLimit } from "./ViewtimeCooldownLimit";
export { WindowCooldownLimit } from "./WindowCooldownLimit";