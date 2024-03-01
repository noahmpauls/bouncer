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
  /** Trigger a refresh of the Bouncer data cache. */
  REFRESH = "refresh",
}

/** Represents a message sent from Bouncer to a page. */
export type BouncerMessage = {
  /** The access status of the page. */
  status: FrameStatus,
  /** The next time Bouncer recommends checking for a window-based update. */
  windowCheck?: Date | undefined,
  /** The next time Bouncer recommends checking for a viewtime-based update. */
  viewtimeCheck?: Date | undefined,
}

/** 
 * Represents the status of a frame as seen by Bouncer.
 */
export enum FrameStatus {
  /** Bouncer does not track the frame. */
  UNTRACKED = "untracked",
  /** Bouncer has blocked the frame. */
  ALLOWED = "allowed",
  /** Bouner allows the frame. */
  BLOCKED = "blocked",
}
