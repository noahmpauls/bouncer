import { IPage } from "./page";


/**
 * Represents a schedule limit.
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