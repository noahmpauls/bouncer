import { assert } from "@bouncer/utils";
import { ISchedule } from ".";
import { IPageMetrics, PageAccess, PageAction, PageActionType } from "@bouncer/page";

const SECOND_MS = 1000;
const MINUTE_MS = SECOND_MS * 60;
const HOUR_MS = MINUTE_MS * 60;
const DAY_MS = HOUR_MS * 24;
const WEEK_MS = DAY_MS * 7;

/** Period of the schedule. */
type Period = 
    "minute"
  | "hour"
  | "day"
  | "week"
  ;

function periodMs(period: Period): number {
  switch (period) {
    case "minute":
      return MINUTE_MS;
    case "hour":
      return HOUR_MS;
    case "day":
      return DAY_MS;
    case "week":
      return WEEK_MS;
  }
}

function periodStart(period: Period): (t: Date) => Date {
  switch (period) {
    case "minute":
      return minuteStart;
    case "hour":
      return hourStart;
    case "day":
      return dayStart;
    case "week":
      return weekStart;
  }
}

function minuteStart(time: Date): Date {
  const adjust = new Date(time.getTime());
  adjust.setSeconds(0, 0);
  return adjust;
}

function hourStart(time: Date): Date {
  const adjust = new Date(time.getTime());
  adjust.setMinutes(0, 0, 0);
  return adjust;
}

function dayStart(time: Date): Date {
  const adjust = new Date(time.getTime());
  adjust.setHours(0, 0, 0, 0);
  return adjust;
}

function weekStart(time: Date): Date {
  const adjust = new Date(time.getTime());
  const dayDiff = time.getDate() - time.getDay();
  adjust.setDate(dayDiff);
  adjust.setHours(0, 0, 0, 0);
  return adjust;
}

type Interval = { start: number, end: number }


/**
 * Reperesents a schedule that repeats on a specified period.
 */
export class PeriodicSchedule implements ISchedule {

  private readonly period: {
    type: Period,
    ms: number,
    start: (t: Date) => Date
  };
  private readonly intervals: Interval[];
  
  constructor(period: Period, intervals: Interval[]) {
    this.period = {
      type: period,
      ms: periodMs(period),
      start: periodStart(period)
    }
    this.validateIntervals(this.period.ms, intervals);
    this.intervals = intervals;
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
      obj.data.type,
      obj.data.intervals
    );
  }

  private validateIntervals(period: number, intervals: Interval[]) {
    assert(intervals.length > 0, `intervals must be non-empty`);
    for (const { start, end } of intervals) {
      assert(start >= 0 && start < period && end >= 0 && end < period,
        `interval bounds must be in range [0, ${period}]`);
      for (const [i, a] of intervals.entries()) {
        for (const b of intervals.slice(i + 1)) {
          assert(!this.overlaps(a, b),
            `intervals cannot overlap (found overlap with ${a}, ${b})`);
        }
      }
    }
  }

  private overlaps(a: Interval, b: Interval): boolean {
    // since intervals can wrap, correct to an "unwrapped" interval
    const unwrapped = {
      start: b.start,
      end: (b.end > b.start) ? b.end : b.end + this.period.ms
    };

    // to account for the potential shift of the unwrap, test a shifted interval
    // in addition to the original
    const aNext = { start: a.start + this.period.ms, end: a.end + this.period.ms };
    for (const { start, end} of [a, aNext]) {
      const overlapping = 
        (start >= unwrapped.start && start < unwrapped.end) ||
        (end > unwrapped.start && end <= unwrapped.end);
      if (overlapping) {
        return true;
      } 
    }
    
    return false;
  }
  
  contains(time: Date): boolean {
    const msOfPeriod = time.getTime() - this.period.start(time).getTime();
    for (const { start, end } of this.intervals) {
      const contains = 
        (start < end && (msOfPeriod >= start && msOfPeriod < end)) || 
        (start >= end && (msOfPeriod >= start || msOfPeriod < end));
      if (contains) {
        return true
      }
    }
    return false;
  }
  
  actions(from: Date, to: Date, page: IPageMetrics): PageAction[] {
    const starts = this.intervals
      .map(({ start }) => this.offsetToConcrete(start, from, to))
      .filter(this.isNotNull)
      .sort();
    const ends = this.intervals
      .map(({ end }) => this.offsetToConcrete(end, from, to))
      .filter(this.isNotNull)
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

  /**
   * Convert an offset into a period to the most recent concrete time within
   * the allowed range. Returns null if no such time exists.
   * 
   * @param periodOffset offset into period, in milliseconds
   * @param min minimum allowed concrete time, exclusive
   * @param max maximum allowed concrete time, inclusive
   * @returns the most recent concrete time corresponding to the given offset
   */
  private offsetToConcrete(periodOffset: number, min: Date, max: Date): Date | null {
    assert(periodOffset >= 0 && periodOffset < this.period.ms, `periodOffset must be in range [0, ${this.period.ms}) (was ${periodOffset})`);

    let periodStart = this.period.start(max);
    let nearest = new Date(periodStart.getTime() + periodOffset);
    if (nearest > max) {
      nearest = new Date(nearest.getTime() - this.period.ms);
    }
    return (nearest > min)
      ? nearest
      : null;
  }

  private isNotNull<T>(t: T | null): t is T {
    return t !== null;
  }
  
  nextStart(time: Date): Date | null {
    const starts = this.intervals
      .map(i => this.nextIntervalStart(time, i))
      .sort();
    return starts[0];
  }
  
  private nextIntervalStart(time: Date, interval: Interval): Date {
    const { start } = interval;
    const periodStart = this.period.start(time);
    const intervalStart = new Date(periodStart.getTime() + start);
    if (time > intervalStart) {
      return new Date(intervalStart.getTime() + this.period.ms);
    } else {
      return intervalStart;
    }
  }

  toObject(): PeriodicScheduleData {
    return {
      type: "PeriodicSchedule",
      data: {
        type: this.period.type,
        intervals: this.intervals,
      }
    }
  }
}

export type PeriodicScheduleData = {
  type: "PeriodicSchedule",
  data: {
    type: Period,
    intervals: Interval[],
  }
}
