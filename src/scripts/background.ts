import browser from "webextension-polyfill";
import { BrowserStorage } from "@bouncer/storage";
import { StoredBouncerData } from "@bouncer/data";
import { CachedBouncerContext, type IBouncerContext } from "@bouncer/context";
import { BrowserEventTranslator } from "@bouncer/events";
import { BouncerController } from "@bouncer/controller";


const logTimestamp = (time: Date, message: string) => console.log(`${time.getTime()} ${ message }`)

const eventEmitter = new BrowserEventTranslator();
browser.tabs.onActivated.addListener(eventEmitter.handleActivated);
browser.tabs.onRemoved.addListener(eventEmitter.handleRemoved);
browser.webNavigation.onCommitted.addListener(eventEmitter.handleCommitted);
browser.webNavigation.onHistoryStateUpdated.addListener(eventEmitter.handleHistoryStateUpdated);
browser.runtime.onMessage.addListener(eventEmitter.handleMessage);


const cache: IBouncerContext = new CachedBouncerContext(new StoredBouncerData(new BrowserStorage()));
BouncerController.new(cache).then(controller => {
  eventEmitter.onStatus.addListener(controller.handleStatus);
  eventEmitter.onBrowse.addListener(controller.handleBrowse);
  eventEmitter.onRefresh.addListener(controller.handleRefresh);
});
