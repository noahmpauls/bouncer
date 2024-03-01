import { assert, assertTimeSequence } from "@bouncer/utils";
import { PageAccess, PageActionType, PageEvent } from "./enums";
import { type IPage } from "./types";

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
  private timeInitialVisit: Date | null;
  private msViewtimeAccrued: number;
  private timeBlock: Date | null;
  private timeLastShow: Date | null;
  private timeLastHide: Date | null;
  private timeLastUpdate: Date | null;

  /**
   * @param timeInitialVisit time of the initial visit to the page after a
   *  block is removed (or ever)
   * @param msViewtimeAccrued viewtime accrued so far
   * @param timeBlock time of last block
   */
  constructor(
    timeInitialVisit?: Date | null,
    msViewtimeAccrued?: number,
    timeBlock?: Date | null,
    timeLastShow?: Date | null,
    timeLastHide?: Date | null,
    timeLastUpdate?: Date | null,
  ) {
    this.timeInitialVisit = timeInitialVisit ?? null;
    this.msViewtimeAccrued = msViewtimeAccrued ?? 0;
    this.timeBlock = timeBlock ?? null;
    this.timeLastShow = timeLastShow ?? null;
    this.timeLastHide = timeLastHide ?? null;
    this.timeLastUpdate = timeLastUpdate ?? null;
    this.checkRep();
  }

  private checkRep() {
    if (this.timeBlock !== null) {
      assert(this.timeInitialVisit === null, `timeInitialVisit should be null when blocked (was ${this.timeInitialVisit})`);
      assert(this.timeLastShow === null, `timeLastShow should be null when blocked`);
      assert(this.msViewtimeAccrued === 0, `msViewtimeAccrued should be 0 when blocked`);
    }
    
    if (this.timeInitialVisit !== null) {
      assert(this.timeBlock === null, `timeBlock should be null if visit occurs`);
    }
    
    if (this.timeLastShow !== null) {
      assert(this.timeLastHide === null, `timeLastHide must be null when showing`);
    }

    if (this.timeLastUpdate !== null) {
      assertTimeSequence(this.timeInitialVisit ?? this.timeLastUpdate, this.timeLastUpdate);
      assertTimeSequence(this.timeBlock ?? this.timeLastUpdate, this.timeLastUpdate);
      assertTimeSequence(this.timeLastShow ?? this.timeLastUpdate, this.timeLastUpdate);
      assertTimeSequence(this.timeLastHide ?? this.timeLastUpdate, this.timeLastUpdate);
    } else {
      assert(this.timeInitialVisit === null, `timeInitialVisit should be null if no last update`);
      assert(this.timeBlock === null, `timeBlock should be null if no last update`);
      assert(this.timeLastShow === null, `timeLastShow should be null if no last update`);
      assert(this.timeLastHide === null, `timeLastHide should be null if no last update`);
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
      obj.data.timeInitialVisit,
      obj.data.msViewtimeAccrued,
      obj.data.timeBlock,
      obj.data.timeLastShow,
      obj.data.timeLastHide,
      obj.data.timeLastUpdate,
    );
  }
  
  private setTimeLastUpdate(time: Date): void {
    if (this.timeLastUpdate === null) {
      this.timeLastUpdate = time;
    } else {
      this.timeLastUpdate = new Date(Math.max(this.timeLastUpdate.getTime(), time.getTime()));
    }
  }

  access(): PageAccess {
    if (this.timeBlock === null) {
      return PageAccess.ALLOWED;
    } else {
      return PageAccess.BLOCKED;
    }
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
    this.timeLastHide = null;
    if (this.timeInitialVisit === null) {
      this.timeInitialVisit = time;
      isUpdate = true;
    }
    // timeLastShow only set if previously cleared
    if (this.timeLastShow === null) {
      this.timeLastShow = time;
      isUpdate = true;
    }
    return isUpdate;
  }
  
  private handleHide(time: Date): boolean {
    if (this.timeLastShow === null) {
      return false;
    }
    const viewtime = Math.max(0, time.getTime() - this.timeLastShow.getTime());
    this.msViewtimeAccrued += viewtime;
    this.timeLastShow = null;
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
      // if showing, viewtime is already accruing since reset
      const viewtimeStart = new Date(Math.max(resetTime.getTime(), this.timeLastShow!.getTime()));
      this.timeLastShow = viewtimeStart;
    } else {
      this.timeLastShow = null;
    }
    this.setTimeLastUpdate(resetTime);
  }
  
  private resetInitialVisit(resetTime: Date): void {
    if (this.access() === PageAccess.BLOCKED) { return; }
    if (this.isShowing()) {
      const initialVisit = new Date(Math.max(resetTime.getTime(), this.timeLastShow!.getTime()));
      this.timeInitialVisit = initialVisit;
    } else {
      this.timeInitialVisit = null;
    }
    this.setTimeLastUpdate(resetTime);
  }

  private block(time: Date): void {
    if (this.access() === PageAccess.BLOCKED) { return; }
    this.timeBlock = time;
    this.timeInitialVisit = null;
    this.msViewtimeAccrued = 0;
    this.timeLastShow = null;
    this.timeLastHide = null;
    this.setTimeLastUpdate(time);
  }
  
  private unblock(time: Date): void {
    if (this.access() === PageAccess.ALLOWED) { return; }
    this.timeBlock = null;
    this.setTimeLastUpdate(time);
  }
  
  isShowing(): boolean {
    return this.timeLastShow !== null;
  }
  
  msSinceInitialVisit(time: Date): number | null {
    if (this.timeInitialVisit === null) return null;
    return Math.max(0, time.getTime() - this.timeInitialVisit.getTime());
  }
  
  msViewtime(time: Date): number {
    if (this.timeLastShow === null) {
      return this.msViewtimeAccrued;
    } else {
      return Math.max(0, this.msViewtimeAccrued + (time.getTime() - this.timeLastShow.getTime()));
    }
  }
  
  msSinceBlock(time: Date): number | null {
    if (this.timeBlock === null) return null;
    return Math.max(0, time.getTime() - this.timeBlock.getTime());
  }
  
  msSinceHide(time: Date): number | null {
    if (this.timeLastHide === null) return null;
    return Math.max(0, time.getTime() - this.timeLastHide.getTime());
  }
  
  msSinceUpdate(time: Date): number | null {
    if (this.timeLastUpdate === null) return null;
    return Math.max(0, time.getTime() - this.timeLastUpdate.getTime());
  }

  toObject(): BasicPageData {
    return {
      type: "BasicPage",
      data: {
        timeInitialVisit: this.timeInitialVisit,
        msViewtimeAccrued: this.msViewtimeAccrued,
        timeBlock: this.timeBlock,
        timeLastShow: this.timeLastShow,
        timeLastHide: this.timeLastHide,
        timeLastUpdate: this.timeLastUpdate,
      }
    };
  }
}

export type BasicPageData = {
  type: "BasicPage",
  data: {
    timeInitialVisit: Date | null,
    msViewtimeAccrued: number,
    timeBlock: Date | null,
    timeLastShow: Date | null,
    timeLastHide: Date | null,
    timeLastUpdate: Date | null,
  }
}
