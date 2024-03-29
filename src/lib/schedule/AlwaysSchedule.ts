import { type IPageMetrics, type PageAction } from "@bouncer/page";
import { type ISchedule } from "./types";
import { assert } from "@bouncer/utils";

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
  

  actions(from: Date, to: Date, page: IPageMetrics): PageAction[] { return []; }


  contains(time: Date): boolean { return true; }
  

  nextStart(time: Date): Date | undefined { return undefined; }


  toObject(): AlwaysScheduleData {
    return { type: "AlwaysSchedule" };
  }
}

export type AlwaysScheduleData = {
  type: "AlwaysSchedule"
}
