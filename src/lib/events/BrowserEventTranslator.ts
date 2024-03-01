import browser from "webextension-polyfill";
import { type PageMessage, PageMessageType } from "scripts/message";
import { type BouncerStatusEvent, type BouncerRefreshEvent, type BouncerBrowseEvent, BouncerEventType, BrowseEventType, type EventHook, type IEventEmitter, type EventListener } from "./types";


type PartialOnActivatedDetails = Pick<browser.Tabs.OnActivatedActiveInfoType, "tabId" | "previousTabId">
type PartialOnCommittedDetails = Pick<browser.WebNavigation.OnCommittedDetailsType, "url" | "tabId" | "frameId" | "timeStamp">
type PartialOnHistoryStateUpdatedDetails = Pick<browser.WebNavigation.OnHistoryStateUpdatedDetailsType, "url" | "tabId" | "frameId" | "timeStamp">
type PartialMessageSender = Pick<browser.Runtime.MessageSender, "frameId"> & {
  tab?: Pick<browser.Tabs.Tab, "id">
}


/**
 * Translates browser extension events into Bouncer-relevant events.
 */
export class BrowserEventTranslator implements IEventEmitter {
  private readonly listeners: {
    status: EventListener<BouncerStatusEvent>[],
    browse: EventListener<BouncerBrowseEvent>[],
    refresh: EventListener<BouncerRefreshEvent>[],
  } = {
    status: [],
    browse: [],
    refresh: [],
  };

  constructor() { }

  readonly onStatus = this.createHook(this.listeners.status);
  readonly onBrowse = this.createHook(this.listeners.browse);
  readonly onRefresh = this.createHook(this.listeners.refresh);

  handleCommitted = (details: PartialOnCommittedDetails) => {
    this.triggerListeners(this.listeners.browse, {
      type: BouncerEventType.BROWSE,
      time: new Date(details.timeStamp),
      browseEvent: {
        type: BrowseEventType.NAVIGATE,
        url: new URL(details.url),
        tabId: details.tabId,
        frameId: details.frameId,
      }
    });
  }

  handleHistoryStateUpdated = (details: PartialOnHistoryStateUpdatedDetails) => {
    this.triggerListeners(this.listeners.browse, {
      type: BouncerEventType.BROWSE,
      time: new Date(details.timeStamp),
      browseEvent: {
        type: BrowseEventType.NAVIGATE,
        url: new URL(details.url),
        tabId: details.tabId,
        frameId: details.frameId,
      }
    });
  }

  handleActivated = (details: PartialOnActivatedDetails) => {
    this.triggerListeners(this.listeners.browse, {
      type: BouncerEventType.BROWSE,
      time: new Date(),
      browseEvent: {
        type: BrowseEventType.TAB_ACTIVATE,
        tabId: details.tabId,
        previousTabId: details.previousTabId,
      }
    });
  }

  handleRemoved = (tabId: number) => {
    this.triggerListeners(this.listeners.browse, {
      type: BouncerEventType.BROWSE,
      time: new Date(),
      browseEvent: {
        type: BrowseEventType.TAB_REMOVE,
        tabId: tabId,
      }
    });
  }

  handleMessage = (message: PageMessage, sender: PartialMessageSender) => {
    if (sender.tab?.id === undefined || sender.frameId === undefined) {
      console.warn("event translator: received message with undefined fields");
      return;
    }
    const event = {
      time: message.time,
      tabId: sender.tab?.id,
      frameId: sender.frameId,
    }

    switch (message.type) {
      case PageMessageType.CHECK: 
        this.triggerListeners(this.listeners.status, { type: BouncerEventType.STATUS, ...event });
        break;
      case PageMessageType.REFRESH:
        this.triggerListeners(this.listeners.refresh, { type: BouncerEventType.REFRESH, ...event });
        break;
      default:
        console.warn(`translation error: unsupported message type ${message.type}`)
    }
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
