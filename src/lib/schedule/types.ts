import type { IPageMetrics, PageAction } from "@bouncer/page";
import type { AlwaysScheduleData } from "./AlwaysSchedule";
import type { PeriodicScheduleData } from "./PeriodicSchedule";

/**
 * Represents a specified subset of all times.
 * 
 * TODO: include an understanding of boundaries? Can't currently enable
 * resets.
 */
export interface ISchedule {
  /**
   * Check whether the given time is in the schedule.
   * 
   * @param time the time to test
   * @returns whether the given time is in the schedule
   */
  contains(time: Date): boolean;
  
  /**
   * Get any recommended actions to take on the given page based on schedule
   * changes in the given time range.
   * 
   * @param from start of relevant time range
   * @param to end of relevant time range
   * @param page the page to apply the schedule to
   * @returns the recommended actions to take on the page
   */
  actions(from: Date, to : Date, page: IPageMetrics): PageAction[];
  
  /**
   * Get the datetime of the next schedule start after the given time, if a
   * start exists.
   * 
   * @param time the current time
   * @returns the next nearest schedule start after `time`, if one exists
   */
  nextStart(time: Date): Date | undefined;

  /**
   * Convert schedule to an object representation. The representation must
   * include a field "type" that indicates the type of schedule represented.
   * 
   * @returns object representing schedule
   */
  toObject(): ScheduleData;
}

/**
 * Union of all types that represent schedules in their serialized form.
 */
export type ScheduleData =
    AlwaysScheduleData
  | PeriodicScheduleData
  ;
