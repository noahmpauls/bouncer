import browser from "webextension-polyfill";
import { BrowserStorage } from "@bouncer/storage";
import { StoredBouncerData } from "@bouncer/data";
import { PageAccess, PageEvent } from "@bouncer/page";
import { Synchronizer } from "@bouncer/utils";
import { CachedBouncerContext, type IBouncerContext } from "@bouncer/context";
import type { IGuard } from "@bouncer/guard";


// TOOD: move most of this to its own ADT

const synchronizer: Synchronizer = new Synchronizer();
const cache: IBouncerContext = new CachedBouncerContext(new StoredBouncerData(new BrowserStorage()));

// TODO: abstractify messaging, add explicit types to messages
browser.runtime.onMessage.addListener(async (message, sender) => await synchronizer.sync(async () => {
  const senderId = constructSenderId(sender);
  if (senderId === null) {
    console.log(`${message.time.getTime()} back: received ${message.type} from null sender`);
    return Promise.resolve(null);
  }
  console.log(`${message.time.getTime()} back: received ${message.type} from ${senderId}`);

  let messageType: string = message.type;
  let messageTime: Date = message.time;

  let url = new URL(sender.url ?? "");
  let response: any = null;
  switch (messageType) {
    case "CHECK":
      response = await handlePageEvent(messageTime, null, url, senderId);
      break;
    case "VISIT":
      response = await handlePageEvent(messageTime, PageEvent.VISIT, url, senderId);
      break;
    case "SHOW":
      response = await handlePageEvent(messageTime, PageEvent.SHOW, url, senderId);
      break;
    case "HIDE":
      response = await handlePageEvent(messageTime, PageEvent.HIDE, url, senderId);
      break;
    // rules were changed externally, so need to refresh them
    case "REFRESH":
      cache.refresh();
      break;
    default:
      response = null;
      break;
  }
  
  // persist any changes made to cache (don't await)
  cache.persist();
  
  // return the response
  return Promise.resolve(response);
}));


async function handlePageEvent(time: Date, event: PageEvent | null, url: URL, sender: string): Promise<any> {
  // get rules associated with this sender
  const applicable: IGuard[] = await cache.applicableGuards(url);
  if (applicable.length === 0) {
    return {
      status: "UNTRACKED",
    }
  }

  let block = false;
  let viewtimeChecks: Date[] = [];
  let windowChecks: Date[] = [];

  for (const guard of applicable) {
    const page = guard.page;
    const policy = guard.policy
    // apply any necessary resets prior to recording event
    policy.enforcer.applyTo(time, page);
    if (event !== null) {
      page.recordEvent(time, event, sender);
      policy.enforcer.applyTo(time, page);
    }
    block ||= page.access() === PageAccess.BLOCKED;

    const viewtimeCheck = policy.enforcer.nextViewEvent(time, page);
    if (viewtimeCheck !== null) {
      viewtimeChecks.push(viewtimeCheck);
    }
    const windowCheck = policy.enforcer.nextTimelineEvent(time, page);
    if (windowCheck !== null) {
      windowChecks.push(windowCheck);
    }
  }
  
  const viewtimeCheck = viewtimeChecks.length > 0
    ? new Date(Math.min(...viewtimeChecks.filter(d => d !== null).map(d => d!.getTime())))
    : undefined;
  const windowCheck = windowChecks.length > 0
    ? new Date(Math.min(...windowChecks.filter(d => d !== null).map(d => d!.getTime())))
    : undefined;

  return {
    status: block ? "BLOCKED" : "ALLOWED",
    viewtimeCheck,
    windowCheck,
  };
}


function constructSenderId(sender: browser.Runtime.MessageSender): string | null {
  const senderId = sender.id;
  const tabId = sender.tab?.id;
  const frameId = sender.frameId;
  if (senderId === undefined || tabId === undefined || frameId === undefined) {
    return null;
  }
  const id = [senderId, tabId, frameId].join("-");
  return id;
}

/*
browser.tabs.onCreated.addListener((tab) => {
  console.log(`${Date.now()} back: tab ${tab.id} onCreated with URL ${tab.url}`);
})

browser.tabs.onActivated.addListener((activeInfo) => {
  const tab = browser.tabs.get(activeInfo.tabId).then(tab => {
    console.log(`${Date.now()} back: tab ${activeInfo.tabId} onActivated with URL ${tab.url} and window ${activeInfo.windowId}`);
  });
})

browser.tabs.onAttached.addListener((tabId, attachInfo) => {
  console.log(`${Date.now()} back: tab ${tabId} onAttached to window ${attachInfo.newWindowId}`);
})

browser.tabs.onDetached.addListener((tabId, detachInfo) => {
  console.log(`${Date.now()} back: tab ${tabId} onDetached from window ${detachInfo.oldWindowId}`);
})

browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log(`${Date.now()} back: tab ${tabId} onRemoved from window ${removeInfo.windowId}`);
})

browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  console.log(`${Date.now()} back: tab ${tabId} onUpdated with URL ${changeInfo.url}`);
}, { properties: ["url"]})
*/
