import { ILimit, deserializeLimit, serializeLimit, LimitData } from "@bouncer/limit";
import { IPage, PageAccess } from "@bouncer/page";
import { ISchedule, deserializeSchedule, serializeSchedule, ScheduleData } from "@bouncer/schedule";
import { assert } from "@bouncer/utils";
import { IEnforcer } from ".";

/**
 * Represents a browsing limit that applies on a schedule.
 * 
 * A `ScheduledLimit` has two main parts:
 * - `schedule`: determines when this enforcer applies. The conditions of the
 *   enforcer only apply when the current time is within the schedule;
 *   otherwise, the enforcer doesn't apply.
 * - `limit`: determines how the enforcer applies during the schedule.
 */
export class ScheduledLimit implements IEnforcer {

  private readonly schedule: ISchedule;
  private readonly limit: ILimit;

  /**
   * @param schedule the schedule during which the limit applies
   * @param limit the limit to apply
   */
  constructor(schedule: ISchedule, limit: ILimit) {
    this.schedule = schedule;
    this.limit = limit;
  }

  /**
   * Convert an object to this type of enforcer.
   * 
   * @param obj object data representing enforcer
   * @returns enforcer
   */
  static fromObject(obj: ScheduledLimitData): ScheduledLimit {
    assert(obj.type === "ScheduledLimit", `cannot make ScheduledLimit from data with type ${obj.type}`);
    return new ScheduledLimit(
      deserializeSchedule(obj.data.schedule),
      deserializeLimit(obj.data.limit)
    );
  }
  
  applyTo(time: Date, page: IPage): void {
    if (this.schedule.contains(time)) {
      const pageAccess = page.access();
      const action = this.limit.action(time, page);
      console.log(`enforcer: got action ${action.action}`)
      if (action.action === "RESET") {
        for (const reset of action.resets) {
          page.recordReset(reset.type, reset.time);
        }
      } else if (action.action === "BLOCK" && pageAccess === PageAccess.ALLOWED) {
        page.block(action.time);
      } else if (action.action === "UNBLOCK" && pageAccess === PageAccess.BLOCKED) {
        page.unblock();
      }
    } else if (page.access() === PageAccess.BLOCKED) {
      page.unblock();
    }
  }
  
  remainingViewtime(time: Date, page: IPage): number {
    return this.limit.remainingViewtime(time, page);
  }
  
  remainingWindow(time: Date, page: IPage): number {
    return this.limit.remainingWindow(time, page);
  }
  
  toObject(): ScheduledLimitData {
    return {
      type: "ScheduledLimit",
      data: {
        schedule: serializeSchedule(this.schedule),
        limit: serializeLimit(this.limit)
      }
    };
  }
}

export type ScheduledLimitData = {
  type: "ScheduledLimit",
  data: {
    schedule: ScheduleData,
    limit: LimitData,
  }
}
