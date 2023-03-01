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
}


/**
 * Represents a schedule containing all times.
 */
export class AlwaysSchedule implements ISchedule {

  constructor() { }
  
  contains(time: Date): boolean { return true; }
}
