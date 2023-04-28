import type { IPage } from "@bouncer/page";
import type { ScheduledLimitData } from "./ScheduledLimit";

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
   * Get the datetime of the next enforcement event triggered by browsing
   * activity. Only events that aid block enforcement are considered; an event
   * that triggers an unblock is not.
   * 
   * @param time the current time
   * @param page the current page
   * @returns the date of the next enforcement event triggered by viewtime use
   */
  nextViewEvent(time: Date, page: IPage): Date | null;

  /**
   * Get the datetime of the next enforcement event triggered by the passage of
   * time. Only events that aid block enforcement are considered; an event that
   * triggers an unblock is not.
   * 
   * @param time the current time
   * @param page the current page
   * @returns the date of the next scheduled enforcement event
   */
  nextTimelineEvent(time: Date, page: IPage): Date | null;

  /**
   * Convert enforcer to an object representation. The representation must
   * include a field "type" that indicates the type of enforcer represented.
   * 
   * @returns object representing enforcer
   */
  toObject(): EnforcerData;
}

/**
 * Union of all types that represent enforcers in their serialized form.
 */
export type EnforcerData =
  ScheduledLimitData;
