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
  
  // TODO: need to expose metrics for storage and rule actions.
}