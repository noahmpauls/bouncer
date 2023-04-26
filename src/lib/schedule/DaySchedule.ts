import { IPageMetrics, PageAccess, PageAction, PageActionType } from "@bouncer/page";
import { ISchedule } from ".";
import { assert } from "@bouncer/utils";


type Interval = { start: number, end: number }
const DAY_MS: number = 24 * 60 * 60 * 1000;


/**
 * Represents a schedule that repeats every day.
 */
export class DaySchedule implements ISchedule {
  
  // intervals are windows of time delineated in milliseconds, inclusive of
  // start time and exclusive of end time
  private readonly intervals: Interval[];
  
  /**
   * @param intervals a non-empty array of non-overlapping intervals of time,
   *  where `start` and `end` are millisecond offsets into an arbitrary day
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
  static fromObject(obj: DayScheduleData): DaySchedule {
    assert(obj.type === "DaySchedule", `cannot make DaySchedule from data with type ${obj.type}`);
    return new DaySchedule(
      obj.data.intervals
    );
  }

  private validateIntervals(intervals: Interval[]) {
    assert(intervals.length > 0, `intervals must be non-empty`);
    for (const { start, end } of intervals) {
      assert(start >= 0 && start < DAY_MS && end >= 0 && end < DAY_MS,
        `interval bounds must be in range [0, ${DAY_MS}]`);
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
      end: (b.end > b.start) ? b.end : b.end + DAY_MS
    };

    // to account for the potential shift of the unwrap, test a shifted interval
    // in addition to the original
    const aNext = { start: a.start + DAY_MS, end: a.end + DAY_MS };
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
    const msOfDay = time.getTime() - this.startOfDay(time).getTime();
    for (const { start, end } of this.intervals) {
      const contains = 
        (start < end && (msOfDay >= start && msOfDay < end)) || 
        (start >= end && (msOfDay >= start || msOfDay < end));
      if (contains) {
        return true
      }
    }
    return false;
  }

  /**
   * Gets the start of the day containing the given time. The start of a day
   * is midnight.
   * 
   * @param time time to adjust
   * @returns the start of the day containing `time`
   */
  private startOfDay(time: Date): Date {
    const adjusted = new Date(time.getTime());
    adjusted.setHours(0, 0, 0, 0);
    return adjusted;
  }

  actions(from: Date, to: Date, page: IPageMetrics): PageAction[] {
    const starts = this.intervals
      .map(({ start }) => this.nearestDateOfDayBetween(start, from , to))
      .filter(this.isNotNull)
      .sort();
    const ends = this.intervals
      .map(({ end }) => this.nearestDateOfDayBetween(end, from, to))
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
   *  2. the milliseconds elapsed since that date's day start is equal to
   *     `msOfDay`
   * 
   * @param msOfDay millisecond offset into an arbitrary day
   * @param min minimum time allowed
   * @param max maximum time allowed
   * @returns the most recent date that is within (min, max] and has the given
   *  offset into the day, or null if no such date exists
   */
  private nearestDateOfDayBetween(msOfDay: number, min: Date, max: Date): Date | null {
    assert(msOfDay >= 0 && msOfDay < DAY_MS, `msOfDay must be in range [0, ${DAY_MS}) (was ${msOfDay})`);

    let startOfDay = this.startOfDay(max);
    let nearest = new Date(startOfDay.getTime() + msOfDay);
    if (nearest > max) {
      nearest = new Date(nearest.getTime() - DAY_MS);
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
    const startOfDay = this.startOfDay(time);
    const intervalStart = new Date(startOfDay.getTime() + start);
    if (time > intervalStart) {
      return new Date(intervalStart.getTime() + DAY_MS);
    } else {
      return intervalStart;
    }
  }

  toObject(): DayScheduleData {
    return {
      type: "DaySchedule",
      data: {
        intervals: this.intervals,
      }
    }
  }
}

export type DayScheduleData = {
  type: "DaySchedule",
  data: {
    intervals: Interval[]
  }
}
