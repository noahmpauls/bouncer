import type Browser from "webextension-polyfill";
import { type ClientMessage, type FrameMessage } from "@bouncer/message";
import { BrowseEventType, type EventHook, type IEventEmitter, type EventListener, type BrowseEvent } from "./types";


type PartialOnActivatedDetails = Pick<Browser.Tabs.OnActivatedActiveInfoType, "tabId" | "previousTabId">
type PartialOnCommittedDetails = Pick<Browser.WebNavigation.OnCommittedDetailsType, "url" | "tabId" | "frameId" | "timeStamp">
type PartialOnHistoryStateUpdatedDetails = Pick<Browser.WebNavigation.OnHistoryStateUpdatedDetailsType, "url" | "tabId" | "frameId" | "timeStamp">
type PartialMessageSender = Pick<Browser.Runtime.MessageSender, "frameId"> & {
  tab?: Pick<Browser.Tabs.Tab, "id">
}


/**
 * Translates browser extension events into Bouncer-relevant events.
 */
export class BrowserEvents implements IEventEmitter {
  private readonly listeners: {
    message: EventListener<FrameMessage>[],
    browse: EventListener<BrowseEvent>[],
  } = {
    message: [],
    browse: [],
  };

  constructor() { }

  readonly onMessage = this.createHook(this.listeners.message);
  readonly onBrowse = this.createHook(this.listeners.browse);

  handleCommitted = (details: PartialOnCommittedDetails) => {
    this.triggerListeners(this.listeners.browse, {
      time: new Date(details.timeStamp),
      type: BrowseEventType.NAVIGATE,
      url: new URL(details.url),
      tabId: details.tabId,
      frameId: details.frameId,
    });
  }

  handleHistoryStateUpdated = (details: PartialOnHistoryStateUpdatedDetails) => {
    this.triggerListeners(this.listeners.browse, {
      time: new Date(details.timeStamp),
      type: BrowseEventType.NAVIGATE,
      url: new URL(details.url),
      tabId: details.tabId,
      frameId: details.frameId,
    });
  }

  handleActivated = (details: PartialOnActivatedDetails) => {
    this.triggerListeners(this.listeners.browse, {
      time: new Date(),
      type: BrowseEventType.TAB_ACTIVATE,
      tabId: details.tabId,
      previousTabId: details.previousTabId,
    });
  }

  handleRemoved = (tabId: number) => {
    this.triggerListeners(this.listeners.browse, {
      time: new Date(),
      type: BrowseEventType.TAB_REMOVE,
      tabId: tabId,
    });
  }

  handleMessage = (message: ClientMessage, sender: PartialMessageSender) => {
    if (sender.tab?.id === undefined || sender.frameId === undefined) {
      console.warn(`message from tab ${sender.tab?.id}, frame ${sender.frameId}`);
      return;
    }
    this.triggerListeners(this.listeners.message, {
      ...message,
      tabId: sender.tab.id,
      frameId: sender.frameId,
    });
  }

  private createHook<E>(listeners: EventListener<E>[]): EventHook<E> {
    return {
      addListener: (listener: EventListener<E>) => this.addEventListener(listeners, listener),
      removeListener: (listener: EventListener<E>) => this.removeEventListener(listeners, listener),
    }
  }

  private addEventListener<E>(listeners: EventListener<E>[], listener: EventListener<E>) {
    listeners.push(listener);
  }

  private removeEventListener<E>(listeners: EventListener<E>[], listener: EventListener<E>) {
    const existing = listeners.indexOf(listener);
    if (existing !== -1) {
      listeners.splice(existing, 1);
    }
  }

  private triggerListeners<E>(listeners: EventListener<E>[], event: E) {
    for (const listener of listeners) {
      listener(event);
    }
  }
}
