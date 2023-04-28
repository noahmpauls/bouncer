import type { IPageMetrics, PageAction } from "@bouncer/page";
import type { AlwaysBlockData } from "./AlwaysBlock";
import type { ViewtimeCooldownData } from "./ViewtimeCooldownLimit";
import type { WindowCooldownData } from "./WindowCooldownLimit";

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
 * Union of all types that represent limits in their serialized form.
 */
export type LimitData =
    AlwaysBlockData
  | ViewtimeCooldownData
  | WindowCooldownData
  ;
