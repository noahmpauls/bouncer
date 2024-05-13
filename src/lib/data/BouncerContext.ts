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
  local: IStorage,
  session: IStorage,
}

type BouncerContextKeyConfig = KeyConfig<BouncerContextData, BouncerContextBuckets>;

type BouncerContextFallbacks = {
  [Property in keyof BouncerContextKeyConfig]: BouncerContextKeyConfig[Property]["fallback"]
}

const BouncerContextTransformer = (logs: ILogs) => ({
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

const browserBuckets: BouncerContextBuckets = {
  local: BrowserStorage.local(),
  session: BrowserStorage.session(),
}

const browserFallbacks: BouncerContextFallbacks = {
  activeTabs: { initialize: async () => (await browser.tabs.query({ active: true })).map(t => t.id).filter((id): id is number => id !== undefined) },
  activityLatest: { value: undefined },
  activityStarted: { value: false },
  guardPostings: { value: [] },
  guards: { value: sampleGuards.map(serializeGuard) },
}

const browserKeyConfig = (fallbacks: BouncerContextFallbacks): BouncerContextKeyConfig => ({
  activeTabs: {
    bucket: "session",
    fallback: fallbacks.activeTabs,
  },
  activityLatest: {
    bucket: "session",
    fallback: fallbacks.activityLatest,
  },
  activityStarted: {
    bucket: "local",
    fallback: fallbacks.activityStarted,
  },
  guardPostings: {
    bucket: "session",
    fallback: fallbacks.guardPostings,
  },
  guards: {
    bucket: "local",
    fallback: fallbacks.guards,
  },
});

export const BouncerContext = {
  new: (buckets: BouncerContextBuckets, fallbacks: BouncerContextFallbacks, logs: ILogs): IBouncerContext => {
    return new StoredContext(buckets, BouncerContextTransformer(logs), browserKeyConfig(fallbacks));
  },

  browser: (logs: ILogs): IBouncerContext => BouncerContext.new(browserBuckets, browserFallbacks, logs)
}
