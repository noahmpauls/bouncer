import { browser } from "@bouncer/browser";
import type { ClientMessage, FrameMessage } from "@bouncer/message";
import type Browser from "webextension-polyfill";
import { type IControllerEventEmitter, type BrowseEvent, type SystemEvent, BrowseEventType, SystemEventType, type BrowseLocation, FrameContext, PageOwner, type EventHook, type EventListener } from "./types";

type ActivateDetails = Pick<Browser.Tabs.OnActivatedActiveInfoType, "tabId" | "previousTabId">
type CommitDetails = Pick<Browser.WebNavigation.OnCommittedDetailsType, "url" | "tabId" | "frameId" | "timeStamp">
type HistoryDetails = Pick<Browser.WebNavigation.OnHistoryStateUpdatedDetailsType, "url" | "tabId" | "frameId" | "timeStamp">
type MessageSender = Pick<Browser.Runtime.MessageSender, "frameId"> & {
  tab?: Pick<Browser.Tabs.Tab, "id">
}
type AlarmDetails = Pick<Browser.Alarms.Alarm, "name">

enum Alarms {
  HEARTBEAT = "heartbeat",
}

/**
 * Translates browser extension events into Bouncer-relevant events.
 */
export class BrowserEvents implements IControllerEventEmitter {
  private readonly listeners: {
    message: EventListener<FrameMessage>[],
    browse: EventListener<BrowseEvent>[],
    system: EventListener<SystemEvent>[],
  } = {
    message: [],
    browse: [],
    system: [],
  };

  constructor(
    private readonly extensionUrl: string,
  ) { }
  
  static browser = () => {
    return new BrowserEvents(browser.runtime.getURL("/"));
  }

  readonly onMessage = this.createHook(this.listeners.message);
  readonly onBrowse = this.createHook(this.listeners.browse);
  readonly onSystem = this.createHook(this.listeners.system);

  start = () => {
    browser.tabs.onActivated.addListener(this.handleActivated);
    browser.tabs.onRemoved.addListener(this.handleRemoved);
    browser.webNavigation.onCommitted.addListener(this.handleCommitted);
    browser.webNavigation.onHistoryStateUpdated.addListener(this.handleHistoryStateUpdated);
    browser.runtime.onMessage.addListener(this.handleMessage);
    browser.alarms.onAlarm.addListener(this.handleAlarm);

    browser.alarms.create(Alarms.HEARTBEAT, { periodInMinutes: 0.5 });
  }

  stop = () => {
    browser.alarms.clear(Alarms.HEARTBEAT);

    browser.tabs.onActivated.removeListener(this.handleActivated);
    browser.tabs.onRemoved.removeListener(this.handleRemoved);
    browser.webNavigation.onCommitted.removeListener(this.handleCommitted);
    browser.webNavigation.onHistoryStateUpdated.removeListener(this.handleHistoryStateUpdated);
    browser.runtime.onMessage.removeListener(this.handleMessage);
    browser.alarms.onAlarm.removeListener(this.handleAlarm);
  }

  private handleCommitted = async (details: CommitDetails) => {
    await this.triggerListeners(this.listeners.browse, {
      time: new Date(details.timeStamp),
      type: BrowseEventType.NAVIGATE,
      tabId: details.tabId,
      frameId: details.frameId,
      location: this.location(details.url, details.frameId),
    });
  }

  private handleHistoryStateUpdated = async (details: HistoryDetails) => {
    await this.triggerListeners(this.listeners.browse, {
      time: new Date(details.timeStamp),
      type: BrowseEventType.NAVIGATE,
      tabId: details.tabId,
      frameId: details.frameId,
      location: this.location(details.url, details.frameId),
    });
  }

  private handleActivated = async (details: ActivateDetails) => {
    await this.triggerListeners(this.listeners.browse, {
      time: new Date(),
      type: BrowseEventType.TAB_ACTIVATE,
      tabId: details.tabId,
      // when popping a tab out of a window, previous tab is same as activated tab
      previousTabId: details.previousTabId !== details.tabId ? details.previousTabId : undefined,
    });
  }

  private handleRemoved = async (tabId: number) => {
    await this.triggerListeners(this.listeners.browse, {
      time: new Date(),
      type: BrowseEventType.TAB_REMOVE,
      tabId: tabId,
    });
  }

  private handleMessage = async (message: ClientMessage, sender: MessageSender) => {
    if (sender.tab?.id === undefined || sender.frameId === undefined) {
      console.warn(`message from tab ${sender.tab?.id}, frame ${sender.frameId}`);
      return;
    }
    await this.triggerListeners(this.listeners.message, {
      ...message,
      tabId: sender.tab.id,
      frameId: sender.frameId,
    });
  }

  private handleAlarm = async (alarm: AlarmDetails) => {
    switch (alarm.name) {
      case Alarms.HEARTBEAT:
        await this.triggerListeners(this.listeners.system, {
          // TODO: clock provider?
          time: new Date(),
          type: SystemEventType.HEARTBEAT,
        });
        break;
    }
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

  private async triggerListeners<E>(listeners: EventListener<E>[], event: E) {
    await Promise.all(listeners.map(l => l(event)));
  }
}
