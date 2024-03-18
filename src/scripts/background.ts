import { browser } from "@bouncer/browser";
import { BrowserEvents } from "@bouncer/events";
import { Controller } from "@bouncer/controller";
import { BrowserControllerMessenger } from "@bouncer/message";
import { SyncedCache } from "@bouncer/cache";
import { BouncerContext } from "@bouncer/data/BouncerContext";

const bouncerContext = BouncerContext.browser();

const controllerCache = new SyncedCache(async () => {
  return bouncerContext.fetch()
    .then(data => new Controller(data.guards, data.guardPostings, data.activeTabs, BrowserControllerMessenger))
});

const controller = () => {
  return controllerCache.value();
}

const saveOnComplete = (func: (...args: any[]) => Promise<void>) => {
  return async (...args: any[]) => {
    await func(...args)
    await bouncerContext.commit();
    logTimestamp(new Date(), "data saved.");
  }
}

const logTimestamp = (time: Date, message: string) => console.log(`${time.getTime()} ${ message }`)

const eventEmitter = new BrowserEvents();
browser.tabs.onActivated.addListener(eventEmitter.handleActivated);
browser.tabs.onRemoved.addListener(eventEmitter.handleRemoved);
browser.webNavigation.onCommitted.addListener(eventEmitter.handleCommitted);
browser.webNavigation.onHistoryStateUpdated.addListener(eventEmitter.handleHistoryStateUpdated);
browser.runtime.onMessage.addListener(eventEmitter.handleMessage);


eventEmitter.onMessage.addListener(saveOnComplete(async (event) => {
  controller().then(c => c.handleMessage(event));
}));
eventEmitter.onBrowse.addListener(saveOnComplete(async (event) => {
  controller().then(c => c.handleBrowse(event));
}));

