import { IPage } from "./page";

/**
 * Represents a suggested action to take on a page.
 */
export type LimitAction = 
{ action: "NONE" | "UNBLOCK" } | 
{
  action: "BLOCK",
  duration: number,
}


/**
 * Represents a suggested limit on browsing activity.
 */
export interface ILimit {
  /**
   * Recommend an action to take on a page at the given time.
   * 
   * @param time time to apply the limit at
   * @param page the page to apply the rule to
   * @returns the recommended action to take on the page
   */
  action(time: Date, page: IPage): LimitAction;


  /**
   * Get the amount of viewtime remaining until the next suggested viewtime-
   * based block.
   * 
   * @param page page to be blocked
   * @returns amount of viewtime until the page should be blocked
   */
  remainingViewtime(page: IPage): number;
}


/**
 * Represents a limit that always recommends blocking no matter what.
 */
export class AlwaysBlock implements ILimit {

  constructor() { }

  action(time: Date, page: IPage): LimitAction {
    return {
      action: "BLOCK",
      duration: Infinity
    };
  }
  
  remainingViewtime(page: IPage): number {
    return Infinity;
  }
}
