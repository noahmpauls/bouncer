import { assert } from "./assert";

/**
 * Represents a specified subset of all times.
 * 
 * TODO: include an understanding of boundaries? Can't currently enable
 * resets.
 */
export interface ISchedule {
  /**
   * Type discriminator indicating the type of schedule.
   */
  type: string;


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


/**
 * Represents a schedule containing all times.
 */
export class AlwaysSchedule implements ISchedule {
  readonly type = "AlwaysSchedule";


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
    return { type: this.type };
  }  
}

type AlwaysScheduleData = {
  type: "AlwaysSchedule"
}
