import { assert, assertTimeSequence } from "./assert";

/**
 * Represents the level of view access allowed for a page.
 */
export enum PageAccess {
  /** Full view access to a page granted. */
  ALLOWED = "allowed",
  /** No view access to a page granted. */
  BLOCKED = "blocked",
}

/**
 * Represents events that occur on a page during browsing.
 */
export enum PageEvent {
  /** Page is first opened. */
  VISIT = "visit",
  /** Page becomes visible. */
  SHOW = "show",
  /** Page becomes hidden. */
  HIDE = "hide",
}


/**
 * Represents a webpage that can be browsed and blocked.
 */
export interface IPage {
  /**
   * Type discriminator indicating the type of page.
   */
  type: PageType;

  /**
   * Get the current level of view access to the page.
   *
   * @param time the current time
   * @returns the access status of the page
   */
  checkAccess(time: Date): PageAccess;

  /**
   * Record that a specific browsing event happended on the page at the current
   * time.
   * 
   * @param time the current time
   * @param event the event to record
   */
  recordEvent(time: Date, event: PageEvent): void;

  /**
   * Add a block to this page at the current time.
   * 
   * @param time the current time
   */
  block(time: Date): void;
  
  /**
   * Removes a block from this page at the current time.
   * 
   * @param time the current time
   */
  unblock(time: Date): void;
  
  /**
   * Convert the page to an object representation. The representation must
   * include a field "type" that indicates the type of page represented.
   * 
   * @returns object representing page
   */
  toObject(): any;
  
  //----------------------------------------------------------------------------
  // Metrics
  //----------------------------------------------------------------------------

  /**
   * Milliseconds since the first page visit since an unblock (or ever).
   * TOOO null if...
   * 
   * @param time the current time
   * @returns milliseconds since initial visit
   */
  msSinceInitialVisit(time: Date): number | null;

  /**
   * Milliseconds of viewtime accrued on the page so far.
   * 
   * @param time the current time
   * @returns milliseconds of viewtime accrued
   */
  msViewtime(time: Date): number;

  /**
   * Milliseconds since last time a block was applied to the page.
   * 
   * @param time the current time
   * @returns milliseconds since last block
   */
  msSinceBlock(time: Date): number | null;
}


/**
 * Deserialize a page from an object.
 * 
 * @param data object data representing page
 * @returns deserialized page
 */
export function deserializePage(data: any): IPage {
  switch (data.type as PageType) {
    case "BasicPage":
      return BasicPage.fromObject(data);
    default:
      throw new Error(`invalid policy type ${data.type} cannot be deserialized`)
  }
}


/**
 * Serialize a page to an object representation.
 * 
 * @param page the page to serialize
 * @returns serialized page object
 */
export function serializePage(page: IPage): any {
  return page.toObject();
}


/**
 * Discriminator type for each kind of page.
 */
type PageType =
  "BasicPage";


/**
 * Represents a webpage that can be browsed and blocked.
 */
export class BasicPage implements IPage {
  readonly type: PageType = "BasicPage";
  
  private timeInitialVisit: Date | null;
  private msViewtimeAccrued: number;
  private timeBlock: Date | null;
  private timeLastShow: Date | null = null;

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
  ) {
    this.timeInitialVisit = timeInitialVisit ?? null;
    this.msViewtimeAccrued = msViewtimeAccrued ?? 0;
    this.timeBlock = timeBlock ?? null;
    this.checkRep();
  }

  private checkRep() {
    if (this.timeBlock !== null) {
      assert(this.timeInitialVisit === null, `timeInitialVisit should be null when blocked (was ${this.timeInitialVisit})`);
      assert(this.timeLastShow === null, `timeLastShow should be null when blocked`);
      assert(this.msViewtimeAccrued === 0, `msViewtimeAccrued should be 0 when blocked`);
    }
    
    if (this.timeInitialVisit === null) {
      assert(this.timeLastShow === null, `timeLastShow should be null until visited`);
      assert(this.msViewtimeAccrued === 0, `msViewtimeAccrued should be 0 until visited`);
    } else {
      assert(this.timeBlock === null, `timeBlock should be null if visit occurs`);
    }
  }
  
  /**
   * Convert an object to this kind of page.
   * 
   * @param data object data representing the page
   * @returns page
   */
  static fromObject(data: any): BasicPage {
    assert(data.type === "BasicPage", `cannot make BasicPage from data with type ${data.type}`);
    return new BasicPage(
      data.timeInitialVisit,
      data.msViewtimeAccrued,
      data.timeBlock
    );
  }

  checkAccess(time: Date): PageAccess {
    if (this.timeBlock === null) {
      return PageAccess.ALLOWED;
    } else {
      return PageAccess.BLOCKED;
    }
  }

  recordEvent(time: Date, event: PageEvent): void {
    switch (event) {
      case PageEvent.VISIT:
        this.handleVisit(time);
        break;
      case PageEvent.SHOW:
        this.handleShow(time);
        break;
      case PageEvent.HIDE:
        this.handleHide(time);
        break;
      default:
        throw "unreachable";
    }
    this.checkRep();
  }

  private handleVisit(time: Date): void {
    if (this.timeInitialVisit !== null) {
      assertTimeSequence(this.timeInitialVisit, time);
    } else {
      this.timeInitialVisit = time;
    }
  }
  
  private handleShow(time: Date): void {
    if (this.timeLastShow !== null) {
      assertTimeSequence(this.timeLastShow, time);
    } else {
      this.timeLastShow = time;
    }
  }
  
  private handleHide(time: Date): void {
    if (this.timeLastShow !== null) {
      assertTimeSequence(this.timeLastShow, time);
      const viewtime = time.getTime() - this.timeLastShow.getTime()
      this.msViewtimeAccrued += viewtime;
      this.timeLastShow = null;
    }
  }

  block(time: Date): void {
    this.timeBlock = time;
    this.timeInitialVisit = null;
    this.msViewtimeAccrued = 0;
    this.timeLastShow = null;
    this.checkRep();
  }
  
  unblock(time: Date): void {
    this.timeBlock = null;
    this.checkRep();
  }
  
  msSinceInitialVisit(time: Date): number | null {
    if (this.timeInitialVisit === null) return null;
    assertTimeSequence(this.timeInitialVisit, time);
    return time.getTime() - this.timeInitialVisit.getTime();
  }
  
  msViewtime(time: Date): number {
    if (this.timeLastShow === null) {
      return this.msViewtimeAccrued;
    } else {
      assertTimeSequence(this.timeLastShow, time);
      return this.msViewtimeAccrued + (time.getTime() - this.timeLastShow.getTime());
    }
  }
  
  msSinceBlock(time: Date): number | null {
    if (this.timeBlock === null) return null;
    assertTimeSequence(this.timeBlock, time);
    return time.getTime() - this.timeBlock.getTime();
  }

  toObject(): any {
    return {
      type: this.type,
      timeInitialVisit: this.timeInitialVisit,
      msViewtimeSpent: this.msViewtimeAccrued,
      timeLastBlock: this.timeBlock,
    };
  }
}
