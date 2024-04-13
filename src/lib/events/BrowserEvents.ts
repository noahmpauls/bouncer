import { type ClientMessage, type FrameMessage } from "@bouncer/message";
import { BrowseEventType, type EventHook, type IControllerEventEmitter, type EventListener, type BrowseEvent, type IBrowserEventHandler, type CommitDetails, type HistoryDetails, type ActivateDetails, type MessageSender, FrameContext, type BrowseLocation, PageOwner } from "./types";
import { browser } from "@bouncer/browser";

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

  constructor(
    private readonly extensionUrl: string,
  ) { }
  
  static browser = () => {
    return new BrowserEvents(browser.runtime.getURL("/"));
  }

  readonly onMessage = this.createHook(this.listeners.message);
  readonly onBrowse = this.createHook(this.listeners.browse);

  handleCommitted = (details: CommitDetails) => {
    this.triggerListeners(this.listeners.browse, {
      time: new Date(details.timeStamp),
      type: BrowseEventType.NAVIGATE,
      tabId: details.tabId,
      frameId: details.frameId,
      location: this.location(details.url, details.frameId),
    });
  }

  handleHistoryStateUpdated = (details: HistoryDetails) => {
    this.triggerListeners(this.listeners.browse, {
      time: new Date(details.timeStamp),
      type: BrowseEventType.NAVIGATE,
      tabId: details.tabId,
      frameId: details.frameId,
      location: this.location(details.url, details.frameId),
    });
  }

  handleActivated = (details: ActivateDetails) => {
    this.triggerListeners(this.listeners.browse, {
      time: new Date(),
      type: BrowseEventType.TAB_ACTIVATE,
      tabId: details.tabId,
      // when popping a tab out of a window, previous tab is same as activated tab
      previousTabId: details.previousTabId !== details.tabId ? details.previousTabId : undefined,
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

  private location = (url: string, frameId: number): BrowseLocation => ({
    url: new URL(url),
    context: frameId === 0 ? FrameContext.ROOT : FrameContext.EMBED,
    owner: url.startsWith(this.extensionUrl) ? PageOwner.SELF : PageOwner.WEB,
  });

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
