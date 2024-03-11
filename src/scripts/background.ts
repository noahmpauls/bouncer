import browser from "webextension-polyfill";
import { BrowserStorage } from "@bouncer/storage";
import { StoredContext } from "@bouncer/data";
import { BrowserEventTranslator } from "@bouncer/events";
import { Controller } from "@bouncer/controller";
import { type IGuard, type GuardData, serializeGuard, deserializeGuard, BasicGuard } from "@bouncer/guard";
import { ScheduledLimit } from "@bouncer/enforcer";
import { AlwaysBlock, ViewtimeCooldownLimit, WindowCooldownLimit } from "@bouncer/limit";
import { ExactHostnameMatcher } from "@bouncer/matcher";
import { BasicPolicy } from "@bouncer/policy";
import { AlwaysSchedule, MinuteSchedule, PeriodicSchedule } from "@bouncer/schedule";
import { BasicPage } from "@bouncer/page";

// TODO: rework this to be service worker-compatible. Currently there are bugs
// caused by the controller getting reset when the service worker idles.

const initialGuards = [
  new BasicPolicy(
    "example.com viewtime block",
    true,
    new ExactHostnameMatcher("example.com"),
    new ScheduledLimit(
      new MinuteSchedule(30, 10),
      new ViewtimeCooldownLimit(10000, 15000),
    ),
  ),
  new BasicPolicy(
    "en.wikipedia.org window block",
    true,
    new ExactHostnameMatcher("en.wikipedia.org"),
    new ScheduledLimit(
      new MinuteSchedule(30, 10),
      new WindowCooldownLimit(10000, 15000),
    ),
  ),
  new BasicPolicy(
    "Block HackerNews after thirty seconds",
    true,
    new ExactHostnameMatcher("news.ycombinator.com"),
    new ScheduledLimit(
      new AlwaysSchedule(),
      new WindowCooldownLimit(30_000, 10_000)
    ),
  ),
  new BasicPolicy(
    "Limit CNBC during work hours",
    true,
    new ExactHostnameMatcher("www.cnbc.com"),
    new ScheduledLimit(
      new PeriodicSchedule(
        "day",
        [
          { start: 2.88e+7, end: 6.12e+7 }
        ]
      ),
      new AlwaysBlock(),
    ),
  ),
].map((policy, i) => new BasicGuard(`${i}`, policy, new BasicPage()));


type GuardContextObject = {
  guards: IGuard[],
}

type GuardContextData = {
  guards: GuardData[],
}

const guardContext = new StoredContext(
  {
    local: new BrowserStorage(),
  },
  {
    serialize: (obj: GuardContextObject) => ({ guards: obj.guards.map(serializeGuard) }),
    deserialize: (data: GuardContextData) => ({ guards: data.guards.map(deserializeGuard) })
  },
  {
    guards: {
      bucket: "local",
      fallback: initialGuards.map(serializeGuard),
    }
  }
);

const saveOnComplete = (func: (...args: any[]) => void) => {
  return async (...args: any[]) => {
    func(...args);
    await guardContext.commit();
    logTimestamp(new Date(), "data saved.");
  }
}

const logTimestamp = (time: Date, message: string) => console.log(`${time.getTime()} ${ message }`)

const eventEmitter = new BrowserEventTranslator();
browser.tabs.onActivated.addListener(eventEmitter.handleActivated);
browser.tabs.onRemoved.addListener(eventEmitter.handleRemoved);
browser.webNavigation.onCommitted.addListener(eventEmitter.handleCommitted);
browser.webNavigation.onHistoryStateUpdated.addListener(eventEmitter.handleHistoryStateUpdated);
browser.runtime.onMessage.addListener(eventEmitter.handleMessage);


guardContext.fetch().then(data => Controller.fromBrowser(data.guards)).then(controller => {
  eventEmitter.onStatus.addListener(saveOnComplete(controller.handleStatus));
  eventEmitter.onBrowse.addListener(saveOnComplete(controller.handleBrowse));
});

