/**
 * Valid period lengths.
 */
export type PeriodType =
  "week"
| "day"
| "hour"
| "minute"
;

/**
 * Represents a repeating period of time.
 */
export interface IPeriod {
  
  /** Type of period. */
  type: PeriodType;

  /** Length of the period. */
  length: number;

  /**
   * Find the exact start time of the period containing the given time.
   * 
   * @param time time contained by the desired period
   * @returns the start of the period
   */
  start: (time: Date) => Date;
}