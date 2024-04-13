import type Browser from "webextension-polyfill";
import type { ClientMessage, FrameMessage } from "@bouncer/message";

export type ActivateDetails = Pick<Browser.Tabs.OnActivatedActiveInfoType, "tabId" | "previousTabId">
export type CommitDetails = Pick<Browser.WebNavigation.OnCommittedDetailsType, "url" | "tabId" | "frameId" | "timeStamp">
export type HistoryDetails = Pick<Browser.WebNavigation.OnHistoryStateUpdatedDetailsType, "url" | "tabId" | "frameId" | "timeStamp">
export type MessageSender = Pick<Browser.Runtime.MessageSender, "frameId"> & {
  tab?: Pick<Browser.Tabs.Tab, "id">
}

export interface IBrowserEventHandler {
  handleCommitted(details: CommitDetails): void;
  handleHistoryStateUpdated(details: HistoryDetails): void;
  handleActivated(details: ActivateDetails): void;
  handleRemoved(tabId: number): void;
  handleMessage(message: ClientMessage, sender: MessageSender): void;
}

/**
 * Emitter of events relevant to Bouncer.
 */
export interface IControllerEventEmitter {
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
  previousTabId?: number,
}

export type BrowseTabRemoveEvent = {
  time: Date,
  type: BrowseEventType.TAB_REMOVE,
  tabId: number,
}
