import { assert, assertTimeSequence } from "@bouncer/utils";
import { PageAccess, PageActionType, PageEvent } from "./enums";
import type { IPage } from "./types";

/**
 * Represents a webpage that can be browsed and blocked.
 */
export class BasicPage implements IPage {
  
  /** TODO:
   * 
   * Almost all of the "time" fields are exclusive to one another.
   * 
   * Replace with a single status field with the time of that field's
   * most recent update.
   */
  private timeInitialVisit: Date | undefined;
  private msViewtimeAccrued: number;
  private timeBlock: Date | undefined;
  private timeLastShow: Date | undefined;
  private timeLastHide: Date | undefined;
  private timeLastUpdate: Date | undefined;

  /**
   * @param timeInitialVisit time of the initial visit to the page after a
   *  block is removed (or ever)
   * @param msViewtimeAccrued viewtime accrued so far
   * @param timeBlock time of last block
   */
  constructor(
    timeInitialVisit?: Date | undefined,
    msViewtimeAccrued?: number,
    timeBlock?: Date | undefined,
    timeLastShow?: Date | undefined,
    timeLastHide?: Date | undefined,
    timeLastUpdate?: Date | undefined,
  ) {
    this.timeInitialVisit = timeInitialVisit;
    this.msViewtimeAccrued = msViewtimeAccrued ?? 0;
    this.timeBlock = timeBlock;
    this.timeLastShow = timeLastShow;
    this.timeLastHide = timeLastHide;
    this.timeLastUpdate = timeLastUpdate;
    this.checkRep();
  }

  private checkRep() {
    if (this.timeBlock !== undefined) {
      assert(this.timeInitialVisit === undefined, `timeInitialVisit should be undefined when blocked (was ${this.timeInitialVisit})`);
      assert(this.timeLastShow === undefined, "timeLastShow should be undefined when blocked");
      assert(this.msViewtimeAccrued === 0, "msViewtimeAccrued should be 0 when blocked");
    }
    
    if (this.timeInitialVisit !== undefined) {
      assert(this.timeBlock === undefined, "timeBlock should be undefined if visit occurs");
    }
    
    if (this.timeLastShow !== undefined) {
      assert(this.timeLastHide === undefined, "timeLastHide must be undefined when showing");
    }

    if (this.timeLastUpdate !== undefined) {
      assertTimeSequence(this.timeInitialVisit ?? this.timeLastUpdate, this.timeLastUpdate);
      assertTimeSequence(this.timeBlock ?? this.timeLastUpdate, this.timeLastUpdate);
      assertTimeSequence(this.timeLastShow ?? this.timeLastUpdate, this.timeLastUpdate);
      assertTimeSequence(this.timeLastHide ?? this.timeLastUpdate, this.timeLastUpdate);
    } else {
      assert(this.timeInitialVisit === undefined, "timeInitialVisit should be undefined if no last update");
      assert(this.timeBlock === undefined, "timeBlock should be undefined if no last update");
      assert(this.timeLastShow === undefined, "timeLastShow should be undefined if no last update");
      assert(this.timeLastHide === undefined, "timeLastHide should be undefined if no last update");
    }
  }
  
  /**
   * Convert an object to this kind of page.
   * 
   * @param obj object data representing the page
   * @returns page
   */
  static fromObject(obj: BasicPageData): BasicPage {
    assert(obj.type === "BasicPage", `cannot make BasicPage from data with type ${obj.type}`);
    return new BasicPage(
      obj.data.timeInitialVisit ? new Date(obj.data.timeInitialVisit) : undefined,
      obj.data.msViewtimeAccrued,
      obj.data.timeBlock ? new Date(obj.data.timeBlock) : undefined,
      obj.data.timeLastShow ? new Date(obj.data.timeLastShow) : undefined,
      obj.data.timeLastHide ? new Date(obj.data.timeLastHide) : undefined,
      obj.data.timeLastUpdate ? new Date(obj.data.timeLastUpdate) : undefined,
    );
  }
  
  private setTimeLastUpdate(time: Date): void {
    if (this.timeLastUpdate === undefined) {
      this.timeLastUpdate = time;
    } else {
      this.timeLastUpdate = new Date(Math.max(this.timeLastUpdate.getTime(), time.getTime()));
    }
  }

  access(): PageAccess {
    if (this.timeBlock === undefined) {
      return PageAccess.ALLOWED;
    }
    return PageAccess.BLOCKED;
  }

  recordEvent(time: Date, event: PageEvent): void {
    // cannot record events on blocked page
    if (this.access() === PageAccess.BLOCKED) {
      return;
    }
    let isUpdate = false;
    switch (event) {
      case PageEvent.SHOW:
        isUpdate ||= this.handleShow(time);
        break;
      case PageEvent.HIDE:
        isUpdate ||= this.handleHide(time);
        break;
      default:
        throw "unreachable";
    }
    if (isUpdate) {
      this.setTimeLastUpdate(time);
    }
    this.checkRep();
  }

  private handleShow(time: Date): boolean {
    let isUpdate = false;
    this.timeLastHide = undefined;
    if (this.timeInitialVisit === undefined) {
      this.timeInitialVisit = time;
      isUpdate = true;
    }
    // timeLastShow only set if previously cleared
    if (this.timeLastShow === undefined) {
      this.timeLastShow = time;
      isUpdate = true;
    }
    return isUpdate;
  }
  
  private handleHide(time: Date): boolean {
    if (this.timeLastShow === undefined) {
      return false;
    }
    const viewtime = Math.max(0, time.getTime() - this.timeLastShow.getTime());
    this.msViewtimeAccrued += viewtime;
    this.timeLastShow = undefined;
    this.timeLastHide = time;
    return true;
  }
  
  recordAction(type: PageActionType, time: Date): void {
    switch (type) {
      case PageActionType.BLOCK:
        this.block(time);
        break;
      case PageActionType.UNBLOCK:
        this.unblock(time);
        break;
      case PageActionType.RESET_METRICS:
        this.resetInitialVisit(time);
        this.resetViewtime(time);
        break;
      case PageActionType.RESET_INITIALVISIT:
        this.resetInitialVisit(time);
        break;
      case PageActionType.RESET_VIEWTIME:
        this.resetViewtime(time);
        break;
      default:
        throw new Error("unreachable");
    }
    this.checkRep();
  }
  

  private resetViewtime(resetTime: Date): void {
    if (this.access() === PageAccess.BLOCKED) { return; }
    this.msViewtimeAccrued = 0;
    if (this.isShowing()) {
      if (this.timeLastShow === undefined) {
        throw new Error("timeLastShow cannot be undefined if isShowing");
      }
      // if showing, viewtime is already accruing since reset
      const viewtimeStart = new Date(Math.max(resetTime.getTime(), this.timeLastShow.getTime()));
      this.timeLastShow = viewtimeStart;
    } else {
      this.timeLastShow = undefined;
    }
    this.setTimeLastUpdate(resetTime);
  }
  
  private resetInitialVisit(resetTime: Date): void {
    if (this.access() === PageAccess.BLOCKED) { return; }
    if (this.isShowing()) {
      if (this.timeLastShow === undefined) {
        throw new Error("timeLastShow cannot be undefined if isShowing");
      }
      const initialVisit = new Date(Math.max(resetTime.getTime(), this.timeLastShow.getTime()));
      this.timeInitialVisit = initialVisit;
    } else {
      this.timeInitialVisit = undefined;
    }
    this.setTimeLastUpdate(resetTime);
  }

  private block(time: Date): void {
    if (this.access() === PageAccess.BLOCKED) { return; }
    this.timeBlock = time;
    this.timeInitialVisit = undefined;
    this.msViewtimeAccrued = 0;
    this.timeLastShow = undefined;
    this.timeLastHide = undefined;
    this.setTimeLastUpdate(time);
  }
  
  private unblock(time: Date): void {
    if (this.access() === PageAccess.ALLOWED) { return; }
    this.timeBlock = undefined;
    this.setTimeLastUpdate(time);
  }
  
  isShowing(): boolean {
    return this.timeLastShow !== undefined;
  }
  
  msSinceInitialVisit(time: Date): number | undefined {
    if (this.timeInitialVisit === undefined) return undefined;
    return Math.max(0, time.getTime() - this.timeInitialVisit.getTime());
  }
  
  msViewtime(time: Date): number {
    if (this.timeLastShow === undefined) {
      return this.msViewtimeAccrued;
    }
    return Math.max(0, this.msViewtimeAccrued + (time.getTime() - this.timeLastShow.getTime()));
  }
  
  msSinceBlock(time: Date): number | undefined {
    if (this.timeBlock === undefined) return undefined;
    return Math.max(0, time.getTime() - this.timeBlock.getTime());
  }
  
  msSinceHide(time: Date): number | undefined {
    if (this.timeLastHide === undefined) return undefined;
    return Math.max(0, time.getTime() - this.timeLastHide.getTime());
  }
  
  msSinceUpdate(time: Date): number | undefined {
    if (this.timeLastUpdate === undefined) return undefined;
    return Math.max(0, time.getTime() - this.timeLastUpdate.getTime());
  }

  toObject(): BasicPageData {
    return {
      type: "BasicPage",
      data: {
        timeInitialVisit: this.timeInitialVisit?.toISOString(),
        msViewtimeAccrued: this.msViewtimeAccrued,
        timeBlock: this.timeBlock?.toISOString(),
        timeLastShow: this.timeLastShow?.toISOString(),
        timeLastHide: this.timeLastHide?.toISOString(),
        timeLastUpdate: this.timeLastUpdate?.toISOString(),
      }
    };
  }
}

export type BasicPageData = {
  type: "BasicPage",
  data: {
    timeInitialVisit: string | undefined,
    msViewtimeAccrued: number,
    timeBlock: string | undefined,
    timeLastShow: string | undefined,
    timeLastHide: string | undefined,
    timeLastUpdate: string | undefined,
  }
}
