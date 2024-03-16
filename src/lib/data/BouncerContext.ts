import browser from "webextension-polyfill";
import { ActiveTabs } from "@bouncer/controller/ActiveTabs";
import { GuardPostings } from "@bouncer/controller/GuardPostings";
import { type IGuard, type GuardData, serializeGuard, deserializeGuard } from "@bouncer/guard";
import { BrowserStorage } from "@bouncer/storage";
import { StoredContext } from "./StoredContext";
import { sampleGuards } from "./sampleData";

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

export const BouncerContext = new StoredContext(
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
      fallback: { initialize: async () => (await browser.tabs.query({ active: true })).map(t => t.id!) },
    },
    guardPostings: {
      bucket: "session",
      fallback: { value: [] },
    },
    guards: {
      bucket: "local",
      fallback: { value: sampleGuards.map(serializeGuard) },
    }
  }
);

