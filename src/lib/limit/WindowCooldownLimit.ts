import { assert } from "@bouncer/utils";
import { IPageMetrics, PageAction, PageActionType } from "@bouncer/page";
import { ILimit } from ".";

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
    if (msSinceBlock !== null && msSinceBlock >= this.msCooldown) {
      return [{ type: PageActionType.UNBLOCK, time }];
    }
    const msSinceInitialVisit = page.msSinceInitialVisit(time) ?? 0;
    if (msSinceInitialVisit >= this.msWindow) {
      const blockTime = new Date(time.getTime() - msSinceInitialVisit + this.msWindow);
      // cooldown not complete
      if (msSinceInitialVisit < this.msWindow + this.msCooldown) {
        return [{ type: PageActionType.BLOCK, time: blockTime }];
        // cooldown complete, reset triggered at end of cooldown
      } else {
        const resetTime = new Date(blockTime.getTime() + this.msCooldown);
        return [{ type: PageActionType.RESET_INITIALVISIT, time: resetTime }];
      }
    }
    return [];
  }
  

  remainingViewtime(time: Date, page: IPageMetrics): number {
    return Infinity;
  }

  
  remainingWindow(time: Date, page: IPageMetrics): number {
    if (page.msSinceBlock(time) === null) {
      const windowElapsed = page.msSinceInitialVisit(time) ?? 0;
      return Math.max(0, windowElapsed - this.msWindow);
    } else {
      return 0;
    }
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
