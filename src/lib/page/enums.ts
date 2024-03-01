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
  /** Page becomes visible. */
  SHOW = "show",
  /** Page becomes hidden. */
  HIDE = "hide",
}

/**
 * Represents actions that can be taken on a page.
 */
export enum PageActionType {
  /** Block the page. */
  BLOCK = "block",
  /** Clear a block from the page. */
  UNBLOCK = "unblock",
  /** Reset all page metrics. */
  RESET_METRICS = "reset-metrics",
  /** Reset initial visit metrics. */
  RESET_INITIALVISIT = "reset-initialvisit",
  /** Reset viewtime metrics. */
  RESET_VIEWTIME = "reset-viewtime",
}

/**
 * Represents an action taken on a page at a certain time.
 */
export type PageAction = {
  /** Type of action. */
  type: PageActionType,
  /** Time of action. */
  time: Date,
}
