import { AlwaysSchedule, AlwaysScheduleData } from "./AlwaysSchedule";

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
  AlwaysScheduleData;


export { AlwaysSchedule } from "./AlwaysSchedule";
