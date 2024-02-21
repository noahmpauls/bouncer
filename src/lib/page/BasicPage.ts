import { assert, assertTimeSequence } from "@bouncer/utils";
import { PageAccess, PageActionType, type PageEvent, type Frame, type Tab, PageEventType } from "./enums";
import { type IPage } from "./types";

class PageViewers {
  private readonly tabFrameMap: Map<number, Set<number>>;

  constructor(viewers?: Map<number, Set<number>>) {
    this.tabFrameMap = viewers ?? new Map();
    this.checkRep();
  }

  private checkRep() {
    for (const [tabId, frameSet] of this.tabFrameMap.entries()) {
      assert(frameSet.size > 0, `tab ${tabId} must have at least one frame`)
    }
  }

  static fromObject(obj: PageViewersData): PageViewers {
    const map = new Map<number, Set<number>>();
    for (const [t, f] of Object.entries(obj)) {
      map.set(Number(t), new Set(f));
    }
    return new PageViewers(map);
  }

  any(): boolean {    
    return this.tabFrameMap.size > 0;
  }

  has(tabId: number, frameId?: number): boolean {
    throw new Error("not implemented");
  }

  addFrame(frame: Frame): boolean {
    const { tabId: tabId, frameId } = frame;
    const frames = this.tabFrameMap.get(tabId);
    let isUpdate = false;
    if (frames === undefined) {
      this.tabFrameMap.set(tabId, new Set([frameId]));
      isUpdate = true;
    } else {
      isUpdate = !frames.has(frameId);
      frames.add(frameId);
    }
    this.checkRep();
    return isUpdate;
  }

  removeFrame(frame: Frame): boolean {
    const { tabId: tabId, frameId } = frame;
    const frames = this.tabFrameMap.get(tabId);
    if (frames === undefined) {
      return false;
    }
    if (!frames.delete(frameId)) {
      this.checkRep();
      return false;
    }
    if (frames.size === 0) {
      this.tabFrameMap.delete(tabId);
    }
    this.checkRep();
    return true;
  }

  removeTab(tab: Tab): boolean {
    const isUpdate = this.tabFrameMap.delete(tab.tabId);
    this.checkRep();
    return isUpdate;
  }

  clear(): boolean {
    const isUpdate = this.any();
    this.tabFrameMap.clear();
    this.checkRep();
    return isUpdate;
  }

  toObject(): PageViewersData {
    const data: PageViewersData = {};
    for (const [tabId, frameSet] of this.tabFrameMap.entries()) {
      data[tabId] = [...frameSet];
    }
    return data;
  }
}

type PageViewersData = {
  [t: number]: number[];
}

/**
 * Represents a webpage that can be browsed and blocked.
 */
export class BasicPage implements IPage {
  
  private timeInitialVisit: Date | null;
  private msViewtimeAccrued: number;
  private timeBlock: Date | null;
  private timeLastShow: Date | null;
  private timeLastHide: Date | null;
  private viewers: PageViewers; 
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
    viewers?: PageViewers,
    timeLastUpdate?: Date | null,
  ) {
    this.timeInitialVisit = timeInitialVisit ?? null;
    this.msViewtimeAccrued = msViewtimeAccrued ?? 0;
    this.timeBlock = timeBlock ?? null;
    this.timeLastShow = timeLastShow ?? null;
    this.timeLastHide = timeLastHide ?? null;
    this.viewers = viewers ?? new PageViewers();
    this.timeLastUpdate = timeLastUpdate ?? null;
    this.checkRep();
  }

  private checkRep() {
    if (this.timeBlock !== null) {
      assert(this.timeInitialVisit === null, `timeInitialVisit should be null when blocked (was ${this.timeInitialVisit})`);
      assert(this.timeLastShow === null, `timeLastShow should be null when blocked`);
      assert(this.msViewtimeAccrued === 0, `msViewtimeAccrued should be 0 when blocked`);
      assert(!this.viewers.any(), "no viewers allowed when blocked")
    }
    
    if (this.timeInitialVisit !== null) {
      assert(this.timeBlock === null, `timeBlock should be null if visit occurs`);
    }
    
    if (this.timeLastShow !== null) {
      assert(this.timeLastHide === null, `timeLastHide must be null when showing`);
      assert(this.viewers.any(), `must have viewers while showing`);
    } else {
      assert(!this.viewers.any(), `no viewers allowed while not showing`);
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
      PageViewers.fromObject(obj.data.viewers),
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
    switch (event.type) {
      case PageEventType.FRAME_OPEN:
        isUpdate ||= this.handleVisit(time, event.frame);
        break;
      case PageEventType.FRAME_SHOW:
        isUpdate ||= this.handleShow(time, event.frame);
        break;
      case PageEventType.FRAME_HIDE:
        isUpdate ||= this.handleHide(time, event.frame);
        break;
      case PageEventType.TAB_CLOSE:
        isUpdate ||= this.handleClose(time, event.tab);
        break;
      default:
        throw new Error("unreachable");
    }
    if (isUpdate) {
      this.setTimeLastUpdate(time);
    }
    this.checkRep();
  }

  private handleVisit(time: Date, frame: Frame): boolean {
    // initial visit only set if previously cleared by block
    if (this.timeInitialVisit === null) {
      this.timeInitialVisit = time;
      return true;
    }
    return false;
  }
  
  private handleShow(time: Date, frame: Frame): boolean {
    let isUpdate = this.viewers.addFrame(frame);
    this.timeLastHide = null;
    // timeLastShow only set if previously cleared
    if (this.timeLastShow === null) {
      this.timeLastShow = time;
      isUpdate = true;
    }
    return isUpdate;
  }
  
  private handleHide(time: Date, frame: Frame): boolean {
    this.viewers.removeFrame(frame);
    if (this.timeLastShow === null) {
      return false;
    }
    const viewtime = Math.max(0, time.getTime() - this.timeLastShow.getTime());
    this.msViewtimeAccrued += viewtime;
    if (this.viewers.any()) {
      this.timeLastShow = time;
    } else {
      this.timeLastShow = null;
      this.timeLastHide = time;
    }
    return true;
  }

  private handleClose(time: Date, tab: Tab): boolean {
    this.viewers.removeTab(tab);
    if (this.timeLastShow === null) {
      return false;
    }
    const viewtime = Math.max(0, time.getTime() - this.timeLastShow.getTime());
    this.msViewtimeAccrued += viewtime;
    if (this.viewers.any()) {
      this.timeLastShow = time;
    } else {
      this.timeLastShow = null;
      this.timeLastHide = time;
    }
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
      this.viewers.clear();
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
    this.viewers.clear();
    this.setTimeLastUpdate(time);
  }
  
  private unblock(time: Date): void {
    if (this.access() === PageAccess.ALLOWED) { return; }
    this.timeBlock = null;
    this.setTimeLastUpdate(time);
  }
  
  isShowing(): boolean {
    return this.viewers.any();
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
        viewers: this.viewers.toObject(),
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
    viewers: PageViewersData,
    timeLastUpdate: Date | null,
  }
}
