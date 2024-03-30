import { assert } from "@bouncer/utils";
import { type ISchedule } from "./types";
import { type IPageMetrics, PageAccess, type PageAction, PageActionType } from "@bouncer/page";
import { PeriodicInterval, type PeriodType, type PeriodicIntervalData } from "@bouncer/period";


/**
 * Reperesents a schedule that repeats on a specified period.
 */
export class PeriodicSchedule implements ISchedule {
  constructor(
    private readonly intervals: PeriodicInterval[],
  ) {
    this.checkRep();
  }

  /**
   * Convert an object to this type of schedule.
   * 
   * @param obj object data representing schedule
   * @returns schedule
   */
  static fromObject(obj: PeriodicScheduleData): PeriodicSchedule {
    assert(obj.type === "PeriodicSchedule", `cannot make PeriodicSchedule from data with type ${obj.type}`);
    return new PeriodicSchedule(
      obj.data.intervals.map(i => PeriodicInterval.fromObject(i)),
    );
  }

  private checkRep() {
    assert(this.intervals.length > 0, `intervals must be non-empty`);
    let period: PeriodType | undefined = undefined;
    for (const interval of this.intervals) {
      if (period === undefined) {
        period = interval.period;
      } else {
        assert(interval.period === period,
          `all intervals must have the same period`);
      }
      for (const [i, a] of this.intervals.entries()) {
        for (const b of this.intervals.slice(i + 1)) {
          assert(!a.overlaps(b),
            `intervals cannot overlap (found overlap with ${a}, ${b})`);
        }
      }
    }
  }

  contains = (time: Date): boolean =>
    this.intervals.some(i => i.contains(time));

  actions(from: Date, to: Date, page: IPageMetrics): PageAction[] {
    const starts = this.intervals
      .map(i => i.start.prev(to))
      .filter(d => d > from)
      .sort();
    const ends = this.intervals
      .map(i => i.end.prev(to))
      .filter(d => d > from)
      .sort();
    
    const latestStart = (starts.length > 0)
      ? starts[starts.length - 1]
      : null;
    const latestEnd = (ends.length > 0)
      ? ends[ends.length - 1]
      : null;
      
    const actions = [];
    if (latestStart !== null && latestEnd !== null) {
      if (page.access() === PageAccess.ALLOWED) {
        // no unblock required, so only a RESET_METRICS event
        const actionTime = new Date(Math.max(latestStart.getTime(), latestEnd.getTime()));
        actions.push({ type: PageActionType.RESET_METRICS, time: actionTime });
      } else {
        actions.push({ type: PageActionType.UNBLOCK, time: latestEnd })
        // UNBLOCK basically performs a RESET_METRICS, so only do another RESET
        // if it comes after the unblock
        if (latestStart >= latestEnd) {
          actions.push({ type: PageActionType.RESET_METRICS, time: latestStart });
        }
      }
    } else if (latestStart !== null && page.access() === PageAccess.ALLOWED) {
      actions.push({ type: PageActionType.RESET_METRICS, time: latestStart });
    } else if (latestEnd !== null) {
      const actionType = (page.access() === PageAccess.ALLOWED) ? PageActionType.RESET_METRICS : PageActionType.UNBLOCK;
      actions.push({ type: actionType, time: latestEnd });
    }
    return actions;
  }

  nextStart(time: Date): Date | undefined {
    const starts = this.intervals
      .map(i => i.start.next(time))
      .sort();
    return starts[0];
  }
  
  toObject(): PeriodicScheduleData {
    return {
      type: "PeriodicSchedule",
      data: {
        intervals: this.intervals.map(i => i.toObject()),
      }
    }
  }
}

export type PeriodicScheduleData = {
  type: "PeriodicSchedule",
  data: {
    intervals: PeriodicIntervalData[],
  }
}
