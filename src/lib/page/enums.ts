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
export enum PageEventType {
  /** Frame is first opened. */
  FRAME_OPEN = "frame_open",
  /** Frame becomes visible. */
  FRAME_SHOW = "frame_show",
  /** Frame becomes hidden. */
  FRAME_HIDE = "frame_hide",
  /** Tab closes. */
  TAB_CLOSE = "tab_close",
}

export type Tab = {
  tabId: number,
}

export type Frame = Tab & {
  frameId: number,
}

export type PageEvent =
    FrameOpenEvent
  | FrameShowEvent
  | FrameHideEvent
  | TabCloseEvent
  ;

export type FrameOpenEvent = {
  type: PageEventType.FRAME_OPEN,
  frame: Frame,
}

export type FrameShowEvent = {
  type: PageEventType.FRAME_SHOW,
  frame: Frame,
}

export type FrameHideEvent = {
  type: PageEventType.FRAME_HIDE,
  frame: Frame,
}

export type TabCloseEvent = {
  type: PageEventType.TAB_CLOSE,
  tab: Tab,
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
