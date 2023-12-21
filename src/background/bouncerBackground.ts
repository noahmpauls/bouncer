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
  console.log(`${message.time.getTime()} back: received ${message.type}`);

  let messageType: string = message.type;
  let messageTime: Date = message.time;

  let url = new URL(sender.url ?? "");
  let senderId = constructSenderId(sender);
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


function constructSenderId(sender: browser.Runtime.MessageSender): string {
  const senderId = sender.id ?? "X";
  const windowId = sender.tab?.windowId ?? "X";
  const tabId = sender.tab?.id ?? "X";
  const frameId = sender.frameId ?? "X";
  const id = [senderId, windowId, tabId, frameId].join("-");
  return id;
}
