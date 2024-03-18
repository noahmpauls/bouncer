import { type ClientMessage, type FrameMessage } from "@bouncer/message";
import { BrowseEventType, type EventHook, type IControllerEventEmitter, type EventListener, type BrowseEvent, type IBrowserEventHandler, type CommitDetails, type HistoryDetails, type ActivateDetails, type MessageSender } from "./types";

/**
 * Translates browser extension events into Bouncer-relevant events.
 */
export class BrowserEvents implements IControllerEventEmitter, IBrowserEventHandler {
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

  handleCommitted = (details: CommitDetails) => {
    this.triggerListeners(this.listeners.browse, {
      time: new Date(details.timeStamp),
      type: BrowseEventType.NAVIGATE,
      url: new URL(details.url),
      tabId: details.tabId,
      frameId: details.frameId,
    });
  }

  handleHistoryStateUpdated = (details: HistoryDetails) => {
    this.triggerListeners(this.listeners.browse, {
      time: new Date(details.timeStamp),
      type: BrowseEventType.NAVIGATE,
      url: new URL(details.url),
      tabId: details.tabId,
      frameId: details.frameId,
    });
  }

  handleActivated = (details: ActivateDetails) => {
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

  handleMessage = (message: ClientMessage, sender: MessageSender) => {
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
