/**
 * Emitter of events relevant to Bouncer.
 */
export interface IEventEmitter {
  readonly onStatus: EventHook<BouncerStatusEvent>;
  readonly onBrowse: EventHook<BouncerBrowseEvent>;
}

export type EventListener<E> = (event: E) => void;

export type EventHook<E> = {
  addListener(listener: EventListener<E>): void;
  removeListener(listener: EventListener<E>): void;
}

export enum BouncerEventType {
  STATUS = "status",
  BROWSE = "browse",
}

export type BouncerEvent =
    BouncerStatusEvent
  | BouncerBrowseEvent
  ;

export type BouncerStatusEvent = {
  type: BouncerEventType.STATUS,
  time: Date,
  tabId: number,
  frameId: number,
}

export type BouncerBrowseEvent = {
  type: BouncerEventType.BROWSE,
  time: Date,
  browseEvent: BrowseEvent,
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
  type: BrowseEventType.NAVIGATE,
  tabId: number,
  frameId: number,
  url: URL,
}

export type BrowseTabActivateEvent = {
  type: BrowseEventType.TAB_ACTIVATE,
  tabId: number,
  previousTabId?: number,
}

export type BrowseTabRemoveEvent = {
  type: BrowseEventType.TAB_REMOVE,
  tabId: number,
}