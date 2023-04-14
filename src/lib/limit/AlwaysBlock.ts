import { assert } from "@bouncer/utils";
import { IPageMetrics, PageAccess, PageAction, PageActionType } from "@bouncer/page";
import { ILimit } from ".";

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


  actions(time: Date, page: IPageMetrics): PageAction[] {
    if (page.access() !== PageAccess.BLOCKED) {
      return [{ type: PageActionType.BLOCK, time }];
    } else {
      return [];
    }
  }

  
  remainingViewtime(time: Date, page: IPageMetrics): number {
    return Infinity;
  }
  

  remainingWindow(time: Date, page: IPageMetrics): number {
    return Infinity;
  }
  

  toObject(): AlwaysBlockData {
    return { type: "AlwaysBlock" };
  }
}

export type AlwaysBlockData = {
  type: "AlwaysBlock",
}
