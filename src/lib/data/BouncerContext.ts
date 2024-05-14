import { browser } from "@bouncer/browser";
import { ActiveTabs, BrowseActivity } from "@bouncer/controller";
import { GuardPostings } from "@bouncer/controller";
import { type GuardData, deserializeGuard, serializeGuard } from "@bouncer/guard";
import type { ILogs } from "@bouncer/logs";
import { BrowserStorage, type IStorage } from "@bouncer/storage";
import { StoredContext } from "./StoredContext";
import { sampleGuards } from "./sampleData";
import type { BouncerContextObject, IBouncerContext, KeyConfig } from "./types";


type BouncerContextData = {
  activeTabs: ReturnType<ActiveTabs["toObject"]>,
  activityLatest: ReturnType<BrowseActivity["toObject"]>["latest"],
  activityStarted: ReturnType<BrowseActivity["toObject"]>["started"],
  guardPostings: ReturnType<GuardPostings["toObject"]>,
  guards: GuardData[],
}

type BouncerContextBuckets = {
  durable: IStorage,
  session: IStorage,
}

type BouncerContextKeyConfig = KeyConfig<BouncerContextData, BouncerContextBuckets>;

type BouncerContextFallbacks = {
  [Property in keyof BouncerContextKeyConfig]: BouncerContextKeyConfig[Property]["fallback"]
}

const transformer = (logs: ILogs) => ({
  serialize: (obj: BouncerContextObject): BouncerContextData => {
    const browseActivityData = obj.browseActivity.toObject();
    return  {
      activityLatest: browseActivityData.latest,
      activityStarted: browseActivityData.started,
      activeTabs: obj.activeTabs.toObject(),
      guardPostings: obj.guardPostings.toObject(),
      guards: obj.guards.map(serializeGuard),
    };
  },

  deserialize: (data: BouncerContextData): BouncerContextObject => {
    const activeTabs = ActiveTabs.fromObject(data.activeTabs, logs);
    const browseActivity = BrowseActivity.fromObject({
      started: data.activityStarted,
      latest: data.activityLatest,
    });
    const guards = data.guards.map(deserializeGuard);
    const guardPostings = GuardPostings.fromObject(data.guardPostings, guards, logs);
    return { activeTabs, browseActivity, guardPostings, guards, };
  },
})

const keyConfig = (fallbacks: BouncerContextFallbacks): BouncerContextKeyConfig => ({
  activeTabs: {
    bucket: "session",
    fallback: fallbacks.activeTabs,
  },
  activityLatest: {
    bucket: "durable",
    fallback: fallbacks.activityLatest,
  },
  activityStarted: {
    bucket: "session",
    fallback: fallbacks.activityStarted,
  },
  guardPostings: {
    bucket: "durable",
    fallback: fallbacks.guardPostings,
  },
  guards: {
    bucket: "durable",
    fallback: fallbacks.guards,
  },
});

export const BouncerContext = {
  new: (buckets: BouncerContextBuckets, fallbacks: BouncerContextFallbacks, logs: ILogs): IBouncerContext => {
    return new StoredContext(
      buckets,
      transformer(logs),
      keyConfig(fallbacks)
    );
  },

  browser: (logs: ILogs): IBouncerContext => {
    const buckets: BouncerContextBuckets = {
      durable: BrowserStorage.local(),
      session: BrowserStorage.session(),
    };
    const fallbacks: BouncerContextFallbacks = {
      activeTabs: { initialize: async () => (await browser.tabs.query({ active: true })).map(t => t.id).filter((id): id is number => id !== undefined) },
      activityLatest: { value: undefined },
      activityStarted: { value: false },
      guardPostings: { value: [] },
      guards: { value: sampleGuards.map(serializeGuard) },
    };
    return BouncerContext.new(buckets, fallbacks, logs);
  }
}
