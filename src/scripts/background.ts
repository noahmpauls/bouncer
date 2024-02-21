import browser from "webextension-polyfill";
import { BrowserStorage } from "@bouncer/storage";
import { StoredBouncerData } from "@bouncer/data";
import { PageAccess, PageEventType, type PageEvent } from "@bouncer/page";
import { Synchronizer } from "@bouncer/utils";
import { CachedBouncerContext, type IBouncerContext } from "@bouncer/context";
import type { IGuard } from "@bouncer/guard";
import { PageMessageType, type PageMessage, type BouncerMessage, PageStatus } from "./message";


// TODO: move most of this to its own ADT
const synchronizer: Synchronizer = new Synchronizer();
const cache: IBouncerContext = new CachedBouncerContext(new StoredBouncerData(new BrowserStorage()));

// TODO: abstractify messaging
browser.runtime.onMessage.addListener(handleMessage);

async function handleMessage(message: PageMessage, sender: browser.Runtime.MessageSender) {
 await synchronizer.sync(async () => {
  const senderId = constructSenderId(sender);
  if (senderId === null) {
    console.log(`${message.time.getTime()} back: received ${message.type} from null sender`);
    return Promise.resolve(null);
  }
  console.log(`${message.time.getTime()} back: received ${message.type} from ${senderId}`);

  let url = new URL(sender.url ?? "");
  let response: BouncerMessage | null = null;
  switch (message.type) {
    case PageMessageType.CHECK:
      response = await handlePageEvent(message.time, null, url);
      break;
    case PageMessageType.VISIT:
      response = await handlePageEvent(message.time, { type: PageEventType.FRAME_OPEN, frame: { tabId: sender.tab!.id!, frameId: sender.frameId! }}, url);
      break;
    case PageMessageType.SHOW:
      response = await handlePageEvent(message.time, { type: PageEventType.FRAME_SHOW, frame: { tabId: sender.tab!.id!, frameId: sender.frameId! }}, url);
      break;
    case PageMessageType.HIDE:
      response = await handlePageEvent(message.time, { type: PageEventType.FRAME_HIDE, frame: { tabId: sender.tab!.id!, frameId: sender.frameId! }}, url);
      break;
    // rules were changed externally, so need to refresh them
    case PageMessageType.REFRESH:
      cache.refresh();
      break;
    default:
      response = null;
      break;
  }
  
  // persist any changes made to cache (don't await)
  cache.persist();
  
  // return the response
  // TODO: this fails when the tab is the Bouncer settings page
  browser.tabs.sendMessage(sender.tab?.id!, response, { frameId: sender.frameId });
 });
}


async function handlePageEvent(time: Date, event: PageEvent | null, url: URL): Promise<BouncerMessage> {
  // get rules associated with this sender
  const applicable: IGuard[] = await cache.applicableGuards(url);
  if (applicable.length === 0) {
    return {
      status: PageStatus.UNTRACKED,
    }
  }

  let block = false;
  let viewtimeChecks: Date[] = [];
  let windowChecks: Date[] = [];

  for (const guard of applicable) {
    const page = guard.page;
    const policy = guard.policy
    // apply any necessary resets prior to recording event
    policy.enforce(time, page);
    if (event !== null) {
      page.recordEvent(time, event);
      policy.enforce(time, page);
    }
    block ||= page.access() === PageAccess.BLOCKED;

    const viewtimeCheck = policy.nextViewEvent(time, page);
    if (viewtimeCheck !== null) {
      viewtimeChecks.push(viewtimeCheck);
    }
    const windowCheck = policy.nextTimelineEvent(time, page);
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
    status: block ? PageStatus.BLOCKED : PageStatus.ALLOWED,
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
