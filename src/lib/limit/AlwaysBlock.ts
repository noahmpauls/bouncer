import { assert } from "../../assert";
import { IPage } from "page";
import { ILimit, LimitAction } from ".";

/**
 * Represents a limit that always recommends blocking no matter what.
 */
export class AlwaysBlock implements ILimit {

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
    return { type: "AlwaysBlock" };
  }
}

export type AlwaysBlockData = {
  type: "AlwaysBlock",
}
