import browser from "webextension-polyfill";
import { BrowserStorage } from "../browserStorage";
import { StoredBouncerData } from "../data";
import { IPage, PageAccess, PageEvent } from "../page";
import { IPolicy } from "../policy";
import { Sync } from "../utils";
import { BouncerCache, IBouncerCache } from "./cache";


const synchronizer: Sync = new Sync();
const cache: IBouncerCache = new BouncerCache(new StoredBouncerData(new BrowserStorage()));

browser.runtime.onMessage.addListener(async (message, sender) => await synchronizer.sync(async () => {
  console.log(`${message.time.getTime()} back: received ${message.type}`);
  console.log(`${message.time.getTime()} back: sender has id ${sender.id}, frame ${sender.frameId}, tab ${sender.tab?.id}`);

  // switch case to use proper event handler
  let messageType: string = message.type;
  let messageTime: Date = message.time;
  // TODO: this is just yike
  let parsedSender = { id: sender.id ?? "", url: new URL(sender.url ?? "") }
  let response: any = null;
  switch (messageType) {
    case "CHECK":
      response = await handlePageEvent(messageTime, null, parsedSender);
      break;
    case "VISIT":
      response = await handlePageEvent(messageTime, PageEvent.VISIT, parsedSender);
      break;
    case "SHOW":
      response = await handlePageEvent(messageTime, PageEvent.SHOW, parsedSender);
      break;
    case "HIDE":
      response = await handlePageEvent(messageTime, PageEvent.HIDE, parsedSender);
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


async function handlePageEvent(time: Date, event: PageEvent | null, sender: { url: URL, id: string }): Promise<any> {
  // get rules associated with this sender
  const applicable: IPolicy[] = await cache.getApplicablePolicies(sender.url);
  if (applicable.length === 0) {
    return {
      status: "UNTRACKED",
    }
  }

  let block = false;
  let viewtimeCheck = Infinity;
  // let nextWindowCheck = null;

  for (const policy of applicable) {
    if (event !== null) {
      // TODO: alter pages to support multiple concurrent viewers
      // policy.page.recordEvent(time, event, sender);
      policy.page.recordEvent(time, event);
    }
    policy.enforcer.applyTo(time, policy.page);
    block ||= policy.page.checkAccess(time) === PageAccess.BLOCKED;
    viewtimeCheck = Math.min(viewtimeCheck, time.getTime() + policy.enforcer.remainingViewtime(time, policy.page));
  }

  return {
    status: block ? "BLOCKED" : "ALLOWED",
    viewtimeCheck: viewtimeCheck < Infinity ? new Date(viewtimeCheck) : undefined,
  };
}
