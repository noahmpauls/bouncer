import { ILimit } from "./limit";
import { IPage } from "./page";
import { ISchedule } from "./schedule";


/**
 * Represents a rule that limits allowed browsing behavior for a page.
 */
export interface IRule {
  /**
   * Apply a rule to a page, potentially mutating the page.
   * 
   * @param time time to apply the rule at
   * @param page the page to apply the rule to
   */
  applyTo(time: Date, page: IPage): void;

  /**
   * Get the amount of viewtime remaining until the next viewtime-based block.
   * 
   * @param page page to be blocked
   * @returns amount of viewtime until the page is blocked
   */
  remainingViewtime(page: IPage): number;
}


/**
 * Represents a browsing limit that applies on a schedule.
 * 
 * A `ScheduledLimit` has two main parts:
 * - `schedule`: determines when this rule applies. The conditions of the rule
 *   only apply when the current time is within the schedule; otherwise, the
 *   rule doesn't apply.
 * - `limit`: determines how the rule applies during the schedule.
 */
export class ScheduledLimit implements IRule {

  /**
   * @param schedule the schedule during which the limit applies
   * @param limit the limit to apply
   */
  constructor(schedule: ISchedule, limit: ILimit) {
    throw new Error("Method not implemented.");
  }


  applyTo(time: Date, page: IPage): void {
    throw new Error("Method not implemented.");
  }
  

  remainingViewtime(page: IPage): number {
    throw new Error("Method not implemented.");
  }
}
