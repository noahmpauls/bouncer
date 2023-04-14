import { BasicPage, BasicPageData } from "./BasicPage";
import { PageAccess, PageActionType, PageEvent } from "./enums";


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
   * @param viewer unique ID of the viewer
   */
  recordEvent(time: Date, event: PageEvent, viewer: string): void;
  
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
 * Deserialize a page from an object.
 * 
 * @param obj object data representing page
 * @returns deserialized page
 */
export function deserializePage(obj: PageData): IPage {
  switch (obj.type) {
    case "BasicPage":
      return BasicPage.fromObject(obj);
    default:
      throw new Error(`invalid policy type ${obj.type} cannot be deserialized`)
  }
}


/**
 * Serialize a page to an object representation.
 * 
 * @param page the page to serialize
 * @returns serialized page object
 */
export function serializePage(page: IPage): PageData {
  return page.toObject();
}


/**
 * Union of all types that represent pages in their serialized form.
 */
export type PageData = 
  BasicPageData;


export * from "./enums";
export { BasicPage } from "./BasicPage";
