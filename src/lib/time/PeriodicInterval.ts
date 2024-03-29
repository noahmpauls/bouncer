import { PartialTime, type PartialTimeData } from "./PartialTime";
import { Period } from "./Period";
import type { IPeriod, PeriodType } from "./types";

/**
 * Represents a repeating interval of time.
 */
export class PeriodicInterval {
  /** Start of the interval (inclusive) */
  public readonly start: PartialTime;
  /** End of the interval (exclusive) */
  public readonly end: PartialTime;
  private readonly period: IPeriod;

  /**
   * 
   * @param type Period of the interval.
   * @param start interval start time, inclusive
   * @param end interval end time, exclusive
   */
  constructor(
    public readonly type: PeriodType,
    start: PartialTime,
    end: PartialTime,
  ) {
    this.start = start.normalized(this.type);
    this.end = end.normalized(this.type);
    this.period = Period.from(this.type)
  }

  /**
   * Deserialize data representation.
   * 
   * @param obj serialized data representation
   * @returns deserialized instance
   */
  static fromObject = (obj: PeriodicIntervalData): PeriodicInterval =>
    new PeriodicInterval(
      obj.type,
      new PartialTime(obj.start),
      new PartialTime(obj.end),
    )

  /**
   * Determine whether two intervals of the same type overlap.
   * 
   * @param other interval to test; must be of the same type
   * @returns whether the intervals overlap
   */
  overlaps = (other: PeriodicInterval): boolean => {
    if (this.type !== other.type) {
      throw new Error(`cannot compare intervals of different periods (got ${this.type} and ${other.type})`);
    }

    const unwrappedMs = {
      start: this.start.offset(),
      end: this.end.offset(),
    };

    if (unwrappedMs.start >= unwrappedMs.end) {
      unwrappedMs.end += this.period.length;
    }

    const otherMs = {
      start: other.start.offset(),
      end: other.end.offset(),
    };

    const otherShiftedMs = {
      start: otherMs.start + this.period.length,
      end: otherMs.end + this.period.length,
    };

    for (const interval of [otherMs, otherShiftedMs]) {
      const overlapping =
        (interval.start >= unwrappedMs.start && interval.start < unwrappedMs.end) ||
        (interval.end > unwrappedMs.start && interval.end <= unwrappedMs.end);
      if (overlapping) {
        return true;
      }
    }
    return false;
  }

  /**
   * Determine whether the interval contains the given time.
   * 
   * @param time
   * @returns whether the interval contains the given time
   */
  contains = (time: Date): boolean => {
    const periodOffset = time.getTime() - this.period.start(time).getTime();
    const [start, end] = [this.start.offset(), this.end.offset()];

    if (start < end) {
      return periodOffset >= start && periodOffset < end;
    } else {
      return periodOffset >= start || periodOffset < end;
    }
  }

  /**
   * Find the concrete start time of the next period after the given time.
   * 
   * @param time
   * @returns the start of the next period after the given time
   */
  nextStart = (time: Date): Date => {
    const periodStart = this.period.start(time);
    const intervalStart = new Date(periodStart.getTime() + this.start.offset());
    if (time > intervalStart) {
      return new Date(intervalStart.getTime() + this.period.length);
    } else {
      return intervalStart;
    }
  }

  /**
   * Find the most recent concrete period start time prior to the given time.
   * The start time can correspond to a period that the given time is contained
   * by.
   * 
   * @param time
   * @returns the most recent concrete period start time before the given time
   */
  lastStart = (time: Date): Date =>
    this.latest(time, this.start);

  /**
   * Find the most recent concrete period end time prior to the given time.
   * 
   * @param time
   * @returns the most recent concrete period end time before the given time
   */
  lastEnd = (time: Date): Date =>
    this.latest(time, this.end);

  /**
   * @param time maximum allowed concrete time (inclusive)
   * @param moment moment to convert to concrete instance
   * @returns the most recent concrete instance of the given moment
   */
  latest = (time: Date, moment: PartialTime): Date => {
    let periodStart = this.period.start(time);
    let nearest = new Date(periodStart.getTime() + moment.offset());
    if (nearest > time) {
      // TODO: potential daylight savings bug in this conversion?
      return new Date(nearest.getTime() - this.period.length);
    } else {
      return nearest;
    }
  }

  /**
   * @returns serialized data representation
   */
  toObject = (): PeriodicIntervalData => ({
    type: this.type,
    start: this.start.toObject(),
    end: this.end.toObject(),
  });
}

export type PeriodicIntervalData = {
  type: PeriodType,
  start: PartialTimeData,
  end: PartialTimeData,
}
