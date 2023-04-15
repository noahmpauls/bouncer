import { ISchedule } from ".";
import { assert } from "@bouncer/utils";
import { IPageMetrics, PageAccess, PageAction, PageActionType } from "@bouncer/page";


/**
 * Represents a schedule that repeats every minute, in which a contiguous range
 * of seconds is included in the schedule.
 * 
 * The schedule can include any range of seconds that lasts a minute or less.
 * The range is defined by a start second and an end second. For example, a
 * schedule defined by `{ start: 15, end: 45 }` includes a 30-second window of
 * time every minute, starting at the minute's 15th second and ending at its
 * 45th second. Likewise, a schedule defined by `{ start: 58, end: 0 }` starts
 * on the 58th second of one minute, and ends at the start of the next minute.
 * In this way, ranges can straddle two different clock minutes.
 * 
 * The range is inclusive of the start second and exclusive of the end second;
 * that is, if a schedule has `{ start: 30, end: 35 }`, the schedule contains
 * the 30th second, but not the 35th second.
 * 
 * A range can start and end on the same second, such as `{ start: 0, end: 0 }`.
 * In this case, the range covers a full 60 seconds and contains all times.
 */
export class MinuteSchedule implements ISchedule {
  private readonly startSecond: number;
  private readonly endSecond: number;

  /**
   * @param startSecond second of each minute where the schedule starts
   * @param endSecond second of each minute where the schedule ends
   */
  constructor(startSecond: number, endSecond: number) {
    assert(startSecond >= 0 && startSecond < 60, `startSecond must be in range [0, 60) (was ${startSecond})`)
    assert(endSecond >= 0 && endSecond < 60, `endSecond must be in range [0, 60) (was ${endSecond})`)
    this.startSecond = startSecond;
    this.endSecond = endSecond;
  }

  /**
   * Convert an object to this type of schedule.
   * 
   * @param obj object data representing schedule
   * @returns schedule
   */
  static fromObject(obj: MinuteScheduleData): MinuteSchedule {
    assert(obj.type === "MinuteSchedule", `cannot make MinuteSchedule from data with type ${obj.type}`);
    return new MinuteSchedule(
      obj.data.startSecond,
      obj.data.endSecond,
    );
  }

  contains(time: Date): boolean {
    const sec = time.getSeconds();
    if (this.startSecond < this.endSecond) {
      return sec >= this.startSecond && sec < this.endSecond;
    } else {
      return sec >= this.startSecond || sec < this.endSecond;
    }
  }

  actions(from: Date, to: Date, page: IPageMetrics): PageAction[] {
    // convert startSec and endSec to concrete times
    const start = this.nearestDateBetween(this.startSecond, from, to);
    const end = this.nearestDateBetween(this.endSecond, from, to);
    // convert start and end times to actions based on page state
    const actions = [];
    if (start !== null && end !== null) {
      if (page.access() === PageAccess.ALLOWED) {
        const actionTime = new Date(Math.max(start.getTime(), end.getTime()));
        actions.push({ type: PageActionType.RESET_METRICS, time: actionTime });
      } else {
        actions.push({ type: PageActionType.UNBLOCK, time: end })
        if (start >= end) {
          actions.push({ type: PageActionType.RESET_METRICS, time: start });
        }
      }
    } else if (start !== null && page.access() === PageAccess.ALLOWED) {
      actions.push({ type: PageActionType.RESET_METRICS, time: start });
    } else if (end !== null) {
      const actionType = (page.access() === PageAccess.ALLOWED) ? PageActionType.RESET_METRICS : PageActionType.UNBLOCK;
      actions.push({ type: actionType, time: end });
    }
    return actions;
  }

  private nearestDateBetween(seconds: number, min: Date, max: Date): Date | null {
    assert(seconds >= 0 && seconds < 60, `seconds must be in range [0, 60) (was ${seconds})`);

    let nearest = new Date(max.getTime());
    nearest.setSeconds(seconds);
    if (max < nearest) {
      nearest = new Date(nearest.getTime() - 60_000);
    }
    return (nearest > min)
      ? nearest
      : null;
  }

  toObject(): MinuteScheduleData {
    return {
      type: "MinuteSchedule",
      data: {
        startSecond: this.startSecond,
        endSecond: this.endSecond
      }
    }
  }
}

export type MinuteScheduleData = {
  type: "MinuteSchedule",
  data: {
    startSecond: number,
    endSecond: number,
  }
}