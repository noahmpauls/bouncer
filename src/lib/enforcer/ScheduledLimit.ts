import { type ILimit, type LimitData, deserializeLimit, serializeLimit } from "@bouncer/limit";
import { type IPage, PageAccess } from "@bouncer/page";
import { type ISchedule, type ScheduleData, deserializeSchedule, serializeSchedule } from "@bouncer/schedule";
import { assert } from "@bouncer/utils";
import type { IEnforcer } from "./types";

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
    // apply schedule actions
    // TODO: shouldn't use last page update time to define this range...
    const msSinceUpdate = page.msSinceUpdate(time);
    if (msSinceUpdate !== undefined) {
      const lastUpdateTime = new Date(time.getTime() - msSinceUpdate);
      const scheduleActions = this.schedule.actions(lastUpdateTime, time, page).sort((a1, a2) => a1.time.getTime() - a2.time.getTime());
      for (const action of scheduleActions) {
        page.recordAction(action.type, action.time);
      }
    }
    // apply limit actions
    if (this.schedule.contains(time)) {
      const pageAccess = page.access();
      const actions = this.limit.actions(time, page).sort((a1, a2) => a1.time.getTime() - a2.time.getTime());
      for (const action of actions) {
        page.recordAction(action.type, action.time);
      }
    }
  }
  
  nextViewEvent(time: Date, page: IPage): Date | undefined {
    const scheduleActive = this.schedule.contains(time);
    if (!scheduleActive || !page.isShowing()) {
      return undefined;
    }
    const remainingViewtime = this.limit.remainingViewtime(time, page);
    return remainingViewtime === Number.POSITIVE_INFINITY
      ? undefined
      : new Date(time.getTime() + remainingViewtime);
  }
  
  nextTimelineEvent(time: Date, page: IPage): Date | undefined {
    const scheduleActive = this.schedule.contains(time);
    const nextStart = this.schedule.nextStart(time);
    if (!scheduleActive) {
      return nextStart;
    }
    const remainingWindow = this.limit.remainingWindow(time, page);
    const nextWindowEvent = remainingWindow === Number.POSITIVE_INFINITY
      ? undefined
      : new Date(time.getTime() + remainingWindow);
    // TODO: this makes me cringe...
    if (nextStart !== undefined && nextWindowEvent !== undefined) {
      return new Date(Math.min(nextStart.getTime(), nextWindowEvent.getTime()));
    }
    if (nextStart !== undefined) {
      return nextStart;
    }
    if (nextWindowEvent !== undefined) {
      return nextWindowEvent;
    }
    return undefined;
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
