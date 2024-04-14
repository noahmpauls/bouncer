import { assert } from "@bouncer/utils";
import { Period } from "./Period";
import { PeriodicTime } from "./PeriodicTime";
import type { PeriodType } from "./types";

/**
 * Represents a repeating interval of time.
 */
export class PeriodicInterval {
  /**
   * @param start Start of the interval (inclusive).
   * @param end End of the interval (exclusive).
   */
  constructor(
    public readonly start: PeriodicTime,
    public readonly end: PeriodicTime,
  ) {
    this.checkRep();
  }

  private checkRep = () => {
    assert(this.start.period === this.end.period,
      `period of bounds must match; got [${this.start.period}, ${this.end.period})`)
  }

  /**
   * Deserialize data representation.
   * 
   * @param obj serialized data representation
   * @returns deserialized instance
   */
  static fromObject = (obj: PeriodicIntervalData): PeriodicInterval =>
    new PeriodicInterval(
      PeriodicTime.fromString(obj.start),
      PeriodicTime.fromString(obj.end),
    )
  
  /**
   * The period over which this interval repeats
   */
  get period(): PeriodType {
    return this.start.period;
  }

  /**
   * Determine whether two intervals of the same period overlap.
   * 
   * @param other interval to test; must be of the same period
   * @returns whether the intervals overlap
   */
  overlaps = (other: PeriodicInterval): boolean => {
    const p = Period(this.period);
    const unwrappedMs = {
      start: this.start.offset(),
      end: this.end.offset(),
    };

    if (unwrappedMs.start >= unwrappedMs.end) {
      unwrappedMs.end += p.ms
    }

    const otherMs = {
      start: other.start.offset(),
      end: other.end.offset(),
    };

    const otherShiftedMs = {
      start: otherMs.start + p.ms,
      end: otherMs.end + p.ms,
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
    const intervalStart = this.start.prev(time);
    const intervalEnd = this.end.next(time, false);
    return intervalEnd.getTime() - intervalStart.getTime() <= Period(this.period).ms;
  }

  /**
   * @returns serialized data representation
   */
  toObject = (): PeriodicIntervalData => ({
    start: this.start.toObject(),
    end: this.end.toObject(),
  });
}

export type PeriodicIntervalData = {
  start: string,
  end: string,
}
