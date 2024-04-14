import { AlwaysSchedule } from "./AlwaysSchedule";
import { PeriodicSchedule } from "./PeriodicSchedule";
import type { ISchedule, ScheduleData } from "./types";

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


export * from "./types";
export { AlwaysSchedule } from "./AlwaysSchedule";
export { PeriodicSchedule } from "./PeriodicSchedule";
