import { assert } from "../../assert";
import { IPage, PageReset } from "@bouncer/page";
import { ILimit, LimitAction } from ".";

/**
 * Represents a limit that provides an allotment of viewtime, followed by a
 * block lasting for at least the duration of a specified cooldown period.
 */
export class ViewtimeCooldownLimit implements ILimit {
  
  private readonly msViewtime: number;
  private readonly msCooldown: number;
  
  /**
   * @param msViewtime allotted viewtime, in ms
   * @param msCooldown cooldown period, in ms
   */
  constructor(msViewtime: number, msCooldown: number) {
    this.msViewtime = msViewtime;
    this.msCooldown = msCooldown;
    this.checkRep();
  }
  
  private checkRep(): void {
    assert(this.msViewtime > 0, `msViewtime must be > 0 (was ${this.msViewtime})`);
    assert(this.msCooldown > 0, `msCooldown must be > 0 (was ${this.msCooldown})`);
  }


  /**
   * Convert an object to this type of limit.
   * 
   * @param obj object data representing limit
   * @returns limit
   */
  static fromObject(obj: ViewtimeCooldownData): ViewtimeCooldownLimit {
    const expectedType = "ViewtimeCooldown";

    assert(obj.type === expectedType, `cannot make ${expectedType} from data with type ${obj.type}`);
    return new ViewtimeCooldownLimit(
      obj.data.msViewtime,
      obj.data.msCooldown,
    );
  }


  action(time: Date, page: IPage): LimitAction {
    const msSinceBlock = page.msSinceBlock(time);
    if (msSinceBlock !== null && msSinceBlock >= this.msCooldown) {
      return { action: "UNBLOCK" };
    }
    const viewtime = page.msViewtime(time);
    if (viewtime >= this.msViewtime) {
      const timeOverAllotted = viewtime - this.msViewtime;
      const blockTimeOffset = (page.msSinceHide(time) ?? 0) + timeOverAllotted;
      const blockTime = new Date(time.getTime() - blockTimeOffset);
      // cooldown not elapsed
      if (time.getTime() - blockTime.getTime() < this.msCooldown) {
        return { action: "BLOCK", time: blockTime };
      // cooldown complete, reset triggered at end of cooldown
      } else {
        const resetTime = new Date(blockTime.getTime() + this.msCooldown);
        return {
          action: "RESET",
          resets: [{ type: PageReset.VIEWTIME, time: resetTime }]
        };
      }
    }
    return { action: "NONE" };
  }

  
  remainingViewtime(time: Date, page: IPage): number {
    if (page.msSinceBlock(time) === null) {
      const remaining = Math.max(0, this.msViewtime - page.msViewtime(time));
      return remaining;
    } else {
      return 0;
    }
  }
  

  remainingWindow(time: Date, page: IPage): number {
    return Infinity;
  }
  

  toObject(): ViewtimeCooldownData {
    return { 
      type: "ViewtimeCooldown",
      data: {
        msViewtime: this.msViewtime,
        msCooldown: this.msCooldown,
      }
    };
  }
}

export type ViewtimeCooldownData = {
  type: "ViewtimeCooldown",
  data: {
    msViewtime: number,
    msCooldown: number,
  }
}
