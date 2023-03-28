import { assert } from "./assert";
import { deserializeLimit, ILimit, LimitData, serializeLimit } from "@bouncer/limit";
import { IPage, PageAccess } from "@bouncer/page";
import { deserializeSchedule, ISchedule, ScheduleData, serializeSchedule } from "./lib/schedule";


/**
 * Represents an enforcer that limits allowed browsing behavior for a page.
 */
export interface IEnforcer {
  /**
   * Apply an enforcer to a page, potentially mutating the page.
   * 
   * @param time time to apply the enforcer at
   * @param page the page to apply the enforcer to
   */
  applyTo(time: Date, page: IPage): void;

  /**
   * Get the amount of viewtime remaining until the next viewtime-based block.
   * 
   * @param time the current time
   * @param page page to be blocked
   * @returns amount of viewtime until the page is blocked, in ms
   */
  remainingViewtime(time: Date, page: IPage): number;

  /**
   * 
   * @param time the current time
   * @param page page to be blocked
   * @returns remaining time in window until the page is blocked, in ms
   */
  remainingWindow(time: Date, page: IPage): number;

  /**
   * Convert enforcer to an object representation. The representation must
   * include a field "type" that indicates the type of enforcer represented.
   * 
   * @returns object representing enforcer
   */
  toObject(): EnforcerData;
}


/**
 * Deserialize an enforcer from an object.
 * 
 * @param obj object data representing enforcer
 * @returns deserialized enforcer
 */
export function deserializeEnforcer(obj: EnforcerData): IEnforcer {
  switch (obj.type) {
    case "ScheduledLimit":
      return ScheduledLimit.fromObject(obj);
    default:
      throw new Error(`invalid enforcer type ${(obj as any).type} cannot be deserialized`);
  }
}


/**
 * Serialize an enforcer to an object representation.
 * 
 * @param enforcer the enforcer to serialize
 * @returns serialized enforcer object
 */
export function serializeEnforcer(enforcer: IEnforcer): EnforcerData {
  return enforcer.toObject();
}


/**
 * Union of all types that represent enforcers in their serialized form.
 */
export type EnforcerData =
  ScheduledLimitData;


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
      const pageAccess = page.checkAccess(time);
      const action = this.limit.action(time, page);
      console.log(`enforcer: got action ${action.action}`)
      if (action.action === "RESET") {
        for (const reset of action.resets) {
          page.recordReset(time, reset.type, reset.time);
        }
      } else if (action.action === "BLOCK" && pageAccess === PageAccess.ALLOWED) {
        page.block(action.time);
      } else if (action.action === "UNBLOCK" && pageAccess === PageAccess.BLOCKED) {
        page.unblock(time);
      }
    } else if (page.checkAccess(time) === PageAccess.BLOCKED) {
      page.unblock(time);
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

type ScheduledLimitData = {
  type: "ScheduledLimit",
  data: {
    schedule: ScheduleData,
    limit: LimitData,
  }
}
