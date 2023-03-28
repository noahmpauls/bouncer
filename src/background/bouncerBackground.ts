import browser from "webextension-polyfill";
import { BrowserStorage } from "@bouncer/storage";
import { StoredBouncerData } from "@bouncer/data";
import { IPage, PageAccess, PageEvent } from "@bouncer/page";
import { IPolicy } from "@bouncer/policy";
import { Synchronizer } from "@bouncer/utils";
import { BouncerCache, IBouncerCache } from "./cache";


const synchronizer: Synchronizer = new Synchronizer();
const cache: IBouncerCache = new BouncerCache(new StoredBouncerData(new BrowserStorage()));

browser.runtime.onMessage.addListener(async (message, sender) => await synchronizer.sync(async () => {
  console.log(`${message.time.getTime()} back: received ${message.type}`);

  let messageType: string = message.type;
  let messageTime: Date = message.time;
  // TODO: this is just yike
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
  const applicable: IPolicy[] = await cache.getApplicablePolicies(url);
  if (applicable.length === 0) {
    return {
      status: "UNTRACKED",
    }
  }

  let block = false;
  let viewtimeCheck = Infinity;
  let windowCheck = Infinity;

  for (const policy of applicable) {
    // apply any necessary resets prior to recording event
    policy.enforcer.applyTo(time, policy.page);
    if (event !== null) {
      policy.page.recordEvent(time, event, sender);
    }
    policy.enforcer.applyTo(time, policy.page);
    block ||= policy.page.checkAccess(time) === PageAccess.BLOCKED;
    // if page isn't showing, don't perform viewtime check
    if (policy.page.isShowing(time)) {
      viewtimeCheck = Math.min(viewtimeCheck, time.getTime() + policy.enforcer.remainingViewtime(time, policy.page));
    }
    windowCheck = Math.min(windowCheck, time.getTime() + policy.enforcer.remainingWindow(time, policy.page));
  }

  return {
    status: block ? "BLOCKED" : "ALLOWED",
    viewtimeCheck: viewtimeCheck < Infinity ? new Date(viewtimeCheck) : undefined,
    windowCheck: windowCheck < Infinity ? new Date(windowCheck) : undefined,
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
