import { type IPageMetrics, PageAccess, type PageAction, PageActionType } from "@bouncer/page";
import { assert } from "@bouncer/utils";
import type { ILimit } from "./types";

/**
 * Represents a limit that always recommends blocking no matter what.
 */
export class AlwaysBlock implements ILimit {
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
    if (page.access() === PageAccess.BLOCKED) {
      return [];
    }
    return [{ type: PageActionType.BLOCK, time }];
  }

  
  remainingViewtime(time: Date, page: IPageMetrics): number {
    return Number.POSITIVE_INFINITY;
  }
  

  remainingWindow(time: Date, page: IPageMetrics): number {
    return Number.POSITIVE_INFINITY;
  }
  

  toObject(): AlwaysBlockData {
    return { type: "AlwaysBlock" };
  }
}

export type AlwaysBlockData = {
  type: "AlwaysBlock",
}
