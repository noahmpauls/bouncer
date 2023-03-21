import { assert } from "./assert";
import { IPage, PageReset } from "./page";


/**
 * Represents a suggested action to take on a page.
 */
export type LimitAction = 
{ action: "NONE" | "UNBLOCK" } | 
{
  action: "BLOCK",
  time: Date,
} |
{
  action: "RESET",
  resets: ResetAction[]
}

/**
 * Represents a type of reset to apply to a page, and the time to apply the
 * reset at.
 */
export type ResetAction = {
  type: PageReset,
  time: Date
}


/**
 * Represents a suggested limit on browsing activity.
 */
export interface ILimit {
  /**
   * Type discriminator indicating the type of limit.
   */
  type: string;

  /**
   * Recommend an action to take on a page at the given time.
   * 
   * @param time time to apply the limit at
   * @param page the page to apply the limit to
   * @returns the recommended action to take on the page
   */
  action(time: Date, page: IPage): LimitAction;


  /**
   * Get the amount of viewtime remaining until the next suggested 
   * viewtime-based block. Should return `Infinity` if the limit does not
   * recommend blocks based on viewtime.
   * 
   * @param time the current time
   * @param page page to be blocked
   * @returns amount of viewtime until the page should be blocked, in ms
   */
  remainingViewtime(time: Date, page: IPage): number;
  

  /**
   * Get the amount of time remaining in the window since a page's initial
   * visit until the next suggested window-based block. Should return
   * `Infinity` if the limit does not recommend blocks based on windows.
   * 
   * @param time the current time
   * @param page page to be blocked
   * @returns remaining time in window until the page should be blocked, in ms
   */
  remainingWindow(time: Date, page: IPage): number;


  /**
   * Convert limit to an object representation. The representation must
   * include a field "type" that indicates the type of limit represented.
   * 
   * @returns object representing limit
   */
  toObject(): LimitData;
}


/**
 * Deserialize a limit from an object.
 * 
 * @param obj object data representing limit
 * @returns deserialized limit
 */
export function deserializeLimit(obj: LimitData): ILimit {
  switch (obj.type) {
    case "AlwaysBlock":
      return AlwaysBlock.fromObject(obj);
    case "ViewtimeCooldown":
      return ViewtimeCooldownLimit.fromObject(obj);
    case "WindowCooldown":
      return WindowCooldownLimit.fromObject(obj);
    default:
      throw new Error(`invalid limit type ${(obj as any).type} cannot be deserialized`);
  }
}


/**
 * Serialize a limit to an object representation.
 * 
 * @param limit the limit to serialize
 * @returns serialized limit object
 */
export function serializeLimit(limit: ILimit): LimitData {
  return limit.toObject();
}


/**
 * Union of all types that represent limits in their serialized form.
 */
export type LimitData =
    AlwaysBlockData
  | ViewtimeCooldownData
  | WindowCooldownData
  ;


/**
 * Represents a limit that always recommends blocking no matter what.
 */
export class AlwaysBlock implements ILimit {
  readonly type = "AlwaysBlock";

  constructor() { }


  /**
   * Convert an object to this type of limit.
   * 
   * @param obj object data representing limit
   * @returns limit
   */
  static fromObject(obj: AlwaysBlockData): AlwaysBlock {
    assert(obj.type === "AlwaysBlock", `cannot make AlwaysBlock from data with type ${obj.type}`);
    return new AlwaysBlock();
  }


  action(time: Date, page: IPage): LimitAction {
    return {
      action: "BLOCK",
      time
    };
  }

  
  remainingViewtime(time: Date, page: IPage): number {
    return Infinity;
  }
  

  remainingWindow(time: Date, page: IPage): number {
    return Infinity;
  }
  

  toObject(): AlwaysBlockData {
    return { type: this.type };
  }
}

type AlwaysBlockData = {
  type: "AlwaysBlock",
}


/**
 * Represents a limit that provides an allotment of viewtime, followed by a
 * block lasting for at least the duration of a specified cooldown period.
 */
export class ViewtimeCooldownLimit implements ILimit {
  readonly type = "ViewtimeCooldown";
  
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
      type: this.type,
      data: {
        msViewtime: this.msViewtime,
        msCooldown: this.msCooldown,
      }
    };
  }
}

type ViewtimeCooldownData = {
  type: "ViewtimeCooldown",
  data: {
    msViewtime: number,
    msCooldown: number,
  }
}


/**
 * Represents a limit that allows viewing for a specified amount of time after
 * an initial visit, followed by a block lasting for at least the duration of a
 * specified cooldown period.
 */
export class WindowCooldownLimit implements ILimit {
  readonly type = "WindowCooldown";
  
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
  
  action(time: Date, page: IPage): LimitAction {
    const msSinceBlock = page.msSinceBlock(time);
    if (msSinceBlock !== null && msSinceBlock >= this.msCooldown) {
      return { action: "UNBLOCK" };
    }
    const msSinceInitialVisit = page.msSinceInitialVisit(time) ?? 0;
    if (msSinceInitialVisit >= this.msWindow) {
      const blockTime = new Date(time.getTime() - msSinceInitialVisit + this.msWindow);
      // cooldown not complete
      if (msSinceInitialVisit < this.msWindow + this.msCooldown) {
        return { action: "BLOCK", time: blockTime };
        // cooldown complete, reset triggered at end of cooldown
      } else {
        const resetTime = new Date(blockTime.getTime() + this.msCooldown);
        return {
          action: "RESET",
          resets: [{ type: PageReset.INITIALVISIT, time: resetTime }]
        };
      }
    }
    return { action: "NONE" };
  }
  
  remainingViewtime(time: Date, page: IPage): number {
    return Infinity;
  }
  
  remainingWindow(time: Date, page: IPage): number {
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

type WindowCooldownData = {
  type: "WindowCooldown",
  data: {
    msWindow: number,
    msCooldown: number,
  }
}
