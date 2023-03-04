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
  type: ScheduleType;


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
  toObject(): any;
}


/**
 * Deserialize a schedule from an object.
 * 
 * @param data object data representing schedule
 * @returns deserialized schedule
 */
export function deserializeSchedule(data: any): ISchedule {
  switch (data.type as ScheduleType) {
    case "AlwaysSchedule":
      return AlwaysSchedule.fromObject(data);
    default:
      throw new Error(`invalid schedule type ${data.type} cannot be deserialized`);
  }
}


/**
 * Serialize a schedule to an object representation.
 * 
 * @param schedule the schedule to serialize
 * @returns serialized schedule object
 */
export function serializeSchedule(schedule: ISchedule): any {
  return schedule.toObject();
}


/**
 * Discriminator type for each kind of schedule.
 */
type ScheduleType =
  "AlwaysSchedule";


/**
 * Represents a schedule containing all times.
 */
export class AlwaysSchedule implements ISchedule {
  readonly type: ScheduleType = "AlwaysSchedule";


  constructor() { }


  /**
   * Convert an object to this type of schedule.
   * 
   * @param data object data representing schedule
   * @returns schedule
   */
  static fromObject(data: any): AlwaysSchedule {
    throw new Error("Method not implemented.");
  }

  
  contains(time: Date): boolean { return true; }
  

  toObject(): any {
    
  }  
}
