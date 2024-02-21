import type { BasicPageData } from "./BasicPage";
import type { PageEvent, PageActionType, PageAccess } from "./enums";

/**
 * Represents a webpage that can be browsed and blocked.
 */
export interface IPage extends IPageMetrics {
  /**
   * Record the occurence of an event on the page from a particular page
   * viewer.
   * 
   * @param time event time
   * @param event the event to record
   */
  recordEvent(time: Date, event: PageEvent): void;
  
  /**
   * Take an action on the page at the given time.
   * 
   * @param type the type of action to take
   * @param time the time of the action
   */
  recordAction(type: PageActionType, time: Date): void;

  /**
   * Convert the page to an object representation. The representation must
   * include a field "type" that indicates the type of page represented.
   * 
   * @returns object representing page
   */
  toObject(): PageData;
}


export interface IPageMetrics {
  /**
   * Get the current level of view access to the page.
   *
   * @returns the access status of the page
   */
  access(): PageAccess;

  /**
   * Get whether the page is currently showing in any context.
   * 
   * @returns whether the page is currently showing
   */
  isShowing(): boolean;

  /**
   * Milliseconds since the first page visit since an unblock (or ever).
   * TODO null if...
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
  
  /**
   * Milliseconds since last time the page was hidden. Returns null if the page
   * has never been hidden since being blocked.
   * 
   * @param time the current time
   * @returns milliseconds since most recent hide
   */
  msSinceHide(time: Date): number | null;
  
  /**
   * Milliseconds since last time the page was updated in any way.
   * 
   * @param time the current time
   * @returns milliseconds since most recent update
   */
  msSinceUpdate(time: Date): number | null;
}

/**
 * Union of all types that represent pages in their serialized form.
 */
export type PageData = 
  BasicPageData;
