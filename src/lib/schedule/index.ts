import { IPageMetrics, PageAction } from "@bouncer/page";
import { AlwaysSchedule, AlwaysScheduleData } from "./AlwaysSchedule";
import { MinuteSchedule, MinuteScheduleData } from "./MinuteSchedule";
import { WeekSchedule, WeekScheduleData } from "./WeekSchedule";
import { DaySchedule, DayScheduleData } from "./DaySchedule";
import { PeriodicSchedule, PeriodicScheduleData } from "./PeriodicSchedule";

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
  nextStart(time: Date): Date | null;

  /**
   * Convert schedule to an object representation. The representation must
   * include a field "type" that indicates the type of schedule represented.
   * 
   * @returns object representing schedule
   */
  toObject(): ScheduleData;
}


/**
 * Deserialize a schedule from an object.
 * 
 * @param obj object data representing schedule
 * @returns deserialized schedule
 */
export function deserializeSchedule(obj: ScheduleData): ISchedule {
  switch (obj.type) {
    case "AlwaysSchedule":
      return AlwaysSchedule.fromObject(obj);
    case "MinuteSchedule":
      return MinuteSchedule.fromObject(obj);
    case "DaySchedule":
      return DaySchedule.fromObject(obj);
    case "WeekSchedule":
      return WeekSchedule.fromObject(obj);
    case "PeriodicSchedule":
      return PeriodicSchedule.fromObject(obj);
    default:
      throw new Error(`invalid schedule type ${(obj as any).type} cannot be deserialized`);
  }
}


/**
 * Serialize a schedule to an object representation.
 * 
 * @param schedule the schedule to serialize
 * @returns serialized schedule object
 */
export function serializeSchedule(schedule: ISchedule): ScheduleData {
  return schedule.toObject();
}


/**
 * Union of all types that represent schedules in their serialized form.
 */
export type ScheduleData =
    AlwaysScheduleData
  | MinuteScheduleData
  | DayScheduleData
  | WeekScheduleData
  | PeriodicScheduleData
  ;


export { AlwaysSchedule } from "./AlwaysSchedule";
export { MinuteSchedule } from "./MinuteSchedule";
export { DaySchedule } from "./DaySchedule";
export { WeekSchedule } from "./WeekSchedule";
export { PeriodicSchedule } from "./PeriodicSchedule";
