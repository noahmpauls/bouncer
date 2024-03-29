import { assert } from "@bouncer/utils";
import { MS } from "./constants";
import type { PeriodType } from "./types";

/**
 * Given a dividend and divisor, get the quotient and remainder.
 * 
 * @param dividend
 * @param divisor
 * @returns [quotient, remainder]
 */
const divmod = (dividend: number, divisor: number): [number, number] =>
  [Math.floor(dividend / divisor), dividend % divisor];

/**
 * Represents a subset of date/time fields.
 * 
 * TODO: this ADT should probably be more tightly coupled with the Period
 * concept, as the whole idea of an "offset" doesn't really make sense without
 * knowing what we're offsetting from (i.e. the start of a Period)
 */
export class PartialTime {
  constructor(
    private readonly partialTime: PartialTimeData = {}
  ) {
    this.checkRep();
  }

  /**
   * Create a new PartialTime from a millisecond offset. The offset is the
   * number of milliseconds since the zero-time.
   *
   * @param ms milliseconds from zero time
   * @returns normalized PartialTime
   */
  static fromOffset = (ms: number): PartialTime => {
    const [day, dayRemainder] = divmod(ms, MS.DAY);
    const [hour, hourRemainder] = divmod(dayRemainder, MS.HOUR);
    const [minute, minuteRemainder] = divmod(hourRemainder, MS.MINUTE);
    const [second, millisecond] = divmod(minuteRemainder, MS.SECOND);
    return new PartialTime({ day, hour, minute, second, millisecond });
  }


  private checkRep = () => {
    assert(this.inRange(this.partialTime.day ?? 0, 0, 6),
      `invalid day value ${this.partialTime.day}`);
    assert(this.inRange(this.partialTime.hour ?? 0, 0, 23),
      `invalid hour value ${this.partialTime.hour}`);
    assert(this.inRange(this.partialTime.minute ?? 0, 0, 59),
      `invalid minute value ${this.partialTime.minute}`);
    assert(this.inRange(this.partialTime.second ?? 0, 0, 59),
      `invalid second value ${this.partialTime.second}`);
    assert(this.inRange(this.partialTime.millisecond ?? 0, 0, 999),
      `invalid millisecond value ${this.partialTime.millisecond}`);
  }

  private inRange = (test: number, min: number, max: number): boolean =>
    test >= min && test <= max;
  
  /**
   * Normalize a PartialTime to a given period, stripping away any parts of the
   * time that don't fit inside the period.
   * 
   * @param period
   * @returns PartialTime with fields larger than the period omitted
   */
  normalized = (period: PeriodType): PartialTime => {
    switch(period) {
      case "week":
        return this;
      case "day": {
        const { day: _a, ...data } = this.partialTime;
        return new PartialTime(data);
      }
      case "hour": {
        const { day: _a, hour: _b, ...data } = this.partialTime;
        return new PartialTime(data);
      }
      case "minute": {
        const { day: _a, hour: _b, minute: _c, ...data } = this.partialTime;
        return new PartialTime(data);
      }
    }
  }

  /**
   * Convert the time to a millisecond offset.
   * 
   * @returns offset from the zero time in milliseconds
   */
  offset = (): number =>
    ((this.partialTime.day ?? 0) * MS.DAY) +
    ((this.partialTime.hour ?? 0) * MS.HOUR) +
    ((this.partialTime.minute ?? 0) * MS.MINUTE) +
    ((this.partialTime.second ?? 0) * MS.SECOND) +
    (this.partialTime.millisecond ?? 0);
  
  /**
   * @returns serialized data representation
   */
  toObject = (): PartialTimeData => this.partialTime;
}

export type PartialTimeData = {
  day?: number,
  hour?: number,
  minute?: number,
  second?: number,
  millisecond?: number,
}