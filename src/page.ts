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
   * @param duration duration of the block, in ms
   */
  block(time: Date, duration: number): void;
  
  /**
   * Convert page to an object representation.
   * 
   * @returns object representing page
   */
  toObject(): any;
  
  // TODO: need to expose metrics for storage and rule actions.
}


/**
 * Deserialize a page from an object.
 * 
 * @param data object data representing page
 * @returns deserialized page
 */
export function deserializePage(data: any): IPage {
  throw new Error("Function not implemented.");
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
