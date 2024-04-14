import { MS } from "@bouncer/time";
import { assert } from "@bouncer/utils";
import { Period } from "./Period";
import type { PeriodType } from "./types";

type PeriodicTimeFields = {
  day: number,
  hour: number,
  minute: number,
  second: number,
}

/**
 * Represents a time that repeats over a fixed period. If a broken clock is
 * right twice a day, a PeriodicTime is right once per period.
 * 
 * This ADT supports periods of one week, one day, one hour, and one minute.
 */
export class PeriodicTime {

  constructor(
    private readonly time: Partial<PeriodicTimeFields>,
  ) {
    this.checkRep();
  }

  /**
   * Convert a periodic time string to a PeriodicTime.
   * 
   * A valid periodic time string is of the form:
   * 
   * - `${day} ${hour}:${minute}:${second}`
   * - `${hour}:${minute}:${second}`
   * - `${minute}:${second}`
   * - `${second}`
   * 
   * The following are valid periodic time strings:
   * 
   * - `Mon 23:56:12`
   * - `08:34:00`
   * - `00:00`
   * - `30`
   *
   * @param timeString a periodic time string
   * @returns PeriodicTime represented by the given string
   */
  static fromString = (timeString: string): PeriodicTime => {
    const fields = parse(timeString);
    return new PeriodicTime(fields);
  }

  private checkRep = () => {
    // at least one time field must be populated
    const fields: (keyof PeriodicTimeFields)[] = ["day", "hour", "minute", "second"];
    assert(Object.values(this.time).some(v => v !== undefined), "no time fields specified");

    const fieldBounds: { [Property in keyof PeriodicTimeFields]: [number, number] } = {
      day: [0, 59],
      hour: [0, 23],
      minute: [0, 59],
      second: [0, 59],
    };

    const largestFieldIndex = fields.findIndex(f => Object.keys(this.time).includes(f) && this.time[f] !== undefined);
    const populatedFields = fields.splice(largestFieldIndex);
    for (const field of populatedFields) {
      // all fields of granularity below the period must be populated
      assert(this.time[field] !== undefined, `field ${field} must be defined`);
      // all fields must be inbounds
      assert(this.inbounds(this.time[field], ...fieldBounds[field]),
        `invalid ${field} value ${this.time[field]}`);
    }
  }

  private inbounds = (test: number | undefined, min: number, max: number): boolean =>
    test !== undefined && test >= min && test <= max;
  
  /**
   * The period over which this time repeats.
   */
  get period(): PeriodType {
    const fields: (keyof PeriodicTimeFields)[] = ["day", "hour", "minute", "second"];
    const fieldToPeriod: { [Property in keyof PeriodicTimeFields]: PeriodType } = {
      day: "week",
      hour: "day",
      minute: "hour",
      second: "minute",
    }
    const largestField = fields.find(f => Object.keys(this.time).includes(f) && this.time[f] !== undefined);
    if (largestField === undefined) {
      throw new Error("must have a largest field");
    }
    return fieldToPeriod[largestField];
  }

  /**
   * Find the nearest concrete occurrence of this periodic time prior to the
   * given time.
   * 
   * @param time concrete time
   * @param inclusive whether the given time is considered a valid occurrence
   * @returns the value of the nearest concrete occurrence of this periodic
   *  time before the given time
   */
  prev = (time: Date, inclusive = true): Date => {
    const p = Period(this.period);
    const periodStart = p.start(time);
    const nextInPeriod = new Date(periodStart.getTime() + this.offset());
    const requiresShift = inclusive ? nextInPeriod > time : nextInPeriod >= time;
    if (requiresShift) {
      // TODO: potential daylight savings bug in this conversion?
      return new Date(nextInPeriod.getTime() - p.ms);
    }
    return nextInPeriod;
  }

  /**
   * Find the nearest concrete occurrence of this periodic time after the
   * given time.
   * 
   * @param time concrete time
   * @param inclusive whether the given time is considered a valid occurrence
   * @returns the value of the nearest concrete occurrence of this periodic
   *  time after the given time
   */
  next = (time: Date, inclusive = true): Date => {
    const p = Period(this.period);
    const periodStart = p.start(time);
    const nextInPeriod = new Date(periodStart.getTime() + this.offset());
    const requiresShift = inclusive ? nextInPeriod < time : nextInPeriod <= time;
    if (requiresShift) {
      // TODO: potential daylight savings bug in this conversion?
      return new Date(nextInPeriod.getTime() + p.ms);
    }
    return nextInPeriod;
  }
  
  /**
   * Convert the time to a millisecond offset.
   * 
   * @returns offset from the zero time in milliseconds
   */
  offset = (): number =>
    ((this.time.day ?? 0) * MS.DAY) +
    ((this.time.hour ?? 0) * MS.HOUR) +
    ((this.time.minute ?? 0) * MS.MINUTE) +
    ((this.time.second ?? 0) * MS.SECOND)
  
  /**
   * @returns serialized data representation
   */
  toObject = (): string => unparse(this.time);
}

// TODO: find a better way to organize all this...

function parse(time: string): Partial<PeriodicTimeFields> {
  return parseDayTime(time);
}

function parseDayTime(time: string) {
  const [day, ...rest] = time.split(" ");
  if (rest.length > 0) {
    return {
      day: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].indexOf(day.toUpperCase()),
      ...parseHourTime(rest[0]),
    };
  }

  return { ...parseHourTime(time) };
}

function parseHourTime(time: string) {
  const [hour, ...rest] = time.split(":");
  if (rest.length > 0) {
    return {
      hour: Number.parseInt(hour),
      ...parseMinuteTime(rest.join(":")),
    }
  }
  return { ...parseMinuteTime(time) };
}

function parseMinuteTime(time: string) {
  const [minute, ...rest] = time.split(":");
  if (rest.length > 0) {
    return {
      minute: Number.parseInt(minute),
      ...parseSecondTime(rest.join(":")),
    }
  }
  return { ...parseSecondTime(time) };
}

function parseSecondTime(time: string) {
  return {
    second: Number.parseInt(time),
  }
}

function unparse(time: Partial<PeriodicTimeFields>) {
  return unparseDayTime(time);
}

function unparseDayTime(time: Partial<PeriodicTimeFields>): string {
  if (time.day === undefined) {
    return unparseHourTime(time);
  }
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][time.day];
  return `${day} ${unparseHourTime(time)}`;
}

function unparseHourTime(time: Partial<PeriodicTimeFields>): string {
  if (time.hour === undefined) {
    return unparseMinuteTime(time);
  }
  const hour = String(time.hour).padStart(2, "0");
  return `${hour}:${unparseMinuteTime(time)}`
}

function unparseMinuteTime(time: Partial<PeriodicTimeFields>): string {
  if (time.minute === undefined) {
    return unparseSecondTime(time);
  }
  const minute = String(time.minute).padStart(2, "0");
  return `${minute}:${unparseSecondTime(time)}`
}

function unparseSecondTime(time: Partial<PeriodicTimeFields>): string {
  return String(time.second).padStart(2, "0");
}
