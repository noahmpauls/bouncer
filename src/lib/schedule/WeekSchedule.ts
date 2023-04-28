import { type IPageMetrics, PageAccess, type PageAction, PageActionType } from "@bouncer/page";
import { type ISchedule } from "./types";
import { assert } from "@bouncer/utils";


type Interval = { start: number, end: number }
const WEEK_MS: number = 7 * 24 * 60 * 60 * 1000;


/**
 * Represents a schedule that repeats every week.
 */
export class WeekSchedule implements ISchedule {
  
  // intervals are windows of time delineated in milliseconds, inclusive of
  // start time and exclusive of end time
  private readonly intervals: Interval[];
  
  /**
   * @param intervals a non-empty array of non-overlapping intervals of time,
   *  where `start` and `end` are millisecond offsets into an arbitrary week
   */
  constructor(intervals: Interval[]) {
    this.validateIntervals(intervals);
    this.intervals = intervals;
  }

  /**
   * Convert an object to this type of schedule.
   * 
   * @param obj object data representing schedule
   * @returns schedule
   */
  static fromObject(obj: WeekScheduleData): WeekSchedule {
    assert(obj.type === "WeekSchedule", `cannot make WeekSchedule from data with type ${obj.type}`);
    return new WeekSchedule(
      obj.data.intervals
    );
  }

  private validateIntervals(intervals: Interval[]) {
    assert(intervals.length > 0, `intervals must be non-empty`);
    for (const { start, end } of intervals) {
      assert(start >= 0 && start < WEEK_MS && end >= 0 && end < WEEK_MS,
        `interval bounds must be in range [0, ${WEEK_MS}]`);
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
      end: (b.end > b.start) ? b.end : b.end + WEEK_MS
    };

    // to account for the potential shift of the unwrap, test a shifted interval
    // in addition to the original
    const aNext = { start: a.start + WEEK_MS, end: a.end + WEEK_MS };
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
    const msOfWeek = time.getTime() - this.startOfWeek(time).getTime();
    for (const { start, end } of this.intervals) {
      const contains = 
        (start < end && (msOfWeek >= start && msOfWeek < end)) || 
        (start >= end && (msOfWeek >= start || msOfWeek < end));
      if (contains) {
        return true
      }
    }
    return false;
  }

  /**
   * Gets the start of the week containing the given time. The start of a week
   * is midnight on Sunday.
   * 
   * @param time time to adjust
   * @returns the start of the week containing `time`
   */
  private startOfWeek(time: Date): Date {
    const adjusted = new Date(time.getTime());
    const dayDiff = time.getDate() - time.getDay();
    adjusted.setDate(dayDiff);
    adjusted.setHours(0, 0, 0, 0);
    return adjusted;
  }

  actions(from: Date, to: Date, page: IPageMetrics): PageAction[] {
    const starts = this.intervals
      .map(({ start }) => this.nearestDateOfWeekBetween(start, from , to))
      .filter(this.isNotNull)
      .sort();
    const ends = this.intervals
      .map(({ end }) => this.nearestDateOfWeekBetween(end, from, to))
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
        const actionTime = new Date(Math.max(latestStart.getTime(), latestEnd.getTime()));
        actions.push({ type: PageActionType.RESET_METRICS, time: actionTime });
      } else {
        actions.push({ type: PageActionType.UNBLOCK, time: latestEnd })
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
   * Find the most recent date that satisfies the following conditions:
   *  1. the date falls into the range (min, max]
   *  2. the milliseconds elapsed since that date's week start (midnight Sunday)
   *     is equal to `msOfWeek`
   * 
   * @param msOfWeek millisecond offset into an arbitrary week
   * @param min minimum time allowed
   * @param max maximum time allowed
   * @returns the most recent date that is within (min, max] and has the given
   *  offset into the week, or null if no such date exists
   */
  private nearestDateOfWeekBetween(msOfWeek: number, min: Date, max: Date): Date | null {
    assert(msOfWeek >= 0 && msOfWeek < WEEK_MS, `msOfWeek must be in range [0, ${WEEK_MS}) (was ${msOfWeek})`);

    let startOfWeek = this.startOfWeek(max);
    let nearest = new Date(startOfWeek.getTime() + msOfWeek);
    if (nearest > max) {
      nearest = new Date(nearest.getTime() - WEEK_MS);
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
    const startOfWeek = this.startOfWeek(time);
    const intervalStart = new Date(startOfWeek.getTime() + start);
    if (time > intervalStart) {
      return new Date(intervalStart.getTime() + WEEK_MS);
    } else {
      return intervalStart;
    }
  }

  toObject(): WeekScheduleData {
    return {
      type: "WeekSchedule",
      data: {
        intervals: this.intervals,
      }
    }
  }
}

export type WeekScheduleData = {
  type: "WeekSchedule",
  data: {
    intervals: Interval[]
  }
}
