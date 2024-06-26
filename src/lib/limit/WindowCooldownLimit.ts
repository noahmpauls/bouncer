import { type IPageMetrics, type PageAction, PageActionType } from "@bouncer/page";
import { assert } from "@bouncer/utils";
import type { ILimit } from "./types";

/**
 * Represents a limit that allows viewing for a specified amount of time after
 * an initial visit, followed by a block lasting for at least the duration of a
 * specified cooldown period.
 */
export class WindowCooldownLimit implements ILimit {
  
  private readonly msWindow: number;
  private readonly msCooldown: number;

  /**
   * @param msWindow allotted window, in ms
   * @param msCooldown cooldown period, in ms
   */
  constructor(msWindow: number, msCooldown: number) {
    this.msWindow = msWindow;
    this.msCooldown = msCooldown;
    this.checkRep();
  }
  
  private checkRep(): void {
    assert(this.msWindow > 0, `msWindow must be > 0 (was ${this.msWindow})`);
    assert(this.msCooldown > 0, `msCooldown must be > 0 (was ${this.msCooldown})`);
  }
  
  /**
   * Convert an object to this type of limit.
   * 
   * @param obj object data representing limit
   * @returns limit
   */
  static fromObject(obj: WindowCooldownData): WindowCooldownLimit {
    const expectedType = "WindowCooldown";

    assert(obj.type === expectedType, `cannot make ${expectedType} from data with type ${obj.type}`);
    return new WindowCooldownLimit(
      obj.data.msWindow,
      obj.data.msCooldown,
    );
  }

  
  actions(time: Date, page: IPageMetrics): PageAction[] {
    const msSinceBlock = page.msSinceBlock(time);
    if (msSinceBlock !== undefined && msSinceBlock >= this.msCooldown) {
      return [{ type: PageActionType.UNBLOCK, time }];
    }
    const msSinceInitialVisit = page.msSinceInitialVisit(time) ?? 0;
    if (msSinceInitialVisit < this.msWindow) {
      return [];
    }
    const blockTime = new Date(time.getTime() - msSinceInitialVisit + this.msWindow);
    // cooldown not complete
    if (msSinceInitialVisit < this.msWindow + this.msCooldown) {
      return [{ type: PageActionType.BLOCK, time: blockTime }];
      // cooldown complete, reset triggered at end of cooldown
    }
    const resetTime = new Date(blockTime.getTime() + this.msCooldown);
    return [{ type: PageActionType.RESET_INITIALVISIT, time: resetTime }];
  }
  

  remainingViewtime(time: Date, page: IPageMetrics): number {
    return Number.POSITIVE_INFINITY;
  }

  
  remainingWindow(time: Date, page: IPageMetrics): number {
    if (page.msSinceBlock(time) !== undefined) {
      return 0;
    }
    const windowElapsed = page.msSinceInitialVisit(time) ?? 0;
    const remainingWindow = this.msWindow - windowElapsed;
    if (remainingWindow > 0) {
      return remainingWindow;
    }
    const remainingCooldown = this.msCooldown + remainingWindow;
    if (remainingCooldown > 0) {
      return 0
    }
    return this.msWindow + remainingCooldown;
  }
  
  toObject(): WindowCooldownData {
    return {
      type: "WindowCooldown",
      data: {
        msWindow: this.msWindow,
        msCooldown: this.msCooldown,
      }
    }
  }
}

export type WindowCooldownData = {
  type: "WindowCooldown",
  data: {
    msWindow: number,
    msCooldown: number,
  }
}
