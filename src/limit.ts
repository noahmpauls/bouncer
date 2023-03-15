import { assert } from "./assert";
import { IPage } from "./page";


/**
 * Represents a suggested action to take on a page.
 */
export type LimitAction = 
{ action: "NONE" | "UNBLOCK" } | 
{
  action: "BLOCK",
  duration: number,
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
   * @returns amount of viewtime until the page should be blocked
   */
  remainingViewtime(time: Date, page: IPage): number;


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
  | ViewtimeCooldownData;
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
      duration: Infinity
    };
  }

  
  remainingViewtime(time: Date, page: IPage): number {
    return Infinity;
  }
  

  toObject(): AlwaysBlockData {
    return { type: this.type };
  }
}

type AlwaysBlockData = {
  type: "AlwaysBlock",
}


export class ViewtimeCooldownLimit implements ILimit {
  readonly type = "ViewtimeCooldown";
  
  private readonly msViewtime: number;
  private readonly msCooldown: number;
  
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
    } else if (page.msViewtime(time) >= this.msViewtime) {
      return { action: "BLOCK", duration: this.msCooldown };
    }
    return { action: "NONE" };
  }

  
  remainingViewtime(time: Date, page: IPage): number {
    if (page.msSinceBlock(time) === null) {
      return Math.max(0, this.msViewtime - page.msViewtime(time));
    } else {
      return 0;
    }
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
