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
 * Represents resets that can be applied to a page.
 */
export enum PageReset {
  /** Viewtime reset. */
  VIEWTIME = "viewtime",
  /** Initial visit time reset. */
  INITIALVISIT = "initialVisit",
}
