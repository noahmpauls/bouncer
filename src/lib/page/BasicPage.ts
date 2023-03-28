import { assert, assertTimeSequence } from "@bouncer/utils";
import { PageAccess, PageEvent, PageReset } from "./enums";
import { IPage } from ".";

/**
 * Represents a webpage that can be browsed and blocked.
 */
export class BasicPage implements IPage {
  
  private timeInitialVisit: Date | null;
  private msViewtimeAccrued: number;
  private timeBlock: Date | null;
  private timeLastShow: Date | null;
  private timeLastHide: Date | null;
  private viewers: Set<string>;

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
    viewers?: string[],
  ) {
    this.timeInitialVisit = timeInitialVisit ?? null;
    this.msViewtimeAccrued = msViewtimeAccrued ?? 0;
    this.timeBlock = timeBlock ?? null;
    this.timeLastShow = timeLastShow ?? null;
    this.timeLastHide = timeLastHide ?? null;
    this.viewers = viewers !== undefined ? new Set(viewers) : new Set();
    this.checkRep();
  }

  private checkRep() {
    if (this.timeBlock !== null) {
      assert(this.timeInitialVisit === null, `timeInitialVisit should be null when blocked (was ${this.timeInitialVisit})`);
      assert(this.timeLastShow === null, `timeLastShow should be null when blocked`);
      assert(this.msViewtimeAccrued === 0, `msViewtimeAccrued should be 0 when blocked`);
      assert(this.viewers.size === 0, "no viewers allowed when blocked")
    }
    
    if (this.timeInitialVisit !== null) {
      assert(this.timeBlock === null, `timeBlock should be null if visit occurs`);
    }
    
    if (this.timeLastShow !== null) {
      assert(this.timeLastHide === null, `timeLastHide must be null when showing`);
      assert(this.viewers.size > 0, `must have viewers while showing`);
    } else {
      assert(this.viewers.size === 0, `no viewers allowed while not showing`);
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
      obj.data.viewers,
    );
  }

  checkAccess(time: Date): PageAccess {
    if (this.timeBlock === null) {
      return PageAccess.ALLOWED;
    } else {
      return PageAccess.BLOCKED;
    }
  }

  recordEvent(time: Date, event: PageEvent, viewer: string): void {
    // cannot record events on blocked page
    if (this.checkAccess(time) === PageAccess.BLOCKED) {
      return;
    }
    switch (event) {
      case PageEvent.VISIT:
        this.handleVisit(time);
        break;
      case PageEvent.SHOW:
        this.handleShow(time, viewer);
        break;
      case PageEvent.HIDE:
        this.handleHide(time, viewer);
        break;
      default:
        throw "unreachable";
    }
    this.checkRep();
  }

  private handleVisit(time: Date): void {
    // initial visit only set if previously cleared by block
    if (this.timeInitialVisit === null) {
      this.timeInitialVisit = time;
    }
  }
  
  private handleShow(time: Date, viewer: string): void {
    this.timeLastHide = null;
    this.viewers.add(viewer);
    // timeLastShow only set if previously cleared
    if (this.timeLastShow === null) {
      this.timeLastShow = time;
    }
  }
  
  private handleHide(time: Date, viewer: string): void {
    this.viewers.delete(viewer);
    if (this.timeLastShow === null) {
      return;
    }
    const viewtime = time.getTime() - this.timeLastShow.getTime();
    this.msViewtimeAccrued += viewtime;
    if (this.viewers.size > 0) {
      this.timeLastShow = time;
    } else {
      this.timeLastShow = null;
      this.timeLastHide = time;
    }
  }
  
  recordReset(time: Date, type: PageReset, resetTime: Date): void {
    switch (type) {
      case PageReset.INITIALVISIT:
        this.resetInitialVisit(time, resetTime);
        break;
      case PageReset.VIEWTIME:
        this.resetViewtime(time, resetTime);
        break;
    }
    this.checkRep();
  }

  private resetViewtime(time: Date, resetTime: Date): void {
    assertTimeSequence(resetTime, time);
    this.msViewtimeAccrued = 0;
    this.timeLastHide = null;
    if (this.isShowing(time)) {
      // if showing, viewtime is already accruing since reset
      const viewtimeStart = new Date(Math.max(resetTime.getTime(), this.timeLastShow!.getTime()));
      this.timeLastShow = viewtimeStart;
    } else {
      this.timeLastShow = null;
      this.viewers.clear();
    }
  }
  
  private resetInitialVisit(time: Date, resetTime: Date): void {
    assertTimeSequence(resetTime, time);
    if (this.isShowing(time)) {
      this.timeInitialVisit = resetTime;
    } else {
      this.timeInitialVisit = null;
    }
  }

  block(time: Date): void {
    this.timeBlock = time;
    this.timeInitialVisit = null;
    this.msViewtimeAccrued = 0;
    this.timeLastShow = null;
    this.timeLastHide = null;
    this.viewers.clear();
    this.checkRep();
  }
  
  unblock(time: Date): void {
    this.timeBlock = null;
    this.checkRep();
  }
  
  isShowing(time: Date): boolean {
    return (this.timeLastShow !== null && this.timeLastShow <= time)
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

  toObject(): BasicPageData {
    return {
      type: "BasicPage",
      data: {
        timeInitialVisit: this.timeInitialVisit,
        msViewtimeAccrued: this.msViewtimeAccrued,
        timeBlock: this.timeBlock,
        timeLastShow: this.timeLastShow,
        timeLastHide: this.timeLastHide,
        viewers: [...this.viewers]
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
    viewers: string[],
  }
}
