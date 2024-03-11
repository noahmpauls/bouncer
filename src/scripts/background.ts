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
import { GuardPostings } from "@bouncer/controller/GuardPostings";
import { ActiveTabs } from "@bouncer/controller/ActiveTabs";
import { BrowserControllerMessenger } from "@bouncer/message";
import { SyncedCache } from "@bouncer/cache";

// TODO: does this work if the browser is opened directly to a guarded page?
// My guess is that the first signals don't get picked up.
//
// What about opening a group of pages from a set of bookmarks?

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
    "Block HackerNews after 45 seconds",
    true,
    new ExactHostnameMatcher("news.ycombinator.com"),
    new ScheduledLimit(
      new AlwaysSchedule(),
      new WindowCooldownLimit(45_000, 10_000)
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


type BouncerContextObject = {
  activeTabs: ActiveTabs,
  guardPostings: GuardPostings,
  guards: IGuard[],
}

type BouncerContextData = {
  activeTabs: ReturnType<ActiveTabs["toObject"]>,
  guardPostings: ReturnType<GuardPostings["toObject"]>,
  guards: GuardData[],
}

const serializeContext = (obj: BouncerContextObject): BouncerContextData => {
  return  {
    guards: obj.guards.map(serializeGuard),
    activeTabs: obj.activeTabs.toObject(),
    guardPostings: obj.guardPostings.toObject(),
  };
}

const deserializeContext = (data: BouncerContextData): BouncerContextObject => {
  const guards = data.guards.map(deserializeGuard);
  const activeTabs = ActiveTabs.fromObject(data.activeTabs);
  const guardPostings = GuardPostings.fromObject(data.guardPostings, guards);
  return { guards, activeTabs, guardPostings };
}


const bouncerContext = new StoredContext(
  {
    local: new BrowserStorage(browser.storage.local),
    session: new BrowserStorage(browser.storage.session),
  },
  {
    serialize: serializeContext,
    deserialize: deserializeContext,
  },
  {
    activeTabs: {
      bucket: "session",
      fallback: { initialize: async () => (await browser.tabs.query({ active: true })).map(t => t.id!) }, // TODO: this is where active tabs should be placed
    },
    guardPostings: {
      bucket: "session",
      fallback: { value: [] },
    },
    guards: {
      bucket: "local",
      fallback: { value: initialGuards.map(serializeGuard) },
    }
  }
);

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

const eventEmitter = new BrowserEventTranslator();
browser.tabs.onActivated.addListener(eventEmitter.handleActivated);
browser.tabs.onRemoved.addListener(eventEmitter.handleRemoved);
browser.webNavigation.onCommitted.addListener(eventEmitter.handleCommitted);
browser.webNavigation.onHistoryStateUpdated.addListener(eventEmitter.handleHistoryStateUpdated);
browser.runtime.onMessage.addListener(eventEmitter.handleMessage);


eventEmitter.onStatus.addListener(saveOnComplete(async (event) => {
  controller().then(c => c.handleStatus(event));
}));
eventEmitter.onBrowse.addListener(saveOnComplete(async (event) => {
  controller().then(c => c.handleBrowse(event));
}));

