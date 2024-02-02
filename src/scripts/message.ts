/**
 * Represents a message sent from a page to Bouncer.
 */
export type PageMessage = {
  /** Type of message to send. */
  type: PageMessageType,
  /** Time of message. */
  time: Date,
}

/**
 * Represents the type of a page message.
 */
export enum PageMessageType {
  /** Check the status of the current page. */
  CHECK = "check",
  /** Record a visit for the current page. */
  VISIT = "visit",
  /** Record a show for the current page. */
  SHOW = "show",
  /** Record a hide for the current page. */
  HIDE = "hide",
  /** Trigger a refresh of the Bouncer data cache. */
  REFRESH = "refresh",
}

/** Represents a message sent from Bouncer to a page. */
export type BouncerMessage = {
  /** The access status of the page. */
  status: PageStatus,
  /** The next time Bouncer recommends checking for a window-based update. */
  windowCheck?: Date | undefined,
  /** The next time Bouncer recommends checking for a viewtime-based update. */
  viewtimeCheck?: Date | undefined,
}

/** 
 * Represents the status of the page as seen by Bouncer.
 */
export enum PageStatus {
  /** Bouncer does not track the page. */
  UNTRACKED = "untracked",
  /** Bouncer has blocked the page. */
  ALLOWED = "allowed",
  /** Bouner allows the page. */
  BLOCKED = "blocked",
}
