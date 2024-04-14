import { browser } from "@bouncer/browser";
import { ActiveTabs } from "@bouncer/controller";
import { GuardPostings } from "@bouncer/controller";
import { type GuardData, deserializeGuard, serializeGuard } from "@bouncer/guard";
import type { ILogs } from "@bouncer/logs";
import { BrowserStorage, type IStorage } from "@bouncer/storage";
import { StoredContext } from "./StoredContext";
import { sampleGuards } from "./sampleData";
import type { BouncerContextObject, IBouncerContext, KeyConfig } from "./types";


type BouncerContextData = {
  activeTabs: ReturnType<ActiveTabs["toObject"]>,
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
    return  {
      guards: obj.guards.map(serializeGuard),
      activeTabs: obj.activeTabs.toObject(),
      guardPostings: obj.guardPostings.toObject(),
    };
  },

  deserialize: (data: BouncerContextData): BouncerContextObject => {
    const guards = data.guards.map(deserializeGuard);
    const activeTabs = ActiveTabs.fromObject(data.activeTabs, logs);
    const guardPostings = GuardPostings.fromObject(data.guardPostings, guards, logs);
    return { guards, activeTabs, guardPostings };
  },
})

const browserBuckets: BouncerContextBuckets = {
  local: BrowserStorage.local(),
  session: BrowserStorage.session(),
}

const browserFallbacks: BouncerContextFallbacks = {
  activeTabs: { initialize: async () => (await browser.tabs.query({ active: true })).map(t => t.id).filter((id): id is number => id !== undefined) },
  guardPostings: { value: [] },
  guards: { value: sampleGuards.map(serializeGuard) },
}

const browserKeyConfig = (fallbacks: BouncerContextFallbacks): BouncerContextKeyConfig => ({
  activeTabs: {
    bucket: "session",
    fallback: fallbacks.activeTabs,
  },
  guardPostings: {
    bucket: "session",
    fallback: fallbacks.guardPostings,
  },
  guards: {
    bucket: "local",
    fallback: fallbacks.guards,
  }
});

export const BouncerContext = {
  new: (buckets: BouncerContextBuckets, fallbacks: BouncerContextFallbacks, logs: ILogs): IBouncerContext => {
    return new StoredContext(buckets, BouncerContextTransformer(logs), browserKeyConfig(fallbacks));
  },

  browser: (logs: ILogs): IBouncerContext => BouncerContext.new(browserBuckets, browserFallbacks, logs)
}
