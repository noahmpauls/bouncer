import browser from "webextension-polyfill";
import { ClientMessageType, type ClientMessage } from "@bouncer/message";
import { type BouncerStatusEvent, type BouncerBrowseEvent, BouncerEventType, BrowseEventType, type EventHook, type IEventEmitter, type EventListener } from "./types";


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
  } = {
    status: [],
    browse: [],
  };

  constructor() { }

  readonly onStatus = this.createHook(this.listeners.status);
  readonly onBrowse = this.createHook(this.listeners.browse);

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

  handleMessage = (message: ClientMessage, sender: PartialMessageSender) => {
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
      case ClientMessageType.CHECK: 
        this.triggerListeners(this.listeners.status, { type: BouncerEventType.STATUS, ...event });
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
