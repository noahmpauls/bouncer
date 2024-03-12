import type { FrameMessage } from "@bouncer/message";

/**
 * Emitter of events relevant to Bouncer.
 */
export interface IEventEmitter {
  readonly onMessage: EventHook<FrameMessage>;
  readonly onBrowse: EventHook<BrowseEvent>;
}

export type EventListener<E> = (event: E) => void;

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

export type BrowseNavigateEvent = {
  time: Date,
  type: BrowseEventType.NAVIGATE,
  tabId: number,
  frameId: number,
  url: URL,
}

export type BrowseTabActivateEvent = {
  time: Date,
  type: BrowseEventType.TAB_ACTIVATE,
  tabId: number,
  previousTabId?: number,
}

export type BrowseTabRemoveEvent = {
  time: Date,
  type: BrowseEventType.TAB_REMOVE,
  tabId: number,
}
