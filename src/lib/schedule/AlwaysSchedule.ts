import { ISchedule } from ".";
import { assert } from "../../assert";

/**
 * Represents a schedule containing all times.
 */
export class AlwaysSchedule implements ISchedule {

  constructor() { }


  /**
   * Convert an object to this type of schedule.
   * 
   * @param obj object data representing schedule
   * @returns schedule
   */
  static fromObject(obj: AlwaysScheduleData): AlwaysSchedule {
    assert(obj.type === "AlwaysSchedule", `cannot make AlwaysSchedule from data with type ${obj.type}`);
    return new AlwaysSchedule();
  }


  contains(time: Date): boolean { return true; }


  toObject(): AlwaysScheduleData {
    return { type: "AlwaysSchedule" };
  }
}

export type AlwaysScheduleData = {
  type: "AlwaysSchedule"
}
