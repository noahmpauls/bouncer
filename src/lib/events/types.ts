import type { FrameMessage } from "@bouncer/message";

/**
 * Emitter of events relevant to Bouncer.
 */
export interface IControllerEventEmitter {
  /** Start listening for events. */
  start(): void;
  /** Stop listening for events. */
  stop(): void;
  readonly onMessage: EventHook<FrameMessage>;
  readonly onBrowse: EventHook<BrowseEvent>;
  readonly onSystem: EventHook<SystemEvent>;
}

export type EventListener<E> = (event: E) => Promise<void>;

export type EventHook<E> = {
  addListener(listener: EventListener<E>): void;
  removeListener(listener: EventListener<E>): void;
}

export enum BrowseEventType {
  NAVIGATE = "navigate",
  TAB_ACTIVATE = "tab_activate",
  TAB_REMOVE = "tab_remove",
}

export type BrowseEvent =
    BrowseNavigateEvent
  | BrowseTabActivateEvent
  | BrowseTabRemoveEvent
  ;

export enum FrameContext {
  ROOT = "root",
  EMBED = "embed",
}

export enum PageOwner {
  SELF = "self",
  WEB = "web",
}

export type BrowseLocation = {
  url: URL,
  context: FrameContext,
  owner: PageOwner,
}

export type BrowseNavigateEvent = {
  time: Date,
  type: BrowseEventType.NAVIGATE,
  tabId: number,
  frameId: number,
  location: BrowseLocation,
}

export type BrowseTabActivateEvent = {
  time: Date,
  type: BrowseEventType.TAB_ACTIVATE,
  tabId: number,
  /**
   * If tab activation results in another tab's deactivation, contains the ID
   * of the deactivated tab.
   */
  previousTabId?: number,
}

export type BrowseTabRemoveEvent = {
  time: Date,
  type: BrowseEventType.TAB_REMOVE,
  tabId: number,
}

export enum SystemEventType {
  HEARTBEAT = "heartbeat",
}

export type SystemEvent = SystemHeartbeatEvent;

export type SystemHeartbeatEvent = {
  time: Date,
  type: SystemEventType.HEARTBEAT,
}
